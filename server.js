
var app_root = __dirname,
    express = require('express'),
    fs = require('fs'),
    path = require('path'),
    hbs = require('express-hbs'),
    favicon = require('serve-favicon'),
    morgan = require('morgan'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash = require('connect-flash'),
    mongoStore = require('connect-mongo')(session),
    dotenv = require('dotenv').config(),
    configDB = require('./config/database');

var dotenv = require('dotenv');
dotenv.config();

var app = express();
var configDB = require('./config/database');
var urlDB = configDB.url;
if (app.get('env') === 'development') {
    urlDB = configDB.urlDev;
}

mongoose.Promise = require('bluebird');
mongoose.connect(urlDB, {
    promiseLibrary: require('bluebird'),
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
});

require('./config/passport')(passport);

var sessionStore = new mongoStore({
    url: urlDB,
    collection: 'sessions'
});


var sessionMiddleware = session({
    name: 'pizza.sid',
    store: sessionStore,
    secret: 'Sa802u5LH67pPASasBPopLxa9618',
    cookie: {maxAge: 60 * 60 * 1000}, //1 Hour
    resave: false,
    saveUninitialized: true
});

app.set('port', process.env.PORT || 9000);

app.use(express.static(path.join(app_root, 'static')));

app.engine('hbs', hbs.express4({
    partialsDir: [app_root + '/views/partials']
}));
app.set('view engine','hbs');
app.set('views', path.join(app_root, 'views'));

app.use(favicon(app_root + '/static/images/site/favicon.ico'));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: '5mb', extended: true }));

app.use(methodOverride());

app.use(cookieParser());
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());


app.use(flash());
var server = require('http').Server(app);

server.listen(app.get('port'));

require('./app/routes.js')(app, passport);

require('./app/api.js')(app, passport);

app.use(function(req,res,next){
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(req, res, next){
    res.locals.session = req.session;
    next();
});

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next){
        if(res.status(404)){
            res.render('site/pageNotFound')
        } else if (res.status(500)){
            res.render('site/serverError')
        }

    });
}

app.use(function(err, req, res, next){
    if(res.status(404)){
        res.render('site/pageNotFound')
    } else if (res.status(500)){
        res.render('site/serverError')
    }
});
