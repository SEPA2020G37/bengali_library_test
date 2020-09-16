const path = require('path');
const multer = require('multer');
const express = require('express');
const ensureLogin = require('connect-ensure-login');
const userController = require('../controllers/userController');


// An express router to better handle routes
const Router = express.Router();

// Route for the admin dashboard
Router.get('/user_dashboard', userController.getDashboard);

module.exports = Router;