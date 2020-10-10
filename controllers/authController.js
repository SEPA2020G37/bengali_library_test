const bcrypt = require('bcrypt');
const db = require('../models/index');

// Send back the login user page back.
// A flash message is set but will only contain a value only if a previous
// login attempt failed due to a set of reasons
module.exports.getLogin = (req, res, next) => {
    res.render('login', { message: req.flash('error'), title: 'login' }, (err, html) => {
        if(err)
            throw err;
        else
            res.send(html);
    });
}

// Second middleware used after the authenticate middleware from passport
module.exports.postLogin = (req, res, next) => {
    const userPosition = req.user.positionId;
    if(userPosition === 1) res.redirect('/user_dashboard');
    else if(userPosition === 2) res.redirect('/admin_dashboard?offset=0')
    else throw new Error(`unknown user position: ${userPosition}`)
}

// Send back the register user page back.
// A flash message is sent back if any which will be set to a value if the
// a previous register attempt fail due to a set of reasons.
module.exports.getRegister = (req, res, next) => {
    res.render('register', { message: req.flash('signupError'), title: 'register' });
}

// Registers the user, auto logs them into the system and redirects the user to the user dashboard page.
// Bcrypt is used to generate salts and hash passwords as required.
// If an error is encountered during the process a flash message will be stored and the request is
// redirected back to the registe page.
module.exports.postRegister = (req, res, next) => {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let password = req.body.password;
    let saltRounds = 10;

    db.User.findOne({ where: { email: email }})
    .then(user => {
        if(!user){
            bcrypt.genSalt(saltRounds, (err, salt) => {
                if(!err){
                    bcrypt.hash(password, saltRounds, (err, hash) => {
                        if(!err){
                            db.User.create({ firstName: firstName, lastName: lastName, email: email, salt: salt, hash: hash, positionId: 1 })
                            .then(user => {
                                req.login(user, (err) => {
                                    if(err) throw err;
                                    else res.render('user-dashboard', { user: req.user });
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
            req.flash('signupError', 'Sorry there is already an account for this email');
            res.redirect('/register');
        }
    })
    .catch(err => {
        throw err;
    })
}