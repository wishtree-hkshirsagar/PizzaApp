
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
    mongoStore = require('connect-mongo')(session),
    dotenv = require('dotenv'),
    configDB = require('./config/database');
// var dotenv = require('dotenv');
dotenv.config();

var app = express();
// var configDB = require('./config/database');
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
    cookie: {maxAge: 60 * 60 * 1000},
    resave: false,
    saveUninitialized: true
});

app.set('port', process.env.PORT || 8000);

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
app.use(passport.authenticate('remember-me'));

app.use(flash());
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
