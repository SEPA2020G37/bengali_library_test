const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models/index.js');

// create a node server
const app = express();

// update the default express view ingine to use ejs
app.set('view engine', 'ejs');

// set the location to serve templates from
app.set('views', 'views');

// set up body parser to decode POST data and populate the request.body property
app.use(bodyParser.urlencoded({ extended: false }));

// specify the path to serve static files such as css, js and other resources
app.use(express.static(path.join(__dirname, 'public')));

// start the node server
app.listen(8080, () => {
    console.log('server running...');
});