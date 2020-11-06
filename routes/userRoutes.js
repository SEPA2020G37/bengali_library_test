const path = require('path');
const multer = require('multer');
const express = require('express');
const ensureLogin = require('connect-ensure-login');
const userController = require('../controllers/userController');


// An express router to better handle routes
const Router = express.Router();

// Route for the user dashboard
Router.get('/user_dashboard', userController.getDashboard);
Router.get('/pdf-viewer', userController.pdfViewer);
Router.get('/view', userController.getBook);
Router.get('/mybooks', userController.booklist);
Router.get('/myWishList', userController.wishList);

//Route for controlling the next & prev feature in pdf viewer
Router.get('/next', userController.next);
Router.get('/prev', userController.prev);


module.exports = Router;