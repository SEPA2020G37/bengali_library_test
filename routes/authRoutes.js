const express = require('express');
const passportConfig = require('../auth/passport');
const authController = require('../controllers/authController');

// An express router to better handle routes
let Router = express.Router();

// Route for retrieving the login page.
Router.get('/login', authController.getLogin);

// Route to authenticate the user through POST user credentials.
// This uses the authenticate method exposed by passport through the
// predefined local strategy.
Router.post('/login', 
    passportConfig.passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    authController.postLogin
);

// Route for retrieving the register page
Router.get('/register', authController.getRegister);

// Route to register a user.
// Bcrypt is used to hash the user password wuth the said of salting
Router.post('/register', authController.postRegister);

module.exports = Router;