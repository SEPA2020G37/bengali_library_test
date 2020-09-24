const path = require('path');
const multer = require('multer');
const express = require('express');
const ensureLogin = require('connect-ensure-login');
const adminController = require('../controllers/adminController');

// Multer is initialized to parse multipart/form-data encoded request bodies.
// Here the PDF file passed in with the request will be parsed and saved into a file object
// inside the request (i.e. req.file).
// An absolute path/dest has been specified into the object passed into the contructor
// allowing multer to auto save the file into that location.
let upload = multer({ dest: path.join(__dirname, '../', 'utils', 'bookUploadStorage') });

// An express router to better handle routes
const Router = express.Router();

// Route for the admin dashboard
Router.get('/admin_dashboard', adminController.getDashboard);

// Route to handle book uploads.
// This uses two middleware, one is to parse the multipart form content and the
// other is for processing the parsed file, uploading the file onto the cloud
// storage and also update the database for new additions.
Router.post('/add-book', upload.single('book'), adminController.postBook);

// Route to delete a book from the admin console.
Router.get('/delete-book', adminController.deleteBook);

module.exports = Router;