const path = require('path');
const express = require('express');
const ensureLogin = require('connect-ensure-login');
const bookStoreController = require('../controllers/bookStoreController');

// An express router to better handle routes
const Router = express.Router();

// Route to serve the main book-store/library page
Router.get('/book-store', bookStoreController.getBookStore);

// Check if a particular book which the user is adding to the cart is already owned by the user
Router.get('/book-owned', bookStoreController.checkBookOwnership);

// Route to make a payment for a book purchases
Router.post('/purchase', bookStoreController.purchaseBooks);

// Route to search for specific books via genre
Router.get('/find-book-by-genre', bookStoreController.findBookByGenre);

// Route to search for specific books via text
Router.get('/find-book', bookStoreController.findBook);

module.exports = Router;