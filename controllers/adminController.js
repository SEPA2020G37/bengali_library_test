const fs = require('fs');
const path = require('path');
const async = require('async');
const aws = require('../utils/S3');
const db = require('../models/index');
var pdftoimage = require('pdftoimage');
const HummusRecipe = require('hummus-recipe');
const { param } = require('../routes/adminRoutes');
const { fileLoader } = require('ejs');

// Acepts an offset value and a callback.
// This function retrieves a list of books after the specified offset and calls
// the callback function received passing in te list.
function getBooks(offset, callback){
    db.Book.findAll({ attributes: ['id', 'isbn', 'title', 'description', 'price', 'link', 'createdAt', 'updatedAt'], 
        offset: offset, 
        limit: 20, 
        include: [ { model: db.Vendor }, { model: db.Genre } ]
    })
    .then(books => {
        callback(books);
    })
    .catch(err => {
        if(err) throw err;
    })
}

// Delete the specified bucket.
function deleteBucket(bucketParams){
    aws.S3.deleteBucket(bucketParams, (err, data) => {
        if(err) throw err;
    });
}

// Return all objects of a specified AWS S3 Bucket.
function listBucketObjects(bucketParams){
    return new Promise((resolve, reject) => {
        aws.S3.listObjectsV2(bucketParams, (err, data) => {
            if(err) reject(err);
            if(data) resolve(data);
        });
    });
}

// Delete all the pages/objects from the specified bucket and calls in 
// deleteBucket() to remove the Bucket from AWS S3 storage.
function deletePages(isbn){
    let bucketParams = {
        Bucket: isbn
    }
    listBucketObjects(bucketParams)
    .then(pages => {
        let objects = [];
        let deleteObjectsParams = { Bucket: isbn };
    
        pages.Contents.forEach(page => {
            objects.push({ Key: page.Key });
        });
        deleteObjectsParams.Delete = { Objects: objects };
        aws.S3.deleteObjects(deleteObjectsParams, (err, data) => {
            if(err) throw err;
            if(data)
                deleteBucket(bucketParams);     
        });
    })
    .catch(err => {
        if(err) throw err;
    })
}

// Upload the converted and saved image to AWS storage.
function uploadCoverImage(params){
    aws.S3.upload(params, (err, data) => {
        if(err) console.log(err)
        else console.log(data);
    });
}

// Convert the first page of the pdf file/book into an image.
function createCoverImage(outputDir, page, isbn, params){
    let filePath = path.join(outputDir, page);

    pdftoimage(filePath, {
        format: 'jpeg',
        prefix: isbn,
        outdir: outputDir
    })
    .then(() =>{
        console.log('Conversion done');
        params.Key = isbn + '-1.jpg';
        fs.readFile(path.join(outputDir, params.Key), (err, file) => {
            if(!err){
                params.Body = file;
                params.ContentType = 'image/jpeg'
                uploadCoverImage(params);
            }else{
                console.log(err);
            }
        })
    })
    .catch((err) => {
        console.log(err);
    });
}

// Read in the passed in page from local storage.
// Upload the page onto AWS S3 storage.
function uploadPage(outputDir, isbn, page, linkAdded, res){
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
                // If it's the first page then update the database to add the link of the page into the Book Schema.
                if(!linkAdded){
                    db.Book.update({ link: data.Location }, { where: { isbn: isbn } })
                    .then(() => {
                        res.send(JSON.stringify({ status: true }));  
                        createCoverImage(outputDir, page, isbn, params);
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
function importPages(isbn, outputDir, res){
    // Read in the all the directory content which stores the PDF pages locally.
    fs.readdir(outputDir, (err, pages) => {
        if(err) throw err;
        let linkAdded = false;
        // Iterate through each page and call the upload function.
        async.each(pages, (page, callback) => {
            if(!linkAdded){
                uploadPage(outputDir, isbn, page, linkAdded, res);
                linkAdded = true;
            }else{
                uploadPage(outputDir, isbn, page, linkAdded, res);
            }
        }, 
        (err) => {
            if(err) throw err;
        });
    });
}

// Uploads the given PDF file to AWS S3 storage.
function uploadToAws(file, isbn, res){
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
            importPages(isbn, outputDir, res);
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
            return db.Genre.findAll()
            .then(genre => {
                return { vendors: vendors, genre: genre }
            })
        })
        .then(data => {
            res.render('admin-dashboard-books', { title: 'adminDB', books: books, vendors: data.vendors, genre: data.genre });
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
    const genre = req.body.genre;
    
    db.Genre.findOne({ where: { id: genre } })
    .then(genre => {
        genre.createBook({ isbn: isbn, title: title, description: description, price: price, vendorId: vendor })
        .then(book => {
            if(book){
                uploadToAws(req.file, isbn, res);
            }
        })
        .catch(err => {
            if(err) throw err;
        })
    })
    .catch(err => {
        throw err;
    });
}

// Deletes the specified book from the database and calls deletePages() to remove the corresponding
// bucket and all of its page objects from AWS S3 storage.
// Returns a JSON object of the updated booklist back to the client.
module.exports.deleteBook = (req, res, next) => {
    db.Book.findOne({ where: { isbn: req.query.isbn } })
    .then((book) => {
        return new Promise((resolve, reject) => {
            book.setGenres([])
            .then(() => resolve(book))
            .catch(() => reject(null))
        });
    }) 
    .then((book) => {
        book.destroy();
        deletePages(req.query.isbn);
        res.send(JSON.stringify({ status: "deleted" }));
    }) 
    .catch(err => {
        if(err) throw err;
    }); 
}

// Edit book details.
// Only the title, price, description and vendor can be editted.
module.exports.editBook = (req, res, next) => {
    console.log(req.body);
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const vendor = req.body.vendorId;
    const genre = req.body.genreId;
    
    db.Book.update({ title: title, price: price, description: description, vendorId: vendor }, { where: { isbn: req.body.isbn } })
    .then(() => {
        return db.Book.findOne({ where: { isbn: req.body.isbn }, include:[ { model: db.Vendor }, { model: db.Genre } ] });
    })
    .then(book => {
        return db.Genre.findAll({ where: { id: { [db.Sequelize.Op.in]: [genre, book.Genres[0].id] } }})
        .then((genre) => {
            return { book: book, genre: genre }
        })
    })
    .then(data => {
        if(data.book.Genres[0].id !== parseInt(genre)){
            if(data.genre[0].id === parseInt(genre)){
                data.genre[1].removeBook(data.book);
                data.genre[0].addBook(data.book);
            }else{
                data.genre[0].removeBook(data.book);
                data.genre[1].addBook(data.book);
            }
        }
        return db.Book.findOne({ where: { isbn: req.body.isbn }, include:[ { model: db.Vendor }, { model: db.Genre } ] });
    })
    .then(updatedBook => {
        console.log(updatedBook);
        res.send(JSON.stringify(updatedBook));
    })
    .catch(err => {
        if(err) throw err;
    });
}

module.exports.getGenreView = (req, res, next) => {
    const offset = parseInt(req.query.offset);
    db.Genre.findAll({ offset: offset })
    .then(genre => {
        if(genre)
            res.render('admin-dashboard-genre', { title: 'adminDB', genre: genre });
    })
    .catch(err => {
        if(err) throw err;
    })
}