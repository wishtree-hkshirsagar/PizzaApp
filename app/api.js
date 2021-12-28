
var util = require('util'),
    async = require('async'),
    mongoose = require('mongoose'),
    validator = require('validator'),
    getSlug = require('speakingurl'),
    // linkify = require('linkifyjs'),
    linkifyHtml = require('linkifyjs/html'),
    shortid = require('shortid'),
    // randomColor = require('randomcolor'),
    multer = require('multer'),
    fs = require('fs'),
    _ = require('lodash');
//UUID
const { v4: uuidv4 } = require('uuid');
//Models
var User = require('../app/models/user').User,
    Pizza = require('../app/models/entity').Pizza;
//Utilities
var Utility = require('../app/utility');

var IO;
var uploadedfile;

//Export all API functions
module.exports = function(app, passport, io){
    IO = io;

     /* ----------------- PIZZA API ------------------ */

     app.post('/api/pizza', isLoggedIn, _addPizza); 
     app.get('/api/pizza', isLoggedIn, _getPizza);
     app.get('/api/pizza/:_id', isLoggedIn, _getPizzaByIdOrSlug);
     app.put('/api/pizza/:_id', isLoggedIn, _updatePizza);
     app.delete('/api/pizza/:_id', isLoggedIn, _deletePizza);

     // ADD Pizza Image
    function getTime() {
        var today = new Date().toLocaleDateString()
        today = today.toString().replace('/', '-')
        today = today.replace('/', '-')

        const date = new Date();
        let h = date.getHours();
        let m = date.getMinutes();
        let s = date.getSeconds();

        today += '-' + h + '-' + m + '-' + s

        return today;
    }

    var storage = multer.diskStorage({

        destination: (req, file, callBack) => {
            callBack(null, './static/images/site')
        },
        filename: (req, file, callBack) => {
            callBack(null, `${getTime()}-${file.originalname}`)
        }
    })
    var upload = multer({
         storage: storage,
         fileFilter: (req, file, cb) => {
            if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
                cb(null, true);
              } else {
                cb(null, false);
                return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
              }
         }
        }).single('file');  
     app.post('/api/upload',isLoggedIn, (req, res) => {
         console.log('inside upload')
        upload(req, res, (err) =>{
            uploadedfile = req.file;
            console.log(uploadedfile);
            if(err){
                console.log('error');
                res.send(err);
            }else{
                console.log('Uploaded successfully...')
                res.send('Successful');
            }
        });
    });

    /* ----------------- USER API  ------------------ */
    //Get current user details
    app.get('/api/me', isLoggedIn, _getCurrentUser);
    //Update current user
    app.post('/api/me', isLoggedIn, _updateCurrentUser);
    //Get public user details
    app.get('/api/user/:_id', isLoggedIn, _getPublicUser);
    //Get all users for admin
    app.get('/api/list/users', isLoggedIn, _getAllUsers);


};









//POST Request function - Pizza
// Add a pizza
var _addPizza = function(req, res){
    if(!req.body.title){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title"});
    }
    console.log('add pizza');
    console.log(uploadedfile.filename)
    //Slug
    var key = shortid.generate();
    var slug = key + '-' + getSlug(req.body.title);
    // var file = req.file;
    //New Pizza
    var new_pizza = new Pizza({
        slug: slug,
        title: req.body.title,
        size: req.body.size,
        price: req.body.price,
        image: uploadedfile.filename,
        updated_at: new Date(Date.now())
    });
    try{
       new_pizza.save(() => {
          res.status(200).json(new_pizza); 
       });
    } catch(error){
        return res.status(501).json(error);
    }
}

//GET Request function - get all pizza
var _getPizza = function(req, res) {
    console.log('get pizza');
    Pizza.find({}, (err, pizzas) => {
        // console.log(pizzas)
        if (err) {
            res.status(500).json({ errmsg: err })
        }
        res.send(pizzas);
    })
}


//GET Request function - get one pizza
var _getPizzaByIdOrSlug = function(req, res) {
    console.log('_getPizzaByIdOrSlug')
    var query;
    if(req.params._id.match(/^[0-9a-fA-F]{24}$/)){
        query = {
            _id: req.params._id
        }
    } else {
        query = {
            slug: req.params._id
        }
    }

    Pizza.findOne(query, function(err, pizza){
        if(!pizza){
            console.log('error')
            res.send(err);
        }
        res.status(200).send(pizza);
    });
    

}

var _updatePizza = function(req, res){
    console.log('update pizza')
    var query = { _id: req.params._id };
    Pizza.findOne(query, function(err, pizza){
        if(!pizza){
            console.log('pizza not found...');
            res.status(404).send(err);
        }else{
            try{
                if(req.body.title){
                    pizza.title = req.body.title
                }
                if(req.body.size){
                    pizza.size = req.body.size
                }
                if(req.body.price){
                    pizza.price = req.body.price
                }
                if(uploadedfile){
                    console.log('uploadfile')
                    fs.unlink(`./static/images/site/${pizza.image}`, function(err){
                        if(err){
                            res.status(500).send(err);
                        }
                    });
                    pizza.image = uploadedfile.filename
                }
                pizza.save(() => {
                    res.status(200).json(pizza); 
                    });
             } catch(error){
                 return res.status(501).json(error);
             }
        }
    });
}

var _deletePizza = function(req, res){
    var id = req.params._id;
    Pizza.deleteOne({_id: id}, function(err){
        if(err){
            console.log(err, 'Error in deleting pizza');
        }
    })
    res.status(200).json({ msg: "Pizza deleted successfully..." })
}



/* ----------------- USER FUNCTION ------------------ */
//GET Request functions - User
//Get details of current user
var _getCurrentUser = function(req, res){
    User.findOne({_id: req.user.id}).select('-reset_email -prev_password -loginAttempts -lockUntil -requestToken -resetPasswordToken -resetPasswordExpires')
    .exec(function(err, user){
        user.password = '';
        res.send(user);
    });
};


//POST Request functions - User
//Update current user
var _updateCurrentUser = function(req, res){
    User.findOne({_id: req.user.id}).select('name initials about email dp password').exec(function(err, user){
        var auser = user;
        if(req.body.oldpwd && req.body.newpwd && user.validPassword(req.body.oldpwd) && req.body.name){
            user.name = req.body.name;
            user.initials = req.body.name.split(' ').map(function (s) { return s.charAt(0); }).join('').toUpperCase();
            if(req.body.about != null){
                var linkifiedText = linkifyHtml(req.body.about, {
                    target: '_blank'
                });
                user.about = linkifiedText.replace(/\n\r?/g, '<br />');
            }
            user.job.title = req.body.job.title;
            user.job.org = req.body.job.org;
            user.country = req.body.country;
            user.city = req.body.city;
            user.phone = req.body.phone;
            if(req.body.sex){
                user.sex = req.body.sex;
            }
            if(req.body.theme){
                user.theme = req.body.theme;
            }
            if(req.body.layout){
                user.layout = req.body.layout;
            }
            user.prev_password = user.password;
            user.password = user.generateHash(req.body.newpwd);
            user.save(function(err){
                user.password = null;
                user.prev_password = null;
                res.send(user);
            });
        } else if(req.body.name){
            user.name = req.body.name;
            user.initials = req.body.name.split(' ').map(function (s) { return s.charAt(0); }).join('').toUpperCase();
            if(req.body.about != null){
                var linkifiedText = linkifyHtml(req.body.about, {
                    target: '_blank'
                });
                user.about = linkifiedText.replace(/\n\r?/g, '<br />');
            }
            user.job.title = req.body.job.title;
            user.job.org = req.body.job.org;
            user.country = req.body.country;
            user.city = req.body.city;
            user.phone = req.body.phone;
            if(req.body.sex){
                user.sex = req.body.sex;
            }
            if(req.body.theme){
                user.theme = req.body.theme;
            }
            if(req.body.layout){
                user.layout = req.body.layout;
            }
            user.save(function(err){
                user.password = null;
                res.send(user);
            });
        } else if(req.body.dp) {
            user.dp.m = req.body.dp;
            user.dp.s = req.body.dp;
            user.save(function(err){
                if(!err) {
                    user.password = null;
                    res.send(user);
                }
                //Resize image
                var key = uuidv4();
                var file_name = key + '-' + getSlug(user.name);
                var dp = req.body.dp.replace(/^https:\/\//i, 'http://');
                Utility.get_resized_image(file_name, dp, 100, function(resized){
                    Utility.upload_file(resized, file_name, function(image_url){
                        User.updateOne({ _id: req.user.id }, { $set: { 'dp.s': image_url }}).exec();
                    });
                });
            });
        }
    });
};

//Get user details
var _getPublicUser = function(req, res){
    //Match if object id or not
    if(req.params._id.match(/^[0-9a-fA-F]{24}$/)){
        var query = {
            _id: req.params._id
        };
    } else {
        var query = {
            username: req.params._id
        };
    }
    //Find
    User.findOne(query).select('name accountCreated initials username about dp job city country').exec(function(err, user){
        if(!user) return res.status(400).send({error: "No such user exists"});
        res.send(user);
    });
};


//Get all users for admin
var _getAllUsers = function(req, res){
    //Check if admin
    if(req.user.type != 'admin'){
        return res.status(400).send({error: "Unauthorized user. Cannot view"});
    }
    User.find({}).select('name about email dp city country sex about').sort({accountCreated: -1}).exec(function(err, users){
        res.send(users);
    });
};


//Route middleware to check if user is loggedIn
function isLoggedIn(req, res, next){
    //passport function to check session and cookie
    if(req.isAuthenticated())
        return next();
    //redirect to login page if not loggedin
    res.redirect('/login');
};
