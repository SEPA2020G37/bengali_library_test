const fs = require('fs');
const path = require('path');
const async = require('async');
const aws = require('../utils/S3');
const db = require('../models/index');
const HummusRecipe = require('hummus-recipe');

// Uploads the given PDF file to AWS S3 storage.
function uploadToAws(file, isbn){
    const fullPDFLocation = path.join(__dirname, '../', 'utils', 'bookUploadStorage', file.filename);
    const outputDir = path.join(__dirname, '../', 'utils', 'bookSplitStorage', file.filename);

    // Creates a temporary directory to hold the split up PDF pages.
    fs.mkdirSync(outputDir);

    // Create a new HummusRecipe instance and pass in the local file location which temporarily
    // stores the unsplit PDF file.
    const pdf = new HummusRecipe(fullPDFLocation);
    // Split the PDF.
    pdf.split(outputDir, isbn).endPDF();

    // Create an AWS S3 bucket for the book to be uploaded.
    // The bucket name will be equal to the isbn of the PDF.
    // This function call waits on a Promise return which indicates if the bucket was created successfully.
    aws.createBucket(isbn, 'public-read-write')
    .then(result => {
        if(result){
            // Read in the all the directory content which stores the PDF pages locally.
            let pages = fs.readdirSync(outputDir);
            let linkAdded = false;
            // Iterate through each page.
            async.each(pages, (page, callback) => {
                // Read in the page.
                let upload = fs.readFileSync(path.join(outputDir, page));
                // Create the S3 upload's parameter Object.
                let params = {
                    Bucket: isbn,
                    Key: page,
                    Body: upload,
                    ContentType: 'application/pdf',
                    ACL: 'public-read'
                }
                // Upload the page.
                aws.S3.upload(params, (err, data) => {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        if(!linkAdded){
                            db.Book.update({ link: data.Location }, { where: { isbn: isbn } });
                            linkAdded = true;
                        }
                    }
                });
            }, 
            (err) => {
                if(err) throw err;
            });
        }
    })
    .catch(err => {
        if(err) throw err;
    });
}

// Send the admin dashboard page back.
// An offset if available will be retrieved from req to determine the current set of
// books to send back, if an offset is not available it will default to 1
module.exports.getDashboard = (req, res, next) => {
    const offset = parseInt(req.query.offset);
    db.Book.findAll({ offset: offset, limit: 10, include: [ { model: db.Vendor, key: 'id' } ]})
    .then(books => {
        db.Vendor.findAll()
        .then(vendors => {
            res.render('admin-dashboard', { title: 'adminDB', books: books, vendors: vendors });
        })
        .catch(err => {
            throw err;
        });
    })
    .catch(err => {
        throw err;
    });
};

// Takes in a new book and details uploaded by the user and inserts the book into AWS S3 storage.
// This returns a refreshed linst of books back.
module.exports.postBook = (req, res, next) => {
    const isbn = req.body.isbn;
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const vendor = req.body.vendor;
    
    db.Book.create({ isbn: isbn, title: title, description: description, price: price, vendorId: vendor })
    .then(book => {
        if(book){
            uploadToAws(req.file, isbn);
            db.Book.findAll({ offset: 0, limit: 10, include: [ { model: db.Vendor, key: 'id' } ]})
            .then(books => {
                res.send(JSON.stringify(books));
            })
            .catch(err => {
                throw err;
            });
        }
    })
    .catch(err => {
        throw err;
    });
}