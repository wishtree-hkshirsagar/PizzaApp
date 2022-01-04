var crypto = require('crypto'),
    async = require('async'),
    mongoose = require('mongoose'),
    User = require('../app/models/user').User,
    LoginToken = require('../app/models/logintoken').LoginToken,
    Pizza = require('../app/models/entity').Pizza;
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
                res.render('app/cart', {
                        userid: req.user.id,
                        email: req.user.email,
                        username: req.user.username,
                        initials: req.user.initials,
                        type: req.user.type,
                        // theme: req.user.theme,
                        // page_layout: req.user.layout
                });
            } else {
                res.render('site/cart', {
                    errorMessage: req.flash('errorMessage'),
                    successMessage: req.flash('successMessage')
                });
            }
        },
        order: function(req, res) {
            if(req.isAuthenticated()){
                res.render('app/order', {
                        userid: req.user.id,
                        email: req.user.email,
                        username: req.user.username,
                        initials: req.user.initials,
                        type: req.user.type,
                        // theme: req.user.theme,
                        // page_layout: req.user.layout
                });
            } else {
                res.redirect('/');
            }
        },
        home: function(req, res){
            console.log('home')
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
                        // theme: req.user.theme,
                        // page_layout: req.user.layout
                    });
                } else {
                    console.log(req.user);
                    res.render('app/index', {
                        userid: req.user.id,
                        email: req.user.email,
                        username: req.user.username,
                        initials: req.user.initials,
                        // dp: req.user.dp.s,
                        type: req.user.type,
                        // theme: req.user.theme,
                        // page_layout: req.user.layout
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
                console.log(req.url)
                console.log('findOnePizza', req.params.slug);
                Pizza.findOne({
                    slug: req.params.slug,
                }, function(err, pizza){
                    if(!pizza){
                        res.redirect('/');
                    } else {
                        req.session.redirectURL = req.url;
                        //Send
                        res.render('site/pizzas', {
                            title: pizza.title,
                            slug: 'pizza/' + pizza.slug,
                        });
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
    app.get('/customer/orders', siteRoute.order);
    app.get('/admin/orders', siteRoute.home);
   
    //process the login form
    app.post('/login',
        passport.authenticate('local-login', { failureRedirect: '/login', failureFlash: true}),
        function(req, res, next){
           
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

    //Logout handler by passport
    app.get('/site/logout', function(req, res){
        req.logout();
        req.session.destroy(function(err){
            res.redirect('/login');
        });
    });
};
