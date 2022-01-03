//Passport authentication strategies
var LocalStrategy = require('passport-local').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;
//Async
var async = require('async');
//load the User model
var User = require('../app/models/user').User;
var LoginToken = require('../app/models/logintoken').LoginToken;
var validator = require('validator');

//UUID
const { v4: uuidv4 } = require('uuid');
//Load crypto for hashing
var crypto = require('crypto'),
    shortid = require('shortid');
//Passport function
module.exports = function(passport){
    //passport needs ability to serialize and unserialize users out of session
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done){
        User.findById(id, function(err,user){
            done(err,user);
        });
    });
    //LOCAL SIGNUP
    passport.use('local-signup', new LocalStrategy({
        //by default, local strategy user username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true //allows us to pass in the req from our route
    }, function(req, email, password, done){
        // console.log(req, email, password)
        //Get unique name
        // const {uniqueNamesGenerator, adjectives, animals, colors, names} = require('unique-names-generator');
        // const randomName = uniqueNamesGenerator({
        //     dictionaries: [adjectives, animals, colors, names],
        //     length: 4,
        //     separator: "-"
        // });
        // email = randomName.toLowerCase();
        //async - User.findOne wont fire unless data is sent back
        process.nextTick(function(){
            User.findOne({'email': email}, function(err, existingUser){
                if(err) return done(err);
                if(existingUser)
                    return done(null, false, req.flash('errorMessage', 'That unique name is already taken'));
                //we are not logged in, so we are creating a new user
                if(!req.user && password.length >=8){
                    var newUser = new User();
                    newUser.email = req.body.email;
                    newUser.password = newUser.generateHash(password);
                    newUser.name = req.body.name;
                    newUser.initials = newUser.name.split(' ').map(function (s) { return s.charAt(0); }).join('').toUpperCase();
                    // newUser.username = shortid.generate();
                    newUser.age = req.body.age;
                    newUser.contact = req.body.contact;
                    newUser.consent = true;
                    newUser.accountCreated = new Date(Date.now());
                    newUser.save(function(err){
                        if(err) return done(err);
                        else return done(null, newUser);
                    });
                } else if(!req.body.name || !alphaSpace.test(req.body.name)){
                    return done(null, false, req.flash('errorMessage', 'Name contains invalid characters'));
                }
                else if(validator.isEmail(email) && password.length < 8){
                    return done(null, false, req.flash('errorMessage', 'Password must be 8 character or more.'))
                } else {
                    return done(null, false, req.flash('errorMessage', 'Email address is invalid.'));
                }
            });
        });
    }));
    //LOCAL LOGIN
    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function(req, email, password, done){
        if(email) email = email.toLowerCase();
        process.nextTick(function(){
            User.findOne({$or: [{ email: email }]}, function(err, user){
                if (err) return done(err);
                if(!user) return done(null, false, req.flash('errorMessage', 'No such user exists.'));
                if(!user.password) return done(null, false, req.flash('errorMessage', 'No local account exists.'));
                if(!!(user.lockUntil && user.lockUntil > Date.now())){
                    //If user is currently locked
                    return done(null, false, req.flash('errorMessage', 'Your account is locked due to security reasons. Please reset password.'));
                } else if(!user.validPassword(password)) {
                    //If password is wrong, when user is not locked or lock is expired
                    user.incLoginAttempts(function(err){
                        if(err) return done(err);
                        return done(null, false, req.flash('errorMessage', 'Invalid id or password.'));
                    });
                } else if(user.loginAttempts) {
                    //Reset login attempts when password is correct, before lock or when lock is expired
                    user.resetLoginAttempts(function(err){
                        if(err) return done(err);
                        return done(null, user);
                    });
                } else {
                    return done(null, user);
                }
            });
        });
    }));
    //REMEMBER ME - cookie strategy.
    passport.use(new RememberMeStrategy(
        function(token, done){
            var hashed_token = crypto.createHash('md5').update(token).digest('hex');
            LoginToken.findOne({token: hashed_token}, function(err, logintoken){
                if (err) { return done(err); }
                if (!logintoken) { return done(null, false); }
                //Delete single use token
                var userid = logintoken.userid;
                logintoken.remove();
                //Send User
                User.findOne({_id: userid}, function(err, user){
                    if (err) { return done(err); }
                    if (!user) { return done(null, false); }
                    return done(null, user);
                });
            });
        }, function(user, done){
            var token = user._id + uuidv4();
            var hashed_token = crypto.createHash('md5').update(token).digest('hex');
            var loginToken = new LoginToken({userid: user._id, token: hashed_token });
            loginToken.save(function(err){
                if (err) { return done(err); }
                return done(null, token);
            });
        }
    ));
};
