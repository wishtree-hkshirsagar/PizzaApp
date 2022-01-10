
var util = require('util'),
    async = require('async'),
    mongoose = require('mongoose'),
    validator = require('validator'),
    getSlug = require('speakingurl'),
    linkifyHtml = require('linkifyjs/html'),
    shortid = require('shortid'),
    multer = require('multer'),
    fs = require('fs'),
    express = require('express'),
    session = require('express-session'),
    dotenv = require('dotenv'),
    stripe = require('stripe')('sk_test_51KFtEUCiI18G0MYYSMrYFvsLCzDF1T7gaugFNlx64gpnufN2eRD0RVyuFCxffg9FRfzv4PpsRBm00LWKpktNAyuI00t00uKcXe'),
    _ = require('lodash');
//UUID
const { v4: uuidv4 } = require('uuid');
//Models
var User = require('../app/models/user').User,
    Pizza = require('../app/models/entity').Pizza,
    Order = require('../app/models/entity').Order,
    Otp = require('../app/models/entity').Otp,
    Email = require('../config/mail');
//Utilities
// var Utility = require('../app/utility');

var IO;
var uploadedfile;
var application = express();
//Export all API functions
module.exports = function(app, passport, io){
    IO = io;

     /* ----------------- PIZZA API ------------------ */

     app.post('/api/pizza', isLoggedIn, _addPizza); 
     app.get('/api/pizza', isLoggedIn, _getPizza);
     app.get('/api/pizza/:_id', isLoggedIn, _getPizzaByIdOrSlug);
     app.put('/api/pizza/:_id', isLoggedIn, _updatePizza);
     app.delete('/api/pizza/:_id', isLoggedIn, _deletePizza);
     app.get('/api/public/pizza', _getPublicPizza);
     app.get('/api/public/pizza/:_id', _getPublicPizzaByIdOrSlug);

     /* ----------------- ORDER API ------------------ */

     app.post('/api/order', isLoggedIn, _orderPizza);
     app.get('/api/order/:_id', isLoggedIn,  _getOrderByIdOrSlug);
     app.post('/api/order/status',isLoggedIn,_addOrderStatus);
     app.get('/api/customer/orders', isLoggedIn, _getCustomerOrders);
     app.get('/api/customer/orders/:_id', isLoggedIn, _getCustomerOrderByIdOrSlug);
     app.get('/api/admin/orders', isLoggedIn, _getAdminOrders);


      /* -----------------CART API ------------------ */
     
      app.post('/api/cart', _addToCart);
      app.get('/api/cart', _getCartItems);
      
       /* -----------------FORGOT PASSWORD API ------------------ */
      app.post('/api/sendEmail', _sendEmail);
      app.post('/api/updatePassword', _updatePassword);

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


};

var _addToCart = function(req, res) {

    if(!req.session.cart) {
        req.session.cart = {
            items: {},
            totalQty: 0,
            totalPrice: 0
        }

    }

    let cart = req.session.cart;
    
    if(!cart.items[req.body._id]) {
        cart.items[req.body._id] = {
            item: req.body,
            qty: 1
        }

        cart.totalQty = cart.totalQty + 1;
        cart.totalPrice = cart.totalPrice + req.body.price;

    } else {
       
        cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1;
        cart.totalQty = cart.totalQty + 1;
        cart.totalPrice = cart.totalPrice + req.body.price; 

    }
    return res.json({
        totalQty: req.session.cart.totalQty,
        totalPrice: req.session.cart.totalPrice,
        items: cart.items
    });
}

var _getOrderByIdOrSlug = async function(req, res) {
    console.log('****getOrderByIdOrSlug****')
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
    await Order.findOne(query, function(err, order){
            if(!order){
                res.send(err);
            }
            let obj = [];
            for(let i of Object.values(order.items)){
                let obj1 = {};
                obj1.item = i.item;
                obj1.item.qty = i.qty;
                obj.push(obj1);
            }
            res.status(200).send({items: obj});
    });
}

var _addOrderStatus = function(req, res) {
    Order.updateOne({
        _id: req.body.orderId
    }, {
        status: req.body.status
    }, (err, data) => {
        if(err) {
            res.status(500).json({err: err});
        }
        return res.redirect('/admin/orders');
    })
}
 

var _getCartItems = function(req, res) {
    
    let obj = [];
    
    
    if(req.session.cart){
        for(let i of Object.values(req.session.cart.items)){
            let obj1 = {};
            
            obj1.item = i.item;
            obj1.item.qty = i.qty;
            
            obj.push(obj1);
            
        }
        
        return res.json({
            items: obj,
            totalQty: req.session.cart.totalQty,
            totalPrice: req.session.cart.totalPrice
        });
    }
}

var _getCustomerOrders = async function(req, res) {
    try{
        const orders = await Order.find({
            customerId: req.user._id
        }, 
        null,
        { sort: {'createdAt': -1 }});
        res.status(200).send(orders);
    } catch(error){
        res.status(500).json({
            msg: 'Error, No Data Found'
        })
    }
    // console.log('orders',orders);
}

var _getCustomerOrderByIdOrSlug = async function(req, res) {
    console.log('get order status')
    
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
    const order = await Order.findOne(query);
    // console.log(order);
    // console.log(req.user)
    //Authorize user
    if(req.user._id.toString() === order.customerId.toString()){
        // console.log('order#####', order);
       return res.status(200).send({order: order});
    }
        return res.redirect('/');
}

var _getAdminOrders = async function(req, res) {
    console.log('getAdminOrders')
    var data;
    try{
        await Order.find({ status: {$ne: 'completed'}}, 
        null,
        {sort: { 'createdAt': -1}}).populate('customerId','-password').exec((error, orders)=> {
            // console.log('orders', orders)
            
            if (Object.prototype.hasOwnProperty.call(req.query, "start")) {
                const columns = ["srno", "orderId", "customerName", "address", "status", "placedAt"];
                const columnStart = parseInt(req.query.start);
                // console.log('*****columnStart****', columnStart)
                const columnLength = parseInt(req.query.length);
                // console.log('*****columnLength****', columnLength)
                const showPage = columnStart / columnLength + 1;
                const sortColumn = req.query.order[0].column;
                const sortDirection = req.query.order[0].dir == 'asc'? 1 : -1;
                const sortCriteria = {};
                sortCriteria[columns[sortColumn]] = sortDirection;
                var searchStr = req.query.search;
                // console.log('***searchStr***',searchStr);
                if(searchStr.value !== ""){
                    var regex = new RegExp(searchStr.value, "i");
                    searchStr = { $or: [{'slug':regex },{'status': regex},{'address': regex }] };
                }else{
                    searchStr={};
                }
                var recordsTotal = 0;
                var recordsFiltered=0;
                // console.log('***searchStr***',searchStr);
                Order.count({}, function(err, c){
                    recordsTotal = c;
                    // console.log('***c***',c);
                    Order.count(searchStr, function(err, c){
                        recordsFiltered=c;
                        // console.log('***c***',c);
                        // console.log('req.body.start',req.query.start);
                        // console.log('req.body.length',req.query.length);
                        let skip = columnLength * (showPage - 1);
                        let limit = parseInt(columnLength, 10);
                        Order.find(searchStr).skip(skip).limit(limit).sort(sortCriteria).populate('customerId','-password').exec((err, results) => {
                            if (err) {
                                console.log('error while getting results'+err);
                                return;
                            }
                            data = JSON.stringify({
                                "draw": req.query.draw,
                                "recordsFiltered": recordsFiltered,
                                "recordsTotal": recordsTotal,
                                "data": results
                            });
                            // console.log(data)
                            res.send(data);
                        })
                       
                    })
                })
            }
            // res.send(data);
            // res.status(200).json({data: data});
        });
    }catch(error){
        res.status(500).json({
            msg: 'Error, No Data Found'
        })
    }
}


var _sendEmail = async function(req, res) {
    let data = await User.findOne({email: req.body.email});
    const responseType = {};
    // console.log('data', data)
    if(data){
        let otpcode = Math.floor((Math.random()*10000)+1);
        console.log('otpcode', otpcode)
        let otpData = new Otp({
            email: req.body.email,
            otp: otpcode,
            expireIn: new Date().getTime() + 300*1000
        });

        
        responseType.statusText = 'Success'
        Email.mailer(req.body.email, otpcode);
        responseType.message = `Otp has been sent to the ${req.body.email}`
        otpData.save(()=> {
            res.status(200).json(responseType);
        });
    } else {
        responseType.statusText = 'Error'
        responseType.message = 'Email ID does not exist'
        res.status(500).json(responseType);
    }
    
}

var _updatePassword = async function(req, res) {
    console.log('email', req.body.email);
    console.log('otp', req.body.otp);
    let data = await Otp.findOne({email: req.body.email, otp: req.body.otp});
    console.log(data);
    const responseType = {};
    if(data){
        console.log('if')
        let currentTime = new Date().getTime();
        let diff = data.expireIn - currentTime;
        if(diff < 0){
            responseType.status = 'Error';
            responseType.message = 'One Time Password Expired';
            res.status(500).json(responseType);
        }else{
            let user = await User.findOne({email: req.body.email})
            user.password = user.generateHash(req.body.password);
            user.save();
            responseType.status = 'Success';
            responseType.message = 'Password Changed Successfully!';
            res.status(200).json(responseType);
        }
    }else{
        console.log('error')
        responseType.status = 'Error';
        responseType.message = 'Invalid OTP';
        res.status(404).json(responseType);
    }
}



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

//GET Request function - get all public pizza
var _getPublicPizza = function(req, res) {
    console.log('get all public pizza');
    Pizza.find({}, (err, pizzas) => {
        // console.log(pizzas)
        if (err) {
            res.status(500).json({ errmsg: err })
        }
        res.send(pizzas);
    })
}

var _getPublicPizzaByIdOrSlug = function(req, res) {
    console.log('_getPublicPizzaByIdOrSlug')
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

var _orderPizza = function(req, res){
    console.log('orderPizza')
    console.log('body', req.body);
    const { contactNumber, address, paymentType, stripeToken } = req.body;
    if(!contactNumber || !address){
         return res.status(422).json({msg : "Error, All fields are required"});
    }
    //Slug
    var key = shortid.generate();
    var slug = key + '-' + getSlug(contactNumber);
    var new_order = new Order({
        customerId: req.user._id,
        items: req.session.cart.items,
        contactNumber: contactNumber,
        address: address,
        paymentType: paymentType,
        slug: slug
    });
    console.log('570', req.body.stripeToken);

    new_order.save().then(result => {
        Order.populate(result, { path: 'customerId' }, (err, placedOrder) => {
            console.log('placedOrder', placedOrder);
            if(placedOrder.paymentType === 'card'){
                console.log('card payment');
                
                    
                    stripe.charges.create({ 
                                amount: req.session.cart.totalPrice  * 100,    // Charing Rs 25 
                                description: `Pizza order id: ${placedOrder._id}`, 
                                currency: 'inr', 
                                source: stripeToken
                            }).then(() => {
                                placedOrder.paymentStatus = true
                                placedOrder.paymentType = paymentType
                                placedOrder.save().then((order) => {
                                    console.log('587', order)
                                    // delete req.session.cart
                                    return res.json({ message : 'Payment successful, Order placed successfully' });
                                }).catch((error) => {
                                    console.log(error)
                                })
                            }).catch((error) => {
                                // delete req.session.cart
                                return res.json({ message : 'OrderPlaced but payment failed, You can pay at delivery time' });
                            })
            } else {
                // delete req.session.cart
                return res.json({ message : 'Order placed succesfully' });
            }
        })
    }).catch(error => {
        return res.status(500).json({message: 'Something went wrong'});
    })
}













//Route middleware to check if user is loggedIn
function isLoggedIn(req, res, next){
    //passport function to check session and cookie
    if(req.isAuthenticated())
        return next();
    //redirect to login page if not loggedin
    res.redirect('/login');
};
