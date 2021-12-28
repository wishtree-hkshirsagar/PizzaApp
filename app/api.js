//API - v1 - FramerSpace
var util = require('util'),
    async = require('async'),
    mongoose = require('mongoose'),
    validator = require('validator'),
    getSlug = require('speakingurl'),
    linkify = require('linkifyjs'),
    linkifyHtml = require('linkifyjs/html'),
    shortid = require('shortid'),
    randomColor = require('randomcolor'),
    multer = require('multer'),
    fs = require('fs'),
    _ = require('lodash');
//UUID
const { v4: uuidv4 } = require('uuid');
//Models
var User = require('../app/models/user').User;
var Member = require('../app/models/entity').Member,
    Learner = require('../app/models/entity').Learner,
    Viewer = require('../app/models/entity').Viewer,
    Course = require('../app/models/entity').Course,
    Badge = require('../app/models/entity').Badge,
    Attachment = require('../app/models/entity').Attachment,
    Response = require('../app/models/entity').Response,
    Option = require('../app/models/entity').Option,
    Fill = require('../app/models/entity').Fill,
    Item = require('../app/models/entity').Item,
    Feedback = require('../app/models/entity').Feedback,
    Block = require('../app/models/entity').Block,
    Pizza = require('../app/models/entity').Pizza;
//Utilities
var Utility = require('../app/utility');

//Email
var Email = require('../config/mail.js');
//Variables for file upload
var mime = require('mime'),
    moment = require('moment'),
    crypto = require('crypto');

var IO;
var uploadedfile;
//Page size
var PAGE_SIZE = 20;
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
         storage: storage 
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

//Unselect match option
var _unselectMatchOption = function(req, res){
    if(!req.body.option || !req.body.matched_to){
        return res.status(400).send({error: "Invalid parameters. We are expecting an option id and matched_to option id."});
    }
    Block.updateOne({
        _id: req.params._id,
        "options._id": req.body.option
    }, { $pull: { "options.$.matchers": {matched_to: req.body.matched_to, creator: req.user.id} } }, function(err, numAffected) {
        if(!err) res.sendStatus(200);
    });
};
//Add fill
var _addFill = function(req, res){
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add fill."});
            //Add new fill
            var new_fill = new Fill({
                text: req.body.text,
                is_blank: req.body.is_blank,
                size: req.body.size,
                options: req.body.options
            });
            block.fills.push(new_fill);
            //Save
            block.save(function(err){
                if(!err){
                    res.status(200).send(new_fill);
                } else res.sendStatus(400);
            });
        });
    });
};
//Edit fill
var _editFill = function(req, res){
    if(!req.body.fill){
        return res.status(400).send({error: "Invalid parameters. We are expecting a fill id."});
    }
    if(req.body.keywords == null){
        return res.status(400).send({error: "Invalid parameters. We are expecting keywords."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot edit fill."});
            //Keywords
            if(req.body.keywords){
                var keywords = req.body.keywords.toLowerCase().match(/(?=\S)[^,]+?(?=\s*(,|$))/g);
                //Update
                Block.updateOne({
                    _id: req.params._id,
                    'fills._id': req.body.fill
                }, { $set: { 'fills.$.keywords': keywords}}, function(err, numAffected){
                    res.send(block);
                });
            } else {
                Block.updateOne({
                    _id: req.params._id,
                    'fills._id': req.body.fill
                }, { $unset: { 'fills.$.keywords': 1}}, function(err, numAffected){
                    res.send(block);
                });
            }
        });
    });
};
//Remove fill
var _removeFill = function(req, res){
    if(!req.body.fill){
        return res.status(400).send({error: "Invalid parameters. We are expecting a fill id."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot remove fill."});
            Block.updateOne({
                _id: req.params._id,
                'fills._id': req.body.fill
            }, { $pull: { fills: {_id: req.body.fill}}}, function(err, numAffected){
                res.sendStatus(200);
            });
        });
    });
};
//Fill blanks
var _fillBlanks = function(req, res){
    if(!req.body.fills || !req.body.fills.length){
        return res.status(400).send({error: "Invalid parameters. We are expecting a fills array."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                  {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                  {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot fill blanks."});
            //Fill
            async.each(req.body.fills, function(fill, callback){
                var fill_id = fill[0];
                var fill_text =  fill[1];
                if(fill_text){
                    var new_fill = new Response({
                        text: fill_text,
                        creator: req.user.id,
                        updated_at: new Date(Date.now())
                    });
                    //Remove previous fill
                    Block.updateOne({
                        _id: req.params._id,
                        "fills._id": fill_id
                    }, { $pull: { "fills.$.responses": {creator: req.user.id} } }, function(err, numAffected) {
                        //Fill
                        Block.updateOne({
                            _id: req.params._id,
                            "fills._id": fill_id},
                        { $push: { "fills.$.responses": new_fill}}, function(err, numAffected){
                            callback();
                        });
                    });
                } else {
                    Block.updateOne({
                        _id: req.params._id,
                        "fills._id": fill_id
                    }, { $pull: { "fills.$.responses": {creator: req.user.id} } }, function(err, numAffected) {
                        callback();
                    });
                }
            }, function(err){
                res.sendStatus(200);
            });
        });
    });
};
//Add user response
var _addUserResponseToBlock = function(req, res){
    if(!req.body.text && !req.body.provider){
         return res.status(400).send({error: "Invalid parameters. We are expecting a response text or a response url."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
            //Check access to course
            Course.findOne({
                _id: block.course,
                $or: [{creator: req.user.id},
                      {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                      {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                      {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
            }, function(err, course){
                if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add response."});
                //Add new response
                var new_response = new Response({
                    text: req.body.text,
                    creator: req.user.id,
                    updated_at: new Date(Date.now)
                });
                //Add attachment
                if(req.body.provider && req.body.provider.url){
                    var new_attachment = new Attachment({
                        type: req.body.file_type || block.response_type,
                        file: req.body.file,
                        provider: req.body.provider
                    });
                    new_response.attachments.push(new_attachment);
                }
                //Save
                block.responses.push(new_response);
                block.save(function(err){
                    if(!err){
                        res.status(200).send(block);
                    } else res.sendStatus(400);
                });
            });
    });
};
//Edit response
var _editTextResponseBlock = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We were expecting a response text."});
    }
    Block.updateOne({
        _id: req.params._id,
        response_type: 'text',
        'responses.creator': req.user.id
    }, { $set: { 'responses.$.text': req.body.text} }, function(err, numAffected){
        if(!err) res.send({text: req.body.text});
    });
};
//Remove user response
var _removeUserResponseFromBlock = function(req, res){
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        if(!block.responses || !block.responses.length)
            return res.status(400).send({error: "Cannot remove response."});
        //Find provider url if any
        var keys = [];
        for(var i=0; i<block.responses.length; i++){
            if((block.responses[i].creator == req.user.id) && block.responses[i].attachments.length){
                for(var j=0; j<block.responses[i].attachments.length; j++){
                    var provider_key = Utility.get_provider_key(block.responses[i].attachments[j].provider);
                    keys.push(provider_key);
                }
                break;
            }
        }
        //Update block
        Block.updateOne({
            _id: req.params._id,
            'responses.creator': req.user.id
        }, { $pull: { responses: {creator: req.user.id}}}, function(err, numAffected){
            if(!err){
                res.sendStatus(200);
                //Finally delete all keys
                Utility.delete_keys(keys);
            } else {
                res.sendStatus(400);
            }
        });
    });
};
//Add list item
var _addListItem = function(req, res){
    if(!req.body.text && !req.body.image){
        return res.status(400).send({error: "Invalid parameters. We are expecting an item text or image."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add item."});
            //Add new item
            var new_item = new Item({
                type: req.body.item_type,
                text: req.body.text,
                'image.m': req.body.image,
                'image.l': req.body.image,
                bound: req.body.bound,
                is_right: req.body.is_right
            });
            block.items.push(new_item);
            //Save
            block.save(function(err){
                if(!err){
                    res.status(200).send(new_item);
                    //Update image
                    if(req.body.image){
                        var image = req.body.image.replace(/^https:\/\//i, 'http://');
                        var slug = shortid.generate();
                        var m_file_name = 'm-' + slug;
                        //Update image (medium size)
                        Utility.get_resized_image(m_file_name, image, 200, function(resized){
                            Utility.upload_file(resized, m_file_name, function(image_url){
                                Block.updateOne({_id: req.params._id, 'items._id': new_item._id}, {$set: {'items.$.image.m': image_url}}).exec();
                            });
                        });
                    }
                } else res.sendStatus(400);
            });
        });
    });
};
//Remove list item
var _removeListItem = function(req, res){
    if(!req.body.item){
        return res.status(400).send({error: "Invalid parameters. We are expecting an item id."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot remove item."});
            Block.updateOne({
                _id: req.params._id,
                'items._id': req.body.item
            }, { $pull: { items: {_id: req.body.item}}}, function(err, numAffected){
                res.sendStatus(200);
            });
        });
    });
};
//Add grid item
var _addGridItem = function(req, res){
    if(!req.body.text && !req.body.image){
        return res.status(400).send({error: "Invalid parameters. We are expecting an item text or image."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add item."});
            //Add new item
            var new_item = new Item({
                text: req.body.text,
                'image.m': req.body.image,
                'image.l': req.body.image,
                bound: req.body.bound
            });
            block.items.push(new_item);
            //Save
            block.save(function(err){
                if(!err){
                    res.status(200).send(new_item);
                    //Update image
                    if(req.body.image){
                        var image = req.body.image.replace(/^https:\/\//i, 'http://');
                        var slug = shortid.generate();
                        var m_file_name = 'm-' + slug;
                        //Update image (medium size)
                        Utility.get_resized_image(m_file_name, image, 400, function(resized){
                            Utility.upload_file(resized, m_file_name, function(image_url){
                                Block.updateOne({_id: req.params._id, 'items._id': new_item._id}, {$set: {'items.$.image.m': image_url}}).exec();
                            });
                        });
                    }
                } else res.sendStatus(400);
            });
        });
    });
};
//Remove grid item
var _removeGridItem = function(req, res){
    if(!req.body.item){
        return res.status(400).send({error: "Invalid parameters. We are expecting an item id."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot remove item."});
            Block.updateOne({
                _id: req.params._id,
                'items._id': req.body.item
            }, { $pull: { items: {_id: req.body.item}}}, function(err, numAffected){
                res.sendStatus(200);
            });
        });
    });
};
//Add feedback
var _addFeedback = function(req, res){
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add feedback."});
            //Add new feedback
            var new_feedback = new Feedback({
                text: req.body.text,
                badges: req.body.badges,
                selected_options: req.body.selected_options,
                fill_id: req.body.fill_id,
                fill_items: req.body.fill_items
            });
            block.feedbacks.push(new_feedback);
            //Save
            block.save(function(err){
                if(!err) {
                    res.status(200).send(new_feedback);
                    //Update total count of skill
                    if(req.body.badges && req.body.badges.length){
                        for(var i=0; i<req.body.badges.length; i++){
                            if(req.body.badges[i].skill_inc){
                                var skill_inc = parseInt(req.body.badges[i].skill_inc);
                                Badge.updateOne({_id: req.body.badges[i].badge, is_skill: true}, {$inc: { skill_total: skill_inc}}).exec();
                            }
                        }
                    }
                }
                else res.sendStatus(400);
            })
        });
    });
};
//Remove feedback
var _removeFeedback = function(req, res){
    if(!req.body.feedback){
        return res.status(400).send({error: "Invalid parameters. We are expecting a feedback id."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot remove feedback."});
            //Get feedback
            var feedback;
            if(block.feedbacks && block.feedbacks.length){
                for(var i=0; i<block.feedbacks.length; i++){
                    if(block.feedbacks[i]._id.toString() == req.body.feedback){
                        feedback = block.feedbacks[i];
                        break;
                    }
                }
            } else {
                return res.status(400).send({error: "No such feedback exists."});
            }
            if(!feedback) return res.status(400).send({error: "No such feedback exists."});
            //Remove feedback
            Block.updateOne({
                _id: req.params._id,
                'feedbacks._id': req.body.feedback
            }, { $pull: { feedbacks: {_id: req.body.feedback}}}, function(err, numAffected){
                res.sendStatus(200);
                //Update total count of skill
                if(feedback.badges && feedback.badges.length){
                    for(var i=0; i<feedback.badges.length; i++){
                        if(feedback.badges[i].skill_inc){
                            var skill_inc = parseInt(feedback.badges[i].skill_inc);
                            skill_inc = -skill_inc;
                            Badge.updateOne({_id: feedback.badges[i].badge, is_skill: true}, {$inc: {skill_total: skill_inc}}).exec();
                        }
                    }
                }
            });
        });
    });
};
//View block
var _viewBlock = function(req, res){
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check if user has access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                  {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                  {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
        }, function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot view block."});
            //Get all viewers
            var viewer_ids = [];
            for(var i=0; i<block.viewers.length; i++){
                viewer_ids.push(block.viewers[i].user.toString());
            }
            //Add or update viewer
            if(viewer_ids.indexOf(req.user.id.toString()) > -1) {
                //Update count
                Block.updateOne({
                   _id: req.params._id,
                   'viewers.user': req.user.id
               }, { $set: { 'viewers.$.updated_at': new Date(Date.now())}, $inc: {'viewers.$.count': 1}}, function(err, numAffected){
                   if(!err) res.sendStatus(200);
               });
            } else {
                //New viewer
                var new_viewer = new Viewer({
                    user: req.user.id,
                    count: 1,
                    updated_at: new Date(Date.now())
                });
                block.viewers.push(new_viewer);
                block.save(function(err){
                    if(!err) res.sendStatus(200);
                });
            }
        });
    });
};

/*---------------- BADGES FUNCTION -------------------------*/
//GET Request functions - Badges
//All badges of a course
var _getBadges = function(req, res){
    //Check access to course
    Course.findOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
              {is_active: true, privacy: {$in: ['public', 'unlisted']}},
              {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
    }, function(err, course){
        if(!course) return res.send([]);
        Badge.find({course: course._id}, function(err, badges){
            res.send(badges);
        });
    });
};
//Get a single badge
var _getBadgeById = function(req, res){

};
//POST Requests function
//Add badge to course
var _createBadge = function(req, res){
    if(!req.body.title) return res.status(400).send({error: "Invalid parameters. We are expecting a badge title."});
    if(!req.body.course) return res.status(400).send({error: "Invalid parameters. We are expecting a course id."});
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }, function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add badge to course."});
        //Get random color
        var badgeColor = randomColor({luminosity: 'dark'});
        //New badge
        var new_badge = new Badge({
            title: req.body.title,
            color: badgeColor,
            'image.m': req.body.image,
            'image.l': req.body.image,
            bound: req.body.bound,
            is_skill: req.body.is_skill,
            course: course._id,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        new_badge.save(function(err){
            if(!err) {
                //Update course count
                if(req.body.is_skill){
                    Course.updateOne({ _id: course._id}, { $inc: { 'count.skills': 1 } }, function(err, numAffected){
                        res.send(new_badge);
                    });
                } else {
                    Course.updateOne({ _id: course._id}, { $inc: { 'count.badges': 1 } }, function(err, numAffected){
                        res.send(new_badge);
                    });
                }
                //Update image
                if(req.body.image){
                    var key = shortid.generate();
                    var slug = key + '-' + getSlug(req.body.title);
                    var m_file_name = 'm-' + slug;
                    var image = req.body.image.replace(/^https:\/\//i, 'http://');
                    //Update image (medium size)
                    Utility.get_resized_image(m_file_name, image, 400, function(resized){
                        Utility.upload_file(resized, m_file_name, function(image_url){
                            Badge.updateOne({ _id: new_badge._id }, { $set: { 'image.m': image_url }}).exec();
                        });
                    });
                }
            }
        });
    });
};
//DELETE Request function
//Delete badge
var _deleteBadge = function(req, res){
    Badge.findOne({_id: req.params._id}, function(err, badge){
        if(!badge) return res.sendStatus(404);
        async.series([
            function(callback){
                //Update badge count
                if(badge.is_skill){
                    Course.updateOne({
                        _id: badge.course,
                        $or: [{creator: req.user.id},
                              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
                    }, { $inc: { 'count.skills': -1 } }, function(err, course){
                        callback();
                    });
                } else {
                    Course.updateOne({
                        _id: badge.course,
                        $or: [{creator: req.user.id},
                              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
                    }, { $inc: { 'count.badges': -1 } }, function(err, course){
                        callback();
                    });
                }
            },
            function(callback){
                //Remove feedback with the badge from blocks
                Block.updateMany({
                    'feedbacks.badges.badge': badge._id
                }, { $pull: {feedbacks: {'badges.badge': badge._id}}}, function(err, numAffected){
                    callback();
                });
            }
        ], function(err){
            //Get badge image keys
            if(badge.image) var keys = Utility.get_image_keys([badge.image.l], badge.image.m);
            //Remove badge
            badge.remove(function(err){
                res.sendStatus(200);
                //Delete badge images
                if(keys) Utility.delete_keys(keys);
            });
        });
    });
};

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
