const path = require('path');
const express = require('express');
const flash = require('connect-flash');
const db = require('./models/index.js');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const passportConfig = require('./auth/passport');
const expressSession = require('express-session');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookStoreRoutes = require('./routes/bookStoreRoutes');

// Set up the local strategy for Passport based authentication
passportConfig.setStrategy();

// Create a node server
const app = express();

// Modify application configuration to set the templating engine to ejs
app.set('view engine', 'ejs');

// Modify application configuration for the directory to serve templates from
app.set('views', 'views');

// Set up middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up body parser to decode POST data and populate the request.body property
app.use(bodyParser.urlencoded({ extended: false }));

// Set up body parser to decode POST data which come as JSON format and populate the request.body property
app.use(bodyParser.json());

// Set up express session middleware
app.use(expressSession({ secret: process.env.EXPRESS_SESSION_SECRET, resave: false, saveUninitialized: false }));

// Set up flash middleware to enable flash messaging support for passport error handling.
// When an error occurs in the authentication process the custom set message for credential issues
// will be set in flash by passport with the handle 'error'
app.use(flash());

// Initialize passport and restore auth state is any are available from the session
app.use(passportConfig.passportInitialize);
app.use(passportConfig.passportSession);

// Route middleware
app.use(authRoutes);
app.use(adminRoutes);
app.use(bookStoreRoutes);

// Start the node server
app.listen(8080, () => {
    console.log('server running...');
});