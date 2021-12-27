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
    Comment = require('../app/models/entity').Comment,
    FeedbackBadge = require('../app/models/entity').FeedbackBadge,
    Feedback = require('../app/models/entity').Feedback,
    Block = require('../app/models/entity').Block,
    Note = require('../app/models/entity').Note,
    Chat = require('../app/models/entity').Chat,
    Message = require('../app/models/entity').Message,
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
     app.get('/api/pizza/:_id', isLoggedIn, _getOnePizzaByIdOrSlug);
     app.put('/api/pizza/:_id', isLoggedIn, _updatePizza);

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


    // /* ----------------- COURSE API ------------------ */
    // //GET Requests
    // //Get courses
    // app.get('/api/courses/:_type', isLoggedIn, function(req, res){
    //     switch(req.params._type){
    //         case 'public':
    //             _getPublicCourses(req, res);
    //             break;
    //         case 'drafts':
    //             _getDraftCourses(req, res);
    //             break;
    //         case 'archived':
    //             _getArchivedCourses(req, res);
    //             break;
    //         case 'enrolled':
    //             _getEnrolledCourses(req, res);
    //             break;
    //         default:
    //             _getPublicCourses(req, res);
    //     }
    // });
    
    // app.get('/api/course/:_id', isLoggedIn, _getCourseByIdOrSlug);
    
    // app.post('/api/course', isLoggedIn, _createCourse);

    // app.put('/api/course/:_id/:_action', isLoggedIn, function(req, res){
    //     switch(req.params._action){
    //         case 'edit':
    //             _editCourse(req, res);
    //             break;
    //         case 'archive':
    //             _archiveCourse(req, res);
    //             break;
    //         case 'unarchive':
    //             _unarchiveCourse(req, res);
    //             break;
    //         case 'join':
    //             _joinCourse(req, res);
    //             break;
    //         case 'unjoin':
    //             _unjoinCourse(req, res);
    //             break;
    //         case 'add_member':
    //             _addMemberToCourse(req, res);
    //             break;
    //         case 'edit_member':
    //             _editMemberPrivilegeInCourse(req, res);
    //             break;
    //         case 'remove_member':
    //             _removeMemberFromCourse(req, res);
    //             break;
    //         case 'add_learner':
    //             _addLearnerToCourse(req, res);
    //             break;
    //         case 'edit_learner':
    //             _editLearnerProgress(req, res);
    //             break;
    //         case 'view':
    //             _viewCourse(req, res);
    //             break;
    //         case 'copy':
    //             _copyCourse(req, res);
    //             break;
    //         default:
    //             _editCourse(req, res);
    //     }
    // });
    //DELETE Requests
    //Delete a course
    // app.delete('/api/course/:_id', isLoggedIn, _deleteCourse);
    /* ----------------- BLOCK API ------------------------- */
    //Get Requests
    //Get course blocks
    // app.get('/api/blocks/:_id', isLoggedIn, _getCourseBlocks);
    //Get container blocks
    // app.get('/api/blocks/container/:_id', isLoggedIn, _getContainerBlocks);
    //Get block by _id or slug
    // app.get('/api/block/:_id', isLoggedIn, _getBlockByIdOrSlug);
    //POST Requests
    //Create a block
    // app.post('/api/block/:_type', isLoggedIn, function(req, res){
    //     switch(req.params._type){
    //         case 'text':
    //             _createTextBlock(req, res);
    //             break;
    //         case 'button':
    //             _createButtonBlock(req, res);
    //             break;
    //         case 'divider':
    //             _createDividerBlock(req, res);
    //             break;
    //         case 'toggle_list':
    //             _createToggleListBlock(req, res);
    //             break;
    //         case 'image':
    //         case 'video':
    //         case 'audio':
    //         case 'file':
    //             _createFileBlock(req, res);
    //             break;
    //         case 'link':
    //             _createLinkBlock(req, res);
    //             break;
    //         case 'gif':
    //             _createGIFBlock(req, res);
    //             break;
    //         case 'mcq':
    //             _createMCQBlock(req, res);
    //             break;
    //         case 'fill':
    //             _createFillInTheBlanksBlock(req, res);
    //             break;
    //         case 'match':
    //             _createMatchTheFollowingBlock(req, res);
    //             break;
    //         case 'response':
    //             _createResponseBlock(req, res);
    //             break;
    //         case 'list':
    //             _createListBlock(req, res);
    //             break;
    //         case 'container':
    //             _createContainerBlock(req, res);
    //             break;
    //         case 'grid':
    //             _createGridBlock(req, res);
    //             break;
    //         case 'comic':
    //             _createComicBlock(req, res);
    //             break;
    //         case 'embed':
    //             _createEmbedBlock(req, res);
    //             break;
    //         default:
    //             res.status(500).send({error: "Invalid query type"});
    //     }
    // });
    //PUT Requests
    //Update a block or actions on a block
    // app.put('/api/block/:_id/:_action', isLoggedIn, function(req, res){
    //     switch(req.params._action){
    //         case 'edit':
    //             _editBlock(req, res);
    //             break;
    //         case 'order':
    //             _editBlockOrder(req, res);
    //             break;
    //         case 'move':
    //             _moveBlock(req, res);
    //             break;
    //         case 'edit_text':
    //             _editTextBlock(req, res);
    //             break;
    //         case 'add_item':
    //             _addToggleListItem(req, res);
    //             break;
    //         case 'remove_item':
    //             _removeToggleListItem(req, res);
    //             break;
    //         case 'add_option':
    //             _addOption(req, res);
    //             break;
    //         case 'edit_mcq_option':
    //             _editMCQOption(req, res);
    //             break;
    //         case 'correct_mcq_option':
    //             _correctMCQOption(req, res);
    //             break;
    //         case 'remove_option':
    //             _removeOption(req, res);
    //             break;
    //         case 'select_option':
    //             _selectOption(req, res);
    //             break;
    //         case 'unselect_option':
    //             _unselectOption(req, res);
    //             break;
    //         case 'select_match':
    //             _selectMatchOption(req, res);
    //             break;
    //         case 'unselect_match':
    //             _unselectMatchOption(req, res);
    //             break;
    //         case 'add_fill':
    //             _addFill(req, res);
    //             break;
    //         case 'edit_fill':
    //             _editFill(req, res);
    //             break;
    //         case 'remove_fill':
    //             _removeFill(req, res);
    //             break;
    //         case 'fill_blanks':
    //             _fillBlanks(req, res);
    //             break;
    //         case 'add_response':
    //             _addUserResponseToBlock(req, res);
    //             break;
    //         case 'edit_text_response':
    //             _editTextResponseBlock(req, res);
    //             break;
    //         case 'remove_response':
    //             _removeUserResponseFromBlock(req, res);
    //             break;
    //         case 'add_list_item':
    //             _addListItem(req, res);
    //             break;
    //         case 'remove_list_item':
    //             _removeListItem(req, res);
    //             break;
    //         case 'add_grid_item':
    //             _addGridItem(req, res);
    //             break;
    //         case 'remove_grid_item':
    //             _removeGridItem(req, res);
    //             break;
    //         case 'add_feedback':
    //             _addFeedback(req, res);
    //             break;
    //         case 'remove_feedback':
    //             _removeFeedback(req, res);
    //             break;
    //         case 'view':
    //             _viewBlock(req, res);
    //             break;
    //         default:
    //             _editBlock(req, res);
    //     }
    // });
    //DELETE Requests
    //Delete block
    app.delete('/api/block/:_id', isLoggedIn, _deleteBlock);
    /* ----------------- BADGES API ------------------------- */
    //GET Requests
    //Get all badges of a course
    // app.get('/api/badges/:_id', isLoggedIn, _getBadges);
    //Get a badge by id
    // app.get('/api/badge/:_id', isLoggedIn, _getBadgeById);
    //POST Requests
    //Create a badge
    // app.post('/api/badge', isLoggedIn, _createBadge);
    //DELETE Requests
    //Delete a badge
    // app.delete('/api/badge/:_id', isLoggedIn, _deleteBadge);
    /* ----------------- MESSAGES API ------------------------- */
    //GET Requests
    //Get all messages
    app.get('/api/messages', isLoggedIn, _getMessages);
    //Get a message by id
    app.get('/api/message/:_id', isLoggedIn, _getMessageById);
    //POST Requests
    //Create a message
    app.post('/api/message', isLoggedIn, _createMessage);
    //PUT Requests
    //Add a chat to a message
    app.put('/api/message/:_id',  isLoggedIn, _addChat);
    //DELETE Requests
    //Delete a message
    app.delete('/api/message/:_id', isLoggedIn, _deleteMessage);
    /* ----------------- COMMENTS API ------------------------- */
    //GET Requests
    //Get all comments
    app.get('/api/discussion/:_id/comments', isLoggedIn, _showComments);
    //Get a comment by id
    app.get('/api/comment/:_id', isLoggedIn, _getCommentById);
    //POST Requests
    //Add a comment
    app.post('/api/comment', isLoggedIn, _addComment);
    // PUT Requests
    // Update a comment or actions on a comment
    app.put('/api/comment/:_id/:_action', isLoggedIn, function(req, res){
        switch(req.params._action){
            case 'edit':
                _editComment(req, res);
                break;
            case 'like':
                _likeComment(req, res);
                break;
            case 'unlike':
                _unlikeComment(req, res);
                break;
            default:
                _editComment(req, res);
        }
    });
    //DELETE Requests
    //Delete a comment
    app.delete('/api/comment/:_id', isLoggedIn, _deleteComment);
    /* ----------------- USER API  ------------------ */
    //Get current user details
    app.get('/api/me', isLoggedIn, _getCurrentUser);
    //Update current user
    app.post('/api/me', isLoggedIn, _updateCurrentUser);
    //Get all users
    app.get('/api/users/:_type', isLoggedIn, function(req, res){
        switch(req.params._type){
            case 'active':
                _getAllActiveUsers(req, res);
                break;
            case 'inactive':
                _getAllInactiveUsers(req, res);
                break;
            default:
                _getAllActiveUsers(req, res);
        }
    });
    //Get public user details
    app.get('/api/user/:_id', isLoggedIn, _getPublicUser);
    //Get all users for admin
    app.get('/api/list/users', isLoggedIn, _getAllUsers);
    //PUT Requests
    //Update a user
    app.put('/api/user/:_id/:_action', isLoggedIn, function(req, res){
        switch(req.params._action){
            case 'activate':
                _activateUser(req, res);
                break;
            case 'deactivate':
                _deactivateUser(req, res);
                break;
            case 'unique_id':
                _updateUniqueId(req, res);
                break;
            case 'reset_email':
                _updateResetEmail(req, res);
                break;
            default:
                _activateUser(req, res);
        }
    });
    /* ----------------- SEARCH API  ------------------ */
    //Get search results
    app.get('/api/search/:_type', isLoggedIn, function(req, res){
        switch(req.params._type){
            case 'all':
                _searchCoursesAndContainers(req, res);
                break;
            case 'users':
                _searchUsers(req, res);
                break;
            case 'gifs':
                _searchGifs(req, res);
                break;
            case 'badges':
                _searchBadges(req, res);
                break;
            case 'skills':
                _searchSkills(req, res);
                break;
            default:
                _searchUsers(req, res);
        }
    });
    /* ----------------- INSIGHT API  ------------------ */
    app.get('/api/insight/:_id/:_type', isLoggedIn, function(req, res){
        switch(req.params._type){
            case 'basic':
                _getCourseBasicInsight(req, res);
                break;
            case 'users':
                _getCourseUsersInsight(req, res);
                break;
            case 'responses':
                _getUserResponsesInsight(req, res);
                break;
            case 'comments':
                _getUserCommentsInsight(req, res);
                break;
            default:
                res.status(500).send({error: "Invalid query type"});
        }
    });
    /* ----------------- PUBLIC API ------------------ */
    //Get public courses
    app.get('/api/public/courses', _getPublicCourses);
    //Get public course
    app.get('/api/public/course/:_id', _getPublicCourseByIdOrSlug);
    //Get public course blocks
    app.get('/api/public/blocks/:_id', _getPublicCourseBlocks);
    //Get public container blocks
    app.get('/api/public/blocks/container/:_id', _getPublicContainerBlocks);
    /* ----------------- MINIMAP API  ------------------ */
    app.get('/api/minimap/:_id', isLoggedIn, _getCourseMinimap);
    /* ----------------- GET LINK DETAILS ------------------ */
    app.get('/api/embedlink', isLoggedIn, _getLinkPreview);
    /* ----------------- GET UNIQUE NAME ------------------ */
    app.get('/api/uniquename', isLoggedIn, _getUniqueName);
    /* ----------------- ANALYSIS ------------------ */
    app.post('/api/analysis/:_type', isLoggedIn, function(req, res){
        switch(req.params._type){
            case 'language':
                _getDominantLanguage(req, res);
                break;
            case 'entity':
                _getEntityRecognition(req, res);
                break;
            case 'keyphrase':
                _getKeyPhrases(req, res);
                break;
            case 'sentiment':
                _getSentimentAnalysis(req, res);
                break;
            case 'syntax':
                _getSyntaxAnalysis(req, res);
                break;
            case 'translate':
                _getTranslatedText(req, res);
                break;
            case 'tone':
                _getToneAnalysis(req, res);
                break;
            default:
                res.status(500).send({error: "Invalid query type"});
        }
    });
    /* ----------------- UPLOAD TO S3 ------------------ */
    app.get('/api/signed', isLoggedIn, _uploadS3);
};
/*---------------- COURSE FUNCTION -------------------------*/
//GET Request functions - Course
//Get public courses
var _getPublicCourses = function(req, res){
    Course.find({
        is_active: true,
        privacy: 'public'
    }).select('-members -learners -viewers').populate('creator', 'name initials username dp job', 'User')
    .sort({updated_at: -1}).exec(function(err, courses){
        res.send(courses);
    });
};
//Get draft courses
var _getDraftCourses = function(req, res){
    Course.find({
        is_active: true,
        privacy: {$ne: 'public'},
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['moderator', 'teacher', 'active']}}}}]
    }).select('-members -learners -viewers').populate('creator', 'name initials username dp job', 'User')
    .sort({updated_at: -1}).exec(function(err, courses){
        res.send(courses);
    });
};
//Get archived courses
var _getArchivedCourses = function(req, res){
    Course.find({
        is_active: false,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).select('-members -learners -viewers').populate('creator', 'name initials username dp job', 'User')
    .sort({updated_at: -1}).exec(function(err, courses){
        res.send(courses);
    });
};
//Get enrolled courses
var _getEnrolledCourses = function(req, res){
    Course.find({
        'learners.user': req.user.id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
              {is_active: true, privacy: {$in: ['public', 'unlisted']}},
              {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
    }).select({title: 1, tagline: 1, slug: 1, learners: {$elemMatch: {user: req.user.id}}})
    .populate('learners.containers', 'title tagline slug', 'Block')
    .sort({title: 1}).exec(function(err, courses){
        res.send(courses);
    });
};
//Get one course details
var _getCourseByIdOrSlug = function(req, res){
    //Match if object id or not
    if(req.params._id.match(/^[0-9a-fA-F]{24}$/)){
        var query = {
            _id: req.params._id
        }
    } else {
        var query = {
            slug: req.params._id
        }
    }
    Course.findOne(query)
    .select({title: 1, tagline: 1, slug: 1, image: 1, bound: 1, org: 1, is_active: 1, privacy: 1, join_code: 1, certification: 1, tag: 1, creator: 1, created_at: 1, updated_at: 1, members: 1, learners: {$elemMatch: {user: req.user.id}}, parent_id: 1, color: 1, count: 1})
    .populate('creator', 'name initials username dp job', 'User')
    .populate('members.user', 'name initials username dp job', 'User')
    .exec(function(err, course){
        if(!course) return res.sendStatus(404);
        res.send(course);
    });
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
var _getOnePizzaByIdOrSlug = function(req, res) {
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
        console.log('_getOnePizzaByIdOrSlug');
        res.status(200).send(pizza);
    });
    

}

var _updatePizza = function(req, res){
    console.log(req.params._id)
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


//POST Requests function - Course
//Create a course
var _createCourse  = function(req, res){
    if(!req.body.title){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title"});
    }
    //Slug
    var key = shortid.generate();
    var slug = key + '-' + getSlug(req.body.title);
    //New course
    var new_course = new Course({
        slug: slug,
        title: req.body.title,
        tagline: req.body.tagline,
        'image.m': req.body.image,
        'image.l': req.body.image,
        bound: req.body.bound,
        'tag.core': req.body.core,
        'tag.sel': req.body.sel,
        'tag.sdg': req.body.sdg,
        privacy: req.body.privacy,
        creator: req.user.id,
        updated_at: new Date(Date.now())
    });
    //Color
    new_course.color.a = randomColor();
    //Join code if private
    if(req.body.privacy == 'private'){
        new_course.join_code = shortid.generate();
    }
    //Save
    new_course.save(function(err){
        if(!err) res.send(new_course);
        //Update image
        if(req.body.image){
            var image = req.body.image.replace(/^https:\/\//i, 'http://');
            var m_file_name = 'm-' + slug;
            //Update image (medium size)
            Utility.get_resized_image(m_file_name, image, 800, function(resized){
                Utility.upload_file(resized, m_file_name, function(image_url){
                    Course.updateOne({ _id: new_course._id }, { $set: { 'image.m': image_url }}).exec();
                });
            });
        }
    });
};
//PUT Requests functions - Course
//Edit basic details of course like title, tagline etc.
var _editCourse = function(req, res){
    Course.findOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }, function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot edit course."});
        //Update title
        if(req.body.title){
            course.title = req.body.title;
        }
        //Update tagline
        if(req.body.tagline != null){
            course.tagline = req.body.tagline;
        }
        //Update image
        if(req.body.image){
            //Get previous image keys
            if(course.image) var keys = Utility.get_image_keys([course.image.l], course.image.m);
            //Update
            course.image.m = req.body.image;
            course.image.l = req.body.image;
            course.bound = req.body.bound;
        }
        //Update organisation
        if(req.body.org_name){
            course.org.name = req.body.org_name;
        }
        if(req.body.org_logo){
            course.org.logo = req.body.org_logo;
        }
        if(req.body.org_url){
            course.org.url = req.body.org_url;
        }
        //Update privacy
        if(req.body.privacy){
            if(req.body.privacy == 'public' && (req.user.type == 'admin' || req.user.type == 'verified')){
                course.privacy = req.body.privacy;
            } else {
                course.privacy = req.body.privacy;
                //If course is private and no join code
                if(!course.join_code && course.privacy == 'private'){
                    course.join_code = shortid.generate();
                }
            }
        }
        //Update certification
        if(req.body.certification != null && (req.user.type == 'admin' || req.user.type == 'verified')){
            course.certification = req.body.certification;
        }
        //Update tag
        if(req.body.core){
            course.tag.core = req.body.core;
        }
        if(req.body.sel){
            course.tag.sel = req.body.sel;
        }
        if(req.body.sdg){
            course.tag.sdg = req.body.sdg;
        }
        //Update theme
        if(req.body.color_a){
            course.color.a = req.body.color_a;
        }
        if(req.body.color_a){
            course.color.b = req.body.color_a;
        }
        course.updated_at = new Date(Date.now());
        //Save
        course.save(function(err){
            if(!err) {
                res.status(200).send(course);
                //Update image
                if(req.body.image){
                    var key = shortid.generate();
                    var slug = key + '-' + getSlug(course.title);
                    var image = req.body.image.replace(/^https:\/\//i, 'http://');
                    var m_file_name = 'm-' + slug;
                    //Update image (medium size)
                    Utility.get_resized_image(m_file_name, image, 800, function(resized){
                        Utility.upload_file(resized, m_file_name, function(image_url){
                            Course.updateOne({ _id: course._id }, { $set: { 'image.m': image_url }}).exec();
                        });
                    });
                    //Delete previous images
                    if(keys) Utility.delete_keys(keys);
                }
            } else {
                res.sendStatus(400);
            }
        });
    });
};
//Archive course - by creator and moderator
var _archiveCourse = function(req, res){
    Course.updateOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }, {$set: {is_active: false, privacy: 'private', updated_at: new Date(Date.now())}}, function(err, numAffected){
        res.sendStatus(200);
    });
};
//Unarchive course - by creator and moderator
var _unarchiveCourse = function(req, res){
    Course.updateOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }, {$set: {is_active: true, updated_at: new Date(Date.now())}}, function(err, numAffected){
        res.sendStatus(200);
    });
};
//Join course
var _joinCourse = function(req, res){
    Course.findOne({_id: req.params._id}, function(err, course){
        if(!course) return res.status(400).send({error: "No such course exists"});
        //Get all course members
        var member_ids = [];
        for(var i=0; i<course.members.length; i++){
            if(course.members[i].user)
                member_ids.push(course.members[i].user.toString());
        }
        if(member_ids.indexOf(req.user.id.toString()) > -1) {
            return res.status(400).send({error: "Already joined"});
        } else if (req.user.id.toString() == course.creator) {
            return res.status(400).send({error: "Cannot add creator to members list"});
        } else {
            //Add new member in inactive state
            var new_member = new Member({
                user: req.user.id,
                added_at: new Date(Date.now()),
                permit_val: 'inactive'
            });
            course.members.push(new_member);
            course.save(function(err){
                if(!err) res.sendStatus(200);
            });
        }
    });
};
//Unjoin course
var _unjoinCourse = function(req, res){
    Course.updateOne({_id: req.params._id}, {$pull: {members: {user: mongoose.Types.ObjectId(req.user.id), permit_val: 'inactive'}}}, function(err, numberAffected){
        if(!err) res.sendStatus(200);
        else return res.sendStatus(400);
    });
};
//Add member to course
var _addMemberToCourse = function(req, res){
    if(!req.body.email && !req.body.user_id){
        //Expecting a email id or user_id
        return res.status(400).send({error: "Invalid parameters. We are expecting a user_id or user email."});
    } else if ((req.body.email == req.user.email) || (req.body.user_id == req.user.id)) {
       //Cannot collaborate to current user
       return res.status(400).send({error: "Cannot add yourself."});
   }
   //Check for user
    var user_id, user_email;
    async.series([
        function(callback){
            if(req.body.user_id){
                user_id = req.body.user_id;
                callback();
            } else if(req.body.email){
                User.findOne({email: req.body.email}, function(err, user){
                    if(!user){
                        user_email = req.body.email;
                        callback();
                    } else {
                        user_id = user._id;
                        callback();
                    }
                });
            }
        }
    ], function(err){
        //Find course
        Course.findOne({
            _id: req.params._id,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }, function(err, course){
            if(!course) return res.status(400).send({error: "No such course exists or Unauthorized user."});
            if(user_id){
                //Remove member from inactive state if present
                Course.updateOne({_id: course._id},{$pull: {members: {user: mongoose.Types.ObjectId(user_id), permit_val: 'inactive'}}}, function(err, numberAffected){
                    //Get all course members
                    var member_ids = [];
                    for(var i=0; i<course.members.length; i++){
                        if(course.members[i].user && !(course.members[i].user == user_id && course.members[i].permit_val == 'inactive')){
                            member_ids.push(course.members[i].user.toString());
                        }
                    }
                    if(member_ids.indexOf(user_id.toString()) > -1) {
                        return res.status(400).send({error: "Already added."});
                    } else if (user_id.toString() == course.creator) {
                        return res.status(400).send({error: "Cannot add creator to collaborator list"});
                    } else {
                        var new_member = new Member({
                            user: user_id,
                            added_by: req.user.id,
                            added_at: new Date(Date.now()),
                            permit_val: 'active'
                        });
                        course.members.push(new_member);
                        course.count.members += 1;
                        course.save(function(err){
                            if(!err) {
                                new_member.populate({path: 'user', select: 'name initials username dp job'}, function(err, member){
                                    res.send(member);
                                    //Send email
                                    User.findOne({_id: user_id}, function(err, user){
                                        if(!user.email) return;
                                        var content = {
                                            email: user.email,
                                            name: user.name,
                                            firstName: user.name.split(' ')[0],
                                            fromName: req.user.name,
                                            subject: req.user.name.split(' ')[0] + " has added you to a course on FramerSpace.",
                                            title: course.title,
                                            redirectURL: course.slug
                                        };
                                        Email.sendOneMail('course_invite', content, function(err, responseStatus){});
                                    });
                                });
                            }
                        });
                    }
                });
            } else if(user_email){
                var member_ids = [];
                for(var i=0; i<course.members.length; i++){
                    if(course.members[i].email)
                        member_ids.push(course.members[i].email);
                }
                if(member_ids.indexOf(user_email) > -1) {
                    return res.status(400).send({error: "Already invited."});
                } else {
                    //Save member
                    var new_member = new Member({ permit_val: 'invited', email: user_email, added_by: req.user.id });
                    course.members.push(new_member);
                    course.save(function(err){
                        res.send(new_member);
                        //Send email
                        var content = {
                            email: user_email,
                            fromName: req.user.name,
                            subject: req.user.name.split(' ')[0] + " has invited you to join a course on FramerSpace.",
                            title: course.title,
                            redirectURL: course.slug
                        };
                        Email.sendOneMail('course_invite_new', content, function(err, responseStatus){});
                    });
                }
            }
        });
    });
};
//Edit member privilege in course
var _editMemberPrivilegeInCourse = function(req, res){
    if(!req.body.user_id){
        return res.status(400).send({error: "Invalid parameters. We are expecting a user_id."});
    } else if (!req.body.permit_val) {
       return res.status(400).send({error: "Invalid parameters. We are expecting a permit_val."});
   } else if((req.body.permit_val != 'active') && (req.body.permit_val != 'moderator') && (req.body.permit_val != 'teacher')){
       return res.status(400).send({error: "Invalid parameters. Incorrect permit_val."});
   }
   //Update
   Course.updateOne({
       _id: req.params._id,
       $or: [{ creator: req.user.id },
             { members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}],
       'members.user': req.body.user_id
   }, { $set: { 'members.$.permit_val': req.body.permit_val} }, function(err, numAffected){
       if(!err) res.sendStatus(200);
   });
};
//Remove member from course
var _removeMemberFromCourse = function(req, res){
    if(req.body.email){
        //Remove invited user
        Course.updateOne({
            _id: req.params._id,
            $or: [{ creator: req.user.id },
                  { members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]},
            {$pull: {members: {email: req.body.email}}}, function(err, numAffected){
                if(!err) res.sendStatus(200);
                else return res.sendStatus(400);
        });
    } else if(req.body.user_id){
        //Remove user
        Course.updateOne({
            _id: req.params._id,
            $or: [{ creator: req.user.id },
                  { members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]},
            {$pull: {members: {user: mongoose.Types.ObjectId(req.body.user_id)}, $inc: {'count.members': -1}}}, function(err, numAffected){
                if(!err) {
                    res.sendStatus(200);
                }
                else return res.sendStatus(400);
        });
    } else {
        //Leave
        Course.updateOne({_id: req.params._id},
            {$pull: {members: {user: mongoose.Types.ObjectId(req.user.id)}, $inc: {'count.members': -1}}}, function(err, numAffected){
                if(!err) {
                    res.sendStatus(200);
                }
                else return res.sendStatus(400);
        });
    }
};
//Add learner to course
var _addLearnerToCourse = function(req, res){
    Course.findOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
              {is_active: true, privacy: {$in: ['public', 'unlisted']}},
              {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
    }, function(err, course){
        if(!course) return res.status(400).send({error: "No such course exists."});
        //Get all course learners
        var learner_ids = [];
        for(var i=0; i<course.learners.length; i++){
            learner_ids.push(course.learners[i].user.toString());
        }
        if(learner_ids.indexOf(req.user.id.toString()) > -1){
             return res.status(400).send({error: "Already a learner of this course."});
        }
        //New learner
        var new_learner = new Learner({
            user: req.user.id,
            progress: 'started',
            updated_at: new Date(Date.now())
        });
        course.learners.push(new_learner);
        course.count.learners += 1;
        course.save(function(err){
            if(!err) res.sendStatus(200);
        });
    });
};
//Edit learner progress
var _editLearnerProgress = function(req, res){
    Course.findOne({_id: req.params._id}, function(err, course){
        if(!course) return res.status(400).send({error: "No such course exists."});
        if(course.certification){
            //Check progress
            var total_mcqs = 0, mcqs_count = 0, total_fills = 0, fills_count = 0, total_keywords = 0, keywords_count = 0, total_required = 0, required_count = 0;
            async.parallel([
                function(callback){
                    //Required questions
                    Block.countDocuments({course: course._id, type: 'response', is_required: true}, function(err, blocks_count){
                        total_required = blocks_count;
                        Block.countDocuments({course: course._id, type: 'response', is_required: true, 'responses.creator': req.user.id}, function(err, response_count){
                            required_count = response_count;
                            callback();
                        });
                    });
                },
                function(callback){
                    //MCQs
                    Block.find({course: course._id, type: 'mcq'}, function(err, blocks){
                        if(blocks || blocks.length) {
                            //Get mcqs_count
                            for(var i=0; i<blocks.length; i++){
                                var block = blocks[i];
                                if(block.mcqs.length){
                                    var correct_options = [], voted_options = [];
                                    for(var j=0; j<block.mcqs.length; j++){
                                        if(block.mcqs[j].is_correct){
                                            correct_options.push(block.mcqs[j]._id);
                                        }
                                        if(block.mcqs[j].voters && block.mcqs[j].voters.length && block.mcqs[j].voters.indexOf(req.user.id) > -1){
                                            voted_options.push(block.mcqs[j]._id);
                                        }
                                    }
                                    //If atleast one correct option is marked in mcq
                                    if(correct_options.length){
                                        total_mcqs += 1;
                                        //If options are same, mark as correct
                                        if(JSON.stringify(correct_options)==JSON.stringify(voted_options)){
                                            mcqs_count += 1;
                                        }
                                    }
                                }
                            }
                            callback();
                        } else {
                            callback();
                        }
                    });
                },
                function(callback){
                    //Fill in the blanks
                    Block.find({course: course._id, type: 'fill'}, function(err, blocks){
                        if(blocks || blocks.length) {
                            //Get fills_count
                            for(var i=0; i<blocks.length; i++){
                                var block = blocks[i];
                                if(block.fills.length){
                                    for(var j=0; j<block.fills.length; j++){
                                        if(block.fills[j].keywords && block.fills[j].keywords.length){
                                            //Total fills
                                            total_fills += 1;
                                            //Get user response
                                            if(block.fills[j].responses && block.fills[j].responses.length){
                                                var user_response = _.filter(block.fills[j].responses, function(response){
                                                    return response.creator == req.user.id;
                                                });
                                                if(user_response && user_response.length && block.fills[j].keywords.indexOf(user_response[0].text.toLowerCase()) > -1){
                                                    fills_count += 1;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            callback();
                        } else {
                            callback();
                        }
                    });
                },
                function(callback){
                    //Text responses
                    Block.find({course: course._id, type: 'response', response_type: 'text'}, function(err, blocks){
                        if(blocks || blocks.length) {
                            //Get keywords_count
                            for(var i=0; i<blocks.length; i++){
                                var block = blocks[i];
                                if(block.keywords && block.keywords.length){
                                    //Total keywords
                                    total_keywords += block.keywords.length;
                                    //Get user response
                                    if(block.responses && block.responses.length){
                                        var user_response = _.filter(block.responses, function(response){
                                            return response.creator == req.user.id;
                                        });
                                        if(user_response && user_response.length){
                                            var response_text = user_response[0].text.toLowerCase();
                                            for (var j=0; j<block.keywords.length; j++){
                                                if(response_text.includes(block.keywords[j])){
                                                    keywords_count += 1;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            callback();
                        } else {
                            callback();
                        }
                    });
                }
            ], function(err){
                if(!err){
                    var progress;
                    //Get total objectives
                    var total_objectives = total_mcqs + total_fills;
                    var objectives_count = mcqs_count + fills_count;
                    //Get percentage
                    if(total_objectives && total_keywords && total_required){
                        var objectives_percentage = parseInt((objectives_count/total_objectives) * 100);
                        var keywords_percentage = parseInt((total_keywords/keywords_count) * 100);
                        var required_percentage = parseInt((total_required/required_count) * 100);
                        //Check if certified
                        if(objectives_percentage >= 70 && keywords_percentage >= 30 && required_percentage >= 40){
                            progress = 'certified';
                        }
                    }
                    //Update progress
                    if(req.body.container){
                        if(!progress) progress = 'active';
                        //Complete container for learner
                        Course.updateOne({
                            _id: req.params._id,
                            $or: [{creator: req.user.id},
                                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                                  {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                                  {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}],
                            'learners.user': req.user.id
                        }, {$set: {'learners.$.progress': progress}, $addToSet: {'learners.$.containers': req.body.container}}, function(err, numAffected){
                            if(!err) res.send({progress: progress});
                        });
                    } else {
                        if(!progress) progress = 'uncertified';
                        //Complete course for learner
                        Course.updateOne({
                            _id: req.params._id,
                            $or: [{creator: req.user.id},
                                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                                  {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                                  {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}],
                            'learners.user': req.user.id
                        }, {$set: {'learners.$.progress': progress}}, function(err, numAffected){
                            if(!err) res.send({progress: progress});
                        });
                    }
                }
            });
        } else {
            if(req.body.container){
                //Complete container for learner
                Course.updateOne({
                    _id: req.params._id,
                    $or: [{creator: req.user.id},
                          {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                          {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                          {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}],
                    'learners.user': req.user.id
                }, {$set: {'learners.$.progress': 'active'}, $addToSet: {'learners.$.containers': req.body.container}}, function(err, numAffected){
                    if(!err) res.send({progress: 'active'});
                });
            } else {
                //Complete course for learner
                Course.updateOne({
                    _id: req.params._id,
                    $or: [{creator: req.user.id},
                          {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                          {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                          {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}],
                    'learners.user': req.user.id
                }, {$set: {'learners.$.progress': 'completed'}}, function(err, numAffected){
                    if(!err) res.send({progress: 'completed'});
                });
            }
        }
    });
};
//Add viewer to course
var _viewCourse = function(req, res){
    Course.findOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
              {is_active: true, privacy: {$in: ['public', 'unlisted']}},
              {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
    }, function(err, course){
        if(!course) return res.status(400).send({error: "No such course exists."});
        //Get all viewers
        var viewer_ids = [];
        for(var i=0; i<course.viewers.length; i++){
            viewer_ids.push(course.viewers[i].user.toString());
        }
        //Add or update viewer
        if(viewer_ids.indexOf(req.user.id.toString()) > -1) {
            //Update count
            Course.updateOne({
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
            course.viewers.push(new_viewer);
            course.save(function(err){
                if(!err) res.sendStatus(200);
            });
        }
    });
};
//Copy course
var _copyCourse = function(req, res){
    if(!req.body.title){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title"});
    }
    Course.findOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }, function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot copy course."});
        var course_id = course._id;
        var new_course = course;
        //Update _id
        new_course._id = new mongoose.Types.ObjectId();
        new_course.isNew = true;
        //Update title
        new_course.title = new_course.title + ' - ' + req.body.title;
        //Update slug
        var key = shortid.generate();
        new_course.slug = key + '-' + getSlug(new_course.title);
        //Make it private
        new_course.privacy = 'private';
        new_course.join_code = shortid.generate();
        //Update user
        new_course.creator = req.user.id;
        new_course.updated_at = new Date(Date.now());
        //Reset members and learners
        new_course.members = undefined;
        new_course.learners = undefined;
        //Add parent id
        new_course.parent_id = course_id;
        //Reset count
        new_course.count.skills = 0;
        new_course.count.badges = 0;
        new_course.count.members = 0;
        new_course.count.learners = 0;
        //Save
        new_course.save(function(err){
            var newIds = {};
            //Copy blocks
            async.series([
                function(callback){
                    //Copy blocks
                    Block.find({course: course_id}, function(err, blocks){
                        async.each(blocks, function(block, cb){
                            var block_id = block._id;
                            var new_block = block;
                            //Update _id
                            new_block._id = new mongoose.Types.ObjectId();
                            new_block.isNew = true;
                            //Update slug
                            new_block.slug = shortid.generate();
                            //Update course id
                            new_block.course = new_course._id;
                            //Reset MCQ options
                            for(var i=0; i<new_block.mcqs.length; i++){
                                new_block.mcqs[i].voters = undefined;
                            }
                            //Reset Match the following options
                            for(var i=0; i<new_block.options.length; i++){
                                new_block.options[i].matchers = undefined;
                            }
                            //Reset Fill in the blanks
                            for(var i=0; i<new_block.fills.length; i++){
                                new_block.fills[i].responses = undefined;
                            }
                            //Reset responses
                            new_block.responses = undefined;
                            //Reset item responses
                            for(var i=0; i<new_block.items.length; i++){
                                new_block.items[i].responses = undefined;
                            }
                            //Reset feedback
                            new_block.feedbacks = undefined;
                            //Reset comments
                            new_block.comments = undefined;
                            //Update user
                            new_block.creator = req.user.id;
                            new_block.updated_at = new Date(Date.now());
                            new_block.save(function(err){
                                //Save id if container
                                if(new_block.type == 'container'){
                                    newIds[block_id] = new_block._id;
                                }
                                cb();
                            });
                        }, function(err){
                            callback();
                        });
                    });
                },
                function(callback){
                    //Update container id of blocks within a container
                    Block.find({course: new_course._id, container: {$exists:true}}, function(err, blocks){
                        async.each(blocks, function(block, cb){
                            //Update container id
                            block.container = newIds[block.container];
                            block.save(function(err){
                                cb();
                            });
                        }, function(err){
                            callback();
                        });
                    });
                }
            ], function(err){
                if(!err) res.send(new_course);
            });
        });
    });
};
//DELETE Request function
//Delete course
var _deleteCourse = function(req, res){

};
/*---------------- BLOCK FUNCTION -------------------------*/
//GET Request functions - Block
//Get blocks of a course
var _getCourseBlocks = function(req, res){
    Course.findOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
              {is_active: true, privacy: {$in: ['public', 'unlisted']}},
              {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
    }, function(err, course){
        if(!course) return res.send([]);
        //Show hidden blocks if creator, moderator or teacher
        Course.findOne({
            _id: req.params._id,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['moderator', 'teacher']}}}}]
        }, function(err, creator_course){
            if(!creator_course){
                Block.find({course: course._id, is_hidden: false, container: null})
                .select({ order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, summary: 1, text: 1, button: 1, divider: 1, image: 1, bound: 1, file: 1, provider: 1, embed: 1, gif: 1, mcqs: 1, is_multiple: 1, fills: 1, options: 1, response_type:1, responses: { $elemMatch: { creator: req.user.id }}, items: 1, theme: 1, art: 1, size: 1, feedbacks: 1, alt_text: 1, ref_url: 1, extra: 1, has_discussion: 1, comments: { $elemMatch: { is_recent: true }}, creator: 1, created_at: 1, updated_at: 1})
                .populate('creator', 'name initials username dp', 'User')
                .populate('comments.creator', 'name initials username dp job', 'User')
                .sort({order: 1}).exec(function(err, blocks){
                    res.send(blocks);
                });
            } else {
                Block.find({course: course._id, container: null})
                .select({ order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, summary: 1, text: 1, button: 1, divider: 1, image: 1, bound: 1, file: 1, provider: 1, embed: 1, gif: 1, mcqs: 1, is_multiple: 1, fills: 1, options: 1, response_type:1, responses: { $elemMatch: { creator: req.user.id }}, items: 1, theme: 1, art: 1, size: 1, feedbacks: 1, alt_text: 1, ref_url: 1, extra: 1, has_discussion: 1, comments: { $elemMatch: { is_recent: true }}, creator: 1, created_at: 1, updated_at: 1})
                .populate('creator', 'name initials username dp', 'User')
                .populate('comments.creator', 'name initials username dp job', 'User')
                .sort({order: 1}).exec(function(err, blocks){
                    res.send(blocks);
                });
            }
        });
    });
};
//Get blocks of a container
var _getContainerBlocks = function(req, res){
    Block.findOne({_id: req.params._id, type: 'container'}, function(err, container){
        if(!container) return res.send([]);
        Course.findOne({
            _id: container.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                  {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                  {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
        }, function(err, course){
            if(!course) return res.send([]);
            //Show hidden blocks if creator, moderator or teacher
            Course.findOne({
                _id: container.course,
                $or: [{creator: req.user.id},
                      {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['moderator', 'teacher']}}}}]
            }, function(err, creator_course){
                if(!creator_course){
                    Block.find({course: course._id, is_hidden: false, container: container._id})
                    .select({ order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, summary: 1, text: 1, button: 1, divider: 1, image: 1, bound: 1, file: 1, provider: 1, embed: 1, gif: 1, mcqs: 1, is_multiple: 1, fills: 1, options: 1, response_type:1, responses: { $elemMatch: { creator: req.user.id }}, items: 1, container: 1, theme: 1, art: 1, size: 1, feedbacks: 1, alt_text: 1, ref_url: 1, extra: 1, has_discussion: 1, comments: { $elemMatch: { is_recent: true }}, creator: 1, created_at: 1, updated_at: 1})
                    .populate('container', 'slug title', 'Block')
                    .populate('creator', 'name initials username dp', 'User')
                    .populate('comments.creator', 'name initials username dp job', 'User')
                    .sort({order: 1}).exec(function(err, blocks){
                        res.send(blocks);
                    });
                } else {
                    Block.find({course: course._id, container: container._id})
                    .select({ order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, summary: 1, text: 1, button: 1, divider: 1, image: 1, bound: 1, file: 1, provider: 1, embed: 1, gif: 1, mcqs: 1, is_multiple: 1, fills: 1, options: 1, response_type:1, responses: { $elemMatch: { creator: req.user.id }}, items: 1, container: 1, theme: 1, art: 1, size: 1, feedbacks: 1, alt_text: 1, ref_url: 1, extra: 1, has_discussion: 1, comments: { $elemMatch: { is_recent: true }}, creator: 1, created_at: 1, updated_at: 1})
                    .populate('container', 'slug title', 'Block')
                    .populate('creator', 'name initials username dp', 'User')
                    .populate('comments.creator', 'name initials username dp job', 'User')
                    .sort({order: 1}).exec(function(err, blocks){
                        res.send(blocks);
                    });
                }
            });
        });
    });
};
//Get one block
var _getBlockByIdOrSlug = function(req, res){
    //Match if object id or not
    if(req.params._id.match(/^[0-9a-fA-F]{24}$/)){
        var query = {
            _id: req.params._id
        };
    } else {
        var query = {
            slug: req.params._id
        };
    }
    //Find
    Block.findOne(query).populate('creator', 'name initials username dp job', 'User')
    .populate('mcqs.voters', 'name initials username dp job', 'User')
    .populate('fills.responses.creator', 'name initials username dp job', 'User')
    .populate('options.matchers.creator', 'name initials username dp job', 'User')
    .populate('feedbacks.badges.badge', 'title color image bound is_skill skill_total', 'Badge')
    .populate('responses.creator', 'name initials username dp job', 'User')
    .populate('comments.creator', 'name initials username dp job', 'User').exec(function(err, block){
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
            res.send(block);
        });
    });
};
//POST Request functions - Block
//Create text block
var _createTextBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.title && !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title or a text."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'text',
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            text: req.body.text,
            'image.m': req.body.image,
            'image.l': req.body.image,
            bound: req.body.bound,
            images: req.body.images,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
            //Update image
            if(req.body.image){
                var image = req.body.image.replace(/^https:\/\//i, 'http://');
                var m_file_name = 'm-' + slug;
                //Update image (medium size)
                Utility.get_resized_image(m_file_name, image, 400, function(resized){
                    Utility.upload_file(resized, m_file_name, function(image_url){
                        Block.updateOne({ _id: new_block._id }, { $set: { 'image.m': image_url }}).exec();
                    });
                });
            }
        });
    });
};
//Create button block
var _createButtonBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a button text."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'button',
            course: req.body.course,
            container: req.body.container,
            text: req.body.text,
            'button.url': req.body.button_url,
            'button.block': req.body.button_block,
            'button.is_new_tab': req.body.is_new_tab,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create button block
var _createDividerBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'divider',
            course: req.body.course,
            container: req.body.container,
            text: req.body.text,
            'divider.type': req.body.divider_type,
            'divider.time': req.body.divider_time,
            'divider.name': req.body.divider_name,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create toggle list block
var _createToggleListBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.title || !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title and a text"});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'toggle_list',
            course: req.body.course,
            container: req.body.container,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Add item
        var new_item = new Item({
            title: req.body.title,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Linkify text
        var linkifiedText = linkifyHtml(req.body.text, {
            target: '_blank'
        });
        new_item.text = linkifiedText.replace(/\n\r?/g, '<br />');
        //Push
        new_block.items.push(new_item);
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create image, video, audio or file block
var _createFileBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.provider.url)
        return res.status(400).send({error: "Invalid parameters. We are expecting an url."});
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: req.params._type,
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            text: req.body.text,
            provider: req.body.provider,
            'image.m': req.body.image,
            'image.l': req.body.image,
            bound: req.body.bound,
            file: req.body.file,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
            //Resize image
            if(req.body.image){
                var file_name = slug;
                if(req.body.provider.name == 'FramerSpace'){
                    var image = req.body.image.replace(/^https:\/\//i, 'http://');
                    //Resize and upload image
                    Utility.get_resized_image(file_name, image, 400, function(resized){
                        Utility.upload_file(resized, file_name, function(image_url){
                            Block.updateOne({ _id: new_block._id }, { $set: { 'image.m': image_url }}).exec();
                        });
                    });
                } else {
                    //Download and upload image
                    Utility.download_file(req.body.image, file_name, function(file){
                        Utility.upload_file(file, file_name, function(image_url){
                            Block.updateOne({ _id: new_block._id }, { $set: { 'image.m': image_url }}).exec();
                        });
                    });
                }
            }
        });
    });
};
//Create link block
var _createLinkBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if((!req.body.url || !validator.isURL(req.body.url)) && !req.body.linkdata){
        return res.status(400).send({error: "Invalid parameters. We are expecting a valid url or link data"});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var linkdata;
        async.series([
            //Get link metadata
            function(callback){
                if(req.body.linkdata){
                    linkdata = req.body.linkdata;
                    callback();
                } else {
                    Utility.get_link_metadata(req.body.url, function(data){
                        linkdata = data;
                        //Get image
                        var images = data.images;
                        var imageURL;
                        if(images && images.length){
                            for(var i=0; i<images.length; i++){
                                if(images[i].width > 200 && images[i].height > 100){
                                    req.body.image = images[i].url.replace(/^https:\/\//i, 'http://');
                                    //Set bound
                                    var bound = (images[i].height * 400 ) / images[i].width;
                                    if(bound){
                                        bound = parseInt(bound);
                                        req.body.bound = bound;
                                    }
                                    break;
                                }
                            }
                        }
                        callback();
                    });
                }
            }
        ], function(err){
            //Slug
            var slug = shortid.generate();
            //Create new block
            var new_block = new Block({
                slug: slug,
                order: req.body.order,
                type: 'link',
                course: req.body.course,
                container: req.body.container,
                title: linkdata.title || linkdata.url,
                text: linkdata.description || req.body.summary,
                'provider.name': linkdata.provider_name,
                'provider.url': linkdata.url,
                'provider.favicon': linkdata.favicon_url,
                'embed.code': linkdata.media.html,
                'embed.kind': linkdata.media.type || linkdata.type,
                publish_date: linkdata.published,
                'image.m': req.body.image,
                'image.l': req.body.image,
                bound: req.body.bound,
                creator: req.user.id,
                updated_at: new Date(Date.now())
            });
            //Save block
            new_block.save(function(err){
                //Update order of other blocks
                if(req.body.order){
                    Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                        res.send(new_block);
                    });
                } else {
                    res.send(new_block);
                }
                //Update image
                if(req.body.image){
                    var image = req.body.image.replace(/^https:\/\//i, 'http://');
                    var file_name = slug;
                    var m_file_name = 'm-' + file_name;
                    //Download and update original file
                    Utility.download_file(image, file_name, function(file){
                        Utility.upload_file(file, file_name, function(image_url){
                            Block.updateOne({ _id: new_block._id }, { $set: { 'image.l': image_url }}).exec();
                        });
                    });
                    //Update image (medium size)
                    Utility.get_resized_image(m_file_name, image, 400, function(resized){
                        Utility.upload_file(resized, m_file_name, function(image_url){
                            Block.updateOne({ _id: new_block._id }, { $set: { 'image.m': image_url }}).exec();
                        });
                    });
                }
            });
        });
    });
};
//Create gif block
var _createGIFBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.gif_embed){
        return res.status(400).send({error: "Invalid parameters. We are expecting a gif_embed."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'gif',
            course: req.body.course,
            container: req.body.container,
            'gif.embed': req.body.gif_embed,
            'gif.url': req.body.gif_url,
            'gif.width': req.body.width,
            'gif.height': req.body.height,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create MCQ and Image MCQ block
var _createMCQBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.title && !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title or a text."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'mcq',
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            is_multiple: req.body.is_multiple,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Block text
        if(req.body.text){
            var linkifiedText = linkifyHtml(req.body.text, {
                target: '_blank'
            });
            new_block.text = linkifiedText.replace(/\n\r?/g, '<br />');
        }
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create fill in the blanks block
var _createFillInTheBlanksBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.title && !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title or a text."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'fill',
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Block text
        if(req.body.text){
            var linkifiedText = linkifyHtml(req.body.text, {
                target: '_blank'
            });
            new_block.text = linkifiedText.replace(/\n\r?/g, '<br />');
        }
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create match the following block
var _createMatchTheFollowingBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.title && !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title or a text."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'match',
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            is_draggable: req.body.is_draggable,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Block text
        if(req.body.text){
            var linkifiedText = linkifyHtml(req.body.text, {
                target: '_blank'
            });
            new_block.text = linkifiedText.replace(/\n\r?/g, '<br />');
        }
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create response block
var _createResponseBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.title && !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title or a text."});
    }
    if(!req.body.response_type){
        return res.status(400).send({error: "Invalid parameters. We are expecting a response type."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'response',
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            response_type: req.body.response_type,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Block text
        if(req.body.text){
            var linkifiedText = linkifyHtml(req.body.text, {
                target: '_blank'
            });
            new_block.text = linkifiedText.replace(/\n\r?/g, '<br />');
        }
        //Keywords
        if(req.body.response_type == 'text' && req.body.keywords){
            new_block.keywords = req.body.keywords.toLowerCase().match(/(?=\S)[^,]+?(?=\s*(,|$))/g);
        }
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create list block
var _createListBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.title && !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title or a text."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'list',
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Block text
        if(req.body.text){
            var linkifiedText = linkifyHtml(req.body.text, {
                target: '_blank'
            });
            new_block.text = linkifiedText.replace(/\n\r?/g, '<br />');
        }
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create container block
var _createContainerBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.title && !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title or a text."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'container',
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            'image.m': req.body.image,
            'image.l': req.body.image,
            bound: req.body.bound,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Block text
        if(req.body.text){
            var linkifiedText = linkifyHtml(req.body.text, {
                target: '_blank'
            });
            new_block.text = linkifiedText.replace(/\n\r?/g, '<br />');
        }
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                    //Update image
                    if(req.body.image){
                        var image = req.body.image.replace(/^https:\/\//i, 'http://');
                        var m_file_name = 'm-' + slug;
                        //Update image (medium size)
                        Utility.get_resized_image(m_file_name, image, 800, function(resized){
                            Utility.upload_file(resized, m_file_name, function(image_url){
                                Block.updateOne({ _id: new_block._id }, { $set: { 'image.m': image_url }}).exec();
                            });
                        });
                    }
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create grid block
var _createGridBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.title && !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title or a text."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'grid',
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Block text
        if(req.body.text){
            var linkifiedText = linkifyHtml(req.body.text, {
                target: '_blank'
            });
            new_block.text = linkifiedText.replace(/\n\r?/g, '<br />');
        }
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create comic block
var _createComicBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.text && !req.body.image){
         return res.status(400).send({error: "Invalid parameters. We are expecting a comic text or a comic image."});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'comic',
            course: req.body.course,
            container: req.body.container,
            text: req.body.text,
            'image.m': req.body.image,
            'image.l': req.body.image,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//Create embed block
var _createEmbedBlock = function(req, res){
    if(!req.body.course){
        return res.status(400).send({error: "Invalid parameters. We are expecting a course id"});
    }
    if(!req.body.embed_code){
        return res.status(400).send({error: "Invalid parameters. We are expecting an embed_code"});
    }
    //Check access to course
    Course.findOne({
        _id: req.body.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add block to this course."});
        var slug = shortid.generate();
        //Create new block
        var new_block = new Block({
            slug: slug,
            order: req.body.order,
            type: 'embed',
            course: req.body.course,
            container: req.body.container,
            title: req.body.title,
            'embed.code': req.body.embed_code,
            'embed.width': req.body.width,
            'embed.height': req.body.height,
            creator: req.user.id,
            updated_at: new Date(Date.now())
        });
        //Save block
        new_block.save(function(err){
            //Update order of other blocks
            if(req.body.order){
                Block.updateMany({_id: {$ne: new_block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(new_block);
                });
            } else {
                res.send(new_block);
            }
        });
    });
};
//PUT Request functions - Block
//Edit basic details of a block like title, button etc.
var _editBlock = function(req, res){
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot edit block."});
            //Update title
            if(req.body.title){
                block.title = req.body.title;
            }
            //Update text
            if(req.body.text){
                var linkifiedText = linkifyHtml(req.body.text, {
                    target: '_blank'
                });
                block.text = linkifiedText.replace(/\n\r?/g, '<br />');
            }
            //Update button
            if(req.body.button_url != null){
                block.button.url = req.body.button_url;
            }
            if(req.body.button_block != null){
                block.button.block = req.body.button_block;
            }
            if(req.body.is_new_tab != null){
                block.button.is_new_tab = req.body.is_new_tab;
            }
            //Update divider
            if(req.body.divider_time != null){
                block.divider.time = req.body.divider_time;
            }
            if(req.body.divider_type != null){
                block.divider.type = req.body.divider_type;
            }
            if(req.body.divider_name != null){
                block.divider.name = req.body.divider_name;
            }
            //Is multiple
            if(req.body.is_multiple != null){
                block.is_multiple = req.body.is_multiple;
            }
            //Update embed block
            if(req.body.embed_code){
                block.embed.code = req.body.embed_code;
            }
            if(req.body.embed_width != null){
                block.embed.width = req.body.embed_width;
            }
            if(req.body.embed_height != null){
                block.embed.height = req.body.embed_height;
            }
            //Update keywords
            if(req.body.keywords != null && block.type == 'response' && block.response_type == 'text'){
                if(req.body.keywords){
                    block.keywords = req.body.keywords.toLowerCase().match(/(?=\S)[^,]+?(?=\s*(,|$))/g);
                } else {
                    block.keywords = undefined;
                }
            }
            //Update theme
            if(req.body.theme != null){
                block.theme = req.body.theme;
            }
            //Update art
            if(req.body.art != null){
                //Get previous image keys
                if(block.art) var keys = Utility.get_image_keys([block.art.l], block.art.m);
                //Update
                block.art.m = req.body.art;
                block.art.l = req.body.art;
                block.art.bound = req.body.art_bound;
            }
            //Update container image
            if(block.type == 'container' && req.body.image != null){
                //Get previous image keys
                if(block.image) var keys = Utility.get_image_keys([block.image.l], block.image.m);
                //Update
                block.image.m = req.body.image;
                block.image.l = req.body.image;
                block.bound = req.body.bound;
            }
            //Update size
            if(req.body.width){
                block.size.width = req.body.width;
            }
            if(req.body.margin != null){
                block.size.margin = req.body.margin;
            }
            //Publish discussion
            if(req.body.has_discussion != null){
                block.has_discussion = req.body.has_discussion;
            }
            if(req.body.is_restricted != null){
                block.is_restricted = req.body.is_restricted;
            }
            //Collapse comments
            if(req.body.is_collapsed != null){
                block.is_collapsed = req.body.is_collapsed;
            }
            //Is required
            if(req.body.is_required != null){
                block.is_required = req.body.is_required;
            }
            //Is hidden
            if(req.body.is_hidden != null){
                block.is_hidden = req.body.is_hidden;
            }
            block.updated_at = new Date(Date.now());
            //Save
            block.save(function(err){
                if(!err){
                    res.status(200).send(block);
                    //Update art
                    if(req.body.art){
                        var key = shortid.generate();
                        var slug = key + '-' + getSlug(block.title);
                        var image = req.body.art.replace(/^https:\/\//i, 'http://');
                        var m_file_name = 'm-' + slug;
                        //Update image (medium size)
                        Utility.get_resized_image(m_file_name, image, 400, function(resized){
                            Utility.upload_file(resized, m_file_name, function(image_url){
                                Block.updateOne({ _id: block._id }, { $set: { 'art.m': image_url }}).exec();
                            });
                        });
                        //Delete previous images
                        if(keys) Utility.delete_keys(keys);
                    }
                    //Update image of container
                    if(block.type == 'container' && req.body.image){
                        var key = shortid.generate();
                        var slug = key + '-' + getSlug(block.title);
                        var image = req.body.image.replace(/^https:\/\//i, 'http://');
                        var m_file_name = 'm-' + slug;
                        //Update image (medium size)
                        Utility.get_resized_image(m_file_name, image, 800, function(resized){
                            Utility.upload_file(resized, m_file_name, function(image_url){
                                Block.updateOne({ _id: block._id }, { $set: { 'image.m': image_url }}).exec();
                            });
                        });
                        //Delete previous images
                        if(keys) Utility.delete_keys(keys);
                    }
                } else res.sendStatus(400);
            });
        });
    });
};
//Edit order of the block
var _editBlockOrder = function(req, res){
    if(!req.body.order){
        return res.status(400).send({error: "Invalid parameters. We are expecting a block order."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        if(block.order == req.body.order){
            return res.status(400).send({error: "Invalid parameters. Block is already at that order."});
        }
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot edit block order."});
            //Save order
            block.order = req.body.order;
            block.save(function(err){
                //Update order of other blocks
                Block.updateMany({_id: {$ne: block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(block);
                });
            });
        });
    });
};
//Move and edit order of the block
var _moveBlock = function(req, res){
    if(!req.body.container || !req.body.order){
        return res.status(400).send({error: "Invalid parameters. We are expecting a container id and a block order."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        if(block.container && block.container == req.body.container){
            return res.status(400).send({error: "Invalid parameters. Block is already in this container."});
        }
        if(block.order == req.body.order){
            return res.status(400).send({error: "Invalid parameters. Block is already at that order."});
        }
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot edit block order."});
            //Save container and order
            block.container = req.body.container;
            block.order = req.body.order;
            block.save(function(err){
                //Update order of other blocks
                Block.updateMany({_id: {$ne: block._id}, course: course._id, order: {$gte: req.body.order}}, {$inc: {order: 1}}, function(err, numAffected){
                    res.send(block);
                });
            });
        });
    });
};
//Edit text block
var _editTextBlock = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a block text."});
    }
    Block.findOne({_id: req.params._id, type: 'text'}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot edit block."});
            block.text = req.body.text;
            //Update images
            if(req.body.images){
                block.images = _.union(block.images, req.body.images);
            }
            //Update image
            if(req.body.image && (!block.image || (block.image && block.image.l != req.body.image))){
                //Add previous thumbnail in images
                if(block.image.m) block.images.push(block.image.m);
                //Update image
                block.image.l = req.body.image;
                block.image.m = req.body.image;
                if(req.body.bound) block.bound = req.body.bound;
            } else {
                req.body.image = '';
            }
            block.updated_at = new Date(Date.now());
            //Save
            block.save(function(err){
                if(!err){
                    res.status(200).send(block);
                    //Update image
                    if(req.body.image){
                        var image = req.body.image.replace(/^https:\/\//i, 'http://');
                        var m_file_name = 'm-' + block.slug;
                        //Update image (medium size)
                        Utility.get_resized_image(m_file_name, image, 400, function(resized){
                            Utility.upload_file(resized, m_file_name, function(image_url){
                                Block.updateOne({ _id: block._id }, { $set: { 'image.m': image_url }}).exec();
                            });
                        });
                    }
                }
            });
        });
    });
};
//Add toggle list item
var _addToggleListItem = function(req, res){
    if(!req.body.title || !req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a title and a text"});
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
                title: req.body.title,
                creator: req.user.id,
                updated_at: new Date(Date.now())
            });
            //Linkify text
            var linkifiedText = linkifyHtml(req.body.text, {
                target: '_blank'
            });
            new_item.text = linkifiedText.replace(/\n\r?/g, '<br />');
            //Push
            block.items.push(new_item);
            //Save
            block.save(function(err){
                if(!err) res.send(new_item);
            });
        });
    });
};
//Remove toggle list item
var _removeToggleListItem = function(req, res){
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
//Add option for MCQ or Match the following
var _addOption = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting an option text."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot add option."});
            //Add new option
            var new_option = new Option({
                text: req.body.text,
                'image.m': req.body.image,
                'image.l': req.body.image,
                bound: req.body.bound
            });
            //Check if mcq or match the following
            if(block.type == 'mcq'){
                block.mcqs.push(new_option);
            } else if(block.type == 'match'){
                new_option.is_optionb = req.body.is_optionb;
                block.options.push(new_option);
            }
            //Save
            block.save(function(err){
                if(!err){
                    res.status(200).send(new_option);
                    //Update image
                    if(req.body.image){
                        var image = req.body.image.replace(/^https:\/\//i, 'http://');
                        var slug = shortid.generate();
                        var m_file_name = 'm-' + slug;
                        //Update image (medium size)
                        Utility.get_resized_image(m_file_name, image, 200, function(resized){
                            Utility.upload_file(resized, m_file_name, function(image_url){
                                if(block.type == 'mcq'){
                                    Block.updateOne({_id: req.params._id, 'mcqs._id': new_option._id}, {$set: {'mcqs.$.image.m': image_url}}).exec();
                                } else if(block.type == 'match'){
                                    Block.updateOne({_id: req.params._id, 'options._id': new_option._id}, {$set: {'options.$.image.m': image_url}}).exec();
                                }
                            });
                        });
                    }
                } else res.sendStatus(400);
            });
        });
    });
};
//Edit MCQ option
var _editMCQOption = function(req, res){
    if(!req.body.option){
        return res.status(400).send({error: "Invalid parameters. We are expecting an option id."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot edit option."});
            Block.updateOne({
                _id: req.params._id,
                'mcqs._id': req.body.option
            }, { $set: { 'mcqs.$.text': req.body.text} }, function(err, numAffected){
                if(!err) res.send({text: req.body.text});
            });
        });
    });
};
//Set correct MCQ Option
var _correctMCQOption = function(req, res){
    if(!req.body.option){
        return res.status(400).send({error: "Invalid parameters. We are expecting an option id."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot set correct option."});
            if(block.is_multiple || !req.body.is_correct){
                Block.updateOne({
                    _id: req.params._id,
                    'mcqs._id': req.body.option
                }, { $set: { "mcqs.$.is_correct": req.body.is_correct}}, function(err, numAffected){
                    res.send(block);
                });
            } else {
                //Remove other correct option
                Block.updateOne({
                    _id: req.params._id,
                    "mcqs.is_correct": true
                }, { $set: { "mcqs.$.is_correct": false} }, function(err, numAffected) {
                    //Set correct option
                    Block.updateOne({
                        _id: req.params._id,
                        'mcqs._id': req.body.option
                    }, { $set: { "mcqs.$.is_correct": true}}, function(err, numAffected){
                        res.send(block);
                    });
                });
            }
        });
    });
};
//Remove option from MCQ or Match the following
var _removeOption = function(req, res){
    if(!req.body.option){
        return res.status(400).send({error: "Invalid parameters. We are expecting an option id."});
    }
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot remove option."});
            //Check if mcq or match the following
            if(block.type == 'mcq'){
                Block.updateOne({
                    _id: req.params._id,
                    'mcqs._id': req.body.option
                }, { $pull: { mcqs: {_id: req.body.option}}}, function(err, numAffected){
                    res.sendStatus(200);
                });
            } else if(block.type == 'match'){
                Block.updateOne({
                    _id: req.params._id,
                    'options._id': req.body.option
                }, { $pull: { options: {_id: req.body.option}}}, function(err, numAffected){
                    res.sendStatus(200);
                });
            }
        });
    });
};
//Select MCQ Option
var _selectOption = function(req, res){
    if(!req.body.option){
        return res.status(400).send({error: "Invalid parameters. We are expecting an option id."});
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
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot select option."});
            if(block.is_multiple){
                Block.updateOne({
                    _id: req.params._id,
                    'mcqs._id': req.body.option
                }, { $addToSet: { "mcqs.$.voters": req.user.id }}, function(err, numAffected){
                    res.sendStatus(200);
                });
            } else {
                //Remove all previous votes
                Block.updateOne({
                    _id: req.params._id,
                    "mcqs.voters": req.user.id
                }, { $pull: { "mcqs.$.voters": req.user.id } }, function(err, numAffected) {
                    //Add new vote
                    Block.updateOne({
                        _id: req.params._id,
                        'mcqs._id': req.body.option
                    }, { $addToSet: { "mcqs.$.voters": req.user.id }}, function(err, numAffected){
                        res.sendStatus(200);
                    });
                });
            }
        });
    });
};
//Unselect option
var _unselectOption = function(req, res){
    if(!req.body.option){
        return res.status(400).send({error: "Invalid parameters. We are expecting an option id."});
    }
    Block.updateOne({
        _id: req.params._id,
        "mcqs._id": req.body.option
    }, { $pull: { "mcqs.$.voters": req.user.id } }, function(err, numAffected) {
        if(!err) res.sendStatus(200);
    });
};
//Select match option
var _selectMatchOption = function(req, res){
    if(!req.body.option){
        return res.status(400).send({error: "Invalid parameters. We are expecting an option id."});
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
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot select option."});
            if(req.body.matched_to){
                //New matcher
                var new_matcher = new Response({
                    matched_to: req.body.matched_to,
                    creator: req.user.id,
                    updated_at: new Date(Date.now())
                });
                //Check if already matched
                var selected_option;
                for(var i=0; i<block.options.length; i++){
                    if(block.options[i]._id.toString() == req.body.option){
                        selected_option = block.options[i];
                        break;
                    }
                }
                if(selected_option){
                    for(var i=0; i<selected_option.matchers.length; i++){
                        if(selected_option.matchers[i].creator.toString() == req.user.id && selected_option.matchers[i].matched_to.toString() == req.body.matched_to){
                            return res.status(400).send({error: "Already matched."});
                        }
                    }
                }
                //Match
                Block.updateOne({
                    _id: req.params._id,
                    "options._id": req.body.option},
                { $push: { "options.$.matchers": new_matcher } }, function(err, numAffected){
                    res.send(new_matcher);
                });
            } else {
                //Get random color
                var optionColor = randomColor({luminosity: 'dark'});
                //Update color of option
                Block.updateOne({
                    _id: req.params._id,
                    "options._id": req.body.option
                }, { $set: { "options.$.color": optionColor } }, function(err, numAffected) {
                    if(!err) res.send({color: optionColor});
                });
            }
        });
    });
};
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
//DELETE Request functions - Block
//Delete block
var _deleteBlock = function(req, res){
    Block.findOne({_id: req.params._id}, function(err, block){
        if(!block) return res.sendStatus(404);
        //Check access to course
        Course.findOne({
            _id: block.course,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }).exec(function(err, course){
            if(!course) return res.status(400).send({error: "Unauthorized user. Cannot delete block."});
            //All s3 image keys
            var keys = [];
            async.parallel([
                function(callback){
                   //Delete provider files
                   if(block.image){
                       var provider_key = Utility.get_provider_key(block.provider, block.image.m);
                   } else {
                       var provider_key = Utility.get_provider_key(block.provider);
                   }
                   if(provider_key) keys.push(provider_key);
                   callback();
                },
                function(callback){
                   //Delete images
                   if(block.type == 'text' && block.images){
                       if(block.image) {
                           var image_keys = Utility.get_image_keys(block.images, block.image.m);
                       } else {
                           var image_keys = Utility.get_image_keys(block.images);
                       }
                   } else if(block.image){
                       var image_keys = Utility.get_image_keys([block.image.l], block.image.m);
                   }
                   keys = keys.concat(image_keys);
                   callback();
                },
                function(callback){
                    //Delete images provider files of responses
                    if(block.responses && block.responses.length){
                        for(var i=0; i<block.responses.length; i++){
                            //Images
                            if(block.responses[i].images && block.responses[i].images.length){
                                var image_keys = Utility.get_image_keys(block.responses[i].images);
                                keys = keys.concat(image_keys);
                            }
                            //Image
                            if(block.responses[i].image){
                                var image_keys = Utility.get_image_keys([block.responses[i].image.l], block.responses[i].image.m);
                                keys = keys.concat(image_keys);
                            }
                            //Attachments
                            if(block.responses[i].attachments && block.responses[i].attachments.length){
                                for(var j=0; j<block.responses[i].attachments.length; j++){
                                    var provider_key = Utility.get_provider_key(block.responses[i].attachments[j].provider);
                                    keys.push(provider_key);
                                }
                            }
                        }
                        callback();
                    } else {
                        callback();
                    }
                },
                function(callback){
                    //Delete images of mcq options
                    if(block.mcqs && block.mcqs.length){
                        for(var i=0; i<block.mcqs.length; i++){
                            if(block.mcqs[i].image){
                                var image_keys = Utility.get_image_keys([block.mcqs[i].image.l], block.mcqs[i].image.m);
                                keys = keys.concat(image_keys);
                            }
                        }
                        callback();
                    } else {
                        callback();
                    }
                },
                function(callback){
                    //Delete images of match the following options
                    if(block.options && block.options.length){
                        for(var i=0; i<block.options.length; i++){
                            if(block.options[i].image){
                                var image_keys = Utility.get_image_keys([block.options[i].image.l], block.options[i].image.m);
                                keys = keys.concat(image_keys);
                            }
                        }
                        callback();
                    } else {
                        callback();
                    }
                },
                function(callback){
                    //Delete images of items
                    if(block.items && block.items.length){
                        for(var i=0; i<block.items.length; i++){
                            if(block.items[i].image){
                                var image_keys = Utility.get_image_keys([block.items[i].image.l], block.items[i].image.m);
                                keys = keys.concat(image_keys);
                            }
                        }
                        callback();
                    } else {
                        callback();
                    }
                },
                function(callback){
                    //Delete all comments images
                    for(var i=0; i<block.comments.length; i++){
                        if(block.comments[i].images && block.comments[i].images.length){
                            var image_keys = Utility.get_image_keys(block.comments[i].images);
                            keys = keys.concat(image_keys);
                        }
                    }
                    callback();
                },
                function(callback){
                   //Update order of other blocks
                   var current_order = block.order;
                   Block.updateMany({course: block.course, order: {$gt: current_order}}, { $inc : { order: -1 }}, function(err, numAffected){
                       callback();
                   });
                },
                function(callback){
                    //Move blocks out of container
                    if(block.type == 'container'){
                        Block.updateMany({container: block._id}, { $unset : { container: 1 }}, function(err, numAffected){
                           callback();
                       });
                    } else {
                        callback();
                    }
                },
                function(callback){
                    //Update skill count
                    var badge_arr = [];
                    var skill_inc_arr = [];
                    if(block.feedbacks && block.feedbacks.length){
                        for(var i=0; i<block.feedbacks.length; i++){
                            var feedback = block.feedbacks[i];
                            if(feedback.badges && feedback.badges.length){
                                for(var j=0; j<feedback.badges.length; j++){
                                    if(feedback.badges[j].skill_inc){
                                        badge_arr.push(feedback.badges[j].badge);
                                        var skill_inc = parseInt(feedback.badges[j].skill_inc);
                                        skill_inc = -skill_inc;
                                        skill_inc_arr.push(skill_inc);
                                    }
                                }
                            }
                        }
                        //Update skill count
                        if(badge_arr && badge_arr.length){
                            async.forEachOf(badge_arr, function(badge_one, index, cb){
                                Badge.updateOne({_id: badge_one, is_skill: true}, {$inc: {skill_total: skill_inc_arr[index]}}, function(err, numAffected){
                                    cb();
                                });
                            }, function(err){
                                callback()
                            });
                        } else {
                            callback();
                        }
                    } else {
                        callback();
                    }
                }
            ], function(err){
               if(!err){
                   //Delete block finally
                   block.remove(function(err){
                       if(!err){
                           res.sendStatus(200);
                           //Finally delete all keys
                           Utility.delete_keys(keys);
                       } else {
                           res.sendStatus(400);
                       }
                   });
               } else {
                   res.sendStatus(400);
               }
            });
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
/*---------------- MESSAGES FUNCTION -------------------------*/
//GET Request functions - Messages
//All messages of a user
var _getMessages = function(req, res){
    Message.find({
        is_archived: false,
        $or: [{user: req.user.id}, {creator: req.user.id}]
    }).select({user: 1, chats: {$elemMatch: {is_recent: true}}, count: 1, creator: 1, created_at: 1, updated_at: 1})
    .populate('user', 'name initials username dp job', 'User')
    .populate('creator', 'name initials username dp job', 'User')
    .sort({updated_at: -1}).exec(function(err, messages){
        res.send(messages);
    });
};
//Get a single message and all its chats
var _getMessageById = function(req, res){
    Message.findOne({
        _id: req.params._id,
        $or: [{user: req.user.id}, {creator: req.user.id}]
    }).populate('user', 'name initials username dp job', 'User')
    .populate('creator', 'name initials username dp job', 'User')
    .populate('chats.creator', 'name initials username dp job', 'User')
    .exec(function(err, message){
        if(!message) return res.sendStatus(404);
        res.send(message);
    });
};
//POST Requests function
//Create a message
var _createMessage = function(req, res){
    if(req.body.user && req.body.user == req.user.id){
        return res.status(400).send({error: "Cannot send a message to yourself."});
    }
    //Message support or any other user
    var user_id;
    async.parallel([
        function(callback){
            if(!req.body.user){
                User.findOne({email: 'framerspace'}, function(err, user){
                    user_id = user._id;
                    callback();
                });
            } else {
                user_id = req.body.user;
                callback();
            }
        }
    ], function(err){
        //Find a message
        Message.findOne({
            $or: [{user: user_id, creator: req.user.id},
                  {user: req.user.id, creator: user_id}]
        }, function(err, message){
            if(message) return res.send(message);
            //New message
            var new_message = new Message({
                user: user_id,
                count: 1,
                creator: req.user.id,
                updated_at: new Date(Date.now())
            });
            //Text
            if(req.body.text){
                //Linkified text
                var linkifiedText = linkifyHtml(req.body.text, {
                    target: '_blank'
                });
                var text = linkifiedText.replace(/\n\r?/g, '<br />');
            } else {
                var text = 'Say hi 👋';
            }
            //Add hello chat
            var new_chat = new Chat({
                text: text,
                is_recent: true,
                is_system: true
            });
            //Push
            new_message.chats.push(new_chat);
            //Save
            new_message.save(function(err){
                if(!err) res.send(new_message);
            });
        });
    });
};
//PUT Requests function
//Add chat to a message
var _addChat = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a chat text."});
    }
    Message.findOne({
        _id: req.params._id,
        $or: [{user: req.user.id}, {creator: req.user.id}]
    }, function(err, message){
        if(!message) return res.status(400).send({error: "Unauthorized user. Cannot add chat."});
        //Remove previous recent
        Message.updateOne({_id: req.params._id, "chats.is_recent": true},
        {$unset: {"chats.$.is_recent": 1}}, function(err, numAffected){
            //Get filtered text
            var filtered_text = Utility.get_filtered_text(req.body.text);
            //Linkified text
            var linkifiedText = linkifyHtml(filtered_text, {
                target: '_blank'
            });
            //New chat
            var new_chat = new Chat({
                text: linkifiedText.replace(/\n\r?/g, '<br />'),
                is_recent: true
            });
            //System or Creator
            if(req.body.is_system){
                new_chat.is_system = true;
            } else {
                new_chat.creator = req.user.id
            }
            //Push
            message.chats.push(new_chat);
            //Update message count and remove from archived
            message.count += 1;
            message.is_archived = false;
            message.updated_at = new Date(Date.now());
            //Save
            message.save(function(err){
                new_chat.populate({path: 'creator', select: 'name initials username dp job'},function(err, chat){
                    res.send(chat);
                });
            });
        });
    })
};
//DELETE Request function
//Delete message and all its chats
var _deleteMessage = function(req, res){
    Message.deleteOne({
        _id: req.params._id,
        $or: [{user: req.user.id}, {creator: req.user.id}]
    }, function(err, numAffected){
        if(!err) res.sendStatus(200);
    });
};
/*---------------- COMMENTS FUNCTION -------------------------*/
//GET Request functions - Comments
//All comments of a discussion
var _showComments = function(req, res){

};
//Get a single comment
var _getCommentById = function(req, res){

};
//POST Requests function
//Add a comment
var _addComment = function(req, res){
    if(!req.body.text || !req.body.block_id){
        return res.status(400).send({error: "Invalid parameters. We were expecting a text and a block id"});
    }
    //Find all courses user has access to
    Course.find({
        is_active: true,
        $or: [{privacy: {$in: ['public', 'unlisted']}},
              {creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['moderator', 'teacher', 'active']}}}}]
    }, function(err, courses){
        //Get course_ids
        var course_ids = [];
        if(courses && courses.length){
            for(var i=0; i<courses.length; i++){
                course_ids.push(courses[i]._id);
            }
        }
        //Get block
        Block.findOne({
            _id: req.body.block_id,
            has_discussion: true,
            course: {$in: course_ids}
        }).populate('creator', 'name email', 'User')
        .populate('comments.creator', 'name email', 'User').exec(function(err, block){
            if(!block) return res.status(400).send({error: "No such block exists."});
            //Remove previous recent
            Block.updateOne({ _id: req.body.block_id, "comments.is_recent": true},
                  { $unset: { "comments.$.is_recent": 1 } }, function(err, numAffected) {
                var new_comment = new Comment({
                    text: req.body.text,
                    images: req.body.images,
                    reply_to: req.body.reply_to,
                    creator: req.user.id,
                    updated_at: new Date(Date.now()),
                    is_recent: true
                });
                new_comment.summary = Utility.get_text_summary(new_comment.text);
                block.comments.push(new_comment);
                block.save(function(err){
                    new_comment.populate({path: 'creator', select: 'name initials username dp job'},function(err, comment){
                        res.send(comment);
                    });
                });
            });
        });
    });
};
//PUT Requests function
//Edit comment
var _editComment = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We were expecting a comment text"});
    }
    //Get comment
    Block.findOne({
        'comments._id': req.params._id,
        'comments.creator': req.user.id
    }, function(err, block){
        if(!block) return res.status(400).send({error: "Unauthorized user. Cannot edit comment."});
        //Get comment
        var comments = block.comments;
        var comment;
        for(var i=0; i<comments.length; i++){
            if(comments[i]._id.toString() == req.params._id){
                comment = comments[i];
            }
        }
        //Get images
        var comment_images = [];
        if(req.body.images){
            if(comment.images){
                var comment_images = comment.images;
            }
            comment_images = _.union(comment_images, req.body.images);
        }
        //Get summary
        var summary = Utility.get_text_summary(req.body.text);
        //Update
        Block.updateOne({
            'comments._id': req.params._id,
            'comments.creator': req.user.id
        }, { $set: { 'comments.$.text': req.body.text, 'comments.$.summary': summary, 'comments.$.images': comment_images} }, function(err, numAffected){
            if(!err) res.send({summary: summary, text: req.body.text});
        });
    });
};
//Like comment
var _likeComment = function(req, res){
    //Find all courses user has access to
    Course.find({
        is_active: true,
        $or: [{privacy: 'public'},
              {creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['moderator', 'teacher', 'active']}}}}]
    }, function(err, courses){
        //Get course_ids
        var course_ids = [];
        if(courses && courses.length){
            for(var i=0; i<courses.length; i++){
                course_ids.push(courses[i]._id);
            }
        }
        //Get block
        Block.updateOne({
            'comments._id': req.params._id,
            has_discussion: true,
            course: {$in: course_ids}
        }, { $addToSet: { "comments.$.likes": req.user.id }}).exec(function(err, block){
            if(!err) {
                res.sendStatus(200);
            }
        });
    });
};
//Unlike comment
var _unlikeComment = function(req, res){
    Block.updateOne({ 'comments._id': req.params._id},
    { $pull: { 'comments.$.likes': req.user.id } }, function(err, numAffected){
        if(!err) res.sendStatus(200);
    });
};
//DELETE Request function
//Delete comment
var _deleteComment = function(req, res){
    var block;
    async.series([
        function(callback){
            if(req.user.type == 'admin'){
                Block.findOne({
                    'comments._id': req.params._id
                }, function(err, b){
                    if(b) {
                        block = b;
                        callback();
                    }
                });
            } else {
                Block.findOne({
                    'comments._id': req.params._id,
                    'comments.creator': req.user.id
                }, function(err, b){
                    if(b){
                        block = b;
                        callback();
                    }
                });
            }
        }
    ], function(err){
        if(!block) return res.status(400).send({error: "Unauthorized user. Cannot delete comment."});
        //Get image keys
        var comment;
        for(var i=0; i< block.comments.length; i++){
            if(block.comments[i]._id.toString() == req.params._id){
                comment = block.comments[i];
                break;
            }
        }
        var keys = Utility.get_image_keys(comment.images);
        //Delete comment and update its replies
        Block.updateOne({_id: block._id, 'comments.reply_to': req.params._id}, {$unset: {'comments.$[].reply_to': 1}}, function(err, numAffected){
            Block.updateOne({'comments._id': req.params._id}, {$pull: {comments: {_id: req.params._id}}}, function(err, numAffected){
                if(!err) {
                    //Make previous comment active
                    if(block.comments.length > 1 && block.comments[block.comments.length -1]._id.toString() == req.params._id){
                        var prev_id = block.comments[block.comments.length -2]._id;
                        Block.updateOne({'comments._id': prev_id}, {$set: {'comments.$.is_recent': true }}, function(err, numAffected) {
                            res.sendStatus(200);
                            //Finally delete all keys
                            Utility.delete_keys(keys);
                        });
                    } else {
                        res.sendStatus(200);
                        //Finally delete all keys
                        Utility.delete_keys(keys);
                    }
                }
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
//Get all active users for admin
var _getAllActiveUsers = function(req, res){
    //Check if admin
    if(req.user.type != 'admin'){
        return res.status(400).send({error: "Unauthorized user. Cannot view"});
    }
    User.find({type: {$ne: 'invited'}}).select('_id email initials username name dp city country sex about job').sort({accountCreated: -1}).exec(function(err, users){
        res.send(users);
    });
};
//Get all inactive users for admin
var _getAllInactiveUsers = function(req, res){
    //Check if admin
    if(req.user.type != 'admin'){
        return res.status(400).send({error: "Unauthorized user. Cannot view"});
    }
    User.find({type: 'invited'}).select('_id email initials username name dp city country sex about job').sort({accountCreated: -1}).exec(function(err, users){
        res.send(users);
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
//Activate user
var _activateUser = function(req, res){
    //Check if admin
    if(req.user.type != 'admin'){
        return res.status(400).send({error: "Unauthorized user. Cannot activate user."});
    }
    var user_type = req.body.type || 'normal';
    User.updateOne({ _id: req.params._id}, { $set : { type: user_type } }, function(err, numAffected){
        res.sendStatus(200);
    });
};
//Deactivate user
var _deactivateUser = function(req, res){
    //Check if admin
    if(req.user.type != 'admin'){
        return res.status(400).send({error: "Unauthorized user. Cannot deactivate user."});
    }
    User.updateOne({ _id: req.params._id}, { $set : { type: 'invited' } }, function(err, numAffected){
        res.sendStatus(200);
    });
};
//Update unique id
var _updateUniqueId = function(req, res){
    //Get unique name
    const {uniqueNamesGenerator, adjectives, animals, colors, names} = require('unique-names-generator');
    const randomName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals, colors, names],
        length: 4,
        separator: "-"
    });
    User.updateOne({_id: req.user.id}, {$set : {email: randomName.toLowerCase()}}, function(err, numAffected){
        res.send({id: randomName.toLowerCase()});
    });
};
//Update reset email id
var _updateResetEmail = function(req, res){
    if(!req.body.email && !validator.isEmail(req.body.email))
        return res.status(400).send({error: "Invalid parameters. We are expecting a valid email"});
    User.findOne({reset_email: req.body.email.toLowerCase()}).exec(function(err, user){
        if(user) return res.status(400).send({error: "A user with this email already exists. Please try again."});
        User.updateOne({_id: req.user.id}, {$set : {reset_email: req.body.email.toLowerCase()}}, function(err, numAffected){
            res.send({email: req.body.email.toLowerCase()});
        });
    });
};
/*---------------- SEARCH FUNCTION -------------------------*/
//GET Request functions
//Search courses and containers
var _searchCoursesAndContainers = function(req, res){
    if(!req.query.text) return res.status(400).send({error: "Invalid parameters. We are expecting a search text."});
    var page = req.query.page;
    var all_courses = [], all_containers = [];
    //Find
    async.parallel([
        function(callback){
            //Search courses
            Course.find({
                is_active: true,
                $and: [{$or: [{'title': new RegExp('' + req.query.text + '', "i")},
                              {'tagline': new RegExp('' + req.query.text + '', "i") }]},
                       {$or: [{privacy: 'public'},
                              {creator: req.user.id},
                              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['moderator', 'teacher', 'active']}}}}]}]
            }).select({title: 1, tagline: 1, slug: 1, image: 1, privacy: 1})
            .sort({updated_at: -1})
            .skip((page - 1)*PAGE_SIZE).limit(PAGE_SIZE)
            .exec(function(err, courses){
                all_courses = courses;
                callback();
            });
        },
        function(callback){
            //Search containers
            Course.find({
                is_active: true,
                $or: [{privacy: 'public'},
                      {creator: req.user.id},
                      {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['moderator', 'teacher', 'active']}}}}]
            }).sort({updated_at: -1})
            .exec(function(err, courses){
                var course_ids = [];
                for(var i=0; i<courses.length; i++){
                    course_ids.push(courses[i]._id);
                }
                //Find
                Block.find({
                    course: {$in: course_ids},
                    type: 'container',
                    is_hidden: false,
                    $or: [{'title': new RegExp('' + req.query.text + '', "i")},
                          {'text': new RegExp('' + req.query.text + '', "i") }],
                }).select({title: 1, tagline: 1, slug: 1, image: 1, course: 1})
                .populate('course', 'slug', 'Course')
                .sort({updated_at: -1})
                .skip((page - 1)*PAGE_SIZE).limit(PAGE_SIZE)
                .exec(function(err, blocks){
                    all_containers = blocks;
                    callback();
                });
            });
        }
    ], function(err){
        res.send({
            courses: all_courses,
            containers: all_containers
        });
    });
};
//Search users
var _searchUsers = function(req, res){
    if(!req.query.text) return res.status(400).send({error: "Invalid parameters. We are expecting a search text."});
    var page = req.query.page;
    //Excluded
    if(req.query.excluded){
        var excluded = JSON.parse(req.query.excluded);
    }
    //Find
    User.find({
        _id: {$nin: excluded},
        $or: [{ 'name': new RegExp('' + req.query.text + '', "i")},
              { 'email': new RegExp('' + req.query.text + '', "i") }] })
    .select('name initials username dp job')
    .skip((page - 1)*PAGE_SIZE).limit(PAGE_SIZE)
    .exec(function(err, users){
        res.send(users);
    });
};
//Search gifs
var _searchGifs = function(req, res){
    if(!req.query.text) return res.status(400).send({error: "Invalid parameters. We are expecting a search text"});
    Utility.get_gifs_results(req.query.text, function(data){
        res.status(200).send(data);
    });
};
//Search badges
var _searchBadges = function(req, res){
    if(!req.query.text) return res.status(400).send({error: "Invalid parameters. We are expecting a search text."});
    if(!req.query.course) return res.status(400).send({error: "Invalid parameters. We are expecting a course id."});
    Course.findOne({
        _id: req.query.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }, function(err, course){
        if(!course) return res.send([]);
        var page = req.query.page;
        //Excluded
        if(req.query.excluded){
            var excluded = JSON.parse(req.query.excluded);
        }
        //Find badges
        Badge.find({
            course: course._id,
            is_skill: false,
            _id: {$nin: excluded},
            title: new RegExp('' + req.query.text + '', "i")
        }).select('title color')
        .skip((page - 1)*PAGE_SIZE).limit(PAGE_SIZE)
        .exec(function(err, badges){
            res.send(badges);
        });
    });
};
//Search skills
var _searchSkills = function(req, res){
    if(!req.query.text) return res.status(400).send({error: "Invalid parameters. We are expecting a search text."});
    if(!req.query.course) return res.status(400).send({error: "Invalid parameters. We are expecting a course id."});
    Course.findOne({
        _id: req.query.course,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }, function(err, course){
        if(!course) return res.send([]);
        var page = req.query.page;
        //Excluded
        if(req.query.excluded){
            var excluded = JSON.parse(req.query.excluded);
        }
        //Find badges
        Badge.find({
            course: course._id,
            is_skill: true,
            _id: {$nin: excluded},
            title: new RegExp('' + req.query.text + '', "i")
        }).select('title color')
        .skip((page - 1)*PAGE_SIZE).limit(PAGE_SIZE)
        .exec(function(err, skills){
            res.send(skills);
        });
    });
};
/*---------------- INSIGHT FUNCTION -------------------------*/
//GET Request functions
//Get basic insight
var _getCourseBasicInsight = function(req, res){
    Course.findOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }, function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot get insight."});
        var all_blocks_count = 0, response_blocks_count = 0, discussion_blocks_count = 0, comments_count = 0;
        async.parallel([
            function(callback){
                Block.countDocuments({course: course._id}, function(err, all_blocks){
                    all_blocks_count = all_blocks;
                    callback();
                });
            },
            function(callback){
                Block.countDocuments({course: course._id, type: {$in: ['mcq', 'fill', 'match', 'response']}}, function(err, response_blocks){
                    response_blocks_count = response_blocks;
                    callback();
                });
            },
            function(callback){
                Block.countDocuments({course: course._id, has_discussion: true}, function(err, discussion_blocks){
                    discussion_blocks_count = discussion_blocks;
                    callback();
                });
            },
            function(callback){
                Block.find({course: course._id, has_discussion: true}, function(err, discussion_blocks){
                    for(var i=0; i<discussion_blocks.length; i++){
                        comments_count += discussion_blocks[i].comments.length;
                    }
                    callback();
                });
            }
        ], function(err){
            if(!err){
                res.send({
                    all_blocks_count: all_blocks_count,
                    response_blocks_count: response_blocks_count,
                    discussion_blocks_count: discussion_blocks_count,
                    comments_count: comments_count,
                    viewers: course.viewers,
                    learners: course.count.learners
                });
            }
        });
    });
};
//Get all users of course
var _getCourseUsersInsight = function(req, res){
    Course.findOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
    }).select('title learners').populate('learners.containers', 'title tagline slug', 'Block')
    .exec(function(err, course){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot get insight."});
        Block.find({course: course._id, type: {$in: ['mcq', 'fill', 'match', 'response']}}, function(err, response_blocks){
            var user_ids = [], mcq_user_ids = [], fill_user_ids = [], match_user_ids = [], response_user_ids = [], comment_user_ids = [];
            async.each(response_blocks, function(block, callback){
                if(block.type == 'mcq'){
                    //MCQ
                    var options = block.mcqs;
                    if(options.length){
                        for(var i=0; i<options.length; i++){
                            var voters = options[i].voters;
                            if(voters.length){
                                for(var j=0; j<voters.length; j++){
                                    var response_user = voters[j].toString();
                                    if(user_ids.indexOf(response_user) > - 1 && mcq_user_ids.indexOf(response_user) > - 1) continue;
                                    //If user is not present in user_ids
                                    if(user_ids.indexOf(response_user) < 0){
                                        user_ids.push(response_user);
                                    }
                                    //If user is not present in mcq_user_ids
                                    if(mcq_user_ids.indexOf(response_user) < 0){
                                        mcq_user_ids.push(response_user);
                                    }
                                }
                            } else {
                                continue;
                            }
                        }
                        callback();
                    } else {
                        callback();
                    }
                } else if(block.type == 'fill'){
                    //Fill in the blanks
                    var fills = block.fills;
                    if(fills.length){
                        for(var i=0; i<fills.length; i++){
                            var responses = fills[i].responses;
                            if(responses.length){
                                for(var j=0; j<responses.length; j++){
                                    var response_user = responses[j].creator.toString();
                                    if(user_ids.indexOf(response_user) > - 1 && fill_user_ids.indexOf(response_user) > - 1) continue;
                                    //If user is not present in user_ids
                                    if(user_ids.indexOf(response_user) < 0){
                                        user_ids.push(response_user);
                                    }
                                    //If user is not present in fill_user_ids
                                    if(fill_user_ids.indexOf(response_user) < 0){
                                        fill_user_ids.push(response_user);
                                    }
                                }
                            } else {
                                continue;
                            }
                        }
                        callback();
                    } else {
                        callback();
                    }
                } else if(block.type == 'match'){
                    //Match the following
                    var options = block.options;
                    if(options.length){
                        for(var i=0; i<options.length; i++){
                            var responses = options[i].matchers;
                            if(responses.length){
                                for(var j=0; j<responses.length; j++){
                                    var response_user = responses[j].creator.toString();
                                    if(user_ids.indexOf(response_user) > - 1 && match_user_ids.indexOf(response_user) > - 1) continue;
                                    //If user is not present in user_ids
                                    if(user_ids.indexOf(response_user) < 0){
                                        user_ids.push(response_user);
                                    }
                                    //If user is not present in match_user_ids
                                    if(match_user_ids.indexOf(response_user) < 0){
                                        match_user_ids.push(response_user);
                                    }
                                }
                            } else {
                                continue;
                            }
                        }
                        callback();
                    } else {
                        callback();
                    }
                } else {
                    //Response
                    var responses = block.responses;
                    if(responses.length){
                        for(var i=0; i<responses.length; i++){
                            var response_user = responses[i].creator.toString();
                            if(user_ids.indexOf(response_user) > - 1 && response_user_ids.indexOf(response_user) > - 1) continue;
                            //If user is not present in user_ids
                            if(user_ids.indexOf(response_user) < 0){
                                user_ids.push(response_user);
                            }
                            //If user is not present in response_user_ids
                            if(response_user_ids.indexOf(response_user) < 0){
                                response_user_ids.push(response_user);
                            }
                        }
                        callback();
                    } else {
                        callback();
                    }
                }
            }, function(err){
                //Find unique comments
                Block.find({course: course._id, has_discussion: true}, function(err, discussion_blocks){
                    if(discussion_blocks && discussion_blocks.length){
                        for(var i=0; i<discussion_blocks.length; i++){
                            var comments = discussion_blocks[i].comments;
                            if(comments.length){
                                for(var j=0; j<comments.length; j++){
                                    var response_user = comments[j].creator.toString();
                                    if(user_ids.indexOf(response_user) > - 1) continue;
                                    else user_ids.push(response_user);
                                }
                            } else {
                                continue;
                            }
                        }
                        //Find users
                        User.find({_id: {$in: user_ids}}).select('_id email initials username name dp city country sex about job').exec(function(err, users){
                            res.send({
                                course: course,
                                mcq_user_ids: mcq_user_ids.length,
                                fill_user_ids: fill_user_ids.length,
                                match_user_ids: match_user_ids.length,
                                response_user_ids: response_user_ids.length,
                                users: users
                            });
                        });
                    } else if(user_ids.length){
                        User.find({_id: {$in: user_ids}}).select('_id email initials username name dp city country sex about job').exec(function(err, users){
                            res.send({
                                course: course,
                                mcq_user_ids: mcq_user_ids.length,
                                fill_user_ids: fill_user_ids.length,
                                match_user_ids: match_user_ids.length,
                                response_user_ids: response_user_ids.length,
                                users: users
                            });
                        });
                    } else {
                        res.send([]);
                    }
                });
            });
        });
    });
};
//Get one user responses
var _getUserResponsesInsight = function(req, res){
    if(!req.query.user) return res.status(400).send({error: "Invalid parameters. We are expecting a user id."});
    var course;
    async.parallel([
        function(cb){
            if(req.query.user == req.user.id){
                //Check if the current user has access to course
                Course.findOne({
                    _id: req.params._id,
                    $or: [{creator: req.user.id},
                          {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                          {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                          {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
                }, function(err, one_course){
                    if(one_course) course = one_course;
                    cb();
                });
            } else {
                //Check if the course is created or moderated by the current user
                Course.findOne({
                    _id: req.params._id,
                    $or: [{creator: req.user.id},
                          {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
                }, function(err, one_course){
                    if(one_course) course = one_course;
                    cb();
                });
            }
        }
    ], function(err){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot get insight."});
        User.findOne({_id: req.query.user}).select('_id email initials username name dp city country sex about job').exec(function(err, user){
            if(!user) return res.status(400).send({error: "Invalid parameters. We are expecting a user id."});
            var all_blocks = [];
            Block.find({
                course: course._id,
                type: {$in: ['mcq', 'fill', 'match', 'response']}
            }).select({ order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, summary: 1, text: 1, button: 1, divider: 1, image: 1, bound: 1, file: 1, provider: 1, embed: 1, gif: 1, mcqs: 1, is_multiple: 1, fills: 1, options: 1, response_type:1, responses: { $elemMatch: { creator: req.query.user }}, items: 1, theme: 1, art: 1, size: 1, feedbacks: 1, alt_text: 1, ref_url: 1, extra: 1, has_discussion: 1, comments: { $elemMatch: { creator: req.query.user }}, creator: 1, created_at: 1, updated_at: 1}).sort({order: 1}).exec(function(err, blocks){
                var all_blocks = [];
                async.each(blocks, function(block, callback){
                    if(block.type == 'mcq'){
                        //MCQ
                        var can_add_block = false;
                        var user_options = [];
                        var options = block.mcqs;
                        if(options.length){
                            for(var i=0; i<options.length; i++){
                                var voters = options[i].voters;
                                if(voters.indexOf(user._id) > -1){
                                    options[i].voters = [];
                                    user_options.push(options[i]);
                                    can_add_block = true;
                                } else {
                                    continue;
                                }
                            }
                            block.mcqs = user_options;
                            if(can_add_block) all_blocks.push(block);
                            callback();
                        } else {
                            callback();
                        }
                    } else if(block.type == 'fill'){
                        //Fill in the blanks
                        var can_add_block = false;
                        var fills = block.fills;
                        if(fills.length){
                            for(var i=0; i<fills.length; i++){
                                var responses = fills[i].responses;
                                if(responses.length){
                                    var user_responses = [];
                                    for(var j=0; j<responses.length; j++){
                                        if(user._id == responses[j].creator.toString()){
                                            user_responses.push(responses[j]);
                                            can_add_block = true;
                                        }
                                    }
                                    block.fills[i].responses = user_responses;
                                } else {
                                    continue;
                                }
                            }
                            if(can_add_block) all_blocks.push(block);
                            callback();
                        } else {
                            callback();
                        }
                    } else if(block.type == 'match'){
                        //Match the following
                        var can_add_block = false;
                        var options = block.options;
                        if(options.length){
                            for(var i=0; i<options.length; i++){
                                var responses = options[i].matchers;
                                if(responses.length){
                                    var user_responses = [];
                                    for(var j=0; j<responses.length; j++){
                                        if(user._id == responses[j].creator.toString()){
                                            user_responses.push(responses[j]);
                                            can_add_block = true;
                                        }
                                    }
                                    block.options[i].matchers = user_responses;
                                } else {
                                    continue;
                                }
                            }
                            if(can_add_block) all_blocks.push(block);
                            callback();
                        } else {
                            callback();
                        }
                    } else if(block.type == 'response'){
                        //Response
                        var can_add_block = false;
                        var user_responses = [];
                        var responses = block.responses;
                        if(responses.length){
                            for(var i=0; i<responses.length; i++){
                                if(user._id == responses[i].creator.toString()){
                                    user_responses.push(responses[i]);
                                    can_add_block = true;
                                } else continue;
                            }
                            block.responses = user_responses;
                            if(can_add_block) all_blocks.push(block);
                            callback();
                        } else {
                            callback();
                        }
                    } else {
                        callback();
                    }
                }, function(err){
                    res.send({
                        user: user,
                        blocks: all_blocks
                    });
                });
            });
        });
    });
};
//Get one user comments
var _getUserCommentsInsight = function(req, res){
    if(!req.query.user) return res.status(400).send({error: "Invalid parameters. We are expecting a user id."});
    var course;
    async.parallel([
        function(cb){
            if(req.query.user == req.user.id){
                //Check if the current user has access to course
                Course.findOne({
                    _id: req.params._id,
                    $or: [{creator: req.user.id},
                          {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
                          {is_active: true, privacy: {$in: ['public', 'unlisted']}},
                          {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
                }, function(err, one_course){
                    if(one_course) course = one_course;
                    cb();
                });
            } else {
                //Check if the course is created or moderated by the current user
                Course.findOne({
                    _id: req.params._id,
                    $or: [{creator: req.user.id},
                          {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
                }, function(err, one_course){
                    if(one_course) course = one_course;
                    cb();
                });
            }
        }
    ], function(err){
        if(!course) return res.status(400).send({error: "Unauthorized user. Cannot get insight."});
        User.findOne({_id: req.query.user}).select('_id email initials username name dp city country sex about job').exec(function(err, user){
            if(!user) return res.status(400).send({error: "Invalid parameters. We are expecting a user id."});
            var all_blocks = [];
            Block.find({
                course: course._id,
                has_discussion: true
            }).select({ order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, summary: 1, text: 1, button: 1, divider: 1, image: 1, bound: 1, file: 1, provider: 1, embed: 1, gif: 1, mcqs: 1, is_multiple: 1, fills: 1, options: 1, response_type:1, responses: { $elemMatch: { creator: req.query.user }}, items: 1, theme: 1, art: 1, size: 1, feedbacks: 1, alt_text: 1, ref_url: 1, extra: 1, has_discussion: 1, comments: 1, creator: 1, created_at: 1, updated_at: 1}).sort({order: 1}).exec(function(err, blocks){
                var all_blocks = [];
                async.each(blocks, function(block, callback){
                    //Comments
                    var can_add_block = false;
                    var user_comments = [];
                    var comments = block.comments;
                    if(comments.length){
                        for(var i=0; i<comments.length; i++){
                            if(user._id == comments[i].creator.toString()){
                                user_comments.push(comments[i]);
                                can_add_block = true;
                            } else continue;
                        }
                        block.comments = user_comments;
                        if(can_add_block) all_blocks.push(block);
                        callback();
                    } else {
                        callback();
                    }
                }, function(err){
                    res.send({
                        user: user,
                        blocks: all_blocks
                    });
                });
            });
        });
    });
};
/*---------------- PUBLIC FUNCTION -------------------------*/
//GET Request functions - Course
//Get public course details
var _getPublicCourseByIdOrSlug = function(req, res){
    //Match if object id or not
    if(req.params._id.match(/^[0-9a-fA-F]{24}$/)){
        var query = {
            _id: req.params._id,
            is_active: true,
            privacy: 'public'
        }
    } else {
        var query = {
            slug: req.params._id,
            is_active: true,
            privacy: 'public'
        }
    }
    Course.findOne(query)
    .select('-members -learners -viewers')
    .populate('creator', 'name initials username dp job', 'User')
    .exec(function(err, course){
        if(!course) return res.sendStatus(404);
        res.send(course);
    });
};
//GET Request functions - Block
//Get blocks of a public course
var _getPublicCourseBlocks = function(req, res){
    Course.findOne({
        _id: req.params._id,
        is_active: true,
        privacy: 'public'
    }, function(err, course){
        if(!course) return res.send([]);
        Block.find({course: course._id, is_hidden: false, container: null})
        .select({ order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, summary: 1, text: 1, button: 1, divider: 1, image: 1, bound: 1, file: 1, provider: 1, embed: 1, gif: 1, mcqs: 1, is_multiple: 1, fills: 1, options: 1, response_type:1, items: 1, theme: 1, art: 1, size: 1, alt_text: 1, ref_url: 1, extra: 1, has_discussion: 1, comments: { $elemMatch: { is_recent: true }}, creator: 1, created_at: 1, updated_at: 1})
        .populate('creator', 'name initials username dp', 'User')
        .populate('comments.creator', 'name initials username dp job', 'User')
        .sort({order: 1}).exec(function(err, blocks){
            res.send(blocks);
        });
    });
};
//Get blocks of a public container
var _getPublicContainerBlocks = function(req, res){
    Block.findOne({_id: req.params._id, type: 'container'}, function(err, container){
        if(!container) return res.send([]);
        Course.findOne({
            _id: container.course,
            is_active: true,
            privacy: 'public'
        }, function(err, course){
            if(!course) return res.send([]);
            Block.find({course: course._id, is_hidden: false, container: container._id})
            .select({ order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, summary: 1, text: 1, button: 1, divider: 1, image: 1, bound: 1, file: 1, provider: 1, embed: 1, gif: 1, mcqs: 1, is_multiple: 1, fills: 1, options: 1, response_type:1, items: 1, container: 1, theme: 1, art: 1, size: 1, alt_text: 1, ref_url: 1, extra: 1, has_discussion: 1, comments: { $elemMatch: { is_recent: true }}, creator: 1, created_at: 1, updated_at: 1})
            .populate('container', 'slug title', 'Block')
            .populate('creator', 'name initials username dp', 'User')
            .populate('comments.creator', 'name initials username dp job', 'User')
            .sort({order: 1}).exec(function(err, blocks){
                res.send(blocks);
            });
        });
    });
};
/*---------------- MINIMAP FUNCTION -------------------------*/
//GET Request functions
//Get course minimap
var _getCourseMinimap = function(req, res){
    Course.findOne({
        _id: req.params._id,
        $or: [{creator: req.user.id},
              {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}},
              {is_active: true, privacy: {$in: ['public', 'unlisted']}},
              {is_active: true, members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: {$in: ['teacher', 'active']}}}}]
    }, function(err, course){
        if(!course) return res.send([]);
        Course.findOne({
            _id: req.params._id,
            $or: [{creator: req.user.id},
                  {members: { $elemMatch: { user: mongoose.Types.ObjectId(req.user.id), permit_val: 'moderator'}}}]
        }, function(err, creator_course){
            if(!creator_course){
                //Learner: Show all container blocks
                Block.find({course: course._id, type: 'container'})
                .select({order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, container: 1, creator: 1, created_at: 1, updated_at: 1})
                .sort({order: 1}).exec(function(err, blocks){
                    //Get sorted blocks
                    Utility.get_sorted_blocks(blocks, function(sorted_blocks){
                        res.send({
                            type: 'learner',
                            blocks: sorted_blocks
                        });
                    });
                });
            } else {
                //Creator or Moderator: Show all blocks
                Block.find({course: course._id})
                .select({order: 1, slug: 1, type: 1, course: 1, is_active: 1, is_hidden: 1, title: 1, container: 1, response_type: 1, creator: 1, created_at: 1, updated_at: 1})
                .sort({order: 1}).exec(function(err, blocks){
                    //Get sorted blocks
                    Utility.get_sorted_blocks(blocks, function(sorted_blocks){
                        res.send({
                            type: 'creator',
                            blocks: sorted_blocks
                        });
                    });
                });
            }
        });
    });
};
/* ------------------- LINK PREVIEW FUNCTION ------------- */
var _getLinkPreview = function(req, res){
    if(!req.query.url && !validator.isURL(req.query.url))
        return res.status(400).send({error: "Invalid parameters. We are expecting a valid url"});
    Utility.get_link_metadata(req.query.url, function(data){
        res.status(200).send(data);
    });
};
/* ------------------- UNIQUE NAME FUNCTION ------------- */
var _getUniqueName = function(req, res){
    const {uniqueNamesGenerator, adjectives, animals, colors, names} = require('unique-names-generator');
    const randomName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals, colors, names],
        length: 4,
        separator: "-"
    });
    res.status(200).send({name: randomName.toLowerCase()});
};
/* ------------------- ANALYSIS FUNCTION ------------- */
//Get dominant language
var _getDominantLanguage = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a text array."});
    }
    //Analyze
    Analysis.get_dominant_language(req.body.text, function(data){
        res.send({data: data});
    });
};
//Get named entities
var _getEntityRecognition = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a text array."});
    }
    //Analyze
    Analysis.get_entity_recognition(req.body.text, function(data){
        res.send({data: data});
    });
};
//Get keyphrases
var _getKeyPhrases = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a text array."});
    }
    //Analyze
    Analysis.get_key_phrases(req.body.text, function(data){
        res.send({data: data});
    });
};
//Get sentiments of a text
var _getSentimentAnalysis = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a text array."});
    }
    //Analyze
    Analysis.get_sentiment_analysis(req.body.text, function(data){
        res.send({data: data});
    });
};
//Get parts of speech
var _getSyntaxAnalysis = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a text array."});
    }
    //Analyze
    Analysis.get_syntax_analysis(req.body.text, function(data){
        res.send({data: data});
    });
};
//Get translated text
var _getTranslatedText = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a text value."});
    }
    //Analyze
    Analysis.get_translated_text(req.body.text, function(data){
        res.send({data: data});
    });
};
//Get tone analysis
var _getToneAnalysis = function(req, res){
    if(!req.body.text){
        return res.status(400).send({error: "Invalid parameters. We are expecting a text array."});
    }
    //Analyze
    Analysis.get_tone_analysis(req.body.text, function(data){
        res.send({data: data});
    });
};
/* ------------------- UPLOAD TO S3 ------------- */
var _uploadS3 = function(req, res){
    var mime_type = mime.getType(req.query.title);
    var expire = moment().utc().add(1, 'hour').toJSON("YYYY-MM-DDTHH:mm:ss Z");
    var policy = JSON.stringify({
      "expiration": expire,
        "conditions": [
          {"bucket": process.env.AWS_BUCKET},
          ["starts-with", "$key", process.env.BUCKET_DIR],
          {"acl": "public-read"},
          {"success-action-status": "201"},
          ["starts-with", "$Content-Type", mime_type],
          ["content-length-range", 0, process.env.MAX_FILE_SIZE]
        ]
    });
    var base64policy = new Buffer(policy).toString('base64');
    var signature = crypto.createHmac('sha1', process.env.AWS_SECRET).update(base64policy).digest('base64');
    var file_key = uuidv4();
    res.json({
        policy: base64policy,
        signature: signature,
        key: process.env.BUCKET_DIR + file_key + "_" + req.query.title,
        success_action_redirect: "/",
        contentType: mime_type
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
