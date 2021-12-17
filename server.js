// Express 4 server and Configurations
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
    colors = require('colors'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash = require('connect-flash'),
    mongoStore = require('connect-mongo')(session);
//This will allow to load environment
//variables defined in .env file in root directory
var dotenv = require('dotenv');
dotenv.config();
//Instantiate express
var app = express();
//Import database configuration and connect to database
var configDB = require('./config/database');
var urlDB = configDB.url;
if (app.get('env') === 'development') {
    urlDB = configDB.urlDev;
}
//Connect mongodb to the url defined in config file
mongoose.Promise = require('bluebird');
mongoose.connect(urlDB, {
    promiseLibrary: require('bluebird'),
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
});
//Pass passport for configuration. We will use passport
//js for login and registration function
require('./config/passport')(passport);
//MongoDB Session store - to create and store login sessions
var sessionStore = new mongoStore({
    url: urlDB,
    collection: 'sessions' //default
});
//Session middleware
var sessionMiddleware = session({
    name: 'pizza.sid',
    store: sessionStore,
    secret: 'Sa802u5LH67pPASasBPopLxa9618',
    cookie: {maxAge: 24 * 60 * 60 * 1000},
    resave: false,
    saveUninitialized: true
});
//Basic session and express configuration
//Set port to 8080 or one defined in env variable
app.set('port', process.env.PORT || 8000);
//Serve static files - like image files kept in static directory
app.use(express.static(path.join(app_root, 'static')));
//Set handlebars as views engine and app_root/views as view dir
app.engine('hbs', hbs.express4({
    partialsDir: [app_root + '/views/partials']
}));
app.set('view engine','hbs');
app.set('views', path.join(app_root, 'views'));
//Set favicon
app.use(favicon(app_root + '/static/images/site/favicon.ico'));

//Body parser: For accessing values using req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: '5mb', extended: true }));
//Method Override: For PUT and DELETE
app.use(methodOverride());
//Express Session
app.use(cookieParser());
app.use(sessionMiddleware);
//Passport using express sessions - Used for login/reg.
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('remember-me'));
//connect flash for flash messages - should be declared after sessions
app.use(flash());
//Socket code - for realtime code
var server = require('http').Server(app);
var io = require('socket.io')(server);
io.use(function(socket, next){
    sessionMiddleware(socket.request, socket.request.res, next);
});
//Start server
server.listen(app.get('port'));
console.log('Express server listening on port: '.green+ app.get('port'));
//Routes - to define several page routes (webpages)
require('./app/routes.js')(app, passport);
//API : Defined in app/api.js
require('./app/api.js')(app, passport, io);
//Realtime code
require('./app/realtime.js')(app, passport, io);
//Error handling - catch 404 and forward to error handler
app.use(function(req,res,next){
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
//Error handlers
//development error handler - print stack trace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next){
        res.status(err.status || 500);
        res.send(err);
    });
}
//production error handler - no stack trace
app.use(function(err, req, res, next){
    res.status(err.status || 500);
    res.send('Error!');
});
