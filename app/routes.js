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
                console.log('public pizzas')
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
                if(req.user.type == 'customer'){
                    // console.log('****',req.params)
                res.render('app/order', {
                        userid: req.user.id,
                        email: req.user.email,
                        username: req.user.username,
                        initials: req.user.initials,
                        type: req.user.type,
                        // theme: req.user.theme,
                        // page_layout: req.user.layout
                });
            } else{
                req.session.redirectURL = null;
                res.redirect('/');
            }
            } else {
                res.redirect('/');
            }
        },
        home: function(req, res){
            // console.log('home')
            // console.log('***req params***',req.params)
            if(req.isAuthenticated()){
                //Render
                if(req.user.type == 'admin'){
                    console.log('inside admin')
                    res.render('app/admin', {
                        userid: req.user.id,
                        email: req.user.email,
                        username: req.user.username,
                        initials: req.user.initials,
                        type: req.user.type,
                        
                    });
                } else if(req.user.type == 'admin' && (req.url == '/admin/orders' || req.url == '/order/' + req.params.slug)){
                    console.log('else if')
                    res.render('app/admin', {
                        userid: req.user.id,
                        email: req.user.email,
                        username: req.user.username,
                        initials: req.user.initials,
                        type: req.user.type
                        
                    });
                } else if(req.user.type == 'customer' && req.url == '/admin/orders'){
                    res.redirect('/');
                } else {
                    console.log(req.user);
                    res.render('app/index', {
                        userid: req.user.id,
                        email: req.user.email,
                        username: req.user.username,
                        initials: req.user.initials,
                        type: req.user.type
                    });
                }
            } else if(req.url == '/'){
                console.log('home page')
                req.session.redirectURL = null;
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
    app.get('/login', siteRoute.site);
    app.get('/signup', siteRoute.site);
    app.get('/forgot', siteRoute.site);
    app.get('/terms', siteRoute.site);
    app.get('/pizza/:slug', siteRoute.home);
    app.get('/admin/orders', siteRoute.home);
    app.get('/order/:slug', siteRoute.home);
    app.get('/cart', siteRoute.cart);
    app.get('/pizzas', siteRoute.pizzas);
    app.get('/customer/orders', siteRoute.order);
    app.get('/customer/orders/:slug', siteRoute.order);
   
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
        console.log('logout')
        req.logout();
        req.session.destroy(function(err){
            res.redirect('/login');
        });
    });
};
