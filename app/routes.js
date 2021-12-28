var crypto = require('crypto'),
    async = require('async'),
    mongoose = require('mongoose'),
    User = require('../app/models/user').User,
    LoginToken = require('../app/models/logintoken').LoginToken,
    Course = require('../app/models/entity').Course,
    Email = require('../config/mail.js');
//UUID
const { v4: uuidv4 } = require('uuid');
//Routes
module.exports = function(app, passport) {
    var siteRoute = {
        site: function(req, res){
            if(req.isAuthenticated()){
                res.redirect('/');
            } else {
                res.render('site/index', {
                    errorMessage: req.flash('errorMessage'),
                    successMessage: req.flash('successMessage')
                });
            }
        },
        pizzas: function(req, res){
            if(req.isAuthenticated()){
                res.redirect('/');
            } else {
                res.render('site/pizzas', {
                    errorMessage: req.flash('errorMessage'),
                    successMessage: req.flash('successMessage')
                });
            }
        },
        cart: function(req, res){
            if(req.isAuthenticated()){
                res.redirect('/');
            } else {
                res.render('site/cart', {
                    // title: 'FramerSpace: Courses',
                    // desc: 'Explore all our popular courses.',
                    // slug: 'courses',
                    // image: 'https://framerspace.com/images/site/share.png',
                    errorMessage: req.flash('errorMessage'),
                    successMessage: req.flash('successMessage')
                });
            }
        },
        home: function(req, res){
            if(req.isAuthenticated()){
                //Render
                //If invited
                if(req.user.type == 'admin'){
                    console.log('inside admin')
                    res.render('app/admin', {
                        userid: req.user.id,
                        email: req.user.email,
                        username: req.user.username,
                        initials: req.user.initials,
                        // dp: req.user.dp.s,
                        type: req.user.type,
                        theme: req.user.theme,
                        page_layout: req.user.layout
                    });
                } else {
                    console.log(req.user);
                    res.render('app/index', {
                        userid: req.user.id,
                        email: req.user.email,
                        username: req.user.username,
                        initials: req.user.initials,
                        dp: req.user.dp.s,
                        type: req.user.type,
                        theme: req.user.theme,
                        page_layout: req.user.layout
                    });
                }
            } else if(req.url == '/'){
                req.session.redirectURL = null;
                //Send
                res.render('site/index', {
                    errorMessage: req.flash('errorMessage'),
                    successMessage: req.flash('successMessage')
                });
            } else if((req.url == '/pizza/' + req.params.slug)){
                Pizza.findOne({
                    slug: req.params.slug,
                }, function(err, pizza){
                    if(!pizza){
                        res.redirect('/');
                    } else {
                        req.session.redirectURL = req.url;
                    }
                });
            } else {
                req.session.redirectURL = req.url;
                res.redirect('/login');
            }
        }
    };
    //Site main page
    app.get('/', siteRoute.home);
    app.get('/cart', siteRoute.cart);
    app.get('/login', siteRoute.site);
    app.get('/signup', siteRoute.site);
    app.get('/forgot', siteRoute.site);
    app.get('/terms', siteRoute.site);
    app.get('/pizzas', siteRoute.pizzas);
    app.get('/pizza/:slug', siteRoute.home);
   
    //process the login form
    app.post('/login',
        passport.authenticate('local-login', { failureRedirect: '/login', failureFlash: true}),
        function(req, res, next){
            // Issue a remember me cookie if the option was checked
            if (!req.body.remember_me) { 
                return next(); 
            }
            var token = req.user._id + uuidv4();
            var hashed_token = crypto.createHash('md5').update(token).digest('hex');
            var loginToken = new LoginToken({userid: req.user._id, token: hashed_token });
            loginToken.save(function(){
                res.cookie('remember_me', token, {path: '/', httpOnly: true, maxAge: 604800000});
                return next();
            });
        },
        function(req, res) {
            if(req.session.redirectURL){
                res.redirect(req.session.redirectURL);
                req.session.redirectURL = null;
            } else {
                res.redirect('/');
            }
        });
    //process the signup form
    app.post('/signup',
        passport.authenticate('local-signup', { failureRedirect: '/', failureFlash: true}),
        function(req, res, next){
            // Issue a remember me cookie
            var token = req.user._id + uuidv4();
            var hashed_token = crypto.createHash('md5').update(token).digest('hex');
            var loginToken = new LoginToken({userid: req.user._id, token: hashed_token });
            loginToken.save(function(){
                res.cookie('remember_me', token, {path: '/', httpOnly: true, maxAge: 604800000});
                return next();
            });
        },
        function(req, res){
            if(req.session.redirectURL){
                console.log('inside if')
                res.redirect(req.session.redirectURL);
                req.session.redirectURL = null;
            } else {
                console.log('inside else')
                res.redirect('/login');
            }
        });
    //process the forgot password form
    app.post('/forgot', function(req, res, next){
        /* async waterfall - Runs the tasks array of functions in series,
         each passing their results to the next in the array. */
         async.waterfall([
            // create random reset Token
            function(done){
                crypto.randomBytes(32, function(err, buf){
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            //Update user's resetPasswordToken and resetPasswordExpires
            function(token, done){
                User.findOne({ reset_email: req.body.email}, function(err, user){
                    if(!user){
                        req.flash('errorMessage', 'No account with that email address exists');
                        return res.redirect('/forgot');
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
                    user.save(function(err){
                        done(err, token, user);
                        req.flash('successMessage', 'An email has been sent to '+ user.reset_email +' with further instructions.');
                        res.redirect('/');
                    });
                });
            },
            //Send Password reset email
            function(token, user, done){
                var content = {
                    email: user.reset_email,
                    name: user.name,
                    firstName: user.name.split(' ')[0],
                    subject: "FramerSpace: Password Reset",
                    resetUrl: 'https://framerspace.com/reset/' + token
                };
                Email.sendEmail('reset', content, function(err, responseStatus){
                    done(err, user.email);
                });
            }
        ], function(err, userEmail){
            if(err) return next(err);
            return true;
        });
    });
    //password reset page
    app.get('/reset/:token', function(req, res){
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()} }, function(err, user){
            if(!user){
                req.flash('errorMessage', 'Password reset token is invalid or has expired.')
                return res.redirect('/forgot');
            }
            res.render('site/reset', {email: user.email, token: req.params.token, errorMessage: req.flash('errorMessage')});
        });
    });
    //Save new password
    app.post('/reset/:token', function(req, res){
        async.waterfall([
            function(done){
                User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()} }, function(err, user){
                    if(!user){
                        req.flash('errorMessage', 'Password reset token is invalid or has expired.');
                        return res.redirect('/forgot');
                    } else if(!req.body.password || req.body.password.length < 8){
                        req.flash('errorMessage', 'Password must be 8 character or more.');
                        return res.redirect('/reset/' + req.params.token);
                    } else if(req.body.password != req.body.password2){
                        req.flash('errorMessage', "The passwords don't match, please try again.");
                        return res.redirect('/reset/' + req.params.token);
                    }
                    user.prev_password = user.password;
                    user.password = user.generateHash(req.body.password);
                    //Remove reset password token to make them invalid
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    //Reset login Attempts on password change
                    user.loginAttempts = 0;
                    user.lockUntil = undefined;
                    user.save(function(err){
                        //Login - Passport exposes a login() function on req
                        req.login(user, function(err){
                            done(err, user);
                        });
                    });
                });
            },
            function(user, done){
                //Send password confirmation email
                var content = {
                    email: user.reset_email,
                    name: user.name,
                    firstName: user.name.split(' ')[0],
                    subject: "FramerSpace: Password changed",
                    resetUrl: 'https://framerspace.com/forgot'
                };
                Email.sendOneMail('password_changed', content, function(err, responseStatus){
                    done(err, responseStatus);
                });
            }
        ], function(err, responseStatus){
            if(err) return next(err);
            return res.redirect('/');
        });
    });
    //Logout handler by passport
    app.get('/site/logout', function(req, res){
        // clear the remember me cookie when logging out
        res.clearCookie('remember_me');
        req.logout();
        req.session.destroy(function(err){
            res.redirect('/login');
        });
    });
};
