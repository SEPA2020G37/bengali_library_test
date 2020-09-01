const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const models = require('../models/index');
const { use } = require('passport');

// Configure the local strategy which will be used by Passport for 
// username and password based authentication.
// 
// The local strategy setup requires a verify function which takes in two 
// three parameters username, password and a success/failure callback.
// This function needs to determine if the credentials are valid and call 
// the callback acocrdingly.
module.exports.setStrategy = () => {
    passport.use(new Strategy((username, password, callback) => {
        models.User.findOne({ where: { email: username } })
        .then(user => {
            if(user){
                bcrypt.compare(password, user.hash, (err, result) => {
                    if(err) return callback(err);
                    if(!result) return callback(null, false, { message: 'Password is incorrect' });
                    if(result) return callback(null, user);
                });
            }else{
                return callback(null, false, { message: 'Username is incorrect' });
            }
        })
        .catch(err => {
            throw err;
        })
    }));

    // Configure Passport authenticated session persistence.
    // 
    // To restore authentication state upon future http requests, Passport
    // needs to serialize users into and deserialize users out of sessions
    // and its done simply by adding the user id to the cookie which holds
    // the sid during serializing and also by querying for the incoming user id
    // during deserializing.
    passport.serializeUser((user, callback) => {
        callback(null, user.id);
    });

    passport.deserializeUser((id, callback) => {
        models.User.findByPk(id)
        .then(user => {
            if(user) callback(null, user);
        })
        .catch(err => {
            callback(err);
        });
    });
}

module.exports.passportInitialize = passport.initialize();

module.exports.passportSession = passport.session();

module.exports.passport = passport;