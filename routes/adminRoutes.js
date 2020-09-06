const express = require('express');
const ensureLogin = require('connect-ensure-login');

const Router = express.Router();

Router.get('/admin_dashboard', (req, res, next) => {
    res.render('admin-dashboard');
});

module.exports = Router;