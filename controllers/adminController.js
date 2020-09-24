const fs = require('fs');
const path = require('path');
const async = require('async');
const aws = require('../utils/S3');
const db = require('../models/index');
const HummusRecipe = require('hummus-recipe');

// Acepts an offset value and a callback.
// This function retrieves a list of books after the specified offset and calls
// the callback function received passing in te list.
function getBooks(offset = 0, callback){
    db.Book.findAll({ offset: offset, limit: 10, include: [ { model: db.Vendor } ]})
    .then(books => {
        callback(books);
    })
    .catch(err => {
        if(err) throw err;
    })
}

function deleteBucket(isbn){
    let bucketParams = {
        Bucket: isbn
    }
    aws.S3.listObjectsV2(bucketParams, (err, pages) => {
        if(err) throw err;
        let objects = [];
        pages.Contents.forEach(page => {
            objects.push({ Key: page.Key });
        });
        let deleteObjectsParams = { Bucket: isbn };
        deleteObjectsParams.Delete = { Objects: objects };
        aws.S3.deleteObjects(deleteObjectsParams, (err, data) => {
            if(err) throw err;
            if(data)
                deleteBucket(bucketParams)
            aws.S3.deleteBucket(bucketParams, (err, data) => {
                if(err) throw err;
                console.log(data);
            });
        });
    });
}

// Read in the passed in page.
function uploadPage(outputDir, isbn, page, linkAdded){
    fs.readFile(path.join(outputDir, page), (err, upload) => {
        if(err) throw err;
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
                    db.Book.update({ link: data.Location }, { where: { isbn: isbn } })
                    .then(() => {
                        // console.log('link added');
                    })
                    .catch(err => {
                        if(err) throw err;
                    });
                }
            }
        });
    });
}

// Read in the directory which contains the individuals pages of the PDF.
function importPages(isbn, outputDir){
    // Read in the all the directory content which stores the PDF pages locally.
    fs.readdir(outputDir, (err, pages) => {
        if(err) throw err;
        let linkAdded = false;
        // Iterate through each page and call the upload function.
        async.each(pages, (page, callback) => {
            if(!linkAdded){
                uploadPage(outputDir, isbn, page, linkAdded);
                linkAdded = true;
            }else{
                uploadPage(outputDir, isbn, page, linkAdded);
            }
        }, 
        (err) => {
            if(err) throw err;
        });
    });
}

// Uploads the given PDF file to AWS S3 storage.
function uploadToAws(file, isbn){
    const outputDir = path.join(__dirname, '../', 'utils', 'bookSplitStorage', file.filename);

    // Creates a temporary directory to hold the split up PDF pages.
    fs.mkdir(outputDir, (err) => {
        if(err) throw err;
    });
    // Create a new HummusRecipe instance and pass in the local file location which temporarily
    // stores the unsplit PDF file.
    // Split the PDF.
    const pdf = new HummusRecipe(path.join(__dirname, '../', 'utils', 'bookUploadStorage', file.filename));
    pdf.split(outputDir, isbn).endPDF();

    // Create an AWS S3 bucket for the book to be uploaded.
    // The bucket name will be equal to the isbn of the PDF.
    // This function call waits on a Promise return which indicates if the bucket was created successfully.
    aws.createBucket(isbn, 'public-read-write')
    .then(result => {
        if(result){
            importPages(isbn, outputDir);
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
    getBooks(offset, (books) => {
        db.Vendor.findAll()
        .then(vendors => {
            res.render('admin-dashboard', { title: 'adminDB', books: books, vendors: vendors });
        })
        .catch(err => {
            throw err;
        });
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
            getBooks(0, (books) => {
                res.send(JSON.stringify(books));
            });
        }
    })
    .catch(err => {
        throw err;
    });
}

module.exports.deleteBook = (req, res, next) => {
    db.Book.destroy({ where: { isbn: req.query.isbn } })
    .then(() => {
        deleteBucket(req.query.isbn);
        getBooks((books) => {
            res.send(JSON.stringify(books));
        });
    })  
    .catch(err => {
        if(err) throw err;
    }); 
}