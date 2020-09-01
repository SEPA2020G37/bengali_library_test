const bcrypt = require('bcrypt');
const express = require('express');
const models = require('../models/index');
const messages = require('../utils/messageList');
const passportConfig = require('../auth/passport');

// An express router to better handle routes
let Router = express.Router();

// Route for retrieving the login page.
Router.get('/login/:error', (req, res, next) => {
    res.render('login', { message: messages.login[req.params.error] }, (err, html) => {
        if(err)
            throw err;
        else
            res.send(html);
    });
});

// Route to authenticate the user through POST user credentials.
// This uses the authenticate method exposed by passport through the
// predefined local strategy.
Router.post('/login', 
    passportConfig.passport.authenticate('local', { failureRedirect: '/login/incorrect_credentials' }),
    (req, res, next) => {
        res.redirect('/user_dashboard', { user: req.user });
    }
);

// Route for retrieving the register page
Router.get('/register/:error', (req, res, next) => {
    res.render('/register', { message: messages.register[req.params.error] });
});

// Route to register a user.
// Bcrypt is used to hash the user password wuth the said of salting
Router.post('/register/:error', (req, res, next) => {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let password = req.body.password;
    let saltRounds = 10;

    models.User.findOne({ where: { email: email }})
    .then(user => {
        if(!user){
            bcrypt.genSalt(saltRounds, (err, salt) => {
                if(!err){
                    bcrypt.hash(password, saltRounds, (err, hash) => {
                        if(!err){
                            models.User.create({ firstName: firstName, lastName: lastName, email: email, salt: salt, hash: hash, positionId: 1 })
                            .then(user => {
                                req.login(user, (err) => {
                                    if(err) throw err;
                                    else res.render('/user_dashboard', { user: user });
                                });
                            });
                        }else{
                            throw err;
                        }
                    });
                }else{
                    throw err;
                }
            });
        }else{
            res.redirect('/register/user_exists');
        }
    })
    .catch(err => {
        throw err;
    })
});

module.exports = Router;