//Client side of FramerSpace
var ProjectManager = new Backbone.Marionette.Application();
//Initialize Variables and Functions
var ENTER_KEY = 13,
    MAX_FILE_SIZE = 31457280,
    PAGE_SIZE = 20,
    prevScroll, scrollHandler,
    linkEmbedData,
    findTimer,
    searchTimer,
    feedbackCollection,
    myChart,
    learnerProgress,
    learnerContainers = [];
//Variable to check if inside discussion
var pathInDiscussion = false;
//Default font family for ChartJS
Chart.defaults.global.defaultFontFamily = "'IBM Plex Sans', sans-serif";
//Get global font color
if($('.pageWrap').data('theme') == 'light'){
    var globalFontColor = '#232323';
} else if($('.pageWrap').data('theme') == 'dark'){
    var globalFontColor = '#fff';
} else {
    if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
        var globalFontColor = '#fff';
    } else {
        var globalFontColor = '#232323';
    }
}
//Add regions of the application
ProjectManager.addRegions({
    headerRegion: '.mainHeader',
    contentRegion: '.mainContent',
    overlayRegion: '.overlay',
    feedRegion: '.feedWrap',
    sidebarRegion: '.sidebarWrap',
    resultsRegion: '.search-results',
    chatsRegion: '.chatsWrap'
});
//Navigate function to change url
ProjectManager.navigate = function(route, options){
    options || (options = {});
    Backbone.history.navigate(route, options);
};
//Find current route
ProjectManager.getCurrentRoute = function(){
    return Backbone.history.fragment;
};
//Start
ProjectManager.on('start', function(){
    if(Backbone.history){
        Backbone.history.start({pushState: true});
    }
    //Search
    $('.js-search').click(function(ev){
        if($('.searchWrap').hasClass('u-hide')){
            $('.searchWrap').removeClass('u-hide');
            $('.searchWrap input').focus();
        } else {
            $('.searchWrap input').val('');
            $('.search-results > div').remove();
            $('.searchWrap').addClass('u-hide');
        }
    });
    //Search results
    $('.search-text').on('input', function(ev){
        var search_text = $('.search-text').val().trim();
        if(search_text){
            //Reset searchTimer
            clearTimeout(searchTimer);
            searchTimer = null;
            //Set search timer
            searchTimer = setTimeout(function(){
                ProjectManager.vent.trigger('searchResults:show', search_text);
            }, 500);
        } else {
            //Clear timer
            if(searchTimer){
                clearTimeout(searchTimer);
                searchTimer = null;
            }
            $('.search-results > div').remove();
        }
    });
    //Messages
    $('.js-messages').click(function(ev){
        ev.preventDefault();
        if($('.messagesWrap').hasClass('u-hide')){
            $('.messagesWrap').removeClass('u-hide');
            ProjectManager.vent.trigger('messages:show');
        } else {
            $('.messagesWrap .chatsWrap > div').remove();
            $('.messagesWrap').addClass('u-hide');
        }
    });
    //Help
    $('.js-help').click(function(ev){
        ev.preventDefault();
        ProjectManager.vent.trigger('help:show');
    });
    //More btn
    $('.js-more').click(function(ev){
        ev.preventDefault();
        $('.navMore').toggle();
    });
    //Show my insights
    $('.js-my-insights').click(function(ev){
        ev.preventDefault();
        $('.navMore').hide();
        ProjectManager.vent.trigger('enrolledCourseOverlay:show');
    });
    //Show draft courses
    $('.js-drafts').click(function(ev){
        ev.preventDefault();
        $('.navMore').hide();
        //Close sidebar
        ProjectManager.commands.execute('close:sidebar');
        ProjectManager.vent.trigger('courses:show', 'drafts');
    });
    //Show archived courses
    $('.js-archived').click(function(ev){
        ev.preventDefault();
        $('.navMore').hide();
        //Close sidebar
        ProjectManager.commands.execute('close:sidebar');
        ProjectManager.vent.trigger('courses:show', 'archived');
    });
    //Show settings overlay
    $('.js-settings').click(function(ev){
        ev.preventDefault();
        $('.navMore').hide();
        ProjectManager.vent.trigger('settings:show');
    });
    //On mousedown
    $(document).mousedown(function(ev){
        var $target = $(ev.target);
        //Hide more dropdown
        var moreDropdown = $('.navMore');
        var moreBtn = $target.hasClass('js-more');
        if (moreDropdown.is(':visible') && !moreDropdown.is(ev.target) && moreDropdown.has(ev.target).length === 0 && !moreBtn) {
            moreDropdown.hide();
        }
        //Close searchWrap
        var searchWrap = $('.searchWrap');
        if(!searchWrap.hasClass('u-hide') && !searchWrap.is(ev.target) && searchWrap.has(ev.target).length === 0 && !$target.hasClass('js-search')){
             $('.js-search').click();
        }
        //Close messagesWrap
        var messagesWrap = $('.messagesWrap');
        if(!messagesWrap.hasClass('u-hide') && !messagesWrap.is(ev.target) && messagesWrap.has(ev.target).length === 0 && !$target.hasClass('js-messages') && !$target.hasClass('unread-message')){
             $('.js-messages').click();
        }
    });
    //On keydown
    $(document).keydown(function(ev){
        if(ev.keyCode === $.ui.keyCode.ESCAPE){
            $('.minimap-blocks').sortable('cancel');
            $('.child-blocks').sortable('cancel');
        }
    });
    //Show sticky header on scroll
    var lastScrollTop = 0;
    $(window).scroll(function(){
        var distanceY = $(window).scrollTop();
        if(distanceY > 330){
            //Down scroll
            $('.header-title').addClass('sticky');
        } else {
            //Up scroll
            $('.header-title').removeClass('sticky');
        }
        lastScrollTop = distanceY;
    });
    //Socket variables and triggers
    window.socket = io.connect('https://framerspace.com');
    socket.on('add_comment_toClient', function(data){
        ProjectManager.vent.trigger('socket:addComment', data);
    });
    socket.on('edit_comment_toClient', function(data){
        ProjectManager.vent.trigger('socket:editComment', data);
    });
    socket.on('delete_comment_toClient', function(data){
        ProjectManager.vent.trigger('socket:deleteComment', data);
    });
    socket.on('add_chat_toClient', function(data){
        //Show unread message
        $('.js-messages .unread-message').removeClass('u-hide');
        //Add chat
        ProjectManager.vent.trigger('socket:addChat', data);
    });
    socket.on('delete_chat_toClient', function(data){
        ProjectManager.vent.trigger('socket:deleteChat', data);
    });
});
//Show overlay
ProjectManager.commands.setHandler('show:overlay', function(){
    //Hide scroll on main page
    prevScroll = $('body').scrollTop();
    $('body').css('overflow', 'hidden');
    if($('body').width() < 700 || $('html').hasClass('touchevents')){
        $('html').css('overflow', 'hidden');
        $('html, body').css('position', 'fixed');
    }
    $('body').scrollTop(prevScroll);
});
//Close overlay
ProjectManager.commands.setHandler('close:overlay', function(view){
    if(!$('.overlay > div').length) return;
    //remove animate class on overlay box
    $('.overlay-box').removeClass('animate');
    //Remove socket of discussion
    if(pathInDiscussion){
        socket.emit('socketInDiscussion', false);
        pathInDiscussion = false;
    }
    //after animation, remove view, change route and hide overlay
    setTimeout(function(){
        $('.overlay > div').remove();
        $('.overlay').hide();
        $('html, body').css('overflow', '').css('position', '');
        if(prevScroll) {
            $('html, body').scrollTop(prevScroll);
            prevScroll = '';
        }
    }, 300);
});
//Close sidebar
ProjectManager.commands.setHandler('close:sidebar', function(){
    if(!$('.sidebarWrap > div').length) return;
    //remove animate class on sidebar box
    $('.pageWrap').removeClass('with-sidebar');
    $('.sidebar-box').removeClass('animate');
    //after animation, remove view, change route and hide sidebar
    setTimeout(function(){
        $('.sidebarWrap > div').remove();
        $('.sidebarWrap').hide();
    }, 300);
});
//Router of the application
ProjectManager.module('ProjectApp', function (ProjectApp, ProjectManager, Backbone, Marionette, $, _) {
    ProjectApp.Router = Marionette.AppRouter.extend({
        appRoutes: {
            '': 'publicPizzaView',
            'drafts': 'draftCoursesView',
            'archived': 'archivedCoursesView',
            'course/:slug': 'courseView',
            'course/:slug/:container': 'courseContainerView'
        }
    });
    //API functions for each route
    var API = {
        newPizzaOverlayView: function(){
            console.log('newPizzaOverlayView')
            ProjectManager.ProjectApp.EntityController.Controller.showNewPizzaOverlay();
        },
        newCourseOverlayView: function(){
            ProjectManager.ProjectApp.EntityController.Controller.showNewCourseOverlay();
        },
        editCourseOverlayView: function(course_id){
            ProjectManager.ProjectApp.EntityController.Controller.showEditCourseOverlay(course_id);
        },
        newCohortOverlayView: function(course_id){
            ProjectManager.ProjectApp.EntityController.Controller.showNewCohortOverlay(course_id);
        },
        newBlockOverlayView: function(order){
            ProjectManager.ProjectApp.EntityController.Controller.showNewBlockOverlay(order);
        },
        editBlockOverlayView: function(block_id){
            ProjectManager.ProjectApp.EntityController.Controller.showEditBlockOverlay(block_id);
        },
        // publicPizzaView: function(){
        //     console.log('publicPizzaView')
        //     ProjectManager.ProjectApp.EntityController.Controller.showPizzaHeader('Admin');
        //     ProjectManager.ProjectApp.EntityController.Controller.showPizza('Admin');
        // },
        publicPizzaView: function(){
            console.log('publicPizzaView');
            ProjectManager.ProjectApp.EntityController.Controller.showPizzaHeader();
            ProjectManager.ProjectApp.EntityController.Controller.showPizzas();
        },
        draftCoursesView: function(){
            ProjectManager.ProjectApp.EntityController.Controller.showCoursesHeader('drafts');
            ProjectManager.ProjectApp.EntityController.Controller.showCourses('drafts');
        },
        archivedCoursesView: function(){
            ProjectManager.ProjectApp.EntityController.Controller.showCoursesHeader('archived');
            ProjectManager.ProjectApp.EntityController.Controller.showCourses('archived');
        },
        coursesView: function(type){
            conosole.log('coursesView')
            ProjectManager.ProjectApp.EntityController.Controller.showCoursesHeader(type);
            ProjectManager.ProjectApp.EntityController.Controller.showCourses(type);
        },
        courseView: function(slug, back_type){
            ProjectManager.ProjectApp.EntityController.Controller.showOneCourse(slug, '', back_type);
        },
        courseContainerView: function(slug, container){
            ProjectManager.ProjectApp.EntityController.Controller.showOneCourse(slug, container);
        },
        courseMembersOverlayView: function(course_id){
            ProjectManager.ProjectApp.EntityController.Controller.showCourseMembersOverlay(course_id);
        },
        courseBadgesOverlayView: function(course_id){
            ProjectManager.ProjectApp.EntityController.Controller.showCourseBadgesOverlay(course_id);
        },
        basicInsightOverlayView: function(course_id){
            ProjectManager.ProjectApp.EntityController.Controller.showBasicInsightOverlay(course_id);
        },
        usersInsightOverlayView: function(course_id){
            ProjectManager.ProjectApp.EntityController.Controller.showUsersInsightOverlay(course_id);
        },
        userResponsesInsightOverlayView: function(course_id, user_id, type){
            ProjectManager.ProjectApp.EntityController.Controller.showUserResponsesInsightOverlay(course_id, user_id, type);
        },
        userCommentsInsightOverlayView: function(course_id, user_id, type){
            ProjectManager.ProjectApp.EntityController.Controller.showUserCommentsInsightOverlay(course_id, user_id, type);
        },
        courseMinimapView: function(course_id, animate, selected_block){
            ProjectManager.ProjectApp.EntityController.Controller.showCourseMinimap(course_id, animate, selected_block);
        },
        blocksView: function(course_id, container_id, container_title){
            ProjectManager.ProjectApp.EntityController.Controller.showBlocks(course_id, container_id, container_title);
        },
        blockThemeOverlayView: function(block_id){
            ProjectManager.ProjectApp.EntityController.Controller.showBlockThemeOverlay(block_id);
        },
        discussionOverlayView: function(block_id){
            ProjectManager.ProjectApp.EntityController.Controller.showDiscussionOverlay(block_id);
        },
        responsesOverlayView: function(block_id){
            ProjectManager.ProjectApp.EntityController.Controller.showResponsesOverlay(block_id);
        },
        blockIftttOverlayView: function(block_id){
            ProjectManager.ProjectApp.EntityController.Controller.showBlockIftttOverlay(block_id);
        },
        feedbackView: function(block_id, feedback_id){
            ProjectManager.ProjectApp.EntityController.Controller.showFeedback(block_id, feedback_id);
        },
        animationView: function(name){
            ProjectManager.ProjectApp.EntityController.Controller.showAnimation(name);
        },
        enrolledCoursesOverlayView: function(){
            ProjectManager.ProjectApp.EntityController.Controller.showEnrolledCoursesOverlay();
        },
        invitationsView: function(){
            ProjectManager.ProjectApp.EntityController.Controller.showInvitations();
        },
        settingsView: function(){
            ProjectManager.ProjectApp.EntityController.Controller.showSettings();
        },
        searchResultsView: function(text){
            ProjectManager.ProjectApp.EntityController.Controller.showSearchResults(text);
        },
        messagesView: function(){
            ProjectManager.ProjectApp.EntityController.Controller.showMessages();
        },
        chatsView: function(message_id){
            ProjectManager.ProjectApp.EntityController.Controller.showChats(message_id);
        }
    };
    //Triggers to particular views
    //Show new course overlay
    ProjectManager.vent.on('newPizzaOverlay:show', function(){
        console.log('newPizzaOverlay:show')
        API.newPizzaOverlayView();
    });
    ProjectManager.vent.on('newCourseOverlay:show', function(){
        API.newCourseOverlayView();
    });
    //Show edit course overlay
    ProjectManager.vent.on('editCourseOverlay:show', function(course_id){
        API.editCourseOverlayView(course_id);
    });
    //Show new cohort overlay
    ProjectManager.vent.on('newCohortOverlay:show', function(course_id){
        API.newCohortOverlayView(course_id);
    });
    //Show new block overlay
    ProjectManager.vent.on('newBlockOverlay:show', function(order){
        API.newBlockOverlayView(order);
    });
    //Show edit block overlay
    ProjectManager.vent.on('editBlockOverlay:show', function(block_id){
        API.editBlockOverlayView(block_id);
    });
    //Show courses
    ProjectManager.vent.on('courses:show', function(type){
        if(type == 'public'){
            ProjectManager.navigate('');
        } else {
            ProjectManager.navigate(type);
        }
        API.coursesView(type);
    });
     //Show pizza and pizza modules
     ProjectManager.vent.on('pizza:show', function(slug){
        //Show course modules
        ProjectManager.navigate('pizza/' + slug);
        console.log('pizza navigate');
        // API.courseView(slug, back_type);
    });
    //Show course and course modules
    ProjectManager.vent.on('course:show', function(slug, back_type){
        //Show course modules
        ProjectManager.navigate('course/' + slug);
        API.courseView(slug, back_type);
    });
    //Show course members
    ProjectManager.vent.on('courseMembersOverlay:show', function(course_id){
        API.courseMembersOverlayView(course_id);
    });
    //Show course badges and skills
    ProjectManager.vent.on('courseBadgesOverlay:show', function(course_id){
        API.courseBadgesOverlayView(course_id);
    });
    //Show basic insights
    ProjectManager.vent.on('basicInsightOverlay:show', function(course_id){
        API.basicInsightOverlayView(course_id);
    });
    //Show users insights
    ProjectManager.vent.on('usersInsightOverlay:show', function(course_id){
        API.usersInsightOverlayView(course_id);
    });
    //Show user responses insights
    ProjectManager.vent.on('userResponsesInsightOverlay:show', function(course_id, user_id, type){
        API.userResponsesInsightOverlayView(course_id, user_id, type);
    });
    //Show user comments insights
    ProjectManager.vent.on('userCommentsInsightOverlay:show', function(course_id, user_id, type){
        API.userCommentsInsightOverlayView(course_id, user_id, type);
    });
    //Show course minimap
    ProjectManager.vent.on('courseMinimap:show', function(course_id, animate, selected_block){
        API.courseMinimapView(course_id, animate, selected_block);
    });
    //Show course blocks
    ProjectManager.vent.on('blocks:show', function(course_id, container_id, container_title){
        var course_slug = $('.mainHeader .header-title').data('slug');
        if(container_id){
            ProjectManager.navigate('course/' + course_slug + '/' + container_id);
            API.blocksView(course_id, container_id, container_title);
        } else {
            ProjectManager.navigate('course/' + course_slug);
            API.blocksView(course_id);
        }
    });
    //Show block theme overlay
    ProjectManager.vent.on('blockThemeOverlay:show', function(block_id){
        API.blockThemeOverlayView(block_id);
    });
    //Show discussion overlay
    ProjectManager.vent.on('discussionOverlay:show', function(block_id){
        API.discussionOverlayView(block_id);
    });
    //Show responses overlay
    ProjectManager.vent.on('responsesOverlay:show', function(block_id){
        API.responsesOverlayView(block_id);
    });
    //Show block ifttt
    ProjectManager.vent.on('blockIftttOverlay:show', function(block_id){
        API.blockIftttOverlayView(block_id);
    });
    //Show feedback
    ProjectManager.vent.on('feedback:show', function(block_id, feedback_id){
        API.feedbackView(block_id, feedback_id);
    });
    //Show animation
    ProjectManager.vent.on('animation:show', function(name){
        API.animationView(name);
    });
    //Show enrolled courses overlay
    ProjectManager.vent.on('enrolledCourseOverlay:show', function(){
        API.enrolledCoursesOverlayView();
    });
    //Show invitations overlay
    ProjectManager.vent.on('invitations:show', function(){
        API.invitationsView();
    });
    //Show settings overlay
    ProjectManager.vent.on('settings:show', function(){
        API.settingsView();
    });
    //Show search results
    ProjectManager.vent.on('searchResults:show', function(text){
        API.searchResultsView(text);
    });
    //Show messages
    ProjectManager.vent.on('messages:show', function(){
        API.messagesView();
    });
    //Show message chats
    ProjectManager.vent.on('chats:show', function(message_id){
        API.chatsView(message_id);
    });
    //Initialize router with API
    ProjectManager.addInitializer(function(){
        new ProjectApp.Router({ controller: API });
    });
});
//Models and Collections of the application
ProjectManager.module('Entities', function (Entities, ProjectManager, Backbone, Marionette, $, _) {

    Entities.Pizza = Backbone.Model.extend({
        initialize: function(options){
            this._action = options._action;
            this._id = options._id;
        },
        url: function(){
            if(this._action){
                return '/api/pizza/' + this._id + '/' + this._action
            } else if(this._id) {
                return '/api/pizza/' + this._id
            } else {
                return '/api/pizza'
            }
        },
        idAttribute: '_id'
    });

    //Course Models and Collection
    Entities.Course = Backbone.Model.extend({
        initialize: function(options){
            this._action = options._action;
            this._id = options._id;
        },
        url: function(){
            if(this._action){
                return '/api/course/' + this._id + '/' + this._action
            } else if(this._id) {
                return '/api/course/' + this._id
            } else {
                return '/api/pizza'
            }
        },
        idAttribute: '_id'
    });
    Entities.PizzaCollection = Backbone.Collection.extend({
        url: function(){
            console.log('PizzaCollection');
            return '/api/pizza'
        },
        model: Entities.Pizza
    });
    Entities.CourseCollection = Backbone.Collection.extend({
        initialize: function(models, options){
            //_type is courses type like public, drafts, archived
            this._type = options._type;
        },
        url: function(){
            return '/api/courses/' + this._type
        },
        model: Entities.Course
    });
    //Block Models and Collection
    Entities.Block = Backbone.Model.extend({
        initialize: function(options){
            //type of block: text, audio etc.
            //_action are block actions - edit, add_connector etc.
            this._type = options.type;
            this._action = options._action;
            this._id = options._id;
        },
        url: function(){
            if(this._action){
                return '/api/block/' + this._id + '/' + this._action
            } else if(this._id) {
                return '/api/block/' + this._id
            } else if(this._type){
                return '/api/block/' + this._type
            } else {
                return '/api/block'
            }
        },
        idAttribute: '_id'
    });
    Entities.BlockCollection = Backbone.Collection.extend({
        initialize: function(models, options){
            //_id is course id
            this._id = options._id;
            this._container = options._container;
        },
        url: function(){
            if(this._container){
                return '/api/blocks/container/' + this._container
            } else {
                return '/api/blocks/' + this._id
            }
        },
        model: Entities.Block
    });
    //Badge Models and Collection
    Entities.Badge = Backbone.Model.extend({
        initialize: function(options){
            this._id = options._id;
        },
        url: function(){
            if(this._id){
                return '/api/badge/' + this._id
            } else {
                return '/api/badge'
            }
        },
        idAttribute: '_id'
    });
    Entities.BadgeCollection = Backbone.Collection.extend({
        initialize: function(models, options){
            //_id is course id
            this._id = options._id;
        },
        url: function(){
            return '/api/badges/' + this._id
        },
        model: Entities.Badge
    });
    //Message Models and Collection
    Entities.Message = Backbone.Model.extend({
        initialize: function(options){
            this._id = options._id;
        },
        url: function(){
            if(this._id){
                return '/api/message/' + this._id
            } else {
                return '/api/message'
            }
        },
        idAttribute: '_id'
    });
    Entities.MessageCollection = Backbone.Collection.extend({
        url: '/api/messages',
        model: Entities.Message
    });
    //Comment Model
    Entities.Comment = Backbone.Model.extend({
        initialize: function(options){
            this._action = options._action;
            this._id = options._id;
        },
        url: function(){
            //Get - Edit single comment
            if(this._action){
                return '/api/comment/' + this._id + '/' + this._action
            } else if(this._id){
                return '/api/comment/' + this._id
            } else {
                return '/api/comment'
            }
        },
        idAttribute: '_id'
    });
    //User Models and Collection
    Entities.User = Backbone.Model.extend({
        initialize: function(options){
            if(options) this._action = options._action;
            if(options) this._id = options._id;
        },
        url: function(){
            if(this._action){
                return '/api/user/' + this._id + '/' + this._action
            } else if (this._id) {
                return '/api/user/' + this._id
            } else {
                return '/api/me'
            }
        },
        idAttribute: '_id'
    });
    Entities.UserCollection = Backbone.Collection.extend({
        initialize: function(models, options){
            //_type is users type like active, inactive
            this._type = options._type;
        },
        url: function(){
            return '/api/users/' + this._type
        },
        model: Entities.User
    });
    //Analysis
    Entities.Analysis = Backbone.Model.extend({
        initialize: function(options){
            if(options) this._type = options._type;
        },
        url: function(){
            if (this._type) {
                return '/api/analysis/' + this._type
            }
        },
        idAttribute: '_id'
    });
    //Link Preview
    Entities.LinkPreview = Backbone.Model.extend({
        initialize: function(options){
            this._url = options._url;
        },
        url: function(){
            if (this._url) {
                return '/api/embedlink?url=' + this._url
            }
        },
        idAttribute: '_id'
    });
    //Insight
    Entities.Insight = Backbone.Model.extend({
        initialize: function(options){
            this._id = options._id;
            this._type = options._type;
            this._user = options._user;
        },
        url: function(){
            if(this._user) {
                return '/api/insight/' + this._id + '/' + this._type + '?user=' + this._user
            } else {
                return '/api/insight/' + this._id + '/' + this._type
            }
        },
        idAttribute: '_id'
    });
    //Search
    Entities.Search = Backbone.Model.extend({
        initialize: function(models, options){
            this._type = options._type;
            this._text = encodeURIComponent(options._text);
            this._page = options._page;
        },
        url: function () {
            if(this._page){
                return '/api/search/' + this._type + '?text=' + this._text + '&page=' + this._page
            } else {
                return '/api/search/' + this._type + '?text=' + this._text
            }
        }
    });
    //Minimap
    Entities.Minimap = Backbone.Model.extend({
        initialize: function(options){
            //_id is course id
            this._id = options._id;
        },
        url: function(){
            return '/api/minimap/' + this._id
        },
        idAttribute: '_id'
    });
    //Functions to get data
    var API = {
        getPizza: function(){
            console.log('getPizza API')
            var pizza = new Entities.PizzaCollection([],{});
            var defer = $.Deferred();
            pizza.fetch({
                success: function(data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },

        getCourses: function(_type){
            var courses = new Entities.CourseCollection([], {
                _type: _type
            });
            var defer = $.Deferred();
            courses.fetch({
                success: function(data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getOneCourse: function(_id){
            var course = new Entities.Course({
                _id: _id
            });
            var defer = $.Deferred();
            course.fetch({
                success: function(data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getBlocks: function(_id, _container){
            var blocks = new Entities.BlockCollection([], {
                _id: _id,
                _container: _container
            });
            var defer = $.Deferred();
            blocks.fetch({
                success: function(data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getOneBlock: function(_id){
            var block = new Entities.Block({
                _id: _id
            });
            var defer = $.Deferred();
            block.fetch({
                success: function(data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getBadges: function(_id){
            var badges = new Entities.BadgeCollection([], {
                _id: _id
            });
            var defer = $.Deferred();
            badges.fetch({
                success: function(data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getMessages: function(_id){
            var messages = new Entities.MessageCollection();
            var defer = $.Deferred();
            messages.fetch({
                success: function(data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getOneMessage: function(_id){
            var message = new Entities.Message({
                _id: _id
            });
            var defer = $.Deferred();
            message.fetch({
                success: function(data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getUsers: function(_type){
            var users = new Entities.UserCollection([], {
                _type: _type
            });
            var defer = $.Deferred();
            users.fetch({
                success: function (data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getOneUser: function(_id) {
            var user = new Entities.User({
                _id: _id
            });
            var defer = $.Deferred();
            user.fetch({
                success: function (data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getLinkPreview: function(_url){
            var linkpreview = new Entities.LinkPreview({
                _url: _url
            });
            var defer = $.Deferred();
            linkpreview.fetch({
                success: function (data) {
                    defer.resolve(data);
                }, error: function(){
                    defer.reject();
                }
            });
            return defer.promise();
        },
        getInsight: function(_id, _type, _user){
            var insight = new Entities.Insight({
                _id: _id,
                _type: _type,
                _user: _user
            });
            var defer = $.Deferred();
            insight.fetch({
                success: function (data){
                    defer.resolve(data);
                }, error: function(){
                    defer.reject();
                }
            });
            return defer.promise();
        },
        getSearchResults: function(_type, _text, _page){
            var search = new Entities.Search([], {
                _type: _type,
                _text: _text,
                _page: _page
            });
            var defer = $.Deferred();
            search.fetch({
                success: function (data){
                    defer.resolve(data);
                }
            });
            return defer.promise();
        },
        getMinimap: function(_id){
            var minimap = new Entities.Minimap({
                _id: _id
            });
            var defer = $.Deferred();
            minimap.fetch({
                success: function (data){
                    defer.resolve(data);
                }, error: function(){
                    defer.reject();
                }
            });
            return defer.promise();
        }
    };
    //Request Response Callbacks
    ProjectManager.reqres.setHandler('pizza:entities', function(){
        console.log('Request Response Callbacks')
        return API.getPizza();
    });
    ProjectManager.reqres.setHandler('course:entities', function(_type){
        return API.getCourses(_type);
    });
    ProjectManager.reqres.setHandler('course:entity', function(_id){
        return API.getOneCourse(_id);
    });
    ProjectManager.reqres.setHandler('block:entities', function(_id, _container){
        return API.getBlocks(_id, _container);
    });
    ProjectManager.reqres.setHandler('block:entity', function(_id){
        return API.getOneBlock(_id);
    });
    ProjectManager.reqres.setHandler('badge:entities', function(_id){
        return API.getBadges(_id);
    });
    ProjectManager.reqres.setHandler('message:entities', function(){
        return API.getMessages();
    });
    ProjectManager.reqres.setHandler('message:entity', function(_id){
        return API.getOneMessage(_id);
    });
    ProjectManager.reqres.setHandler('user:entities', function(_type) {
        return API.getUsers(_type);
    });
    ProjectManager.reqres.setHandler('user:entity', function(slug) {
        return API.getOneUser(slug);
    });
    ProjectManager.reqres.setHandler('linkPreview:entity', function(_url){
        return API.getLinkPreview(_url);
    });
    ProjectManager.reqres.setHandler('insight:entity', function(_id, _type, _user){
        return API.getInsight(_id, _type, _user);
    });
    ProjectManager.reqres.setHandler('search:entities', function(_type, _text, _page){
        return API.getSearchResults(_type, _text, _page);
    });
    ProjectManager.reqres.setHandler('minimap:entity', function(_id){
        return API.getMinimap(_id);
    });
});
//Views of the application
ProjectManager.module('ProjectApp.EntityViews', function (EntityViews, ProjectManager, Backbone, Marionette, $, _) {

    //New pizza view
    EntityViews.NewPizzaView = Marionette.ItemView.extend({
        template: 'newPizzaTemplate',
        events: {
            'click .js-close': 'closeOverlay',
            'click .js-save:not(.u-disabled)': 'savePizza'
        },
        initialize: function(){
            console.log('initialize')
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        savePizza: function(ev){
            console.log('save pizza');
        }
    });
    //New course view
    EntityViews.NewCourseView = Marionette.ItemView.extend({
        template: 'newPizzaTemplate',
        events: {
            'click .js-close': 'closeOverlay',
            'focus .pizza-title': 'hideError',
            'click .js-save:not(.u-disabled)': 'savePizza',
            'click .js-delete-course': 'deleteCourse'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        hideError: function(ev){
            this.$('.u-formError').text('').hide();
            this.$('.course-title').removeClass('hasError');
        },
        savePizza: function(ev){
            console.log('save')
            ev.preventDefault();
            if(!this.$('.pizza-title').val()){
                this.$('.pizza-name').text('Please enter a pizza name:').show();
                this.$('.pizza-title').addClass('hasError');
            } else if(!this.$('#select-pizza').find(":selected").val()){
                this.$('.pizza-size').text('Please select pizza size:').show();
                this.$('.select-pizza').addClass('hasError');
            }else if(!this.$('.pizza-price').val()){
                this.$('.price').text('Please enter the pizza price:').show();
                this.$('.pizza-price').addClass('hasError');
            }else {
                var value = {
                    title: this.$('.pizza-title').val().trim(),
                    size: this.$('#select-pizza').find(":selected").val(),
                    price: parseInt(this.$('.pizza-price').val())
                }
                console.log(value);
                this.trigger('save:pizza', value);
            }
            // else {
            //     var value = {
            //         title: this.$('.course-title').val().trim(),
            //         tagline: this.$('.course-tagline').val().trim(),
            //         core: this.$('.course-core').val().trim(),
            //         sel: this.$('.course-sel').val().trim(),
            //         sdg: this.$('.course-sdg').val().trim()
            //     }
            //     //Check privacy
            //     if(this.$('.privacy-label #public-radio').is(':checked')){
            //         value.privacy = 'public';
            //     } else if(this.$('.privacy-label #unlisted-radio').is(':checked')){
            //         value.privacy = 'unlisted';
            //     } else {
            //         value.privacy = 'private';
            //     }
            //     //Check certification
            //     if(this.$('.certification-label input').is(':checked')){
            //         value.certification = true;
            //     } else {
            //         value.certification = false;
            //     }
            //     //Create - Edit course
            //     if(this.$('.overlay-box').hasClass('edit-box')){
            //         this.trigger('update:course', value);
            //     } else {
            //         this.trigger('save:course', value);
            //     }
            // }
        },
        deleteCourse: function(ev){

        }
    });
    //Pizza header view
    EntityViews.PizzaHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'pizzaHeaderTemplate',
        events: {
            'click .js-add-pizza': 'openNewPizzaOverlay'
        },
        openNewPizzaOverlay: function(ev){
            console.log('openNewPizzaOverlay')
            ProjectManager.vent.trigger('newPizzaOverlay:show');
        }
    });
    //Courses header view
    EntityViews.CoursesHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'coursesHeaderTemplate',
        events: {
            'click .js-add-course': 'openNewCourseOverlay'
        },
        openNewCourseOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('newCourseOverlay:show');
        }
    });
    //New cohort view
    EntityViews.NewCohortView = Marionette.ItemView.extend({
        template: 'newCohortTemplate',
        events: {
            'click .js-close': 'closeOverlay',
            'focus .cohort-title': 'hideError',
            'click .js-save:not(.u-disabled)': 'saveCohort'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        hideError: function(ev){
            this.$('.u-formError').text('').hide();
            this.$('.cohort-title').removeClass('hasError');
        },
        saveCohort: function(ev){
            ev.preventDefault();
            if(!this.$('.cohort-title').val()){
                this.$('.u-formError').text('Please enter a cohort name:').show();
                this.$('.cohort-title').addClass('hasError');
            } else {
                var value = {
                    title: this.$('.cohort-title').val().trim()
                }
                this.trigger('save:cohort', value);
            }
        }
    });
     //Pizza item view
     EntityViews.PizzaItemView = Marionette.ItemView.extend({
        tagName: 'a',
        className: 'one-pizza',
        template: 'pizzaOneTemplate',
        initialize: function(){
            console.log('pizzaOneTemplate')
            this.$el.attr('href', '/pizza/' + this.model.get('slug'));
            this.$el.attr('data-slug', this.model.get('slug'));
            // this.$el.attr('data-id', this.model.get('_id'));
        },
        events: {
            'click': 'getOnePizza'
        },
        getOnePizza: function(ev){
            console.log('getOnePizza')
                ev.preventDefault();    
                ProjectManager.vent.trigger('pizza:show', this.model.get('slug'));
            }
    });
    //Course item view
    EntityViews.CourseItemView = Marionette.ItemView.extend({
        tagName: 'a',
        className: 'one-course',
        template: 'courseOneTemplate',
        initialize: function(){
            this.$el.attr('href', '/course/' + this.model.get('slug'));
            this.$el.attr('data-slug', this.model.get('slug'));
        },
        events: {
            'click': 'getOneCourse'
        },
        getOneCourse: function(ev){
            if(ev.metaKey || ev.ctrlKey) return;
            ev.preventDefault();
            //Get type of courses
            if(!$('.draft-courses').hasClass('u-hide')){
                ProjectManager.vent.trigger('course:show', this.model.get('slug'), 'drafts');
            } else if(!$('.archived-courses').hasClass('u-hide')){
                ProjectManager.vent.trigger('course:show', this.model.get('slug'), 'archived');
            } else {
                ProjectManager.vent.trigger('course:show', this.model.get('slug'), 'public');
            }
        }
    });
    //Pizza collection view
    EntityViews.PizzaView = Marionette.CollectionView.extend({
        className: 'all-pizza sectionBox',
        childView: EntityViews.PizzaItemView
    });
    //Courses collection view
    EntityViews.CoursesView = Marionette.CollectionView.extend({
        className: 'all-courses sectionBox',
        childView: EntityViews.CourseItemView
    });
    //Course header view
    EntityViews.CourseHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'courseHeaderTemplate',
        events: {
            'click .header-now': 'doNothing',
            'click .header-back.header-home': 'showPublicCourses',
            'click .header-back.header-drafts': 'showDraftCourses',
            'click .header-back.header-archived': 'showArchivedCourses',
            'click .header-back.header-course': 'showCourseBlocks',
            'click .header-back.header-container': 'showContainerBlocks',
            'click .js-edit-course': 'showEditCourseOverlay',
            'click .js-add-members': 'showCourseMembersOverlay',
            'click .js-add-block': 'showNewBlockOverlay',
            'click .js-add-badges': 'showCourseBadgesOverlay',
            'click .js-show-insights': 'showBasicInsightsOverlay',
            'click .js-request-access': 'requestAccessToCourse',
            'click .js-remove-request': 'removeRequest',
            'click .js-add-cohort': 'showNewCohortOverlay',
            'click .js-minimap': 'showCourseMinimap'
        },
        doNothing: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
        },
        showPublicCourses: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            //Close sidebar
            ProjectManager.commands.execute('close:sidebar');
            ProjectManager.vent.trigger('courses:show', 'public');
        },
        showDraftCourses: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            //Close sidebar
            ProjectManager.commands.execute('close:sidebar');
            ProjectManager.vent.trigger('courses:show', 'drafts');
        },
        showArchivedCourses: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            //Close sidebar
            ProjectManager.commands.execute('close:sidebar');
            ProjectManager.vent.trigger('courses:show', 'archived');
        },
        showCourseBlocks: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            $target.nextAll().remove();
            $target.removeClass('header-back').addClass('header-now');
            //Show blocks
            ProjectManager.vent.trigger('blocks:show', this.model.get('_id'));
        },
        showContainerBlocks: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            var container_id = $target.data('id');
            var container_title = $target.html();
            $target.nextAll().remove();
            $target.prev().prev().removeClass('header-back').addClass('header-now');
            $target.prev().remove();
            $target.remove();
            //Show blocks
            ProjectManager.vent.trigger('blocks:show', this.model.get('_id'), container_id, container_title);
        },
        showEditCourseOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('editCourseOverlay:show', this.model.get('_id'));
        },
        showCourseMembersOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('courseMembersOverlay:show', this.model.get('_id'));
        },
        showNewBlockOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('newBlockOverlay:show', 1);
        },
        showCourseBadgesOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('courseBadgesOverlay:show', this.model.get('_id'));
        },
        showBasicInsightsOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('basicInsightOverlay:show', this.model.get('_id'));
        },
        requestAccessToCourse: function(ev){
            ev.preventDefault();
            this.trigger('join:course', this.model.get('_id'));
        },
        removeRequest: function(ev){
            ev.preventDefault();
            this.trigger('unjoin:course', this.model.get('_id'));
        },
        showNewCohortOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('newCohortOverlay:show', this.model.get('_id'));
        },
        showCourseMinimap: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            if($target.hasClass('is-active')){
                $target.removeClass('is-active');
                ProjectManager.commands.execute('close:sidebar');
            } else {
                $target.addClass('is-active');
                ProjectManager.vent.trigger('courseMinimap:show', this.model.get('_id'), 1);
            }
        }
    });
    //Member item view
    EntityViews.MemberItemView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'person',
        template: 'memberOneTemplate',
        events: {
            'click .add-user': 'addUser',
            'click .change-permit': 'updatePrivileges',
            'click .remove-user': 'removeUser'
        },
        addUser: function(){
            var value = {
                user_id: this.model.get('user')._id
            }
            this.trigger('add:user', value);
        },
        updatePrivileges: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                user_id: this.model.get('user')._id
            }
            //Check
            if($target.hasClass('selected')){
                value.permit_val = 'active';
                if(confirm("Are you sure you want to remove extra privileges from "+this.model.get('user').name+"?")){
                    this.trigger('update:privilege', value);
                }
            } else if($target.hasClass('js-permit-moderator')){
                value.permit_val = 'moderator';
                if(confirm("Are you sure you want to make "+this.model.get('user').name+" moderator of this course?")){
                    this.trigger('update:privilege', value);
                }
            } else if($target.hasClass('js-permit-teacher')){
                value.permit_val = 'teacher';
                if(confirm("Are you sure you want to make "+this.model.get('user').name+" teacher of this course?")){
                    this.trigger('update:privilege', value);
                }
            }
        },
        removeUser: function(){
            if(this.model.get('user')){
                var value = {
                    user_id: this.model.get('user')._id,
                    exclude_email: this.model.get('user').email
                }
            } else {
                var value = {
                    email: this.model.get('email')
                }
            }
            this.trigger('remove:user', value);
        }
    });
    //Course members view
    EntityViews.CourseMembersView = Marionette.CompositeView.extend({
        template: 'courseMembersTemplate',
        childView: EntityViews.MemberItemView,
        childViewContainer: 'div.member-list',
        initialize: function(){
            //Get members
            var members = this.model.get('members');
            this.collection = new Backbone.Collection(members);
        },
        events: {
            'click .js-close, .js-done': 'closeOverlay',
            'keydown .collab-input': 'addMembers'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        addMembers: function(ev){
            ev.stopPropagation();
            var $target = $(ev.target);
            if(ev.keyCode == ENTER_KEY && !ev.shiftKey && $target.val().trim()){
                ev.preventDefault();
                var value = {
                    emails: $target.val().replace(/\s+/g, '')
                }
                this.trigger('add:members', value);
            } else {
                return;
            }
        }
    });
    //One badge view
    EntityViews.BadgeItemView = Marionette.ItemView.extend({
        tagName: 'span',
        className: 'one-badge',
        template: 'badgeOneTemplate',
        events: {
            'click': 'removeBadge'
        },
        removeBadge: function(ev){
            ev.preventDefault();
            this.trigger('remove:badge', this.model);
        }
    });
    //Badges view
    EntityViews.BadgesView = Marionette.CollectionView.extend({
        childView: EntityViews.BadgeItemView,
        filter: function(child, index, collection){
            return !child.get('is_skill');
        }
    });
    //Skills view
    EntityViews.SkillsView = Marionette.CollectionView.extend({
        childView: EntityViews.BadgeItemView,
        filter: function(child, index, collection){
            return child.get('is_skill');
        }
    });
    //Course badges view
    EntityViews.CourseBadgesView = Marionette.LayoutView.extend({
        template: 'courseBadgesTemplate',
        regions: {
            badges: '.badge-list',
            skills: '.skill-list'
        },
        events: {
            'click .js-close': 'closeOverlay',
            'click #drop-badge': 'openFileBrowser',
            'click .file-input': 'doNothing',
            'click .js-save-badge:not(.u-disabled)': 'saveBadge'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        openFileBrowser: function(ev){
            this.$('#drop-badge .file-input').click();
        },
        doNothing: function(ev){
            ev.stopPropagation();
        },
        saveBadge: function(ev){
            ev.preventDefault();
            if(!this.$('.badge-title').val().trim()) return;
            var value = {
                title: this.$('.badge-title').val().trim()
            }
            //Check if skill
            if(this.$('.skill-label input').is(':checked')){
                value.is_skill = true;
            } else {
                value.is_skill = false;
            }
            this.trigger('save:badge', value);
        }
    });
    //Basic insight view
    EntityViews.BasicInsightView = Marionette.ItemView.extend({
        template: 'basicInsightTemplate',
        events: {
            'click .js-close, .js-done': 'closeOverlay',
            'click .js-show-users': 'showUsersInsightOverlay'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        showUsersInsightOverlay: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            $target.html('Loading users. Please wait...');
            ProjectManager.vent.trigger('usersInsightOverlay:show', $target.data('course'));
        }
    });
    //Insight User item view
    EntityViews.InsightUserItemView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'insight-row',
        template: 'insightUserItemTemplate',
        initialize: function(){
            this.$el.attr('data-id', this.model.get('_id'));
        },
        events: {
            'click .name': 'showUserResponsesInsightOverlay'
        },
        showUserResponsesInsightOverlay: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            $('.js-total-users').html('Loading user responses. Please wait...');
            ProjectManager.vent.trigger('userResponsesInsightOverlay:show', $('.js-total-users').data('course'), this.model.get('_id'));
        }
    });
    //Users insight view
    EntityViews.UsersInsightView = Marionette.CompositeView.extend({
        template: 'usersInsightTemplate',
        childView: EntityViews.InsightUserItemView,
        childViewContainer: 'div.overlay-table',
        initialize: function(){
            //Get users
            var users = this.model.get('users');
            this.collection = new Backbone.Collection(users);
        },
        events: {
            'click .js-close': 'closeOverlay',
            'click .js-back': 'showBasicInsightsOverlay',
            'click .js-download': 'downloadUsers'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        showBasicInsightsOverlay: function(ev){
            ev.preventDefault();
            this.$('.js-total-users').html('Loading. Please wait...');
            ProjectManager.vent.trigger('basicInsightOverlay:show', this.model.get('_id'));
        },
        downloadUsers: function(ev){
            ev.preventDefault();
            this.trigger('download:users');
        }
    });
    //Insight response item view
    EntityViews.InsightResponseItemView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'insight-row',
        template: 'insightResponseItemTemplate'
    });
    //User responses insight view
    EntityViews.UserResponsesInsightView = Marionette.CompositeView.extend({
        template: 'userResponsesInsightTemplate',
        childView: EntityViews.InsightResponseItemView,
        childViewContainer: 'div.overlay-table',
        initialize: function(){
            //Get blocks
            var blocks = this.model.get('blocks');
            this.collection = new Backbone.Collection(blocks);
        },
        events: {
            'click .js-close': 'closeOverlay',
            'click .js-back': 'goBack',
            'click .js-show-comments': 'showUserCommentsInsightOverlay',
            'click .js-download': 'downloadResponses',
            'click .js-message': 'sendMessage'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        goBack: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            if(this.$('.overlay-box').hasClass('my-insight')){
                //Show enrolled courses
                this.$('.js-show-comments').html('Loading enrolled courses. Please wait...');
                ProjectManager.vent.trigger('enrolledCourseOverlay:show');
            } else {
                //Show users insight
                this.$('.js-show-comments').html('Loading users. Please wait...');
                ProjectManager.vent.trigger('usersInsightOverlay:show', this.$('.js-show-comments').data('course'));
            }
        },
        showUserCommentsInsightOverlay: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if(this.$('.overlay-box').hasClass('my-insight')){
                $target.html('Loading your comments. Please wait...');
                ProjectManager.vent.trigger('userCommentsInsightOverlay:show', $target.data('course'), $target.data('user'), 'my');
            } else {
                $target.html('Loading user comments. Please wait...');
                ProjectManager.vent.trigger('userCommentsInsightOverlay:show', $target.data('course'), $target.data('user'));
            }
        },
        downloadResponses: function(ev){
            ev.preventDefault();
            this.trigger('download:responses');
        },
        sendMessage: function(ev){
            ev.preventDefault();
            var value = {
                user: this.model.get('user')._id
            }
            this.trigger('save:message', value);
        }
    });
    //Insight comment item view
    EntityViews.InsightCommentItemView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'insight-row',
        template: 'insightCommentItemTemplate'
    });
    //User comments insight view
    EntityViews.UserCommentsInsightView = Marionette.CompositeView.extend({
        template: 'userCommentsInsightTemplate',
        childView: EntityViews.InsightCommentItemView,
        childViewContainer: 'div.overlay-table',
        initialize: function(){
            //Get blocks
            var blocks = this.model.get('blocks');
            this.collection = new Backbone.Collection(blocks);
        },
        events: {
            'click .js-close': 'closeOverlay',
            'click .js-back': 'showUserResponsesInsightOverlay',
            'click .js-download': 'downloadComments',
            'click .js-message': 'sendMessage'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        showUserResponsesInsightOverlay: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if(this.$('.overlay-box').hasClass('my-insight')){
                this.$('.js-user-comments').html('Loading your responses. Please wait...');
                ProjectManager.vent.trigger('userResponsesInsightOverlay:show', $('.js-user-comments').data('course'), $('.js-user-comments').data('user'), 'my');
            } else {
                this.$('.js-user-comments').html('Loading user responses. Please wait...');
                ProjectManager.vent.trigger('userResponsesInsightOverlay:show', $('.js-user-comments').data('course'), $('.js-user-comments').data('user'));
            }
        },
        downloadComments: function(ev){
            ev.preventDefault();
            this.trigger('download:comments');
        },
        sendMessage: function(ev){
            ev.preventDefault();
            var value = {
                user: this.model.get('user')._id
            }
            this.trigger('save:message', value);
        }
    });
    //Minimap block item view
    EntityViews.MinimapBlockItemView = Marionette.CompositeView.extend({
        className: 'one-m-block',
        template: 'minimapBlockTemplate',
        childViewContainer: 'div.child-blocks',
        initialize: function(){
            var children = this.model.get('children');
            this.collection = new Backbone.Collection(children);
            //If container
            if(this.model.get('type') == 'container'){
                this.$el.addClass('is-container');
            }
            //Is hidden
            if(this.model.get('is_hidden')){
                this.$el.addClass('is-hidden');
            }
            //Id
            this.$el.attr('data-id', this.model.get('_id'));
            this.$el.attr('data-type', this.model.get('type'));
            //Order
            this.$el.attr('data-order', this.model.get('order'));
            this.$el.attr('title', this.model.get('order'));
        },
        events: {
            'click .minimap-btn .icon': 'toggleChildBlocks',
            'click .minimap-btn .title': 'showBlock'
        },
        toggleChildBlocks: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            $target.parent().toggleClass('is-collapsed');
            $target.parent().next().toggleClass('u-hide');
        },
        showBlock: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.parent().parent().data('type') == 'container'){
                if($('.header-seperator').length > 1){
                    $('.header-seperator:last').remove();
                    $('.header-now:last').remove();
                }
                ProjectManager.vent.trigger('blocks:show', this.model.get('course'), $target.parent().parent().data('id'), $target.text());
            } else {
                ProjectManager.vent.trigger('editBlockOverlay:show', this.model.get('_id'));
            }
        }
    });
    //Minimap blocks view
    EntityViews.MinimapBlocksView = Marionette.CompositeView.extend({
        template: 'minimapTemplate',
        childView: EntityViews.MinimapBlockItemView,
        childViewContainer: 'div.minimap-blocks',
        initialize: function(){
            //Get blocks
            var blocks = this.model.get('blocks');
            this.collection = new Backbone.Collection(blocks);
        }
    });
    //New block view
    EntityViews.NewBlockView = Marionette.ItemView.extend({
        template: 'newBlockTemplate',
        events: {
            'click .js-close, .js-done': 'closeOverlay',
            'click .toolbar-btn': 'showBlockArea',
            'click .block-divider .select-label': 'selectDividerLabel',
            'input .link-embed': 'showPreviewLink',
            'click .link-add': 'embedLink',
            'click .one-shot': 'selectImage',
            'click #drop-file': 'openFileBrowser',
            'click #drop-container': 'openContainerBrowser',
            'click #option-image': 'openOptionBrowser',
            'click #option-image-left': 'openOptionLeftBrowser',
            'click #option-image-right': 'openOptionRightBrowser',
            'click #drop-comic': 'openComicBrowser',
            'click #list-image': 'openListBrowser',
            'click #grid-image': 'openGridBrowser',
            'click .file-input': 'doNothing',
            'input .search-gifs': 'findGIFResults',
            'click .one-gif': 'saveGIFBlock',
            'click .js-save-toggle-item': 'saveToggleItem',
            'click .one-toggle-item .item-title': 'toggleItem',
            'click .one-toggle-item .remove-item': 'removeToggleItem',
            'click .js-save-mcq-item': 'saveMCQOption',
            'click .one-mcq-item .correct-item': 'correctMCQOption',
            'click .one-mcq-item .remove-item': 'removeMCQOption',
            'click .js-save-fill-item': 'addFill',
            'click .one-fill-item .update-item': 'updateFill',
            'click .one-fill-item .remove-item': 'removeFill',
            'click .js-save-match-item': 'saveMatchItem',
            'click .js-save-list-item': 'saveListItem',
            'click .one-list-item .remove-item': 'removeListItem',
            'click .js-save-grid-item': 'saveGridItem',
            'click .one-grid-item .remove-item': 'removeGridItem',
            'click .js-update-order': 'updateOrder',
            'click .js-required': 'markAsRequired',
            'click .js-hide-learner': 'hideFromLearners',
            'click .js-save-block': 'saveBlock',
            'click .js-delete-block': 'deleteBlock'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        showBlockArea: function(ev){
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')) return;
            //Select btn
            this.$('.toolbar-btns .toolbar-btn').removeClass('selected');
            $target.addClass('selected');
            //Hide area
            this.$('.new-block-area .block-area').addClass('u-hide');
            //Remove saved data
            this.$('.js-save-toggle-item').removeData('block');
            //Show area
            if($target.hasClass('btn-text')){
                this.$('.new-block-area .block-text').removeClass('u-hide');
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-button')){
                this.$('.new-block-area .block-button').removeClass('u-hide');
                this.$('.block-button-text').focus();
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-divider')){
                this.$('.new-block-area .block-divider').removeClass('u-hide');
                this.$('.block-divider-text').focus();
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-toggle-list')){
                this.$('.new-block-area .block-toggle-list').removeClass('u-hide');
                this.$('.block-toggle-title').focus();
                //Hide save block
                this.$('.js-save-block').addClass('u-hide');
                this.$('.js-done').removeClass('u-hide');
            } else if($target.hasClass('btn-image') || $target.hasClass('btn-video') || $target.hasClass('btn-audio') || $target.hasClass('btn-file')){
                this.$('.new-block-area .block-file').removeClass('u-hide');
                this.$('.block-file-title').focus();
                //Trigger file browser
                if($target.hasClass('btn-image')){
                    this.trigger('open:fileBrowser', 'image');
                } else if($target.hasClass('btn-video')){
                    this.trigger('open:fileBrowser', 'video');
                } else if($target.hasClass('btn-audio')){
                    this.trigger('open:fileBrowser', 'audio');
                } else if($target.hasClass('btn-file')){
                    this.trigger('open:fileBrowser', 'file');
                }
                //Hide save block
                this.$('.js-save-block').addClass('u-hide');
                this.$('.js-done').removeClass('u-hide');
            } else if($target.hasClass('btn-link')){
                this.$('.new-block-area .block-link').removeClass('u-hide');
                this.$('.link-embed').focus();
                //Hide save block
                this.$('.js-save-block').addClass('u-hide');
                this.$('.js-done').removeClass('u-hide');
            } else if($target.hasClass('btn-gif')){
                this.$('.new-block-area .block-gif').removeClass('u-hide');
                this.$('.search-gifs').focus();
                //Hide save block
                this.$('.js-save-block').addClass('u-hide');
                this.$('.js-done').removeClass('u-hide');
            } else if($target.hasClass('btn-mcq')){
                this.$('.new-block-area .block-mcq').removeClass('u-hide');
                this.$('.block-mcq-title').focus();
                this.trigger('open:mcqFileBrowser');
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-fill')){
                this.$('.new-block-area .block-fill').removeClass('u-hide');
                this.$('.block-fill-title').focus();
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-match')){
                this.$('.new-block-area .block-match').removeClass('u-hide');
                this.$('.block-match-title').focus();
                this.trigger('open:matchFileBrowser');
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-response-text') || $target.hasClass('btn-response-audio') || $target.hasClass('btn-response-video') || $target.hasClass('btn-response-canvas') || $target.hasClass('btn-response-file')){
                this.$('.new-block-area .block-response').removeClass('u-hide');
                this.$('.block-response-title').focus();
                //Show keywords if text response
                if($target.hasClass('btn-response-text')){
                    this.$('.new-block-area .block-response .overlay-label').removeClass('u-hide');
                    this.$('.new-block-area .block-response .block-response-keywords').removeClass('u-hide');
                } else {
                    this.$('.new-block-area .block-response .overlay-label').addClass('u-hide');
                    this.$('.new-block-area .block-response .block-response-keywords').addClass('u-hide');
                }
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-list')){
                this.$('.new-block-area .block-list').removeClass('u-hide');
                this.$('.block-list-title').focus();
                this.trigger('open:listFileBrowser');
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-container')){
                this.$('.new-block-area .block-container').removeClass('u-hide');
                this.$('.block-container-title').focus();
                this.trigger('open:containerFileBrowser');
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-grid')){
                this.$('.new-block-area .block-grid').removeClass('u-hide');
                this.$('.block-grid-title').focus();
                this.trigger('open:gridFileBrowser');
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-comic')){
                this.$('.new-block-area .block-comic').removeClass('u-hide');
                this.$('.block-comic-text').focus();
                this.trigger('open:comicFileBrowser');
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            } else if($target.hasClass('btn-embed')){
                this.$('.new-block-area .block-embed').removeClass('u-hide');
                this.$('.block-embed-code').focus();
                //Show save block
                this.$('.js-save-block').removeClass('u-hide');
                this.$('.js-done').addClass('u-hide');
            }
        },
        selectDividerLabel: function(ev){
            var $target = $(ev.currentTarget);
            this.$('.block-divider .select-label').removeClass('selected');
            $target.addClass('selected');
        },
        showPreviewLink: function(ev){
            var url = this.$('.link-embed').val().trim();
            if(validator.isURL(url)){
                this.$('.link-add').removeClass('u-hide');
            } else {
                this.$('.link-add').addClass('u-hide');
            }
        },
        embedLink: function(ev){
            var url = this.$('.link-embed').val().trim();
            //Disable input
            this.$('.link-embed').prop('disabled', true);
            this.$('.link-add').text('Loading...');
            //Get Preview
            var _this = this;
            var fetchingLinkpreview = ProjectManager.request('linkPreview:entity', url);
            $.when(fetchingLinkpreview).done(function(data){
                //Save link data
                linkEmbedData = data;
                //Hide preview button
                _this.$('.link-add').text('Preview link').addClass('u-hide');
                //Show Preview
                _this.$('.block-link .overlay-label').removeClass('u-hide');
                _this.$('.link-preview').show();
                _this.$('.preview-title').text(data.get('title'));
                _this.$('.preview-provider a').attr('href', data.get('url')).text(data.get('provider_name'));
                //Show shots
                if(data.get('images') && data.get('images').length){
                    for(var i=0; i<data.get('images').length; i++){
                        //Get image with http protocol
                        var imageUrl = data.get('images')[i].url.replace(/^https:\/\//i, 'http://');
                        //Show only images which are large
                        if(data.get('images')[i].width > 200 && data.get('images')[i].height > 100){
                            _this.$('.preview-shots').append("<div class='one-shot last'></div>");
                            _this.$('.preview-shots .one-shot.last').css('background-image', 'url("' + imageUrl + '")').removeClass('last');
                        }
                    }
                    //Show shots and desc
                    if(_this.$('.preview-shots > div').length){
                        _this.$('.preview-shots > div').eq(0).addClass('selected');
                        _this.$('.preview-shots').show();
                    } else {
                        _this.$('.preview-desc').text(data.get('description'));
                    }
                }
                //Show save button
                _this.$('.js-done').addClass('u-hide');
                _this.$('.js-save-block').removeClass('u-hide');
            });
        },
        selectImage: function(ev){
            var $target = $(ev.currentTarget);
            this.$('.preview-shots .one-shot').removeClass('selected');
            $target.addClass('selected');
        },
        openFileBrowser: function(ev){
            this.$('.block-file .file-input').click();
        },
        openContainerBrowser: function(ev){
            this.$('.block-container .file-input').click();
        },
        openOptionBrowser: function(ev){
            this.$('.block-mcq .file-input').click();
        },
        openOptionLeftBrowser: function(ev){
            this.$('.block-match .options-left .file-input').click();
        },
        openOptionRightBrowser: function(ev){
            this.$('.block-match .options-right .file-input').click();
        },
        openComicBrowser: function(ev){
            this.$('.block-comic .file-input').click();
        },
        openListBrowser: function(ev){
            this.$('.block-list .file-input').click();
        },
        openGridBrowser: function(ev){
            this.$('.block-grid .file-input').click();
        },
        doNothing: function(ev){
            ev.stopPropagation();
        },
        findGIFResults: function(ev){
            var text = this.$('.search-gifs').val().trim();
            var _this = this;
            if(!text){
                if(findTimer){
                    clearTimeout(findTimer);
                    findTimer = null;
                }
                //Hide loading bar and empty results
                this.$('.block-gif .throbber-loader').addClass('u-hide');
                this.$('.block-gif .overlay-label').addClass('u-hide');
                this.$('.gif-results').html('');
            } else {
                clearTimeout(findTimer);
                findTimer = null;
                findTimer = setTimeout(function(){
                    //Show loading bar
                    _this.$('.block-gif .throbber-loader').removeClass('u-hide');
                    //Find gifs
                    var fetchingGIFResults = ProjectManager.request('search:entities', 'gifs', text);
                    $.when(fetchingGIFResults).done(function(results){
                        var attrs = results.attributes.data;
                        //Save results data
                        resultsData = attrs;
                        _this.$('.block-gif .throbber-loader').addClass('u-hide');
                        _this.$('.block-gif .overlay-label').removeClass('u-hide');
                        _this.$('.gif-results').html('').show();
                        for(var i=0; i<10; i++){
                            var data = attrs[i];
                            if(!data) break;
                            var image = data.images.fixed_height.url;
                            var width = parseInt(data.images.fixed_height.width) + 4;
                            width = width + 'px';
                            _this.$('.gif-results').append("<div class='one-gif' style='width:"+width+"'><img src='"+image+"'></div>");
                        }
                    });
                }, 500);
            }
        },
        saveGIFBlock: function(ev){
            var $target = $(ev.currentTarget);
            var index = $target.index();
            var data = resultsData[index];
            var value = {
                type: 'gif',
                gif_url: data.url,
                gif_embed: data.images.original.mp4,
                width: data.images.original.width,
                height: data.images.original.height
            }
            //Course id
            value.course = $('.mainHeader .header-title').data('id');
            //Container id
            if($('.mainHeader .header-container.header-now').data('id')){
                value.container = $('.mainHeader .header-container.header-now').data('id');
            }
            //Save
            this.trigger('save:block', value);
        },
        saveToggleItem: function(ev){
            //Save block or add new item
            if(this.$('.js-save-toggle-item').data('block')){
                var value = {
                    title: this.$('.block-toggle-title').val().trim(),
                    text: this.$('.block-toggle-text').val().trim(),
                    block: this.$('.js-save-toggle-item').data('block')
                }
                this.trigger('add:toggleItem', value);
            } else {
                //Toggle list
                var value = {
                    type: 'toggle_list',
                    title: this.$('.block-toggle-title').val().trim(),
                    text: this.$('.block-toggle-text').val().trim()
                }
                //Course id
                value.course = $('.mainHeader .header-title').data('id');
                //Container id
                if($('.mainHeader .header-container.header-now').data('id')){
                    value.container = $('.mainHeader .header-container.header-now').data('id');
                }
                //Save
                this.trigger('save:block', value);
            }
        },
        toggleItem: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            if($target.parent().hasClass('selected')){
                $target.parent().removeClass('selected');
            } else {
                this.$('.one-toggle-item').removeClass('selected');
                $target.parent().addClass('selected');
            }
        },
        removeToggleItem: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                block: this.$('.js-save-toggle-item').data('block'),
                item: $target.parent().data('id')
            }
            this.trigger('remove:toggleItem', value);
            //Remove
            $target.parent().remove();
        },
        saveMCQOption: function(ev){
            var value = {
                text: this.$('.mcq-new-option .option-text').val().trim(),
                block: this.$('.js-save-mcq-item').data('block')
            }
            this.trigger('add:mcqOption', value);
        },
        correctMCQOption: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                block: this.$('.js-save-mcq-item').data('block'),
                option: $target.parent().data('id')
            }
            //Is correct
            if($target.hasClass('selected')){
                value.is_correct = false;
            } else {
                value.is_correct = true;
            }
            this.trigger('correct:mcqOption', value);
        },
        removeMCQOption: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                block: this.$('.js-save-mcq-item').data('block'),
                option: $target.parent().data('id')
            }
            this.trigger('remove:mcqOption', value);
            //Remove
            $target.parent().remove();
        },
        addFill: function(ev){
            if(this.$('.fill-text').val().trim()){
                var value = {
                    block: this.$('.js-save-fill-item').data('block'),
                    text: this.$('.fill-text').val().trim()
                }
            } else {
                var value = {
                    block: this.$('.js-save-fill-item').data('block'),
                    is_blank: true,
                    size: this.$('.fill-size').val()
                }
            }
            this.trigger('add:fill', value);
        },
        updateFill: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                block: this.$('.js-save-fill-item').data('block'),
                keywords: $target.prev().val().trim(),
                fill: $target.parent().data('id')
            }
            this.trigger('update:fill', value);
        },
        removeFill: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                block: this.$('.js-save-fill-item').data('block'),
                fill: $target.parent().data('id')
            }
            this.trigger('remove:fill', value);
            //Remove
            $target.parent().remove();
        },
        saveMatchItem: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            if($target.parent().hasClass('options-left')){
                if(!this.$('.option-text-left').val().trim()) return;
                var value = {
                    block: this.$('.js-save-match-item').data('block'),
                    text: this.$('.option-text-left').val().trim()
                }
            } else {
                if(!this.$('.option-text-right').val().trim()) return;
                var value = {
                    block: this.$('.js-save-match-item').data('block'),
                    text: this.$('.option-text-right').val().trim(),
                    is_optionb: true
                }
            }
            this.trigger('add:matchOption', value);
        },
        saveListItem: function(ev){
            var value = {
                text: this.$('.list-new-item .list-item-text').val().trim(),
                block: this.$('.js-save-list-item').data('block')
            }
            //Item type
            if(this.$('.list-new-item .list-item-text').val().trim()){
                value.item_type = 'text';
            } else {
                value.item_type = 'response';
            }
            //Check if is_right
            if(this.$('.isright-label input').is(':checked')){
                value.is_right = true;
            } else {
                value.is_right = false;
            }
            this.trigger('add:listItem', value);
        },
        removeListItem: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                block: this.$('.js-save-list-item').data('block'),
                item: $target.parent().data('id')
            }
            this.trigger('remove:listItem', value);
            //Remove
            $target.parent().remove();
        },
        saveGridItem: function(ev){
            var value = {
                text: this.$('.grid-new-item .grid-item-text').val().trim(),
                block: this.$('.js-save-grid-item').data('block')
            }
            this.trigger('add:gridItem', value);
        },
        removeGridItem: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                block: this.$('.js-save-grid-item').data('block'),
                item: $target.parent().data('id')
            }
            this.trigger('remove:gridItem', value);
            //Remove
            $target.parent().remove();
        },
        updateOrder: function(ev){
            ev.preventDefault();
            if(!this.$('.block-order').val().trim()) return;
            var order = parseInt(this.$('.block-order').val().trim());
            if(!order) return;
            this.trigger('update:order', order);
        },
        markAsRequired: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                var value = {
                    is_required: false
                }
                $target.removeClass('selected').text('Mark as required');
            } else {
                var value = {
                    is_required: true
                }
                $target.addClass('selected').text('Required*');
            }
            this.trigger('update:block', value);
        },
        hideFromLearners: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                var value = {
                    is_hidden: false
                }
                $target.removeClass('selected').text('Hide from learners');
            } else {
                var value = {
                    is_hidden: true
                }
                $target.addClass('selected').text('Hidden from learners');
            }
            this.trigger('update:block', value);
        },
        saveBlock: function(ev){
            ev.preventDefault();
            if(this.$('.toolbar-btn.btn-text').hasClass('selected')){
                //Text
                var value = {
                    type: 'text'
                }
            } else if(this.$('.toolbar-btn.btn-button').hasClass('selected')){
                //Button
                var value = {
                    type: 'button',
                    text: this.$('.block-button-text').val().trim(),
                    button_url: this.$('.block-button-url').val().trim(),
                    button_block: this.$('.block-button-number').val().trim(),
                }
                //Check if is_new_tab
                if(this.$('.newtab-label input').is(':checked')){
                    value.is_new_tab = true;
                } else {
                    value.is_new_tab = false;
                }
            } else if(this.$('.toolbar-btn.btn-divider').hasClass('selected')){
                //Divider
                var value = {
                    type: 'divider',
                    text: this.$('.block-divider-text').val().trim(),
                    divider_time: this.$('.block-divider-time').val().trim()
                }
                //Get divider_type and name
                if(this.$('.block-divider .select-label.selected').parent().hasClass('select-animation')){
                    value.divider_type = 'animation';
                    value.divider_name = this.$('.block-divider .select-label.selected').text().toLowerCase();
                } else if($('.block-divider .select-label.selected').parent().hasClass('select-music')){
                    value.divider_type = 'music';
                    value.divider_name = this.$('.block-divider .select-label.selected').text().toLowerCase();
                }
            } else if(this.$('.toolbar-btn.btn-link').hasClass('selected')){
                //Link
                if(!linkEmbedData) return;
                //Selected image
                if(this.$('.one-shot.selected').length){
                    var image = this.$('.one-shot.selected').css('background-image').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                }
                var value = {
                    type: 'link',
                    linkdata: linkEmbedData,
                    image: image
                }
                linkEmbedData = '';
            } else if(this.$('.toolbar-btn.btn-mcq').hasClass('selected')){
                //MCQ
                var value = {
                    type: 'mcq',
                    title: this.$('.block-mcq-title').val().trim()
                }
                //Check if is_multiple
                if(this.$('.is-multiple-label input').is(':checked')){
                    value.is_multiple = true;
                } else {
                    value.is_multiple = false;
                }
            } else if(this.$('.toolbar-btn.btn-fill').hasClass('selected')){
                //Fill in the blanks
                var value = {
                    type: 'fill',
                    title: this.$('.block-fill-title').val().trim(),
                    text: this.$('.block-fill-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-match').hasClass('selected')){
                //Match the following
                var value = {
                    type: 'match',
                    title: this.$('.block-match-title').val().trim(),
                    text: this.$('.block-match-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-response-text').hasClass('selected')){
                //Response text
                var value = {
                    type: 'response',
                    response_type: 'text',
                    title: this.$('.block-response-title').val().trim(),
                    text: this.$('.block-response-text').val().trim(),
                    keywords: this.$('.block-response-keywords').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-response-audio').hasClass('selected')){
                //Response audio
                var value = {
                    type: 'response',
                    response_type: 'audio',
                    title: this.$('.block-response-title').val().trim(),
                    text: this.$('.block-response-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-response-video').hasClass('selected')){
                //Response video
                var value = {
                    type: 'response',
                    response_type: 'video',
                    title: this.$('.block-response-title').val().trim(),
                    text: this.$('.block-response-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-response-canvas').hasClass('selected')){
                //Response canvas
                var value = {
                    type: 'response',
                    response_type: 'canvas',
                    title: this.$('.block-response-title').val().trim(),
                    text: this.$('.block-response-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-response-file').hasClass('selected')){
                //Response file
                var value = {
                    type: 'response',
                    response_type: 'file',
                    title: this.$('.block-response-title').val().trim(),
                    text: this.$('.block-response-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-list').hasClass('selected')){
                //List
                var value = {
                    type: 'list',
                    title: this.$('.block-list-title').val().trim(),
                    text: this.$('.block-list-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-container').hasClass('selected')){
                //Container
                var value = {
                    type: 'container',
                    title: this.$('.block-container-title').val().trim(),
                    text: this.$('.block-container-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-grid').hasClass('selected')){
                //Grid
                var value = {
                    type: 'grid',
                    title: this.$('.block-grid-title').val().trim(),
                    text: this.$('.block-grid-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-comic').hasClass('selected')){
                //Comic
                var value = {
                    type: 'comic',
                    text: this.$('.block-comic-text').val().trim()
                }
            } else if(this.$('.toolbar-btn.btn-embed').hasClass('selected')){
                //Embed
                var value = {
                    type: 'embed',
                    title: this.$('.block-embed-title').val().trim(),
                    embed_code: this.$('.block-embed-code').val().trim()
                }
                //Width
                if(this.$('.block-embed-width').val().trim()){
                    value.width = parseInt(this.$('.block-embed-width').val().trim());
                }
                //Height
                if(this.$('.block-embed-height').val().trim()){
                    value.height = parseInt(this.$('.block-embed-height').val().trim());
                }
            }
            //Save or Update
            if(this.$('.overlay-box').hasClass('edit-box')){
                if(this.$('.toolbar-btn.btn-text').hasClass('selected')){
                    var $target = $(ev.currentTarget);
                    if($target.hasClass('u-disabled')){
                        return;
                    } else {
                        this.trigger('update:htmlBlock', value);
                    }
                } else {
                    //Update file block
                    if(!this.$('.new-block-area .block-file').hasClass('u-hide')){
                        var value = {
                            title: this.$('.block-file-title').val().trim()
                        }
                    }
                    this.trigger('update:block', value);
                }
            } else {
                //Course id
                value.course = $('.mainHeader .header-title').data('id');
                //Container id
                if($('.mainHeader .header-container.header-now').data('id')){
                    value.container = $('.mainHeader .header-container.header-now').data('id');
                }
                //Save
                if(this.$('.toolbar-btn.btn-text').hasClass('selected')){
                    var $target = $(ev.currentTarget);
                    if($target.hasClass('u-disabled')){
                        return;
                    } else {
                        this.trigger('save:htmlBlock', value);
                    }
                } else {
                    this.trigger('save:block', value);
                }
            }
        },
        deleteBlock: function(ev){
            ev.preventDefault();
            if(confirm('Are you sure you want to permanently delete this block?')) {
                this.trigger('delete:block');
            }
        }
    });
    //One Block view
    EntityViews.BlockItemView = Marionette.ItemView.extend({
        className: 'one-block u-transparent',
        template: 'blockOneTemplate',
        initialize: function(){
            this.$el.attr('data-id', this.model.get('_id'));
            this.$el.attr('data-order', this.model.get('order'));
            //Theme and Size
            if(this.model.get('size')){
                var width = this.model.get('size').width;
                var margin = this.model.get('size').margin;
                if(margin){
                    this.$el.css({'width': 'calc('+ width +'% - '+ margin +'px)' });
                    this.$el.css({'margin-right': margin + 'px'});
                } else {
                    this.$el.css({'width': width + '%'});
                }
            } else {
                this.$el.width('100%');
            }
            if(this.model.get('theme')){
                this.$el.addClass(this.model.get('theme')).addClass('themed-block');
            }
            if(this.model.get('art') && this.model.get('art').m){
                this.$el.addClass('with-art');
            }
            //Comic
            if(this.model.get('type') == 'comic'){
                this.$el.addClass('is-comic');
            }
            //Divider
            if(this.model.get('type') == 'divider'){
                this.$el.addClass('is-divider');
            }
        },
        events: {
            'click .container-item-block': 'showContainerBlocks',
            'click .js-edit-block': 'editBlock',
            'click .js-edit-theme': 'editTheme',
            'click .js-discuss, .block-comment': 'showDiscussion',
            'click .js-show-responses': 'showResponses',
            'click .js-edit-ifttt': 'editIfttt',
            'click .js-add-block-below': 'openNewBlockOverlay',
            'click .divider-btn': 'playAnimation',
            'click .one-toggle-item .item-title': 'toggleItem',
            'click .mcq-block .block-option': 'selectMcqOption',
            'click .match-block .block-option': 'selectMatchOption',
            'click .match-block .block-options-right .one-color': 'unselectMatchOption',
            'click .js-fill-blanks': 'fillBlanks',
            'click .js-submit-response': 'addTextResponse',
            'click .remove-response': 'removeResponse',
            'click .file-response-drop': 'openFileBrowser',
            'click .file-input': 'doNothing'
        },
        showContainerBlocks: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('blocks:show', this.model.get('course'), this.model.get('_id'), this.model.get('title'));
        },
        editBlock: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('editBlockOverlay:show', this.model.get('_id'));
        },
        editTheme: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('blockThemeOverlay:show', this.model.get('_id'));
        },
        showDiscussion: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('discussionOverlay:show', this.model.get('_id'));
        },
        showResponses: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('responsesOverlay:show', this.model.get('_id'));
        },
        editIfttt: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('blockIftttOverlay:show', this.model.get('_id'));
        },
        openNewBlockOverlay: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var order = $target.parent().parent().data('order') + 1;
            ProjectManager.vent.trigger('newBlockOverlay:show', order);
        },
        playAnimation: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            ProjectManager.vent.trigger('animation:show', $target.data('name'));
        },
        toggleItem: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            if($target.parent().hasClass('selected')){
                $target.parent().removeClass('selected');
            } else {
                this.$('.one-toggle-item').removeClass('selected');
                $target.parent().addClass('selected');
            }
        },
        selectMcqOption: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            var value = {
                block_id: this.model.get('_id'),
                option_id: $target.data('id')
            }
            if($target.hasClass('selected')){
                $target.removeClass('selected');
                this.trigger('unselect:mcqOption', value);
            } else {
                if(!this.model.get('is_multiple')){
                    this.$('.mcq-block .block-option.selected').removeClass('selected');
                }
                $target.addClass('selected');
                this.trigger('select:mcqOption', value);
                //Show feedback if any
                if(this.model.get('feedbacks') && this.model.get('feedbacks').length){
                    for(var i=0; i<this.model.get('feedbacks').length; i++){
                        var feedback = this.model.get('feedbacks')[i];
                        var selected_options = feedback.selected_options;
                        var num = 0;
                        for(var j=0; j<selected_options.length; j++){
                            if(this.$(".mcq-block .block-option[data-id='" + selected_options[j] + "']").hasClass('selected')) num++;
                        }
                        if(selected_options.length == num && this.$('.mcq-block .block-option.selected').length == num){
                            //Show feedback
                            ProjectManager.vent.trigger('feedback:show', this.model.get('_id'), feedback._id);
                        }
                    }
                }
            }
        },
        selectMatchOption: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                $target.removeClass('selected prev-selected');
            } else {
                if($target.parent().hasClass('block-options-left')){
                    if(this.$('.match-block .block-option.prev-selected').length){
                        alert('Select something on the right side.')
                    } else {
                        if($target.find('.match-colors').length){
                            $target.addClass('prev-selected').addClass('selected');
                        } else {
                            var value = {
                                block_id: this.model.get('_id'),
                                option_id: $target.data('id')
                            }
                            $target.addClass('prev-selected').addClass('selected');
                            this.trigger('select:matchOption', value);
                        }
                    }
                } else {
                    if(!this.$('.match-block .block-option.prev-selected').length){
                        alert('Select something on the left side.')
                    } else {
                        var prev_option= this.$('.match-block .block-option.prev-selected');
                        var value = {
                            block_id: this.model.get('_id'),
                            option_id: $target.data('id'),
                            matched_to: prev_option.data('id')
                        }
                        prev_option.removeClass('prev-selected').removeClass('selected');
                        this.trigger('select:matchOption', value);
                    }
                }
            }
        },
        unselectMatchOption: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            var value = {
                block_id: this.model.get('_id'),
                option_id: $target.parent().parent().data('id'),
                matched_to: $target.data('id')
            }
            $target.remove();
            this.trigger('unselect:matchOption', value);
        },
        fillBlanks: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var fills = [];
            for(var i=0; i<this.$('.block-fills .blank-fill').length; i++){
                fills.push([this.$('.block-fills .blank-fill').eq(i).data('id'), this.$('.block-fills .blank-fill').eq(i).val()]);
            }
            var value = {
                block_id: this.model.get('_id'),
                fills: fills
            }
            this.trigger('fill:Blanks', value);
        },
        addTextResponse: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if(!this.$('.text-response').val().trim()) return;
            var value = {
                block_id: this.model.get('_id'),
                text: this.$('.text-response').val().trim()
            }
            //Create - Edit response
            if($target.hasClass('js-update-response')){
                this.trigger('update:textResponse', value);
            } else {
                this.trigger('add:textResponse', value);
            }
        },
        removeResponse: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var value = {
                block_id: this.model.get('_id')
            }
            this.trigger('remove:response', value);
        },
        openFileBrowser: function(ev){
            this.$('.file-response-drop .file-input').click();
        },
        doNothing: function(ev){
            ev.stopPropagation();
        }
    });
    //Empty blocks view
    EntityViews.EmptyBlocksView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'zero-items',
        template: 'emptyBlocksTemplate'
    });
    //Blocks collection view
    EntityViews.BlocksView = Marionette.CompositeView.extend({
        className: 'sectionBox',
        template: 'courseBlocksTemplate',
        childView: EntityViews.BlockItemView,
        childViewContainer: 'div.all-blocks',
        emptyView: EntityViews.EmptyBlocksView,
        events: {
            'click .js-start-course': 'addLearner',
            'click .js-mark-done': 'editLearnerProgress'
        },
        addLearner: function(ev){
            this.trigger('add:learner');
        },
        editLearnerProgress: function(ev){
            var $target = $(ev.currentTarget);
            if($target.hasClass('js-certified')){
                this.trigger('download:certificate');
            } else {
                this.trigger('edit:learnerProgress');
            }
        }
    });
    //Block theme view
    EntityViews.BlockThemeView = Marionette.ItemView.extend({
        template: 'blockThemeTemplate',
        events: {
            'click .js-close': 'closeOverlay',
            'click #drop-art': 'openFileBrowserForArt',
            'click .file-input': 'doNothing',
            'click .block-themes .one-theme': 'selectTheme',
            'click .js-remove-art': 'removeArt',
            'click .js-save-theme:not(.u-disabled)': 'saveTheme'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        openFileBrowserForArt: function(ev){
            this.$('#drop-art .file-input').click();
        },
        doNothing: function(ev){
            ev.stopPropagation();
        },
        selectTheme: function(ev){
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                $target.removeClass('selected');
            } else {
                this.$('.block-themes .one-theme').removeClass('selected');
                $target.addClass('selected');
            }
        },
        removeArt: function(ev){
            this.trigger('remove:art');
        },
        saveTheme: function(ev){
            ev.preventDefault();
            var value = {
                width: this.$('.block-width').val().trim(),
                margin: this.$('.block-margin').val().trim()
            }
            this.trigger('update:theme', value);
        }
    });
    //One comment view
    EntityViews.CommentItemView = Marionette.ItemView.extend({
        className: 'one-comment',
        template: 'commentOneTemplate',
        initialize: function(){
            this.$el.attr('data-id', this.model.get('_id'));
        },
        events:{
            'click .js-comment-respond': 'showReplyBox',
            'click .js-comment-like': 'toggleLike',
            'click .js-comment-actions .show-parent': 'showParentComment',
            'click .js-comment-actions .edit-btn:not(.uploading)': 'editComment',
            'click .js-comment-actions .delete-btn': 'deleteComment',
            'click .js-more-comment': 'showContextMenu',
            'click .js-context-comment .js-phrase': 'showKeyPhrase',
            'click .js-context-comment .js-syntax': 'showSyntax',
            'click .js-context-comment .js-entity': 'showEntity',
            'click .js-context-comment .js-language': 'showLanguage',
            'click .js-context-comment .js-translate': 'translateText',
            'click .js-comment-creator': 'sendMessage'
        },
        showReplyBox: function(ev){
            var $target = $(ev.currentTarget);
            if(this.$el.hasClass('selected-reply')){
                //Unselect comment
                this.$el.removeClass('selected-reply');
                //Append comment box
                var html = this.$('.new-comment').html();
                this.$('.new-comment').remove();
                $('.discussion-comments').prepend("<div class='new-comment rich-text'>"+html+"</div>");
                //Hide cancel btn
                $target.text('Reply');
                //Show editor
                this.trigger('show:editorForReply');
            } else {
                //Select comment
                $('.js-comment-respond').text('Reply');
                $('.discussion-comments .one-comment').removeClass('selected-reply');
                this.$el.addClass('selected-reply');
                //Append comment box
                var html = $('.discussion-comments .new-comment').html();
                $('.discussion-comments .new-comment').remove();
                this.$('.js-comment-respond').parent().before("<div class='new-comment rich-text'>"+html+"</div>");
                this.$('.new-comment').css('marginTop', '10px');
                //Show cancel btn
                $target.text('Cancel').show();
                //Show editor
                this.trigger('show:editorForReply');
            }
        },
        showParentComment: function(ev){
            ev.preventDefault();
            var comment = $(".one-comment[data-id='" + this.model.get('reply_to') + "']");
            //Show comments if hidden
            if(comment.parent().hasClass('u-hide')){
                comment.parent().removeClass('u-hide');
                comment.parent().prev().removeClass('is-collapsed');
            }
            //Scroll to comment
            $('.overlay').animate({scrollTop: comment.offset().top - $('.overlay-box').offset().top}, 800);
            //Highlight
            setTimeout(function(){
                comment.addClass('highlight');
            }, 700);
            setTimeout(function(){
                comment.removeClass('highlight');
            }, 2000);
        },
        toggleLike: function(ev){
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                var value = {
                    comment_id: this.model.get('_id'),
                    like_action: 'unlike'
                }
                $target.removeClass('selected');
            } else {
                 var value = {
                    comment_id: this.model.get('_id'),
                    like_action: 'like'
                }
                $target.addClass('selected');
            }
            this.trigger('toggle:like', value);
        },
        editComment: function(ev){
            ev.preventDefault();
            var $target = $(ev.target);
            if($target.hasClass('save-btn')){
                var value = {
                    comment_id: this.model.get('_id')
                }
                this.trigger('update:comment', value);
            } else {
                $('.selected-comment .cancel-btn').click();
                //Show save and cancel btn
                this.$el.addClass('selected-comment');
                $target.addClass('save-btn').text('Save');
                $target.parent().find('.delete-btn').addClass('cancel-btn').text('Cancel');
                //Show editor
                this.trigger('edit:comment');
            }
        },
        deleteComment: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('cancel-btn')){
                this.trigger('cancel:editComment');
            } else {
                var value = {
                    comment_id: this.model.get('_id'),
                    created_at: this.model.get('created_at')
                }
                if (confirm('Are you sure you want to delete this comment?')){
                    this.trigger('delete:comment', value);
                }
            }
        },
        showContextMenu: function(ev){
            ev.preventDefault();
            $('.context-menu:not(.js-context-comment)').hide();
            this.$('.js-context-comment').toggle();
        },
        showKeyPhrase: function(ev){
            ev.preventDefault();
            //Get text from html
            var comment_html = this.model.get('text');
            var tmp = document.createElement('div');
            tmp.innerHTML = comment_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Show keyphrase
                var value = {
                    text: [text]
                }
                this.trigger('show:keyphrase', value);
            }
        },
        showSyntax: function(ev){
            ev.preventDefault();
            //Get text from html
            var comment_html = this.model.get('text');
            var tmp = document.createElement('div');
            tmp.innerHTML = comment_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Show syntax
                var value = {
                    text: [text]
                }
                this.trigger('show:syntax', value);
            }
        },
        showEntity: function(ev){
            ev.preventDefault();
            //Get text from html
            var comment_html = this.model.get('text');
            var tmp = document.createElement('div');
            tmp.innerHTML = comment_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Show entity
                var value = {
                    text: [text]
                }
                this.trigger('show:entity', value);
            }
        },
        showLanguage: function(ev){
            ev.preventDefault();
            //Get text from html
            var comment_html = this.model.get('text');
            var tmp = document.createElement('div');
            tmp.innerHTML = comment_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Show language
                var value = {
                    text: [text]
                }
                this.trigger('show:language', value);
            }
        },
        translateText: function(ev){
            ev.preventDefault();
            //Get text from html
            var comment_html = this.model.get('text');
            var tmp = document.createElement('div');
            tmp.innerHTML = comment_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Translate text
                var value = {
                    text: text
                }
                this.trigger('translate:text', value);
            }
        },
        sendMessage: function(ev){
            ev.preventDefault();
            var value = {
                user: this.model.get('creator')._id
            }
            this.trigger('save:message', value);
        }
    });
    //Activity for each date
    EntityViews.CommentDateView = Marionette.CompositeView.extend({
        className: 'comment-date',
        template: 'commentDateTemplate',
        childView: EntityViews.CommentItemView,
        childViewContainer: 'div.date-comments',
        initialize: function(){
            var comments = this.model.get('comments');
            this.collection = new Backbone.Collection(comments);
        },
        events: {
            'click .date-value': 'toggleComments'
        },
        toggleComments: function(ev){
            var $target = $(ev.currentTarget);
            if($target.hasClass('is-collapsed')){
                this.$('.date-comments').removeClass('u-hide');
                $target.removeClass('is-collapsed');
            } else {
                this.$('.date-comments').addClass('u-hide');
                $target.addClass('is-collapsed');
            }
        }
    });
    //Discussion view
    EntityViews.DiscussionView = Marionette.CompositeView.extend({
        template: 'discussionTemplate',
        childView: EntityViews.CommentDateView,
        childViewContainer: 'div.all-comments',
        initialize: function(){
            var comments = this.model.get('comments');
            //Sort by new
            comments.sort(function(a,b){
                return new Date(b.created_at) - new Date(a.created_at);
            });
            //Get comments collection
            var comment_modals = [];
            for(var i=0; i<comments.length; i++){
                var comment = new ProjectManager.Entities.Comment(comments[i]);
                comment_modals.push(comment);
            }
            var comments_collection = new Backbone.Collection(comment_modals);
            //Group comments by date
            this.collection = groupCommentsByDate(comments_collection);
        },
        events: {
            'click .js-close': 'closeOverlay',
            'click .js-done': 'updateDiscussion',
            'click .js-add-comment:not(.uploading)': 'addNewComment',
            'click .js-wordcloud': 'showWordCloud',
            'click .js-sentiment': 'showSentimentChart',
            'click .js-emotion-tone': 'showEmotionToneChart',
            'click .js-emotion': 'showEmotionChart',
            'click .js-tone': 'showToneChart'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        updateDiscussion: function(ev){
            ev.preventDefault();
            var value = {};
            //Check moderation
            if(this.$('.moderation-label input').is(':checked')){
                value.is_restricted = true;
            } else {
                value.is_restricted = false;
            }
            //Check if comments are collapsed
            if(this.$('.collapsed-label input').is(':checked')){
                value.is_collapsed = true;
            } else {
                value.is_collapsed = false;
            }
            //Check publish
            if(this.$('.publish-label input').is(':checked')){
                value.has_discussion = true;
            } else {
                value.has_discussion = false;
            }
            this.trigger('update:discussion', value);
        },
        addNewComment: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            //Add comment
            var value = {
                reply_to: this.$('.one-comment.selected-reply').data('id')
            }
            this.trigger('add:comment', value);
        },
        showWordCloud: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get comments
                var comments = this.model.get('comments');
                if(comments && comments.length){
                    var comments_arr = [];
                    var time_arr = [];
                    for(var i=0; i<comments.length; i++){
                        var comment_html = comments[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = comment_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) comments_arr.push(text);
                    }
                    //Get sentiments
                    var value = {
                        type: 'keyphrase',
                        text: comments_arr
                    }
                    this.trigger('show:analysis', value);
                }
            }
        },
        showSentimentChart: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get comments
                var comments = this.model.get('comments');
                if(comments && comments.length){
                    var comments_arr = [];
                    var time_arr = [];
                    for(var i=0; i<comments.length; i++){
                        var comment_html = comments[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = comment_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) comments_arr.push(text);
                    }
                    //Get sentiments
                    var value = {
                        type: 'sentiment',
                        text: comments_arr
                    }
                    this.trigger('show:analysis', value);
                }
            }
        },
        showEmotionToneChart: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get comments
                var comments = this.model.get('comments');
                if(comments && comments.length){
                    var comments_arr = [];
                    var time_arr = [];
                    for(var i=0; i<comments.length; i++){
                        var comment_html = comments[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = comment_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) comments_arr.push(text);
                    }
                    //Get tones
                    var value = {
                        type: 'tone',
                        text: comments_arr,
                        subtype: 'emotiontone'
                    }
                    this.trigger('show:analysis', value);
                }
            }
        },
        showEmotionChart: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get comments
                var comments = this.model.get('comments');
                if(comments && comments.length){
                    var comments_arr = [];
                    var time_arr = [];
                    for(var i=0; i<comments.length; i++){
                        var comment_html = comments[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = comment_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) comments_arr.push(text);
                    }
                    //Get tones
                    var value = {
                        type: 'tone',
                        text: comments_arr,
                        subtype: 'emotion'
                    }
                    this.trigger('show:analysis', value);
                }
            }
        },
        showToneChart: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get comments
                var comments = this.model.get('comments');
                if(comments && comments.length){
                    var comments_arr = [];
                    var time_arr = [];
                    for(var i=0; i<comments.length; i++){
                        var comment_html = comments[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = comment_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) comments_arr.push(text);
                    }
                    //Get tones
                    var value = {
                        type: 'tone',
                        text: comments_arr
                    }
                    this.trigger('show:analysis', value);
                }
            }
        }
    });
    //Responses View
    EntityViews.ResponsesView = Marionette.ItemView.extend({
        template: 'responsesTemplate',
        events: {
            'click .js-close, .js-done': 'closeOverlay',
            'click .js-wordcloud': 'showWordCloud',
            'click .js-sentiment': 'showSentimentChart',
            'click .js-emotion-tone': 'showEmotionToneChart',
            'click .js-emotion': 'showEmotionChart',
            'click .js-tone': 'showToneChart',
            'click .js-more-response': 'showContextMenu',
            'click .js-context-response .js-phrase': 'showKeyPhrase',
            'click .js-context-response .js-syntax': 'showSyntax',
            'click .js-context-response .js-entity': 'showEntity',
            'click .js-context-response .js-language': 'showLanguage',
            'click .js-context-response .js-translate': 'translateText',
            'click .user-name': 'sendMessage'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        showWordCloud: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get responses
                var responses = this.model.get('responses');
                if(responses && responses.length){
                    var responses_arr = [];
                    var time_arr = [];
                    for(var i=0; i<responses.length; i++){
                        var response_html = responses[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = response_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) responses_arr.push(text);
                    }
                    //Get wordcloud
                    var value = {
                        type: 'keyphrase',
                        text: responses_arr
                    }
                    this.trigger('show:analysis', value);
                }
            }
        },
        showSentimentChart: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get responses
                var responses = this.model.get('responses');
                if(responses && responses.length){
                    var responses_arr = [];
                    var time_arr = [];
                    for(var i=0; i<responses.length; i++){
                        var response_html = responses[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = response_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) responses_arr.push(text);
                    }
                    //Get sentiments
                    var value = {
                        type: 'sentiment',
                        text: responses_arr
                    }
                    this.trigger('show:analysis', value);
                }
            }
        },
        showEmotionToneChart: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get responses
                var responses = this.model.get('responses');
                if(responses && responses.length){
                    var responses_arr = [];
                    var time_arr = [];
                    for(var i=0; i<responses.length; i++){
                        var response_html = responses[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = response_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) responses_arr.push(text);
                    }
                    //Get tones
                    var value = {
                        type: 'tone',
                        text: responses_arr,
                        subtype: 'emotiontone'
                    }
                    this.trigger('show:analysis', value);
                }
            }
        },
        showEmotionChart: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get responses
                var responses = this.model.get('responses');
                if(responses && responses.length){
                    var responses_arr = [];
                    var time_arr = [];
                    for(var i=0; i<responses.length; i++){
                        var response_html = responses[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = response_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) responses_arr.push(text);
                    }
                    //Get tones
                    var value = {
                        type: 'tone',
                        text: responses_arr,
                        subtype: 'emotion'
                    }
                    this.trigger('show:analysis', value);
                }
            }
        },
        showToneChart: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.hasClass('selected')){
                if(myChart) myChart.destroy();
                $('#wordcloud').html("");
                $('.chart-area, #myChart, #wordcloud, .chart-loader').hide();
                $target.removeClass('selected');
            } else {
                $('.analysis-options .selected').click();
                $target.addClass('selected');
                //Get responses
                var responses = this.model.get('responses');
                if(responses && responses.length){
                    var responses_arr = [];
                    var time_arr = [];
                    for(var i=0; i<responses.length; i++){
                        var response_html = responses[i].text;
                        var tmp = document.createElement('div');
                        tmp.innerHTML = response_html;
                        var text = tmp.textContent || tmp.innerText || "";
                        if(text) responses_arr.push(text);
                    }
                    //Get tones
                    var value = {
                        type: 'tone',
                        text: responses_arr
                    }
                    this.trigger('show:analysis', value);
                }
            }
        },
        showContextMenu: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            $('.context-menu:not(.js-context-response)').hide();
            $target.next().toggle();
        },
        showKeyPhrase: function(ev){
            ev.preventDefault();
            //Get text from html
            var $target = $(ev.currentTarget);
            var response_html = $target.parents().eq(1).find('.response-text').html();
            var tmp = document.createElement('div');
            tmp.innerHTML = response_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Show keyphrase
                var value = {
                    text: [text]
                }
                this.trigger('show:keyphrase', value);
            }
        },
        showSyntax: function(ev){
            ev.preventDefault();
            //Get text from html
            var $target = $(ev.currentTarget);
            var response_html = $target.parents().eq(1).find('.response-text').html();
            var tmp = document.createElement('div');
            tmp.innerHTML = response_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Show syntax
                var value = {
                    text: [text]
                }
                this.trigger('show:syntax', value);
            }
        },
        showEntity: function(ev){
            ev.preventDefault();
            //Get text from html
            var $target = $(ev.currentTarget);
            var response_html = $target.parents().eq(1).find('.response-text').html();
            var tmp = document.createElement('div');
            tmp.innerHTML = response_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Show entity
                var value = {
                    text: [text]
                }
                this.trigger('show:entity', value);
            }
        },
        showLanguage: function(ev){
            ev.preventDefault();
            //Get text from html
            var $target = $(ev.currentTarget);
            var response_html = $target.parents().eq(1).find('.response-text').html();
            var tmp = document.createElement('div');
            tmp.innerHTML = response_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Show language
                var value = {
                    text: [text]
                }
                this.trigger('show:language', value);
            }
        },
        translateText: function(ev){
            ev.preventDefault();
            //Get text from html
            var $target = $(ev.currentTarget);
            var response_html = $target.parents().eq(1).find('.response-text').html();
            var tmp = document.createElement('div');
            tmp.innerHTML = response_html;
            var text = tmp.textContent || tmp.innerText || "";
            if(text){
                //Translate text
                var value = {
                    text: text
                }
                this.trigger('translate:text', value);
            }
        },
        sendMessage: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            var value = {
                user: $target.data('user')
            }
            this.trigger('save:message', value);
        }
    });
    //Block Ifttt View
    EntityViews.BlockIftttView = Marionette.ItemView.extend({
        template: 'blockIftttTemplate',
        events: {
            'click .js-close, .js-done': 'closeOverlay',
            'click .mcq-block .block-option': 'selectMcqOption',
            'input .fill-block .blank-fill': 'selectFill',
            'click .one-badge': 'removeBadge',
            'click .js-save-ifttt': 'saveIfttt'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        selectMcqOption: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if(this.model.get('is_multiple')){
                $target.toggleClass('selected');
            } else {
                this.$('.mcq-block .block-option').removeClass('selected');
                $target.addClass('selected');
            }
        },
        selectFill: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            if($target.val().trim()){
                this.$('.blank-fill').prop('readonly', true).removeClass('selected-fill');
                $target.prop('readonly', false).addClass('selected-fill');
            } else {
                this.$('.blank-fill').prop('readonly', false).removeClass('selected-fill');
            }
        },
        removeBadge: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                feedback: $target.data('id')
            }
            //If new badge
            if($target.hasClass('new-badge')){
                value.is_new = true;
            }
            this.trigger('remove:badge', value);
            $target.remove();
        },
        saveIfttt: function(ev){
            ev.preventDefault();
            var value = {
                text: this.$('.feedback-text').val().trim()
            }
            //Selected options
            if(this.model.get('type') == 'mcq' ){
                var selected_options = [];
                this.$('.block-option.selected').each(function(){
                    selected_options.push($(this).data('id'));
                });
                if(selected_options.length) value.selected_options = selected_options;
                else return;
            } else if(this.model.get('type') == 'fill'){
                var str = this.$('.selected-fill').val().trim();
                value.fill_items = str.toLowerCase().match(/(?=\S)[^,]+?(?=\s*(,|$))/g);
                value.fill_id = this.$('.selected-fill').data('id');
            }
            //Add feedback
            this.trigger('add:feedback', value);
        }
    });
    //Feedback Item view
    EntityViews.FeedBackItemView = Marionette.ItemView.extend({
        className: 'one-feedback',
        template: 'feedbackOneTemplate',
        remove: function(){
            //Show remove animation
            var self = this;
            this.$el.fadeOut(function(){
                Marionette.ItemView.prototype.remove.call(self);
            });
        }
    });
    //Feedback view
    EntityViews.FeedBackView = Marionette.CollectionView.extend({
        childView: EntityViews.FeedBackItemView
    });
    //Animation View
    EntityViews.AnimationView = Marionette.ItemView.extend({
        template: 'animationTemplate',
        events: {
            'click .js-close': 'closeOverlay'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        }
    });
    //Insight Course item view
    EntityViews.InsightCourseItemView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'insight-row',
        template: 'insightCourseItemTemplate',
        events: {
            'click .title': 'showUserResponsesInsightOverlay'
        },
        showUserResponsesInsightOverlay: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            $('.js-enrolled-courses').html('Loading your responses. Please wait...');
            ProjectManager.vent.trigger('userResponsesInsightOverlay:show', this.model.get('_id'), $('.pageWrap').data('user'), 'my');
        }
    });
    //Courses insight view
    EntityViews.CoursesInsightView = Marionette.CompositeView.extend({
        template: 'coursesInsightTemplate',
        childView: EntityViews.InsightCourseItemView,
        childViewContainer: 'div.overlay-table',
        events: {
            'click .js-close': 'closeOverlay'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        }
    });
    //User item view
    EntityViews.UserItemView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'user',
        template: 'userOneTemplate',
        events: {
            'click .change-permit': 'activateUser'
        },
        activateUser: function(ev){
            ev.preventDefault();
            var $target = $(ev.currentTarget);
            var value = {
                user_id: this.model.get('_id')
            }
            if(confirm("Are you sure you want to invite "+this.model.get('name')+"?")){
                this.trigger('activate:user', value);
            }
        }
    });
    //Users view
    EntityViews.UsersView = Marionette.CompositeView.extend({
        template: 'usersTemplate',
        childView: EntityViews.UserItemView,
        childViewContainer: 'div.user-list',
        events: {
            'click .js-close, .js-done': 'closeOverlay'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        }
    });
    //Settings View
    EntityViews.SettingsView = Marionette.ItemView.extend({
        template: 'settingsTemplate',
        events: {
            'click .js-close': 'closeOverlay',
            'click #drop-dp': 'openFileBrowserForDp',
            'click .file-input': 'doNothing',
            'click .js-save': 'updateProfile'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
        },
        openFileBrowserForDp: function(ev){
            this.$('#drop-dp .file-input').click();
        },
        doNothing: function(ev){
            ev.stopPropagation();
        },
        updateProfile: function(ev){
            ev.preventDefault();
            var value = {
                name: this.$('.profile-name').val().trim(),
                about: this.$('.profile-about').val().trim(),
                job_title: this.$('.profile-job').val().trim(),
                job_org: this.$('.profile-org').val().trim(),
                city: this.$('.profile-city').val().trim(),
                country: this.$('.select-country').val(),
                sex: this.$('.select-gender').val(),
                phone: this.$('.profile-phone').val().trim(),
                theme: this.$('.select-theme').val(),
                layout: this.$('.select-layout').val(),
            }
            //Check if password is present or not
            if(this.$('.profile-old-pwd').val()){
                value.oldpwd = this.$('.profile-old-pwd').val().trim();
                value.newpwd = this.$('.profile-new-pwd').val().trim();
            }
            this.trigger('update:profile', value);
        }
    });
    //Search results view
    EntityViews.SearchResultsView = Marionette.ItemView.extend({
        template: 'searchResultsView'
    });
    //Message Item view
    EntityViews.MessageItemView = Marionette.ItemView.extend({
        className: 'one-message',
        template: 'messageOneTemplate',
        events: {
            'click': 'showChats'
        },
        showChats: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('chats:show', this.model.get('_id'));
        }
    });
    //Empty messages view
    EntityViews.EmptyMessagesView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'zero-messages',
        template: 'emptyMessagesTemplate'
    });
    //Messages view
    EntityViews.MessagesView = Marionette.CollectionView.extend({
        childView: EntityViews.MessageItemView,
        emptyView: EntityViews.EmptyMessagesView
    });
    //Chat item view
    EntityViews.ChatItemView = Marionette.ItemView.extend({
        className: 'one-chat',
        template: 'chatOneTemplate',
        initialize: function(){
            //If is_system
            if(this.model.get('is_system')){
                this.$el.addClass('system-chat');
            }
            //If other user
            if(this.model.get('creator') && this.model.get('creator')._id != $('.pageWrap').data('user')){
                this.$el.addClass('user-chat');
            }
        }
    });
    //Chats view
    EntityViews.ChatsView = Marionette.CompositeView.extend({
        template: 'chatsTemplate',
        childView: EntityViews.ChatItemView,
        childViewContainer: 'div.all-chats',
        initialize: function(){
            //Get chats
            var chats = this.model.get('chats');
            this.collection = new Backbone.Collection(chats);
        },
        events: {
            'keydown .new-chat-text': 'addChat',
            'click .js-back': 'showMessages',
            'click .js-delete': 'deleteMessage'
        },
        addChat: function(ev){
            ev.stopPropagation();
            var $target = $(ev.target);
            if(ev.keyCode == ENTER_KEY && !ev.shiftKey && $target.val().trim()){
                ev.preventDefault();
                var value = {
                    text: $target.val().trim()
                }
                this.trigger('add:chat', value);
                //Resize
                $target.val('');
                autosize.update($target);
            } else {
                return;
            }
        },
        showMessages: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('messages:show');
        },
        deleteMessage: function(ev){
            ev.preventDefault();
            if(confirm('Are you sure you want to permanently delete this conversation history?')) {
                this.trigger('delete:message');
            }
        }
    });
});
//Common Views of the application - Loading
ProjectManager.module('Common.Views', function(Views,ProjectManager, Backbone, Marionette, $, _){
    //Loading page
    Views.Loading = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'loading-area',
        template: 'loadingTemplate'
    });
});
//Controllers of the Application
ProjectManager.module('ProjectApp.EntityController', function (EntityController, ProjectManager, Backbone, Marionette, $, _) {
    EntityController.Controller = {
        showNewPizzaOverlay: function(){
            console.log('showNewPizzaOverlay')
            $('.overlay').show();
            var newPizzaView = new ProjectManager.ProjectApp.EntityViews.NewPizzaView();
             //Show
             newPizzaView.on('show', function(){
                setTimeout(function(){
                    newPizzaView.$('.overlay-box').addClass('animate');
                }, 100);

                ProjectManager.commands.execute('show:overlay');
                newPizzaView.$('.pizza-title').focus();

                 //Save new course
                newPizzaView.on('save:pizza', function(value){
                var new_pizza = new ProjectManager.Entities.Course({
                    title: value.title,
                    size: value.size,
                    price: value.price

                });
                new_pizza.save({}, {success: function(){
                    ProjectManager.vent.trigger('add:pizza', new_pizza);
                }});
            });
            ProjectManager.overlayRegion.show(newPizzaView);
            });
        },
        showNewCourseOverlay: function(){
            $('.overlay').show();
            var cover_image_url, bound;
            //New course view
            var newCourseView = new ProjectManager.ProjectApp.EntityViews.NewCourseView();
            //Show
            newCourseView.on('show', function(){
                setTimeout(function(){
                    newCourseView.$('.overlay-box').addClass('animate');
                }, 100);
                //Hide scroll on main page
                ProjectManager.commands.execute('show:overlay');
                //Focus
                newCourseView.$('.course-title').focus();
                //Upload cover
                newCourseView.$("#uploadFile").on('change',function(e) {
                    e.preventDefault();
                    var data = new FormData($('#uploadForm')[0]);
                    $.ajax({
                        url:'/api/upload',
                        type: 'POST',
                        contentType: false,
                        processData: false,
                        cache: false,
                        data: data,
                        success: function(){}
                    });
                });
            });
            //Save new course
            newCourseView.on('save:pizza', function(value){
                console.log(value)
                var new_course = new ProjectManager.Entities.Course({
                    title: value.title,
                    size: value.size,
                    price: value.price
                });
                new_course.save({}, {success: function(){
                    ProjectManager.vent.trigger('add:course', new_course);
                }});
            });
            ProjectManager.overlayRegion.show(newCourseView);
        },
        showEditCourseOverlay: function(course_id){
            $('.overlay').show();
            //Fetch course
            var fetchingCourse = ProjectManager.request('course:entity', course_id);
            $.when(fetchingCourse).done(function(course){
                var newCourseView = new ProjectManager.ProjectApp.EntityViews.NewCourseView();
                //Show
                newCourseView.on('show', function(){
                    //Add edit class
                    newCourseView.$('.overlay-box').addClass('edit-box');
                    newCourseView.$('.overlay-form .message').html('Update course:');
                    //Animate overlay box
                    setTimeout(function(){
                        newCourseView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Fill values
                    //Title
                    newCourseView.$('.course-title').val(course.get('title')).focus();
                    //Tagline
                    if(course.get('tagline')){
                        newCourseView.$('.course-tagline').val(course.get('tagline'));
                    }
                    //Tag
                    if(course.get('tag')){
                        if(course.get('tag').core) newCourseView.$('.course-core').val(course.get('tag').core);
                        if(course.get('tag').sel) newCourseView.$('.course-sel').val(course.get('tag').sel);
                        if(course.get('tag').sdg) newCourseView.$('.course-sdg').val(course.get('tag').sdg);
                    }
                    //Privacy
                    if(course.get('privacy') == 'public'){
                        newCourseView.$('.privacy-label #public-radio').prop('checked', true);
                    } else if(course.get('privacy') == 'unlisted'){
                        newCourseView.$('.privacy-label #unlisted-radio').prop('checked', true);
                    } else {
                        newCourseView.$('.privacy-label #private-radio').prop('checked', true);
                    }
                    //Certification
                    if(course.get('certification')){
                        newCourseView.$('.certification-label input').prop('checked', true);
                    }
                    //Show admin/verified labels
                    if($('.pageWrap').data('type') == 'admin' || $('.pageWrap').data('type') == 'verified'){
                        newCourseView.$('.privacy-label .u-hide, .overlay-label.u-hide, .certification-label.u-hide').removeClass('u-hide');
                    }
                    //Active or Inactive
                    newCourseView.$('.course-actions').removeClass('u-hide');
                    if(!course.get('is_active')){
                        newCourseView.$('.js-archive-course').removeClass('archive-course').addClass('unarchive-course').text('Unarchive course');
                    }
                    //Upload cover
                    newCourseView.$('.cover-upload').each(function(){
                        var bound;
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#drop-cover'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Get bound
                                var image = new Image();
                                image.src = window.URL.createObjectURL(data.files[0]);
                                image.onload = function() {
                                    bound = ( image.naturalHeight * 800 ) / image.naturalWidth;
                                    bound = bound / 2; //for retina
                                    if(bound) bound = parseInt(bound);
                                    window.URL.revokeObjectURL(image.src);
                                };
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                newCourseView.$('#drop-cover span').html('Uploading <b>...</b>');
                                newCourseView.$('.js-save').addClass('u-disabled');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                newCourseView.$('#drop-cover span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                newCourseView.$('#drop-cover span').html('Choose course cover image');
                                newCourseView.$('.js-save').removeClass('u-disabled');
                            },
                            success: function(data){
                                var cover_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                cover_image_url = encodeURI(cover_image_url);
                                //Update
                                var edit_course = new ProjectManager.Entities.Course({
                                    _id: course_id,
                                    _action: 'edit'
                                });
                                edit_course.set({
                                    image: cover_image_url,
                                    bound: bound
                                });
                                edit_course.save({}, {success: function(){
                                    //Show save button
                                    newCourseView.$('#drop-cover span').addClass('u-hide');
                                    newCourseView.$('#drop-cover').css('backgroundImage', 'url('+cover_image_url+')');
                                    newCourseView.$('.js-save').removeClass('u-disabled');
                                }});
                            }
                        });
                    });
                });
                //Update course
                newCourseView.on('update:course', function(value){
                    var edit_course = new ProjectManager.Entities.Course({
                        _id: course_id,
                        _action: 'edit'
                    });
                    edit_course.set({
                        title: value.title,
                        tagline: value.tagline,
                        core: value.core,
                        sel: value.sel,
                        sdg: value.sdg,
                        privacy: value.privacy,
                        certification: value.certification
                    });
                    edit_course.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                    }});
                });
                //Archive course
                newCourseView.on('archive:course', function(){
                    var edit_course = new ProjectManager.Entities.Course({
                        _id: course_id,
                        _action: 'archive'
                    });
                    edit_course.set({});
                    edit_course.save({}, {
                        dataType:"text",
                        success: function(){
                            ProjectManager.commands.execute('close:overlay');
                            ProjectManager.vent.trigger('courses:show', 'archived');
                        }
                    });
                });
                //Unarchive course
                newCourseView.on('unarchive:course', function(){
                    var edit_course = new ProjectManager.Entities.Course({
                        _id: course_id,
                        _action: 'unarchive'
                    });
                    edit_course.set({});
                    edit_course.save({}, {
                        dataType:"text",
                        success: function(){
                            ProjectManager.commands.execute('close:overlay');
                            ProjectManager.vent.trigger('courses:show', 'drafts');
                        }
                    });
                });
                ProjectManager.overlayRegion.show(newCourseView);
            });
        },
        showPizzaHeader: function(type){
            var pizzaHeaderView = new ProjectManager.ProjectApp.EntityViews.PizzaHeaderView();
            //show
            pizzaHeaderView.on('show', function(){
                if(type == 'admin'){
                    pizzaHeaderView.$('.admin-view').removeClass('u-hide');
                } else {
                    pizzaHeaderView.$('.public-view').removeClass('u-hide');
                }
            });
            ProjectManager.headerRegion.show(pizzaHeaderView);
        },
        showCoursesHeader: function(type){
            var coursesHeaderView = new ProjectManager.ProjectApp.EntityViews.CoursesHeaderView();
            //Show
            coursesHeaderView.on('show', function(){
                if(type == 'drafts'){
                    coursesHeaderView.$('.draft-courses').removeClass('u-hide');
                } else if(type == 'archived'){
                    coursesHeaderView.$('.archived-courses').removeClass('u-hide');
                } else {
                   coursesHeaderView.$('.public-courses').removeClass('u-hide');
                }
            });
            ProjectManager.headerRegion.show(coursesHeaderView);
        },
        showNewCohortOverlay: function(course_id){
            $('.overlay').show();
            //New cohort view
            var newCohortView = new ProjectManager.ProjectApp.EntityViews.NewCohortView();
            //Show
            newCohortView.on('show', function(){
                setTimeout(function(){
                    newCohortView.$('.overlay-box').addClass('animate');
                }, 100);
                //Hide scroll on main page
                ProjectManager.commands.execute('show:overlay');
                //Focus
                newCohortView.$('.cohort-title').focus();
            });
            //Save new cohort
            newCohortView.on('save:cohort', function(value){
                var new_cohort = new ProjectManager.Entities.Course({
                    _id: course_id,
                    _action: 'copy'
                });
                new_cohort.set({
                    title: value.title
                });
                new_cohort.save({}, {success: function(){
                    ProjectManager.commands.execute('close:overlay');
                    ProjectManager.vent.trigger('courses:show', 'drafts');
                }});
            });
            ProjectManager.overlayRegion.show(newCohortView);
        },
        showPizzas: function(){
            console.log('show pizza');
            var loadingView = new ProjectManager.Common.Views.Loading();
            ProjectManager.contentRegion.show(loadingView);
             //Fetch pizzas
             var fetchingPizza = ProjectManager.request('pizza:entities');
             $.when(fetchingPizza).done(function(pizza){
                console.log('fetching pizza');
                var pizzaView = new ProjectManager.ProjectApp.EntityViews.PizzaView({
                    collection: pizza
                });
                console.log(pizza);
                pizzaView.on('show', function(){

                });

                ProjectManager.vent.off('add:course');
                ProjectManager.vent.on('add:course', function(pizza){
                    pizza.add(pizza, {at: 0});
                    ProjectManager.commands.execute('close:overlay');
                });

                ProjectManager.contentRegion.show(pizzaView);
             });
        },
        showCourses: function(type){
            console.log('showCourses')
            //Update learner progress
            learnerProgress = '', learnerContainers = [];
            //Show loading page
            var loadingView = new ProjectManager.Common.Views.Loading();
            ProjectManager.contentRegion.show(loadingView);
            //Fetch courses
            var fetchingCourses = ProjectManager.request('pizza:entities', type);
            $.when(fetchingCourses).done(function(courses){
                var coursesView = new ProjectManager.ProjectApp.EntityViews.CoursesView({
                    collection: courses
                });

                console.log(courses);
                //Show
                coursesView.on('show', function(){
                    // //Updated title
                    // if(type == 'drafts'){
                    //     document.title = 'FramerSpace: Draft Courses';
                    // } else if(type == 'archived'){
                    //     document.title = 'FramerSpace: Archived Courses';
                    // } else {
                    //     document.title = 'FramerSpace: Courses';
                    // }
                });
                //Add course
                ProjectManager.vent.off('add:course');
                ProjectManager.vent.on('add:course', function(course){
                    courses.add(course, {at: 0});
                    ProjectManager.commands.execute('close:overlay');
                });
                //Show help
                ProjectManager.vent.off('help:show');
                ProjectManager.vent.on('help:show', function(){
                    //New message
                    var new_message = new ProjectManager.Entities.Message({
                        text: 'Hi! Thanks for sliding into our messages. We should get back to you within a few hours — in the meantime, check out https://bit.ly/howtoframerspace 👍'
                    });
                    new_message.save({}, {success: function(){
                        //Show message
                        $('.messagesWrap').removeClass('u-hide');
                        ProjectManager.vent.trigger('chats:show', new_message.get('_id'));
                    }});
                });
                ProjectManager.contentRegion.show(coursesView);
            });
        },
        showOneCourse: function(slug, container, back_type){
            //Fetch course
            var fetchingCourse = ProjectManager.request('course:entity', slug);
            $.when(fetchingCourse).done(function(course){
                var courseHeaderView = new ProjectManager.ProjectApp.EntityViews.CourseHeaderView({
                    model: course
                });
                //Show
                courseHeaderView.on('show', function(){
                    //Show course title
                    document.title = 'FramerSpace: '+ course.get('title');
                    //Add course id to header
                    courseHeaderView.$('.header-title').data('id', course.get('_id'));
                    courseHeaderView.$('.header-title').data('slug', course.get('slug'));
                    //Update learner progress
                    if(course.get('learners') && course.get('learners').length){
                        learnerProgress = course.get('learners')[0].progress;
                        learnerContainers = course.get('learners')[0].containers;
                    }
                    //Show course blocks
                    if(container){
                        ProjectManager.vent.trigger('blocks:show', course.get('_id'), container);
                    } else {
                        ProjectManager.vent.trigger('blocks:show', course.get('_id'));
                    }
                    //Show header title
                    if(back_type == 'drafts'){
                        $('.mainHeader .header-title').append("<a href='/drafts' class='header-back header-drafts'>Draft Courses</a>");
                    } else if(back_type == 'archived'){
                        $('.mainHeader .header-title').append("<a href='/archived' class='header-back header-archived'>Archived Courses</a>");
                    } else {
                        $('.mainHeader .header-title').append("<a href='/' class='header-back header-home'>Courses</a>");
                    }
                    $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                    $('.mainHeader .header-title').append("<a href='/course/"+course.get('slug')+"' class='header-course header-now' data-id='"+course.get('_id')+"'>"+course.get('title')+"</a>");
                    //Add viewer
                    this.trigger('view:course', course.get('_id'));
                });
                //View course
                courseHeaderView.on('view:course', function(value){
                    var course = new ProjectManager.Entities.Course({
                        _id: value,
                        _action: 'view'
                    });
                    course.set({});
                    course.save();
                });
                //Join Course
                courseHeaderView.on('join:course', function(value){
                    var course = new ProjectManager.Entities.Course({
                        _id: value,
                        _action: 'join'
                    });
                    course.set({});
                    course.save({}, {
                        dataType:"text",
                        success: function(){
                            location.reload();
                        }
                    });
                });
                //Unjoin Course
                courseHeaderView.on('unjoin:course', function(value){
                    var course = new ProjectManager.Entities.Course({
                        _id: value,
                        _action: 'unjoin'
                    });
                    course.set({});
                    course.save({}, {
                        dataType:"text",
                        success: function(){
                            location.reload();
                        }
                    });
                });
                ProjectManager.headerRegion.show(courseHeaderView);
            });
        },
        showCourseMembersOverlay: function(course_id){
            $('.overlay').show();
            //Fetch course
            var fetchingCourse = ProjectManager.request('course:entity', course_id);
            $.when(fetchingCourse).done(function(course){
                var courseMembersView = new ProjectManager.ProjectApp.EntityViews.CourseMembersView({
                    model: course
                });
                //Show
                courseMembersView.on('show', function(){
                    setTimeout(function(){
                        courseMembersView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                });
                //Add members
                courseMembersView.on('add:members', function(value){
                    var emailsArr = value.emails.split(',');
                    async.each(emailsArr, function(email, callback){
                        var new_member = new ProjectManager.Entities.Course({
                            _id: course_id,
                            _action: 'add_member'
                        });
                        new_member.set({
                            email: email
                        });
                        new_member.save({}, {
                            success: function(){
                                courseMembersView.collection.add(new_member);
                                callback();
                            },
                            error: function(){
                                callback();
                            }
                        });
                    }, function(err){
                        courseMembersView.$('.collab-input').val('');
                    });
                });
                //Add inactive member
                courseMembersView.on('childview:add:user', function(childView, model){
                    var new_member = new ProjectManager.Entities.Course({
                        _id: course_id,
                        _action: 'add_member'
                    });
                    new_member.set({
                        user_id: model.user_id
                    });
                    new_member.save({}, {success: function(){
                        childView.$('.add-user').remove();
                        childView.$('user-permit').append("<span class='remove-user u-delete'>Remove</span>");
                    }});
                });
                //Edit collaborator privilege
                courseMembersView.on('childview:update:privilege', function(childView, model){
                    var course = new ProjectManager.Entities.Course({
                        _id: course_id,
                        _action: 'edit_member'
                    });
                    course.set({
                        user_id: model.user_id,
                        permit_val: model.permit_val
                    });
                    course.save({}, {
                        dataType: 'text',
                        success: function(){
                            if(model.permit_val == 'moderator'){
                                childView.$('.change-permit').removeClass('selected');
                                childView.$('.js-permit-moderator').addClass('selected');
                            } else if(model.permit_val == 'teacher'){
                                childView.$('.change-permit').removeClass('selected');
                                childView.$('.js-permit-teacher').addClass('selected');
                            } else {
                                childView.$('.change-permit').removeClass('selected');
                            }
                        }
                    });
                });
                //Remove collaborator
                courseMembersView.on('childview:remove:user', function(childView, model){
                    var course = new ProjectManager.Entities.Course({
                        _id: course_id,
                        _action: 'remove_member'
                    });
                    course.set({
                        user_id: model.user_id,
                        email: model.email
                    });
                    course.save({}, {
                        dataType: 'text',
                        success: function(){
                            if(model.user_id == $('.pageWrap').data('user')){
                                //Leave
                                ProjectManager.commands.execute('close:overlay');
                                window.location.href = '/';
                            } else {
                                childView.$el.remove();
                            }
                        }
                    });
                });
                ProjectManager.overlayRegion.show(courseMembersView);
            });
        },
        showCourseBadgesOverlay: function(course_id){
            $('.overlay').show();
            var image_url, bound;
            //Fetch course badges
            var fetchingCourseBadges = ProjectManager.request('badge:entities', course_id);
            $.when(fetchingCourseBadges).done(function(courseBadges){
                var courseBadgesView = new ProjectManager.ProjectApp.EntityViews.CourseBadgesView();
                //Badges and Skills
                var badgesView = new ProjectManager.ProjectApp.EntityViews.BadgesView({
                    collection: courseBadges
                });
                var skillsView = new ProjectManager.ProjectApp.EntityViews.SkillsView({
                    collection: courseBadges
                });
                //Show
                courseBadgesView.on('show', function(){
                    setTimeout(function(){
                        courseBadgesView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Focus
                    courseBadgesView.$('.badge-title').focus();
                    //Upload badge
                    courseBadgesView.$('.badge-upload').each(function(){
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#drop-badge'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Get bound
                                var image = new Image();
                                image.src = window.URL.createObjectURL(data.files[0]);
                                image.onload = function() {
                                    bound = ( image.naturalHeight * 400 ) / image.naturalWidth;
                                    bound = bound / 2; //for retina
                                    if(bound) bound = parseInt(bound);
                                    window.URL.revokeObjectURL(image.src);
                                };
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                courseBadgesView.$('#drop-badge span').html('Uploading <b>...</b>');
                                courseBadgesView.$('.js-save-badge').addClass('u-disabled');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                courseBadgesView.$('#drop-badge span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                courseBadgesView.$('#drop-badge span').html('Add image');
                                courseBadgesView.$('.js-save-badge').removeClass('u-disabled');
                            },
                            success: function(data){
                                image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                image_url = encodeURI(image_url);
                                //Show save button
                                courseBadgesView.$('#drop-badge span').addClass('u-hide');
                                courseBadgesView.$('#drop-badge').css('backgroundImage', 'url('+image_url+')');
                                courseBadgesView.$('.js-save-badge').removeClass('u-disabled');
                            }
                        });
                    });
                });
                //Save badge
                courseBadgesView.on('save:badge', function(value){
                    var new_badge = new ProjectManager.Entities.Badge({
                        title: value.title,
                        is_skill: value.is_skill,
                        course: course_id,
                        image: image_url,
                        bound: bound
                    });
                    new_badge.save({}, {success: function(){
                        courseBadgesView.$('.badge-title').val('').focus();
                        courseBadgesView.$('#drop-badge').css('backgroundImage', 'none');
                        courseBadgesView.$('#drop-badge span').html('Add image').removeClass('u-hide');
                        //Add badge or skill
                        if(value.is_skill){
                            skillsView.collection.add(new_badge);
                        } else {
                            badgesView.collection.add(new_badge);
                        }
                    }});
                });
                //Remove badge
                badgesView.on('childview:remove:badge', function(childView, model){
                    _removeBadge(model);
                });
                skillsView.on('childview:remove:badge', function(childView, model){
                    _removeBadge(model);
                });
                var _removeBadge = function(model){
                    var badge = new ProjectManager.Entities.Badge({
                        _id: model.get('_id')
                    });
                    badge.destroy({
                        dataType: 'text',
                        success: function(model, response){
                            //Check if skill
                            if(model.get('is_skill')){
                                skillsView.collection.remove(model);
                            } else {
                                badgesView.collection.remove(model);
                            }
                        }
                    });
                };
                ProjectManager.overlayRegion.show(courseBadgesView);
                //Show badges and skills in layout's regions
                courseBadgesView.getRegion('badges').show(badgesView);
                courseBadgesView.getRegion('skills').show(skillsView);
            });
        },
        showBasicInsightOverlay: function(course_id){
            $('.overlay').show();
            //Fetch insight
            var fetchingBasicInsight = ProjectManager.request('insight:entity', course_id, 'basic');
            $.when(fetchingBasicInsight).done(function(insight){
                var basicInsightView = new ProjectManager.ProjectApp.EntityViews.BasicInsightView({
                    model: insight
                });
                //Show
                basicInsightView.on('show', function(){
                    setTimeout(function(){
                        basicInsightView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Add data id
                    basicInsightView.$('.js-show-users').data('course', course_id);
                });
                ProjectManager.overlayRegion.show(basicInsightView);
            });
        },
        showUsersInsightOverlay: function(course_id){
            $('.overlay').show();
            //Fetch insight
            var fetchingUsersInsight = ProjectManager.request('insight:entity', course_id, 'users');
            $.when(fetchingUsersInsight).done(function(insight){
                var usersInsightView = new ProjectManager.ProjectApp.EntityViews.UsersInsightView({
                    model: insight
                });
                //Show
                usersInsightView.on('show', function(){
                    setTimeout(function(){
                        usersInsightView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Add data id
                    usersInsightView.$('.js-total-users').data('course', course_id);
                    //Show download button if users
                    if(insight.get('users') && insight.get('users').length){
                        usersInsightView.$('.js-download').removeClass('u-hide');
                    }
                    //Show progress
                    var course = insight.get('course');
                    if(course.learners && course.learners.length){
                        var learner;
                        for(var i=0; i<course.learners.length; i++){
                            var learner = course.learners[i];
                            if(usersInsightView.$(".insight-row[data-id='" + learner.user + "']").length == 1){
                                var string = "<span class='one-progress progress-start' title='Started'></span>";
                                if(learner.containers && learner.containers.length){
                                    for(var j=0; j<learner.containers.length; j++){
                                        string += "<span class='one-progress progress-container' title="+learner.containers[j].title+"></span>";
                                    }
                                }
                                if(learner.progress == 'completed'){
                                    string += "<span class='one-progress progress-end' title='Completed'></span>";
                                } else if(learner.progress == 'certified'){
                                    string += "<span class='one-progress progress-end progress-certified' title='Certified'></span>";
                                }
                                usersInsightView.$(".insight-row[data-id='" + learner.user + "'] .insight-progress").html(string);
                            }
                        }
                    }
                });
                //Download users
                usersInsightView.on('download:users', function(){
                    var usersArr = insight.get('users');
                    //Format the users array
                    var finalUsersArr = [];
                    usersArr.forEach((user, i) => {
                        var json = {
                            id: user._id,
                            uniqueid: user.email,
                            initials: user.initials,
                            username: user.username,
                            name: user.name,
                            country: user.country || '',
                            sex: user.sex || ''
                        };
                        //City
                        if(user.city){
                            json.city = user.city.replace(/,/g, '');
                        } else {
                            json.city = '';
                        }
                        //About
                        if(user.about){
                            json.about = user.about.replace(/,/g, '');
                        } else {
                            json.about = '';
                        }
                        //Job
                        if(user.job){
                            json.title = user.job.title.replace(/,/g, '');
                            json.organisation = user.job.org.replace(/,/g, '');
                        } else {
                            json.title = '';
                            json.organisation = '';
                        }
                        //Progress
                        if(usersInsightView.$('.overlay-table .insight-progress').eq(i).children().length){
                            var progress_text = '';
                            usersInsightView.$('.insight-progress').eq(i).children('.one-progress').each(function(){
                                progress_text += htmlToPlainText($(this).attr('title')) + '; ';
                            });
                            json.progress = progress_text;
                        } else {
                            json.progress = '';
                        }
                        finalUsersArr.push(json);
                    });
                    //CSV Headers
                    var headers = {
                        id: 'User ID',
                        uniqueid: 'Unique ID',
                        initials: 'Initials',
                        username: 'Username',
                        name: 'Full Name',
                        country: 'Country',
                        sex: 'Gender',
                        city: 'City',
                        about: 'About',
                        title: 'Job Title',
                        organisation: 'Organisation name',
                        progress: 'Progress'
                    };
                    //File title
                    var fileTitle = 'course-'+ stringToSlug(insight.get('course').title) +'-users';
                    //Export CSV
                    exportCSVFile(headers, finalUsersArr, fileTitle);
                });
                ProjectManager.overlayRegion.show(usersInsightView);
            });
        },
        showUserResponsesInsightOverlay: function(course_id, user_id, type){
            $('.overlay').show();
            //Fetch insight
            var fetchingUserInsight = ProjectManager.request('insight:entity', course_id, 'responses', user_id);
            $.when(fetchingUserInsight).done(function(insight){
                var userInsightView = new ProjectManager.ProjectApp.EntityViews.UserResponsesInsightView({
                    model: insight
                });
                //Show
                userInsightView.on('show', function(){
                    setTimeout(function(){
                        userInsightView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Add data id
                    userInsightView.$('.js-show-comments').data('course', course_id);
                    userInsightView.$('.js-show-comments').data('user', user_id);
                    //Show download button if blocks
                    if(insight.get('blocks') && insight.get('blocks').length && !type){
                        userInsightView.$('.js-download').removeClass('u-hide');
                    }
                    //Show my responses
                    if(type && type == 'my'){
                       userInsightView.$('.js-show-comments').html('Show my comments &rarr;');
                       userInsightView.$('.overlay-box').addClass('my-insight');
                    }
                });
                //Download responses
                userInsightView.on('download:responses', function(){
                    var blocksArr = insight.get('blocks');
                    //Format the blocks array
                    var finalBlocksArr = [];
                    blocksArr.forEach((block, i) => {
                        var json = {
                            id: block._id,
                            type: block.type
                        };
                        //Title
                        if(block.title){
                            json.title = htmlToPlainText(block.title);
                        } else {
                            json.title = '';
                        }
                        //Text
                        if(block.text){
                            json.text = htmlToPlainText(block.text);
                        } else {
                            json.text = '';
                        }
                        //Response
                        if(userInsightView.$('.overlay-table .insight-responses').eq(i).text()){
                            var response_text = '';
                            userInsightView.$('.insight-responses').eq(i).children('.one-response').each(function(){
                                response_text += htmlToPlainText($(this).text()) + '; ';
                            });
                            json.response = response_text;
                        } else {
                            json.response = '';
                        }
                        finalBlocksArr.push(json);
                    });
                    //CSV Headers
                    var headers = {
                        id: 'Block ID',
                        type: 'Block Type',
                        title: 'Block Title',
                        text: 'Block Text',
                        response: 'User Response(s)'
                    };
                    //File title
                    var fileTitle = 'user-'+ stringToSlug(insight.get('user').name) +'-responses';
                    //Export CSV
                    exportCSVFile(headers, finalBlocksArr, fileTitle);
                });
                //Save message
                userInsightView.on('save:message', function(value){
                    //New message
                    var new_message = new ProjectManager.Entities.Message({
                        user: value.user
                    });
                    new_message.save({}, {success: function(){
                        //Close overlay
                        ProjectManager.commands.execute('close:overlay');
                        //Scroll to top
                        $(window).scrollTop(0);
                        //Show message
                        $('.messagesWrap').removeClass('u-hide');
                        ProjectManager.vent.trigger('chats:show', new_message.get('_id'));
                    }});
                });
                ProjectManager.overlayRegion.show(userInsightView);
            });
        },
        showUserCommentsInsightOverlay: function(course_id, user_id, type){
            $('.overlay').show();
            //Fetch insight
            var fetchingUserInsight = ProjectManager.request('insight:entity', course_id, 'comments', user_id);
            $.when(fetchingUserInsight).done(function(insight){
                var userInsightView = new ProjectManager.ProjectApp.EntityViews.UserCommentsInsightView({
                    model: insight
                });
                //Show
                userInsightView.on('show', function(){
                    setTimeout(function(){
                        userInsightView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Add data id
                    userInsightView.$('.js-user-comments').data('course', course_id);
                    userInsightView.$('.js-user-comments').data('user', user_id);
                    //Show download button if blocks
                    if(insight.get('blocks') && insight.get('blocks').length && !type){
                        userInsightView.$('.js-download').removeClass('u-hide');
                    }
                    //Show my comments
                    if(type && type == 'my'){
                       userInsightView.$('.overlay-box').addClass('my-insight');
                    }
                });
                //Download comments
                userInsightView.on('download:comments', function(){
                    var blocksArr = insight.get('blocks');
                    //Format the blocks array
                    var finalBlocksArr = [];
                    blocksArr.forEach((block, i) => {
                        var json = {
                            id: block._id,
                            type: block.type
                        };
                        //Title
                        if(block.title){
                            json.title = htmlToPlainText(block.title);
                        } else {
                            json.title = '';
                        }
                        //Text
                        if(block.text){
                            json.text = htmlToPlainText(block.text);
                        } else {
                            json.text = '';
                        }
                        //Comment
                        if(userInsightView.$('.overlay-table .insight-comments').eq(i).text()){
                            var comment_text = '';
                            userInsightView.$('.insight-comments').eq(i).children('.one-comment').each(function(){
                                comment_text += htmlToPlainText($(this).text()) + '; ';
                            });
                            json.comment = comment_text;
                        } else {
                            json.comment = '';
                        }
                        finalBlocksArr.push(json);
                    });
                    //CSV Headers
                    var headers = {
                        id: 'Block ID',
                        type: 'Block Type',
                        title: 'Block Title',
                        text: 'Block Text',
                        comment: 'Comment(s)'
                    };
                    //File title
                    var fileTitle = 'user-'+ stringToSlug(insight.get('user').name) +'-comments';
                    //Export CSV
                    exportCSVFile(headers, finalBlocksArr, fileTitle);
                });
                //Save message
                userInsightView.on('save:message', function(value){
                    //New message
                    var new_message = new ProjectManager.Entities.Message({
                        user: value.user
                    });
                    new_message.save({}, {success: function(){
                        //Close overlay
                        ProjectManager.commands.execute('close:overlay');
                        //Scroll to top
                        $(window).scrollTop(0);
                        //Show message
                        $('.messagesWrap').removeClass('u-hide');
                        ProjectManager.vent.trigger('chats:show', new_message.get('_id'));
                    }});
                });
                ProjectManager.overlayRegion.show(userInsightView);
            });
        },
        showCourseMinimap: function(course_id, animate, selected_block){
            $('.sidebarWrap').show();
            //Fetch minimap
            var fetchingMinimap = ProjectManager.request('minimap:entity', course_id);
            $.when(fetchingMinimap).done(function(minimap){
                var blocksView = new ProjectManager.ProjectApp.EntityViews.MinimapBlocksView({
                    model: minimap
                });
                //Show
                blocksView.on('show', function(){
                    //Animate sidebar box
                    if(animate){
                        setTimeout(function(){
                            blocksView.$('.sidebar-box').addClass('animate');
                        }, 100);
                    } else {
                        blocksView.$('.sidebar-box').addClass('animate');
                    }
                    //Selected block
                    if(selected_block){
                        //Highlight dropped block
                        $(".one-m-block[data-id='" + selected_block + "'] .minimap-btn").addClass('is-selected');
                        //Scroll to selected block
                        var offset = $(".one-m-block[data-id='" + selected_block + "']").eq(0).offset().top - 100;
                        $('.sidebar-box.minimap-box').animate({scrollTop: offset}, 100);
                        setTimeout(function(){
                            $(".one-m-block[data-id='" + selected_block + "'] .minimap-btn").removeClass('is-selected');
                        }, 1500);
                    }
                    //Resize page
                    $('.pageWrap').addClass('with-sidebar');
                    //If learner
                    if(minimap.get('type') == 'learner'){
                        $('.sidebar-header .message').text('Navigate:');
                        $('.minimap-blocks').addClass('is-learner');
                        //Hide hidden blocks from learners
                        blocksView.$('.is-hidden').addClass('u-hide');
                    } else if(minimap.get('type') == 'creator'){
                        //Sort minimap parent blocks
                        $('.minimap-blocks').sortable({
                            helper: 'clone',
                            update: function(e, ui){
                                var new_index = ui.item.index();
                                var block_id = ui.item.data('id');
                                if(ui.item.prev().data('order')){
                                    var new_order = ui.item.prev().data('order') + 1;
                                } else {
                                    var new_order = ui.item.next().data('order');
                                }
                                //Update order
                                var edit_block = new ProjectManager.Entities.Block({
                                    _id: block_id,
                                    _action: 'order'
                                });
                                //Set
                                edit_block.set({
                                    order: new_order
                                });
                                edit_block.save({}, {success: function(){
                                    //Update order
                                    ui.item.data('order', new_order);
                                    blocksView.$('.one-m-block').each(function(){
                                        var current_id = $(this).data('id');
                                        var current_order = $(this).data('order');
                                        if(current_order >= new_order && current_id != block_id){
                                            $(this).data('order', current_order + 1);
                                        }
                                    });
                                }});
                            }
                        });
                        //Sort child blocks
                        $('.child-blocks').sortable({
                            helper: 'clone',
                            update: function(e, ui){
                                var new_index = ui.item.index();
                                var block_id = ui.item.data('id');
                                if(ui.item.prev().data('order')){
                                    var new_order = ui.item.prev().data('order') + 1;
                                } else {
                                    var new_order = ui.item.next().data('order');
                                }
                                //Update order
                                var edit_block = new ProjectManager.Entities.Block({
                                    _id: block_id,
                                    _action: 'order'
                                });
                                //Set
                                edit_block.set({
                                    order: new_order
                                });
                                edit_block.save({}, {success: function(){
                                    //Update order
                                    ui.item.data('order', new_order);
                                    blocksView.$('.one-m-block').each(function(){
                                        var current_id = $(this).data('id');
                                        var current_order = $(this).data('order');
                                        if(current_order >= new_order && current_id != block_id){
                                            $(this).data('order', current_order + 1);
                                        }
                                    });
                                }});
                            }
                        });
                        //Draggable child blocks
                        $('.child-blocks').draggable();
                        $('.one-m-block.is-container').droppable({
                            hoverClass: 'is-droppable',
                            greedy: true,
                            drop: function(e, ui){
                                e.preventDefault();
                                e.stopPropagation();
                                var container_id = $(this).data('id');
                                var block_id = $(ui.draggable).data('id');
                                var new_order = $(this).data('order') + 1;
                                //Update order
                                var edit_block = new ProjectManager.Entities.Block({
                                    _id: block_id,
                                    _action: 'move'
                                });
                                //Set
                                edit_block.set({
                                    container: container_id,
                                    order: new_order
                                });
                                edit_block.save({}, {success: function(){
                                    ProjectManager.vent.trigger('courseMinimap:show', course_id, '', block_id);
                                }});
                            }
                        });
                    }
                });
                ProjectManager.sidebarRegion.show(blocksView);
            });
        },
        showNewBlockOverlay: function(order){
            $('.overlay').show();
            var mcq_option_bound, mcq_option_image_url;
            var left_image_url, left_bound, right_image_url, right_bound, list_item_image_url, list_item_bound, grid_item_image_url, grid_item_bound, comic_url, container_image_url, container_bound;
            //Editor
            var richTextEditor;
            var richTextEditorFiles = [];
            //New block view
            var newBlockView = new ProjectManager.ProjectApp.EntityViews.NewBlockView();
            //Show
            newBlockView.on('show', function(){
                //Show overlay
                setTimeout(function(){
                    newBlockView.$('.overlay-box').addClass('animate');
                }, 100);
                //Hide scroll on main page
                ProjectManager.commands.execute('show:overlay');
                //LOAD EDITOR
                //Wait till editor is ready
                newBlockView.$('.block-text').bind('click mousedown dblclick', function(ev){
                   ev.preventDefault();
                   ev.stopImmediatePropagation();
                });
                richTextEditor = setUpAlloyToolbar(false, document.querySelector('.text-content'), false, false);
                var nativeEditor = richTextEditor.get('nativeEditor');
                //On editor ready
                nativeEditor.on('instanceReady', function(ev){
                    newBlockView.$('.block-text').unbind();
                });
                //On image upload
                nativeEditor.on('imageAdd', function(ev){
                    var id = generateRandomUUID();
                    ev.data.file.id = id;
                    richTextEditorFiles.push(ev.data.file);
                    $(ev.data.el.$).addClass('upload-image').attr('data-id', id);
                });
            });
            //UPLOAD
            //Upload file
            newBlockView.on('open:fileBrowser', function(file_type){
                newBlockView.$('.direct-upload').each(function(){
                    //For each file selected, process and upload
                    var form = $(this);
                    var fileCount = 0;
                    var uploadCount = 0;
                    $(this).fileupload({
                        dropZone: $('#drop-file'),
                        url: form.attr('action'), //Grab form's action src
                        type: 'POST',
                        autoUpload: true,
                        dataType: 'xml', //S3's XML response,
                        add: function(event, data){
                            if(data.files[0].size >= MAX_FILE_SIZE) return;
                            fileCount += 1;
                            //Upload through CORS
                            $.ajax({
                                url: '/api/signed',
                                type: 'GET',
                                dataType: 'json',
                                data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                async: false,
                                success: function(data){
                                    // Now that we have our data, we update the form so it contains all
                                    // the needed data to sign the request
                                    form.find('input[name=key]').val(data.key);
                                    form.find('input[name=policy]').val(data.policy);
                                    form.find('input[name=signature]').val(data.signature);
                                    form.find('input[name=Content-Type]').val(data.contentType);
                                }
                            });
                            data.files[0].s3Url = form.find('input[name=key]').val();
                            data.submit();
                        },
                        start: function(e){
                            $('#drop-file span').html('Uploaded <b></b>');
                        },
                        progressall: function(e, data){
                            var progress = parseInt(data.loaded / data.total * 100, 10);
                            $('#drop-file span b').text(progress + '%'); // Update progress bar percentage
                        },
                        fail: function(e, data){
                            $('#drop-file span').html('Choose files or drag and drop them here');
                        },
                        done: function(e, data){
                            var file_name = data.files[0].name;
                            //Get extension of the file
                            var index = file_name.lastIndexOf('.');
                            var file_ext = file_name.substring(index+1, file_name.length);
                            //Get block title
                            if(newBlockView.$('.block-file-title').val()){
                                var block_title = newBlockView.$('.block-file-title').val().trim();
                            } else {
                                var block_title = decodeURIComponent(file_name.substring(0, index));
                            }
                            //Url
                            var url = 'https://d1u3z33x3g234l.cloudfront.net/' +  encodeURIComponent(data.files[0].s3Url).replace(/'/g,"%27").replace(/"/g,"%22");
                            //Get extension
                            var image_extensions = ['jpg', 'png', 'gif', 'jpeg'];
                            if(image_extensions.indexOf(file_ext) < 0) {
                                //Save file
                                var new_block = new ProjectManager.Entities.Block({
                                    type: file_type || 'file',
                                    title: block_title,
                                    provider: {
                                        name: 'FramerSpace',
                                        url: url
                                    },
                                    file: {
                                        size: data.files[0].size,
                                        ext: file_ext
                                    },
                                    order: order,
                                    course: $('.mainHeader .header-title').data('id')
                                });
                                //Container id
                                if($('.mainHeader .header-container.header-now').data('id')){
                                    new_block.set('container', $('.mainHeader .header-container.header-now').data('id'));
                                }
                                //Save block
                                new_block.save({}, {success: function(){
                                    uploadCount += 1;
                                    ProjectManager.commands.execute('close:overlay');
                                    ProjectManager.vent.trigger('add:block', new_block);
                                }});
                            } else {
                                //Save image
                                var new_block = new ProjectManager.Entities.Block({
                                    type: 'image',
                                    title: block_title,
                                    provider: {
                                        name: 'FramerSpace',
                                        url: url
                                    },
                                    file: {
                                        size: data.files[0].size,
                                        ext: file_ext
                                    },
                                    image: url,
                                    order: order,
                                    course: $('.mainHeader .header-title').data('id')
                                });
                                //Container id
                                if($('.mainHeader .header-container.header-now').data('id')){
                                    new_block.set('container', $('.mainHeader .header-container.header-now').data('id'));
                                }
                                //Image
                                var image = new Image();
                                image.src = window.URL.createObjectURL( data.files[0] );
                                image.onload = function(){
                                    var bound = ( image.naturalHeight * 400 ) / image.naturalWidth;
                                    if(bound) {
                                        bound = parseInt(bound);
                                        new_block.set('bound', bound);
                                    }
                                    window.URL.revokeObjectURL(image.src);
                                    //Save block
                                    new_block.save({}, {success: function(){
                                        uploadCount += 1;
                                        ProjectManager.commands.execute('close:overlay');
                                        ProjectManager.vent.trigger('add:block', new_block);
                                    }});
                                };
                                image.onerror = function(){
                                    //Save block
                                    new_block.save({}, {success: function(){
                                        uploadCount += 1;
                                        ProjectManager.commands.execute('close:overlay');
                                        ProjectManager.vent.trigger('add:block', new_block);
                                    }});
                                };
                            }
                        }
                    });
                });
            });
            //Upload MCQ option image
            newBlockView.on('open:mcqFileBrowser', function(){
                newBlockView.$('.option-image-upload').each(function(){
                    /* For each file selected, process and upload */
                    var form = $(this);
                    $(this).fileupload({
                        dropZone: $('#option-image'),
                        url: form.attr('action'), //Grab form's action src
                        type: 'POST',
                        autoUpload: true,
                        dataType: 'xml', //S3's XML response,
                        add: function(event, data){
                            //Check file type
                            var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                            if (allowedtypes.indexOf(fileType) < 0) {
                                alert('Invalid file type, aborted');
                                return false;
                            }
                            //Get bound
                            var image = new Image();
                            image.src = window.URL.createObjectURL(data.files[0]);
                            image.onload = function() {
                                mcq_option_bound = ( image.naturalHeight * 200 ) / image.naturalWidth;
                                if(mcq_option_bound) mcq_option_bound = parseInt(mcq_option_bound);
                                window.URL.revokeObjectURL(image.src);
                            };
                            //Upload through CORS
                            $.ajax({
                                url: '/api/signed',
                                type: 'GET',
                                dataType: 'json',
                                data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                async: false,
                                success: function(data){
                                    // Now that we have our data, we update the form so it contains all
                                    // the needed data to sign the request
                                    form.find('input[name=key]').val(data.key);
                                    form.find('input[name=policy]').val(data.policy);
                                    form.find('input[name=signature]').val(data.signature);
                                    form.find('input[name=Content-Type]').val(data.contentType);
                                }
                            });
                            data.submit();
                        },
                        send: function(e, data){
                            newBlockView.$('#option-image span').html('Uploading <b>...</b>');
                            newBlockView.$('.js-save-mcq-item').addClass('u-hide');
                        },
                        progress: function(e, data){
                            var percent = Math.round((e.loaded / e.total) * 100);
                            newBlockView.$('#option-image span b').text(percent + '%');
                        },
                        fail: function(e, data){
                            newBlockView.$('#option-image span').html('Optional image');
                            newBlockView.$('.js-save-mcq-item').removeClass('u-hide');
                        },
                        success: function(data){
                            mcq_option_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                            mcq_option_image_url = encodeURI(mcq_option_image_url);
                            newBlockView.$('#option-image span').addClass('u-hide');
                            newBlockView.$('#option-image').css('backgroundImage', 'url('+mcq_option_image_url+')');
                            newBlockView.$('.js-save-mcq-item').removeClass('u-hide');
                        }
                    });
                });
            });
            //Upload Match option image
            newBlockView.on('open:matchFileBrowser', function(){
                //Upload option image left
                newBlockView.$('.option-image-upload-left').each(function(){
                    /* For each file selected, process and upload */
                    var form = $(this);
                    $(this).fileupload({
                        dropZone: $('#option-image-left'),
                        url: form.attr('action'), //Grab form's action src
                        type: 'POST',
                        autoUpload: true,
                        dataType: 'xml', //S3's XML response,
                        add: function(event, data){
                            //Check file type
                            var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                            if (allowedtypes.indexOf(fileType) < 0) {
                                alert('Invalid file type, aborted');
                                return false;
                            }
                            //Get bound
                            var image = new Image();
                            image.src = window.URL.createObjectURL(data.files[0]);
                            image.onload = function() {
                                left_bound = ( image.naturalHeight * 200 ) / image.naturalWidth;
                                if(left_bound) left_bound = parseInt(left_bound);
                                window.URL.revokeObjectURL(image.src);
                            };
                            //Upload through CORS
                            $.ajax({
                                url: '/api/signed',
                                type: 'GET',
                                dataType: 'json',
                                data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                async: false,
                                success: function(data){
                                    // Now that we have our data, we update the form so it contains all
                                    // the needed data to sign the request
                                    form.find('input[name=key]').val(data.key);
                                    form.find('input[name=policy]').val(data.policy);
                                    form.find('input[name=signature]').val(data.signature);
                                    form.find('input[name=Content-Type]').val(data.contentType);
                                }
                            });
                            data.submit();
                        },
                        send: function(e, data){
                            newBlockView.$('#option-image-left span').html('Uploading <b>...</b>');
                            newBlockView.$('.options-left .js-save-match-item').addClass('u-hide');
                        },
                        progress: function(e, data){
                            var percent = Math.round((e.loaded / e.total) * 100);
                            newBlockView.$('#option-image-left span b').text(percent + '%');
                        },
                        fail: function(e, data){
                            newBlockView.$('#option-image-left span').html('Optional image');
                            newBlockView.$('.options-left .js-save-match-item').removeClass('u-hide');
                        },
                        success: function(data){
                            left_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                            left_image_url = encodeURI(left_image_url);
                            newBlockView.$('#option-image-left span').addClass('u-hide');
                            newBlockView.$('#option-image-left').css('backgroundImage', 'url('+left_image_url+')');
                            newBlockView.$('.options-left .js-save-match-item').removeClass('u-hide');
                        }
                    });
                });
                //Upload option image right
                newBlockView.$('.option-image-upload-right').each(function(){
                    /* For each file selected, process and upload */
                    var form = $(this);
                    $(this).fileupload({
                        dropZone: $('#option-image-right'),
                        url: form.attr('action'), //Grab form's action src
                        type: 'POST',
                        autoUpload: true,
                        dataType: 'xml', //S3's XML response,
                        add: function(event, data){
                            //Check file type
                            var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                            if (allowedtypes.indexOf(fileType) < 0) {
                                alert('Invalid file type, aborted');
                                return false;
                            }
                            //Get bound
                            var image = new Image();
                            image.src = window.URL.createObjectURL(data.files[0]);
                            image.onload = function() {
                                right_bound = ( image.naturalHeight * 200 ) / image.naturalWidth;
                                if(right_bound) right_bound = parseInt(right_bound);
                                window.URL.revokeObjectURL(image.src);
                            };
                            //Upload through CORS
                            $.ajax({
                                url: '/api/signed',
                                type: 'GET',
                                dataType: 'json',
                                data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                async: false,
                                success: function(data){
                                    // Now that we have our data, we update the form so it contains all
                                    // the needed data to sign the request
                                    form.find('input[name=key]').val(data.key);
                                    form.find('input[name=policy]').val(data.policy);
                                    form.find('input[name=signature]').val(data.signature);
                                    form.find('input[name=Content-Type]').val(data.contentType);
                                }
                            });
                            data.submit();
                        },
                        send: function(e, data){
                            newBlockView.$('#option-image-right span').html('Uploading <b>...</b>');
                            newBlockView.$('.options-right .js-save-match-item').addClass('u-hide');
                        },
                        progress: function(e, data){
                            var percent = Math.round((e.loaded / e.total) * 100);
                            newBlockView.$('#option-image-right span b').text(percent + '%');
                        },
                        fail: function(e, data){
                            newBlockView.$('#option-image-right span').html('Optional image');
                            newBlockView.$('.options-right .js-save-match-item').removeClass('u-hide');
                        },
                        success: function(data){
                            right_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                            right_image_url = encodeURI(right_image_url);
                            newBlockView.$('#option-image-right span').addClass('u-hide');
                            newBlockView.$('#option-image-right').css('backgroundImage', 'url('+right_image_url+')');
                            newBlockView.$('.options-right .js-save-match-item').removeClass('u-hide');
                        }
                    });
                });
            });
            //Upload comic
            newBlockView.on('open:comicFileBrowser', function(){
                newBlockView.$('.comic-upload').each(function(){
                    /* For each file selected, process and upload */
                    var form = $(this);
                    $(this).fileupload({
                        dropZone: $('#drop-comic'),
                        url: form.attr('action'), //Grab form's action src
                        type: 'POST',
                        autoUpload: true,
                        dataType: 'xml', //S3's XML response,
                        add: function(event, data){
                            //Check file type
                            var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                            if (allowedtypes.indexOf(fileType) < 0) {
                                alert('Invalid file type, aborted');
                                return false;
                            }
                            //Upload through CORS
                            $.ajax({
                                url: '/api/signed',
                                type: 'GET',
                                dataType: 'json',
                                data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                async: false,
                                success: function(data){
                                    // Now that we have our data, we update the form so it contains all
                                    // the needed data to sign the request
                                    form.find('input[name=key]').val(data.key);
                                    form.find('input[name=policy]').val(data.policy);
                                    form.find('input[name=signature]').val(data.signature);
                                    form.find('input[name=Content-Type]').val(data.contentType);
                                }
                            });
                            data.submit();
                        },
                        send: function(e, data){
                            newBlockView.$('#drop-comic span').html('Uploading <b>...</b>');
                            newBlockView.$('.js-save-block').addClass('u-hide');
                        },
                        progress: function(e, data){
                            var percent = Math.round((e.loaded / e.total) * 100);
                            newBlockView.$('#drop-comic span b').text(percent + '%');
                        },
                        fail: function(e, data){
                            newBlockView.$('#drop-comic span').html('Choose comic strip and drop them here');
                            newBlockView.$('.js-save-block').removeClass('u-hide');
                        },
                        success: function(data){
                            comic_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                            comic_url = encodeURI(comic_url);
                            newBlockView.$('#drop-comic span').addClass('u-hide');
                            newBlockView.$('#drop-comic').css('backgroundImage', 'url('+comic_url+')');
                            newBlockView.$('.js-save-block').removeClass('u-hide');
                        }
                    });
                });
            });
            //Upload list item image
            newBlockView.on('open:listFileBrowser', function(){
                newBlockView.$('.list-image-upload').each(function(){
                    /* For each file selected, process and upload */
                    var form = $(this);
                    $(this).fileupload({
                        dropZone: $('#list-image'),
                        url: form.attr('action'), //Grab form's action src
                        type: 'POST',
                        autoUpload: true,
                        dataType: 'xml', //S3's XML response,
                        add: function(event, data){
                            //Check file type
                            var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                            if (allowedtypes.indexOf(fileType) < 0) {
                                alert('Invalid file type, aborted');
                                return false;
                            }
                            //Get bound
                            var image = new Image();
                            image.src = window.URL.createObjectURL(data.files[0]);
                            image.onload = function() {
                                list_item_bound = ( image.naturalHeight * 200 ) / image.naturalWidth;
                                if(list_item_bound) list_item_bound = parseInt(list_item_bound);
                                window.URL.revokeObjectURL(image.src);
                            };
                            //Upload through CORS
                            $.ajax({
                                url: '/api/signed',
                                type: 'GET',
                                dataType: 'json',
                                data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                async: false,
                                success: function(data){
                                    // Now that we have our data, we update the form so it contains all
                                    // the needed data to sign the request
                                    form.find('input[name=key]').val(data.key);
                                    form.find('input[name=policy]').val(data.policy);
                                    form.find('input[name=signature]').val(data.signature);
                                    form.find('input[name=Content-Type]').val(data.contentType);
                                }
                            });
                            data.submit();
                        },
                        send: function(e, data){
                            newBlockView.$('#list-image span').html('Uploading <b>...</b>');
                            newBlockView.$('.js-save-list-item').addClass('u-hide');
                        },
                        progress: function(e, data){
                            var percent = Math.round((e.loaded / e.total) * 100);
                            newBlockView.$('#list-image span b').text(percent + '%');
                        },
                        fail: function(e, data){
                            newBlockView.$('#list-image span').html('Optional image');
                            newBlockView.$('.js-save-list-item').removeClass('u-hide');
                        },
                        success: function(data){
                            list_item_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                            list_item_image_url = encodeURI(list_item_image_url);
                            newBlockView.$('#list-image span').addClass('u-hide');
                            newBlockView.$('#list-image').css('backgroundImage', 'url('+list_item_image_url+')');
                            newBlockView.$('.js-save-list-item').removeClass('u-hide');
                        }
                    });
                });
            });
            //Upload container image
            newBlockView.on('open:containerFileBrowser', function(){
                newBlockView.$('.container-upload').each(function(){
                    /* For each file selected, process and upload */
                    var form = $(this);
                    $(this).fileupload({
                        dropZone: $('#drop-container'),
                        url: form.attr('action'), //Grab form's action src
                        type: 'POST',
                        autoUpload: true,
                        dataType: 'xml', //S3's XML response,
                        add: function(event, data){
                            //Check file type
                            var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                            if (allowedtypes.indexOf(fileType) < 0) {
                                alert('Invalid file type, aborted');
                                return false;
                            }
                            //Get bound
                            var image = new Image();
                            image.src = window.URL.createObjectURL(data.files[0]);
                            image.onload = function() {
                                container_bound = ( image.naturalHeight * 800 ) / image.naturalWidth;
                                container_bound = container_bound / 2; //for retina
                                if(container_bound) container_bound = parseInt(container_bound);
                                window.URL.revokeObjectURL(image.src);
                            };
                            //Upload through CORS
                            $.ajax({
                                url: '/api/signed',
                                type: 'GET',
                                dataType: 'json',
                                data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                async: false,
                                success: function(data){
                                    // Now that we have our data, we update the form so it contains all
                                    // the needed data to sign the request
                                    form.find('input[name=key]').val(data.key);
                                    form.find('input[name=policy]').val(data.policy);
                                    form.find('input[name=signature]').val(data.signature);
                                    form.find('input[name=Content-Type]').val(data.contentType);
                                }
                            });
                            data.submit();
                        },
                        send: function(e, data){
                            newBlockView.$('#drop-container span').html('Uploading <b>...</b>');
                            newBlockView.$('.js-save').addClass('u-disabled');
                        },
                        progress: function(e, data){
                            var percent = Math.round((e.loaded / e.total) * 100);
                            newBlockView.$('#drop-container span b').text(percent + '%');
                        },
                        fail: function(e, data){
                            newBlockView.$('#drop-container span').html('Choose container image');
                            newBlockView.$('.js-save').removeClass('u-disabled');
                        },
                        success: function(data){
                            container_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                            container_image_url = encodeURI(container_image_url);
                            //Show save button
                            newBlockView.$('#drop-container span').addClass('u-hide');
                            newBlockView.$('#drop-container').css('backgroundImage', 'url('+container_image_url+')');
                            newBlockView.$('.js-save').removeClass('u-disabled');
                        }
                    });
                });
            });
            //Upload grid item image
            newBlockView.on('open:gridFileBrowser', function(){
                newBlockView.$('.grid-image-upload').each(function(){
                    /* For each file selected, process and upload */
                    var form = $(this);
                    $(this).fileupload({
                        dropZone: $('#grid-image'),
                        url: form.attr('action'), //Grab form's action src
                        type: 'POST',
                        autoUpload: true,
                        dataType: 'xml', //S3's XML response,
                        add: function(event, data){
                            //Check file type
                            var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                            if (allowedtypes.indexOf(fileType) < 0) {
                                alert('Invalid file type, aborted');
                                return false;
                            }
                            //Get bound
                            var image = new Image();
                            image.src = window.URL.createObjectURL(data.files[0]);
                            image.onload = function() {
                                grid_item_bound = ( image.naturalHeight * 400 ) / image.naturalWidth;
                                if(grid_item_bound) grid_item_bound = parseInt(grid_item_bound);
                                window.URL.revokeObjectURL(image.src);
                            };
                            //Upload through CORS
                            $.ajax({
                                url: '/api/signed',
                                type: 'GET',
                                dataType: 'json',
                                data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                async: false,
                                success: function(data){
                                    // Now that we have our data, we update the form so it contains all
                                    // the needed data to sign the request
                                    form.find('input[name=key]').val(data.key);
                                    form.find('input[name=policy]').val(data.policy);
                                    form.find('input[name=signature]').val(data.signature);
                                    form.find('input[name=Content-Type]').val(data.contentType);
                                }
                            });
                            data.submit();
                        },
                        send: function(e, data){
                            newBlockView.$('#grid-image span').html('Uploading <b>...</b>');
                            newBlockView.$('.js-save-grid-item').addClass('u-hide');
                        },
                        progress: function(e, data){
                            var percent = Math.round((e.loaded / e.total) * 100);
                            newBlockView.$('#grid-image span b').text(percent + '%');
                        },
                        fail: function(e, data){
                            newBlockView.$('#grid-image span').html('Optional image');
                            newBlockView.$('.js-save-grid-item').removeClass('u-hide');
                        },
                        success: function(data){
                            grid_item_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                            grid_item_image_url = encodeURI(grid_item_image_url);
                            newBlockView.$('#grid-image span').addClass('u-hide');
                            newBlockView.$('#grid-image').css('backgroundImage', 'url('+grid_item_image_url+')');
                            newBlockView.$('.js-save-grid-item').removeClass('u-hide');
                        }
                    });
                });
            });
            //SAVE
            //Save body HTML
            newBlockView.on('save:htmlBlock', function(value){
                if(richTextEditor){
                    var nativeEditor = richTextEditor.get('nativeEditor');
                    var text = nativeEditor.getData();
                    var new_block = new ProjectManager.Entities.Block({
                        type: value.type,
                        text: text,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    //Save and upload image
                    async.series([
                        function(callback){
                            if(newBlockView.$('.text-content .upload-image').length){
                                newBlockView.$('.js-save-block').text('Uploading...').addClass('u-disabled');
                                //Upload
                                editorUploadImage(richTextEditorFiles, function(image_urls){
                                    richTextEditorFiles = [];
                                    if(image_urls && image_urls.length){
                                        new_block.set('text', nativeEditor.getData());
                                        new_block.set('images', image_urls);
                                        new_block.set('image', image_urls[0]);
                                        callback();
                                    } else {
                                        callback();
                                    }
                                });
                            } else {
                                callback();
                            }
                        }
                    ],
                    function(err){
                        newBlockView.$('.js-save-block').text('Save').removeClass('u-disabled');
                        new_block.save({}, {success: function(){
                            richTextEditor.destroy();
                            ProjectManager.commands.execute('close:overlay');
                            ProjectManager.vent.trigger('add:block', new_block);
                        }});
                    });
                }
            });
            //Save block
            newBlockView.on('save:block', function(value){
                if(value.type == 'button'){
                    //Button
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'button',
                        text: value.text,
                        button_url: value.button_url,
                        button_block: value.button_block,
                        is_new_tab: value.is_new_tab,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        ProjectManager.vent.trigger('add:block', new_block);
                    }});
                } else if(value.type == 'divider'){
                    //Divider
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'divider',
                        text: value.text,
                        divider_time: value.divider_time,
                        divider_type: value.divider_type,
                        divider_name: value.divider_name,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        ProjectManager.vent.trigger('add:block', new_block);
                    }});
                } else if(value.type == 'toggle_list'){
                    //Toggle list
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'toggle_list',
                        title: value.title,
                        text: value.text,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.vent.trigger('add:block', new_block);
                        //Clear
                        newBlockView.$('.block-toggle-title').val('').focus();
                        newBlockView.$('.block-toggle-text').val('');
                        //Update block id
                        newBlockView.$('.js-save-toggle-item').data('block', new_block.get('_id'));
                        var item = new_block.get('items')[0];
                        //Add item
                        newBlockView.$('.toggle-list').append("<div class='one-item one-toggle-item' data-id='"+item._id+"'><div class='item-title'>"+item.title+"</div><div class='item-text'>"+item.text+"</div><span class='remove-item u-delete'>Remove</span></div>");
                    }});
                } else if(value.type == 'link'){
                    //Link
                    if(!value.image){
                        var new_block = new ProjectManager.Entities.Block({
                            type: 'link',
                            linkdata: value.linkdata,
                            order: order,
                            course: value.course,
                            container: value.container
                        });
                        new_block.save({}, {success: function(){
                            ProjectManager.commands.execute('close:overlay');
                            ProjectManager.vent.trigger('add:block', new_block);
                        }});
                    } else {
                        var new_block = new ProjectManager.Entities.Block({
                            type: 'link',
                            linkdata: value.linkdata,
                            image: value.image,
                            order: order,
                            course: value.course,
                            container: value.container
                        });
                        //Get bound
                        var image = new Image();
                        image.src = value.image;
                        image.onload = function(){
                            var bound = ( this.height * 400 ) / this.width;
                            if(bound) {
                                bound = parseInt(bound);
                                new_block.set('bound', bound);
                            }
                            new_block.save({}, {success: function(){
                                ProjectManager.commands.execute('close:overlay');
                                ProjectManager.vent.trigger('add:block', new_block);
                            }});
                        };
                        image.onerror = function(){
                            new_block.save({}, {success: function(){
                                ProjectManager.commands.execute('close:overlay');
                                ProjectManager.vent.trigger('add:block', new_block);
                            }});
                        };
                    }
                } else if(value.type == 'gif'){
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'gif',
                        gif_embed: value.gif_embed,
                        gif_url: value.gif_url,
                        width: value.width,
                        height: value.height,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        ProjectManager.vent.trigger('add:block', new_block);
                    }});
                } else if(value.type == 'mcq'){
                    //MCQ
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'mcq',
                        title: value.title,
                        is_multiple: value.is_multiple,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.vent.trigger('add:block', new_block);
                        //Show options
                        newBlockView.$('.block-mcq-title').attr('readonly', true);
                        newBlockView.$('.is-multiple-label, .js-save-block').addClass('u-hide');
                        newBlockView.$('.mcq-new-option, .js-done').removeClass('u-hide');
                        //Update block id
                        newBlockView.$('.js-save-mcq-item').data('block', new_block.get('_id'));
                    }});
                } else if(value.type == 'fill'){
                    //Fill in the blanks
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'fill',
                        title: value.title,
                        text: value.text,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.vent.trigger('add:block', new_block);
                        //Show fill options
                        newBlockView.$('.block-fill-title').attr('readonly', true);
                        newBlockView.$('.block-fill-text , .js-save-block').addClass('u-hide');
                        newBlockView.$('.fill-new-item, .js-done').removeClass('u-hide');
                        //Update block id
                        newBlockView.$('.js-save-fill-item').data('block', new_block.get('_id'));
                    }});
                } else if(value.type == 'match'){
                    //Match the following
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'match',
                        title: value.title,
                        text: value.text,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.vent.trigger('add:block', new_block);
                        //Show match options
                        newBlockView.$('.block-match-title').attr('readonly', true);
                        newBlockView.$('.block-match-text , .js-save-block').addClass('u-hide');
                        newBlockView.$('.match-new-item, .js-done').removeClass('u-hide');
                        //Update block id
                        newBlockView.$('.js-save-match-item').data('block', new_block.get('_id'));
                    }});
                } else if(value.type == 'response'){
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'response',
                        title: value.title,
                        text: value.text,
                        response_type: value.response_type,
                        order: order,
                        course: value.course,
                        container: value.container,
                        keywords: value.keywords
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        ProjectManager.vent.trigger('add:block', new_block);
                    }});
                } else if(value.type == 'list'){
                    //List
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'list',
                        title: value.title,
                        text: value.text,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.vent.trigger('add:block', new_block);
                        //Show options
                        newBlockView.$('.block-list-title').attr('readonly', true);
                        newBlockView.$('.block-list-text, .js-save-block').addClass('u-hide');
                        newBlockView.$('.list-new-item, .js-done').removeClass('u-hide');
                        //Update block id
                        newBlockView.$('.js-save-list-item').data('block', new_block.get('_id'));
                    }});
                } else if(value.type == 'container'){
                    //Container
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'container',
                        title: value.title,
                        text: value.text,
                        image: container_image_url,
                        bound: container_bound,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        ProjectManager.vent.trigger('add:block', new_block);
                    }});
                } else if(value.type == 'grid'){
                    //Grid
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'grid',
                        title: value.title,
                        text: value.text,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.vent.trigger('add:block', new_block);
                        //Show options
                        newBlockView.$('.block-grid-title').attr('readonly', true);
                        newBlockView.$('.block-grid-text, .js-save-block').addClass('u-hide');
                        newBlockView.$('.grid-new-item, .js-done').removeClass('u-hide');
                        //Update block id
                        newBlockView.$('.js-save-grid-item').data('block', new_block.get('_id'));
                    }});
                } else if(value.type == 'comic'){
                    //Comic
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'comic',
                        text: value.text,
                        image: comic_url,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        ProjectManager.vent.trigger('add:block', new_block);
                    }});
                } else if(value.type == 'embed'){
                    //Embed
                    var new_block = new ProjectManager.Entities.Block({
                        type: 'embed',
                        title: value.title,
                        embed_code: value.embed_code,
                        width: value.width,
                        height: value.height,
                        order: order,
                        course: value.course,
                        container: value.container
                    });
                    new_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        ProjectManager.vent.trigger('add:block', new_block);
                    }});
                }
            });
            //Add toggle item
            newBlockView.on('add:toggleItem', function(value){
                 var new_item = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'add_item'
                });
                new_item.set({
                    title: value.title,
                    text: value.text
                });
                new_item.save({}, {success: function(){
                    //Clear
                    newBlockView.$('.block-toggle-title').val('').focus();
                    newBlockView.$('.block-toggle-text').val('').focus();
                    //Add item
                    newBlockView.$('.toggle-list').append("<div class='one-item one-toggle-item' data-id='"+new_item.get('_id')+"'><div class='item-title'>"+new_item.get('title')+"</div><div class='item-text'>"+new_item.get('text')+"</div><span class='remove-item u-delete'>Remove</span></div>");
                }});
            });
            //Remove toggle item
            newBlockView.on('remove:toggleItem', function(value){
                var block = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'remove_item'
                });
                block.set({
                    item: value.item
                });
                block.save();
            });
            //Add MCQ option
            newBlockView.on('add:mcqOption', function(value){
                 var new_option = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'add_option'
                });
                new_option.set({
                    text: value.text,
                    image: mcq_option_image_url,
                    bound: mcq_option_bound
                });
                new_option.save({}, {success: function(){
                    //Clear
                    newBlockView.$('.mcq-new-option .option-text').val('').focus();
                    newBlockView.$('.mcq-new-option #option-image').css('backgroundImage', '');
                    newBlockView.$('.mcq-new-option #option-image span').html('Optional image');
                    //Add item
                    newBlockView.$('.mcq-option-list').append("<div class='one-item one-mcq-item' data-id='"+new_option.get('_id')+"'><div class='item-title'>"+new_option.get('text')+"</div><span class='correct-item'>Set as correct</span><span class='remove-item u-delete'>Remove</span></div>");
                }});
            });
            //Set correct MCQ option
            newBlockView.on('correct:mcqOption', function(value){
                var block = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'correct_mcq_option'
                });
                block.set({
                    option: value.option,
                    is_correct: value.is_correct
                });
                block.save({}, {success: function(){
                    if(value.is_correct){
                        //Remove other correct option
                        if(!block.get('is_multiple')){
                            newBlockView.$('.one-mcq-item .correct-item.selected').removeClass('selected').text('Set as correct');
                        }
                        newBlockView.$(".one-mcq-item[data-id='" + value.option + "'] .correct-item").addClass('selected').text('Correct option');
                    } else {
                        newBlockView.$(".one-mcq-item[data-id='" + value.option + "'] .correct-item").removeClass('selected').text('Set as correct');
                    }
                }});
            });
            //Remove MCQ option
            newBlockView.on('remove:mcqOption', function(value){
                var block = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'remove_option'
                });
                block.set({
                    option: value.option
                });
                block.save();
            });
            //Add fill
            newBlockView.on('add:fill', function(value){
                 var new_fill = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'add_fill'
                });
                new_fill.set({
                    text: value.text,
                    is_blank: value.is_blank,
                    size: value.size,
                    options: value.options
                });
                new_fill.save({}, {success: function(){
                    //Clear
                    newBlockView.$('.fill-new-item .fill-text').val('').focus();
                    newBlockView.$('.fill-new-item .fill-size').val('');
                    //Add item
                    if(new_fill.get('text')){
                        newBlockView.$('.fill-list').append("<div class='one-item one-fill-item' data-id='"+new_fill.get('_id')+"'><div class='item-title'>"+new_fill.get('text')+"</div><span class='remove-item u-delete'>Remove</span></div>");
                    } else {
                        newBlockView.$('.fill-list').append("<div class='one-item one-fill-item' data-id='"+new_fill.get('_id')+"'><input placeholder='' type='' autocomplete='' class='blank-fill entity-title'><span class='update-item'>Update</span><span class='remove-item u-delete'>Remove</span></div>");
                    }
                }});
            });
            //Update fill
            newBlockView.on('update:fill', function(value){
                var block = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'edit_fill'
                });
                block.set({
                    fill: value.fill,
                    keywords: value.keywords
                });
                block.save({}, {success: function(){
                    if(value.keywords){
                        var keywords = value.keywords.toLowerCase().match(/(?=\S)[^,]+?(?=\s*(,|$))/g).join().replace(/,/g, ", ");
                        newBlockView.$(".one-fill-item[data-id='" + value.fill + "'] .blank-fill").val(keywords);
                    }
                }});
            });
            //Remove fill
            newBlockView.on('remove:fill', function(value){
                var block = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'remove_fill'
                });
                block.set({
                    fill: value.fill
                });
                block.save();
            });
            //Add match option
            newBlockView.on('add:matchOption', function(value){
                 var new_option = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'add_option'
                });
                if(value.is_optionb){
                    new_option.set({
                        text: value.text,
                        image: right_image_url,
                        bound: right_bound,
                        is_optionb: value.is_optionb
                    });
                } else {
                    new_option.set({
                        text: value.text,
                        image: left_image_url,
                        bound: left_bound
                    });
                }
                new_option.save({}, {success: function(){
                    if(value.is_optionb){
                        newBlockView.$('.option-text-right').val('').focus();
                        newBlockView.$('#option-image-right').css('backgroundImage', '');
                        newBlockView.$('#option-image-right span').html('Optional image').removeClass('u-hide');
                        newBlockView.$('.options-right .js-save-match-item').removeClass('u-hide');
                        //Add item
                        newBlockView.$('.match-option-list-right').append("<div class='one-item' data-id='"+new_option.get('_id')+"'><div class='item-text'>"+new_option.get('text')+"</div></div>");
                    } else {
                        newBlockView.$('.option-text-left').val('').focus();
                        newBlockView.$('#option-image-left').css('backgroundImage', '');
                        newBlockView.$('#option-image-left span').html('Optional image').removeClass('u-hide');
                        newBlockView.$('.options-left .js-save-match-item').removeClass('u-hide');
                        //Add item
                        newBlockView.$('.match-option-list-left').append("<div class='one-item' data-id='"+new_option.get('_id')+"'><div class='item-text'>"+new_option.get('text')+"</div></div>");
                    }
                }});
            });
            //Add List item
            newBlockView.on('add:listItem', function(value){
                 var new_item = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'add_list_item'
                });
                new_item.set({
                    item_type: value.item_type,
                    text: value.text,
                    image: list_item_image_url,
                    bound: list_item_bound,
                    is_right: value.is_right
                });
                new_item.save({}, {success: function(){
                    //Clear
                    newBlockView.$('.list-new-item .list-item-text').val('').focus();
                    newBlockView.$('.list-new-item #list-image').css('backgroundImage', '');
                    newBlockView.$('.list-new-item #list-image span').html('Optional image');
                    //Add item
                    if(new_item.get('text')){
                        var text = new_item.get('text');
                    } else {
                        var text = 'List item';
                    }
                    newBlockView.$('.list-item-list').append("<div class='one-item one-list-item' data-id='"+new_item.get('_id')+"'><div class='item-title'>"+text+"</div><span class='remove-item u-delete'>Remove</span></div>");
                }});
            });
            //Remove List item
            newBlockView.on('remove:listItem', function(value){
                var block = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'remove_list_item'
                });
                block.set({
                    item: value.item
                });
                block.save();
            });
            //Add Grid item
            newBlockView.on('add:gridItem', function(value){
                 var new_item = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'add_grid_item'
                });
                new_item.set({
                    text: value.text,
                    image: grid_item_image_url,
                    bound: grid_item_bound
                });
                new_item.save({}, {success: function(){
                    //Clear
                    newBlockView.$('.grid-new-item .grid-item-text').val('').focus();
                    newBlockView.$('.grid-new-item #grid-image').css('backgroundImage', '');
                    newBlockView.$('.grid-new-item #grid-image span').html('Optional image');
                    //Add item
                    if(new_item.get('text')){
                        var text = new_item.get('text');
                    } else {
                        var text = 'Image item';
                    }
                    newBlockView.$('.grid-item-list').append("<div class='one-item one-grid-item' data-id='"+new_item.get('_id')+"'><div class='item-title'>"+text+"</div><span class='remove-item u-delete'>Remove</span></div>");
                }});
            });
            //Remove Grid item
            newBlockView.on('remove:gridItem', function(value){
                var block = new ProjectManager.Entities.Block({
                    _id: value.block,
                    _action: 'remove_grid_item'
                });
                block.set({
                    item: value.item
                });
                block.save();
            });
            ProjectManager.overlayRegion.show(newBlockView);
        },
        showEditBlockOverlay: function(block_id){
            $('.overlay').show();
            var mcq_option_bound, mcq_option_image_url;
            var left_image_url, left_bound, right_image_url, right_bound, list_item_image_url, list_item_bound, grid_item_image_url, grid_item_bound, container_image_url, container_bound;
            //Fetch block
            var fetchingBlock = ProjectManager.request('block:entity', block_id);
            $.when(fetchingBlock).done(function(block){
                var newBlockView = new ProjectManager.ProjectApp.EntityViews.NewBlockView();
                //Editor
                var richTextEditor;
                var richTextEditorFiles = [];
                //Show
                newBlockView.on('show', function(){
                    //Add edit class
                    newBlockView.$('.overlay-box').addClass('edit-box');
                    newBlockView.$('.overlay-form .message').html('Edit block:');
                    setTimeout(function(){
                        newBlockView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Show section based on type
                    var type = block.get('type');
                    //Hide toolbar-btns
                    newBlockView.$('.toolbar-btns > p').addClass('u-hide');
                    //Hide area
                    newBlockView.$('.new-block-area .block-area').addClass('u-hide');
                    newBlockView.$('.toolbar-btn.btn-text').removeClass('selected');
                    //Show block actions
                    newBlockView.$('.block-overlay-actions').removeClass('u-hide');
                    //Show block order
                    newBlockView.$('.block-order').val(block.get('order'));
                    //If hidden from learners
                    if(block.get('is_hidden')){
                        newBlockView.$('.js-hide-learner').addClass('selected').text('Hidden from learners');
                    }
                    //Rich text
                    if(type == 'text'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-text').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-text').removeClass('u-hide');
                        //Wait till editor is ready
                        newBlockView.$('.block-text').bind('click mousedown dblclick', function(ev){
                           ev.preventDefault();
                           ev.stopImmediatePropagation();
                        });
                        richTextEditor = setUpAlloyToolbar(false, document.querySelector('.text-content'), false, false);
                        var nativeEditor = richTextEditor.get('nativeEditor');
                        //On editor ready
                        nativeEditor.on('instanceReady', function(ev){
                            newBlockView.$('.block-text').unbind();
                            nativeEditor.setData(block.get('text'));
                        });
                        //On image upload
                        nativeEditor.on('imageAdd', function(ev){
                            var id = generateRandomUUID();
                            ev.data.file.id = id;
                            richTextEditorFiles.push(ev.data.file);
                            $(ev.data.el.$).addClass('upload-image').attr('data-id', id);
                        });
                    } else if(type == 'button'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-button').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-button').removeClass('u-hide');
                        //Button fill values
                        newBlockView.$('.block-button-text').val(block.get('text')).focus();
                        if(block.get('button')){
                            if(block.get('button').url) newBlockView.$('.block-button-url').val(block.get('button').url);
                            if(block.get('button').block) newBlockView.$('.block-button-number').val(block.get('button').block);
                            if(block.get('button').is_new_tab) newBlockView.$('.newtab-label input').prop('checked', true);
                        }
                    } else if(type == 'divider'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-divider').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-divider').removeClass('u-hide');
                        //Divider fill values
                        if(block.get('text')) newBlockView.$('.block-divider-text').val(block.get('text')).focus();
                        if(block.get('divider')){
                            if(block.get('divider').time) newBlockView.$('.block-divider-time').val(block.get('divider').time);
                            if(block.get('divider').type && block.get('divider').name) newBlockView.$('.select-label.' + block.get('divider').type + '-' + block.get('divider').name).addClass('selected');
                        }
                    } else if(type == 'toggle_list'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-toggle-list').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-toggle-list').removeClass('u-hide');
                        //Hide save block
                        newBlockView.$('.js-save-block').addClass('u-hide');
                        newBlockView.$('.js-done').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-toggle-title').val('').focus();
                        newBlockView.$('.js-save-toggle-item').data('block', block.get('_id'));
                        if(block.get('items') && block.get('items').length){
                            for(var i=0; i<block.get('items').length; i++){
                                var item = block.get('items')[i];
                                newBlockView.$('.toggle-list').append("<div class='one-item one-toggle-item' data-id='"+item._id+"'><div class='item-title'>"+item.title+"</div><div class='item-text'>"+item.text+"</div><span class='remove-item u-delete'>Remove</span></div>");
                            }
                        }
                    } else if(type == 'image' || type == 'video' || type == 'audio' || type == 'file'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-' + type).removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-file').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-file-title').val(block.get('title')).focus();
                        newBlockView.$('#drop-file').addClass('u-hide');
                    } else if(type == 'mcq'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-mcq').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-mcq').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-mcq-title').val(block.get('title')).focus();
                        if(block.get('is_multiple')) newBlockView.$('.is-multiple-label input').prop('checked', true);
                        //Show mcqs
                        newBlockView.$('.mcq-new-option').removeClass('u-hide');
                        newBlockView.$('.js-save-mcq-item').data('block', block.get('_id'));
                        if(block.get('mcqs') && block.get('mcqs').length){
                            for(var i=0; i<block.get('mcqs').length; i++){
                                var option = block.get('mcqs')[i];
                                if(option.is_correct){
                                    newBlockView.$('.mcq-option-list').append("<div class='one-item one-mcq-item' data-id='"+option._id+"'><div class='item-title'>"+option.text+"</div><span class='correct-item selected'>Correct option</span><span class='remove-item u-delete'>Remove</span></div>");
                                } else {
                                    newBlockView.$('.mcq-option-list').append("<div class='one-item one-mcq-item' data-id='"+option._id+"'><div class='item-title'>"+option.text+"</div><span class='correct-item'>Set as correct</span><span class='remove-item u-delete'>Remove</span></div>");
                                }
                            }
                        }
                        //Trigger file browser
                        newBlockView.trigger('open:mcqFileBrowser');
                    } else if(type == 'fill'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-fill').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-fill').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-fill-title').val(block.get('title')).focus();
                        if(block.get('text')){
                            var tmp = document.createElement('div');
                            tmp.innerHTML = block.get('text').replace(/<br\s*[\/]?>/gi, '\n');
                            var text = tmp.textContent || tmp.innerText || "";
                            newBlockView.$('.block-fill-text').val(text);
                        }
                        //Show fills
                        newBlockView.$('.fill-new-item').removeClass('u-hide');
                        newBlockView.$('.js-save-fill-item').data('block', block.get('_id'));
                        if(block.get('fills') && block.get('fills').length){
                            for(var i=0; i<block.get('fills').length; i++){
                                var fill = block.get('fills')[i];
                                if(fill.text){
                                    newBlockView.$('.fill-list').append("<div class='one-item one-fill-item' data-id='"+fill._id+"'><div class='item-title'>"+fill.text+"</div><span class='remove-item u-delete'>Remove</span></div>");
                                } else {
                                    var keywords = '';
                                    if(fill.keywords && fill.keywords.length){
                                        keywords = fill.keywords.join().replace(/,/g, ", ");
                                    }
                                    newBlockView.$('.fill-list').append("<div class='one-item one-fill-item' data-id='"+fill._id+"'><input placeholder='' type='' autocomplete='' class='blank-fill entity-title' value='"+keywords+"'><span class='update-item'>Update</span><span class='remove-item u-delete'>Remove</span></div>");
                                }
                            }
                        }
                    } else if(type == 'match'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-match').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-match').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-match-title').val(block.get('title')).focus();
                        if(block.get('text')){
                            var tmp = document.createElement('div');
                            tmp.innerHTML = block.get('text').replace(/<br\s*[\/]?>/gi, '\n');
                            var text = tmp.textContent || tmp.innerText || "";
                            newBlockView.$('.block-match-text').val(text);
                        }
                        //Show options
                        newBlockView.$('.match-new-item').removeClass('u-hide');
                        newBlockView.$('.js-save-match-item').data('block', block.get('_id'));
                        if(block.get('options') && block.get('options').length){
                            for(var i=0; i<block.get('options').length; i++){
                                var option = block.get('options')[i];
                                if(option.is_optionb){
                                    newBlockView.$('.match-option-list-right').append("<div class='one-item' data-id='"+option._id+"'><div class='item-text'>"+option.text+"</div></div>");
                                } else {
                                    newBlockView.$('.match-option-list-left').append("<div class='one-item' data-id='"+option._id+"'><div class='item-text'>"+option.text+"</div></div>");
                                }
                            }
                        }
                        //Trigger file browser
                        newBlockView.trigger('open:matchFileBrowser');
                    } else if(type == 'response'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-response-' + block.get('response_type')).removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-response').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-response-title').val(block.get('title')).focus();
                        if(block.get('text')){
                            var tmp = document.createElement('div');
                            tmp.innerHTML = block.get('text').replace(/<br\s*[\/]?>/gi, '\n');
                            var text = tmp.textContent || tmp.innerText || "";
                            newBlockView.$('.block-response-text').val(text);
                        }
                        //If text response
                        if(block.get('response_type') == 'text'){
                            //Show keywords
                            newBlockView.$('.new-block-area .block-response .overlay-label').removeClass('u-hide');
                            newBlockView.$('.new-block-area .block-response .block-response-keywords').removeClass('u-hide');
                            if(block.get('keywords') && block.get('keywords').length){
                                var keywords = block.get('keywords').join().replace(/,/g, ", ");
                                newBlockView.$('.block-response-keywords').val(keywords);
                            }
                        }
                        //Show required btn
                        newBlockView.$('.block-overlay-actions .js-required').removeClass('u-hide');
                        //If required
                        if(block.get('is_required')){
                            newBlockView.$('.js-required').addClass('selected').text('Required*');
                        }
                    } else if(type == 'list'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-list').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-list').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-list-title').val(block.get('title')).focus();
                        if(block.get('text')){
                            var tmp = document.createElement('div');
                            tmp.innerHTML = block.get('text').replace(/<br\s*[\/]?>/gi, '\n');
                            var text = tmp.textContent || tmp.innerText || "";
                            newBlockView.$('.block-list-text').val(text);
                        }
                        //Show items
                        newBlockView.$('.list-new-item').removeClass('u-hide');
                        newBlockView.$('.js-save-list-item').data('block', block.get('_id'));
                        if(block.get('items') && block.get('items').length){
                            for(var i=0; i<block.get('items').length; i++){
                                var item = block.get('items')[i];
                                if(item.text){
                                    var text = item.text;
                                } else {
                                    var text = 'List item';
                                }
                                newBlockView.$('.list-item-list').append("<div class='one-item one-list-item' data-id='"+item._id+"'><div class='item-title'>"+text+"</div><span class='remove-item u-delete'>Remove</span></div>");
                            }
                        }
                        //Trigger file browser
                        newBlockView.trigger('open:listFileBrowser');
                    } else if(type == 'container'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-container').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-container').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-container-title').val(block.get('title')).focus();
                        if(block.get('text')){
                            var tmp = document.createElement('div');
                            tmp.innerHTML = block.get('text').replace(/<br\s*[\/]?>/gi, '\n');
                            var text = tmp.textContent || tmp.innerText || "";
                            newBlockView.$('.block-container-text').val(text);
                        }
                        //Trigger file browser
                        newBlockView.trigger('open:containerFileBrowser');
                    } else if(type == 'grid'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-grid').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-grid').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-grid-title').val(block.get('title')).focus();
                        if(block.get('text')){
                            var tmp = document.createElement('div');
                            tmp.innerHTML = block.get('text').replace(/<br\s*[\/]?>/gi, '\n');
                            var text = tmp.textContent || tmp.innerText || "";
                            newBlockView.$('.block-grid-text').val(text);
                        }
                        //Show items
                        newBlockView.$('.grid-new-item').removeClass('u-hide');
                        newBlockView.$('.js-save-grid-item').data('block', block.get('_id'));
                        if(block.get('items') && block.get('items').length){
                            for(var i=0; i<block.get('items').length; i++){
                                var item = block.get('items')[i];
                                if(item.text){
                                    var text = item.text;
                                } else {
                                    var text = 'Image item';
                                }
                                newBlockView.$('.grid-item-list').append("<div class='one-item one-grid-item' data-id='"+item._id+"'><div class='item-title'>"+text+"</div><span class='remove-item u-delete'>Remove</span></div>");
                            }
                        }
                        //Trigger file browser
                        newBlockView.trigger('open:gridFileBrowser');
                    } else if(type == 'comic'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-comic').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-comic').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-comic-text').val(block.get('text')).focus();
                        newBlockView.$('.comic-upload, .block-comic .overlay-label').addClass('u-hide');
                    } else if(type == 'embed'){
                        //Show toolbar-btn
                        newBlockView.$('.toolbar-btn.btn-embed').removeClass('u-hide').addClass('selected');
                        //Show area
                        newBlockView.$('.new-block-area .block-embed').removeClass('u-hide');
                        //Fill values
                        newBlockView.$('.block-embed-title').val(block.get('title'));
                        newBlockView.$('.block-embed-code').val(block.get('embed').code).focus();
                        if(block.get('embed').width) newBlockView.$('.block-embed-width').val(block.get('embed').width);
                        if(block.get('embed').height) newBlockView.$('.block-embed-height').val(block.get('embed').height);
                    }
                });
                //Upload MCQ option image
                newBlockView.on('open:mcqFileBrowser', function(){
                    newBlockView.$('.option-image-upload').each(function(){
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#option-image'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Get bound
                                var image = new Image();
                                image.src = window.URL.createObjectURL(data.files[0]);
                                image.onload = function() {
                                    mcq_option_bound = ( image.naturalHeight * 200 ) / image.naturalWidth;
                                    if(mcq_option_bound) mcq_option_bound = parseInt(mcq_option_bound);
                                    window.URL.revokeObjectURL(image.src);
                                };
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                newBlockView.$('#option-image span').html('Uploading <b>...</b>');
                                newBlockView.$('.js-save-mcq-item').addClass('u-hide');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                newBlockView.$('#option-image span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                newBlockView.$('#option-image span').html('Optional image');
                                newBlockView.$('.js-save-mcq-item').removeClass('u-hide');
                            },
                            success: function(data){
                                mcq_option_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                mcq_option_image_url = encodeURI(mcq_option_image_url);
                                newBlockView.$('#option-image span').addClass('u-hide');
                                newBlockView.$('#option-image').css('backgroundImage', 'url('+mcq_option_image_url+')');
                                newBlockView.$('.js-save-mcq-item').removeClass('u-hide');
                            }
                        });
                    });
                });
                //Upload Match option image
                newBlockView.on('open:matchFileBrowser', function(){
                    //Upload option image left
                    newBlockView.$('.option-image-upload-left').each(function(){
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#option-image-left'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Get bound
                                var image = new Image();
                                image.src = window.URL.createObjectURL(data.files[0]);
                                image.onload = function() {
                                    left_bound = ( image.naturalHeight * 200 ) / image.naturalWidth;
                                    if(left_bound) left_bound = parseInt(left_bound);
                                    window.URL.revokeObjectURL(image.src);
                                };
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                newBlockView.$('#option-image-left span').html('Uploading <b>...</b>');
                                newBlockView.$('.options-left .js-save-match-item').addClass('u-hide');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                newBlockView.$('#option-image-left span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                newBlockView.$('#option-image-left span').html('Optional image');
                                newBlockView.$('.options-left .js-save-match-item').removeClass('u-hide');
                            },
                            success: function(data){
                                left_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                left_image_url = encodeURI(left_image_url);
                                newBlockView.$('#option-image-left span').addClass('u-hide');
                                newBlockView.$('#option-image-left').css('backgroundImage', 'url('+left_image_url+')');
                                newBlockView.$('.options-left .js-save-match-item').removeClass('u-hide');
                            }
                        });
                    });
                    //Upload option image right
                    newBlockView.$('.option-image-upload-right').each(function(){
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#option-image-right'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Get bound
                                var image = new Image();
                                image.src = window.URL.createObjectURL(data.files[0]);
                                image.onload = function() {
                                    right_bound = ( image.naturalHeight * 200 ) / image.naturalWidth;
                                    if(right_bound) right_bound = parseInt(right_bound);
                                    window.URL.revokeObjectURL(image.src);
                                };
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                newBlockView.$('#option-image-right span').html('Uploading <b>...</b>');
                                newBlockView.$('.options-right .js-save-match-item').addClass('u-hide');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                newBlockView.$('#option-image-right span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                newBlockView.$('#option-image-right span').html('Optional image');
                                newBlockView.$('.options-right .js-save-match-item').removeClass('u-hide');
                            },
                            success: function(data){
                                right_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                right_image_url = encodeURI(right_image_url);
                                newBlockView.$('#option-image-right span').addClass('u-hide');
                                newBlockView.$('#option-image-right').css('backgroundImage', 'url('+right_image_url+')');
                                newBlockView.$('.options-right .js-save-match-item').removeClass('u-hide');
                            }
                        });
                    });
                });
                //Upload list item image
                newBlockView.on('open:listFileBrowser', function(){
                    newBlockView.$('.list-image-upload').each(function(){
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#list-image'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Get bound
                                var image = new Image();
                                image.src = window.URL.createObjectURL(data.files[0]);
                                image.onload = function() {
                                    list_item_bound = ( image.naturalHeight * 200 ) / image.naturalWidth;
                                    if(list_item_bound) list_item_bound = parseInt(list_item_bound);
                                    window.URL.revokeObjectURL(image.src);
                                };
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                newBlockView.$('#list-image span').html('Uploading <b>...</b>');
                                newBlockView.$('.js-save-list-item').addClass('u-hide');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                newBlockView.$('#list-image span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                newBlockView.$('#list-image span').html('Optional image');
                                newBlockView.$('.js-save-list-item').removeClass('u-hide');
                            },
                            success: function(data){
                                list_item_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                list_item_image_url = encodeURI(list_item_image_url);
                                newBlockView.$('#list-image span').addClass('u-hide');
                                newBlockView.$('#list-image').css('backgroundImage', 'url('+list_item_image_url+')');
                                newBlockView.$('.js-save-list-item').removeClass('u-hide');
                            }
                        });
                    });
                });
                //Upload container image
                newBlockView.on('open:containerFileBrowser', function(){
                    newBlockView.$('.container-upload').each(function(){
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#drop-container'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Get bound
                                var image = new Image();
                                image.src = window.URL.createObjectURL(data.files[0]);
                                image.onload = function() {
                                    container_bound = ( image.naturalHeight * 800 ) / image.naturalWidth;
                                    container_bound = container_bound / 2; //for retina
                                    if(container_bound) container_bound = parseInt(container_bound);
                                    window.URL.revokeObjectURL(image.src);
                                };
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                newBlockView.$('#drop-container span').html('Uploading <b>...</b>');
                                newBlockView.$('.js-save').addClass('u-disabled');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                newBlockView.$('#drop-container span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                newBlockView.$('#drop-container span').html('Choose container image');
                                newBlockView.$('.js-save').removeClass('u-disabled');
                            },
                            success: function(data){
                                container_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                container_image_url = encodeURI(container_image_url);
                                //Show save button
                                newBlockView.$('#drop-container span').addClass('u-hide');
                                newBlockView.$('#drop-container').css('backgroundImage', 'url('+container_image_url+')');
                                newBlockView.$('.js-save').removeClass('u-disabled');
                            }
                        });
                    });
                });
                //Upload grid item image
                newBlockView.on('open:gridFileBrowser', function(){
                    newBlockView.$('.grid-image-upload').each(function(){
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#grid-image'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Get bound
                                var image = new Image();
                                image.src = window.URL.createObjectURL(data.files[0]);
                                image.onload = function() {
                                    grid_item_bound = ( image.naturalHeight * 400 ) / image.naturalWidth;
                                    if(grid_item_bound) grid_item_bound = parseInt(grid_item_bound);
                                    window.URL.revokeObjectURL(image.src);
                                };
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                newBlockView.$('#grid-image span').html('Uploading <b>...</b>');
                                newBlockView.$('.js-save-grid-item').addClass('u-hide');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                newBlockView.$('#grid-image span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                newBlockView.$('#grid-image span').html('Optional image');
                                newBlockView.$('.js-save-grid-item').removeClass('u-hide');
                            },
                            success: function(data){
                                grid_item_image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                grid_item_image_url = encodeURI(grid_item_image_url);
                                newBlockView.$('#grid-image span').addClass('u-hide');
                                newBlockView.$('#grid-image').css('backgroundImage', 'url('+grid_item_image_url+')');
                                newBlockView.$('.js-save-grid-item').removeClass('u-hide');
                            }
                        });
                    });
                });
                //Update body HTML
                newBlockView.on('update:htmlBlock', function(value){
                    if(richTextEditor){
                        var nativeEditor = richTextEditor.get('nativeEditor');
                        var text = nativeEditor.getData();
                        var edit_block = new ProjectManager.Entities.Block({
                            _id: block_id,
                            _action: 'edit_text'
                        });
                        edit_block.set({
                            text: text
                        });
                        //Save and upload image
                        async.series([
                            function(callback){
                                if(newBlockView.$('.text-content .upload-image').length){
                                    newBlockView.$('.js-save-block').text('Uploading...').addClass('u-disabled');
                                    //Upload
                                    editorUploadImage(richTextEditorFiles, function(image_urls){
                                        richTextEditorFiles = [];
                                        if(image_urls && image_urls.length){
                                            edit_block.set('text', nativeEditor.getData());
                                            edit_block.set('images', image_urls);
                                            edit_block.set('image', image_urls[0]);
                                            callback();
                                        } else {
                                            callback();
                                        }
                                    });
                                } else {
                                    callback();
                                }
                            }
                        ],
                        function(err){
                            newBlockView.$('.js-save-block').text('Save').removeClass('u-disabled');
                            edit_block.save({}, {success: function(){
                                richTextEditor.destroy();
                                ProjectManager.commands.execute('close:overlay');
                            }});
                        });
                    }
                });
                //Update order
                newBlockView.on('update:order', function(value){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: block_id,
                        _action: 'order'
                    });
                    edit_block.set({
                        order: value
                    });
                    edit_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        //Show blocks
                        if(edit_block.get('container')){
                            ProjectManager.vent.trigger('blocks:show', edit_block.get('course'), edit_block.get('container'));
                        } else {
                            ProjectManager.vent.trigger('blocks:show', edit_block.get('course'));
                        }
                    }});
                });
                //Update block
                newBlockView.on('update:block', function(value){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: block_id,
                        _action: 'edit'
                    });
                    edit_block.set({
                        title: value.title,
                        text: value.text,
                        image: container_image_url,
                        bound: container_bound,
                        button_url: value.button_url,
                        button_block: value.button_block,
                        is_new_tab: value.is_new_tab,
                        divider_time: value.divider_time,
                        divider_type: value.divider_type,
                        divider_name: value.divider_name,
                        is_multiple: value.is_multiple,
                        embed_code: value.embed_code,
                        embed_width: value.width,
                        embed_height: value.height,
                        is_required: value.is_required,
                        is_hidden: value.is_hidden,
                        keywords: value.keywords
                    });
                    edit_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                    }});
                });
                //Add toggle item
                newBlockView.on('add:toggleItem', function(value){
                     var new_item = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'add_item'
                    });
                    new_item.set({
                        title: value.title,
                        text: value.text
                    });
                    new_item.save({}, {success: function(){
                        //Clear
                        newBlockView.$('.block-toggle-title').val('').focus();
                        newBlockView.$('.block-toggle-text').val('').focus();
                        //Add item
                        newBlockView.$('.toggle-list').append("<div class='one-item one-toggle-item' data-id='"+new_item.get('_id')+"'><div class='item-title'>"+new_item.get('title')+"</div><div class='item-text'>"+new_item.get('text')+"</div><span class='remove-item u-delete'>Remove</span></div>");
                    }});
                });
                //Remove toggle item
                newBlockView.on('remove:toggleItem', function(value){
                    var block = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'remove_item'
                    });
                    block.set({
                        item: value.item
                    });
                    block.save();
                });
                //Add MCQ option
                newBlockView.on('add:mcqOption', function(value){
                     var new_option = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'add_option'
                    });
                    new_option.set({
                        text: value.text,
                        image: mcq_option_image_url,
                        bound: mcq_option_bound
                    });
                    new_option.save({}, {success: function(){
                        //Clear
                        newBlockView.$('.mcq-new-option .option-text').val('').focus();
                        newBlockView.$('.mcq-new-option #option-image').css('backgroundImage', '');
                        newBlockView.$('.mcq-new-option #option-image span').html('Optional image');
                        //Add item
                        newBlockView.$('.mcq-option-list').append("<div class='one-item one-mcq-item' data-id='"+new_option.get('_id')+"'><div class='item-title'>"+new_option.get('text')+"</div><span class='correct-item'>Set as correct</span><span class='remove-item u-delete'>Remove</span></div>");
                    }});
                });
                //Set correct MCQ option
                newBlockView.on('correct:mcqOption', function(value){
                    var block = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'correct_mcq_option'
                    });
                    block.set({
                        option: value.option,
                        is_correct: value.is_correct
                    });
                    block.save({}, {success: function(){
                        if(value.is_correct){
                            //Remove other correct option
                            if(!block.get('is_multiple')){
                                newBlockView.$('.one-mcq-item .correct-item.selected').removeClass('selected').text('Set as correct');
                            }
                            newBlockView.$(".one-mcq-item[data-id='" + value.option + "'] .correct-item").addClass('selected').text('Correct option');
                        } else {
                            newBlockView.$(".one-mcq-item[data-id='" + value.option + "'] .correct-item").removeClass('selected').text('Set as correct');
                        }
                    }});
                });
                //Remove MCQ option
                newBlockView.on('remove:mcqOption', function(value){
                    var block = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'remove_option'
                    });
                    block.set({
                        option: value.option
                    });
                    block.save();
                });
                //Add fill
                newBlockView.on('add:fill', function(value){
                     var new_fill = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'add_fill'
                    });
                    new_fill.set({
                        text: value.text,
                        is_blank: value.is_blank,
                        size: value.size,
                        options: value.options
                    });
                    new_fill.save({}, {success: function(){
                        //Clear
                        newBlockView.$('.fill-new-item .fill-text').val('').focus();
                        newBlockView.$('.fill-new-item .fill-size').val('');
                        //Add item
                        if(new_fill.get('text')){
                            newBlockView.$('.fill-list').append("<div class='one-item one-fill-item' data-id='"+new_fill.get('_id')+"'><div class='item-title'>"+new_fill.get('text')+"</div><span class='remove-item u-delete'>Remove</span></div>");
                        } else {
                            newBlockView.$('.fill-list').append("<div class='one-item one-fill-item' data-id='"+new_fill.get('_id')+"'><input placeholder='' type='' autocomplete='' class='blank-fill entity-title'><span class='update-item'>Update</span><span class='remove-item u-delete'>Remove</span></div>");
                        }
                    }});
                });
                //Update fill
                newBlockView.on('update:fill', function(value){
                    var block = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'edit_fill'
                    });
                    block.set({
                        fill: value.fill,
                        keywords: value.keywords
                    });
                    block.save({}, {success: function(){
                        if(value.keywords){
                            var keywords = value.keywords.toLowerCase().match(/(?=\S)[^,]+?(?=\s*(,|$))/g).join().replace(/,/g, ", ");
                            newBlockView.$(".one-fill-item[data-id='" + value.fill + "'] .blank-fill").val(keywords);
                        }
                    }});
                });
                //Remove fill
                newBlockView.on('remove:fill', function(value){
                    var block = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'remove_fill'
                    });
                    block.set({
                        fill: value.fill
                    });
                    block.save();
                });
                //Add match option
                newBlockView.on('add:matchOption', function(value){
                     var new_option = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'add_option'
                    });
                    if(value.is_optionb){
                        new_option.set({
                            text: value.text,
                            image: right_image_url,
                            bound: right_bound,
                            is_optionb: value.is_optionb
                        });
                    } else {
                        new_option.set({
                            text: value.text,
                            image: left_image_url,
                            bound: left_bound
                        });
                    }
                    new_option.save({}, {success: function(){
                        if(value.is_optionb){
                            newBlockView.$('.option-text-right').val('').focus();
                            newBlockView.$('#option-image-right').css('backgroundImage', '');
                            newBlockView.$('#option-image-right span').html('Optional image').removeClass('u-hide');
                            newBlockView.$('.options-right .js-save-match-item').removeClass('u-hide');
                            //Add item
                            newBlockView.$('.match-option-list-right').append("<div class='one-item' data-id='"+new_option.get('_id')+"'><div class='item-text'>"+new_option.get('text')+"</div></div>");
                        } else {
                            newBlockView.$('.option-text-left').val('').focus();
                            newBlockView.$('#option-image-left').css('backgroundImage', '');
                            newBlockView.$('#option-image-left span').html('Optional image').removeClass('u-hide');
                            newBlockView.$('.options-left .js-save-match-item').removeClass('u-hide');
                            //Add item
                            newBlockView.$('.match-option-list-left').append("<div class='one-item' data-id='"+new_option.get('_id')+"'><div class='item-text'>"+new_option.get('text')+"</div></div>");
                        }
                    }});
                });
                //Add List item
                newBlockView.on('add:listItem', function(value){
                     var new_item = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'add_list_item'
                    });
                    new_item.set({
                        item_type: value.item_type,
                        text: value.text,
                        image: list_item_image_url,
                        bound: list_item_bound,
                        is_right: value.is_right
                    });
                    new_item.save({}, {success: function(){
                        //Clear
                        newBlockView.$('.list-new-item .list-item-text').val('').focus();
                        newBlockView.$('.list-new-item #list-image').css('backgroundImage', '');
                        newBlockView.$('.list-new-item #list-image span').html('Optional image');
                        //Add item
                        if(new_item.get('text')){
                            var text = new_item.get('text');
                        } else {
                            var text = 'List item';
                        }
                        newBlockView.$('.list-item-list').append("<div class='one-item one-list-item' data-id='"+new_item.get('_id')+"'><div class='item-title'>"+text+"</div><span class='remove-item u-delete'>Remove</span></div>");
                    }});
                });
                //Remove List item
                newBlockView.on('remove:listItem', function(value){
                    var block = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'remove_list_item'
                    });
                    block.set({
                        item: value.item
                    });
                    block.save();
                });
                //Add Grid item
                newBlockView.on('add:gridItem', function(value){
                     var new_item = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'add_grid_item'
                    });
                    new_item.set({
                        text: value.text,
                        image: grid_item_image_url,
                        bound: grid_item_bound
                    });
                    new_item.save({}, {success: function(){
                        //Clear
                        newBlockView.$('.grid-new-item .grid-item-text').val('').focus();
                        newBlockView.$('.grid-new-item #grid-image').css('backgroundImage', '');
                        newBlockView.$('.grid-new-item #grid-image span').html('Optional image');
                        //Add item
                        if(new_item.get('text')){
                            var text = new_item.get('text');
                        } else {
                            var text = 'Image item';
                        }
                        newBlockView.$('.grid-item-list').append("<div class='one-item one-grid-item' data-id='"+new_item.get('_id')+"'><div class='item-title'>"+text+"</div><span class='remove-item u-delete'>Remove</span></div>");
                    }});
                });
                //Remove Grid item
                newBlockView.on('remove:gridItem', function(value){
                    var block = new ProjectManager.Entities.Block({
                        _id: value.block,
                        _action: 'remove_grid_item'
                    });
                    block.set({
                        item: value.item
                    });
                    block.save();
                });
                //Delete block
                newBlockView.on('delete:block', function(){
                    var block = new ProjectManager.Entities.Block({
                        _id: block_id
                    });
                    block.destroy({
                        dataType: 'text',
                        success: function(model, response){
                            location.reload();
                        }
                    });
                });
                ProjectManager.overlayRegion.show(newBlockView);
            });
        },
        showBlocks: function(course_id, container_id, container_title){
            //Show loading page
            var loadingView = new ProjectManager.Common.Views.Loading();
            ProjectManager.contentRegion.show(loadingView);
            //Fetch blocks
            var fetchingBlocks = ProjectManager.request('block:entities', course_id, container_id);
            $.when(fetchingBlocks).done(function(blocks){
                var blocksView = new ProjectManager.ProjectApp.EntityViews.BlocksView({
                    collection: blocks
                });
                //Show
                blocksView.on('show', function(){
                    //Update header title
                    if(container_id){
                        if(container_title){
                            var title = container_title;
                        } else if(blocks && blocks.length){
                            var title = blocks.first().get('container').title;
                        } else {
                            var title = '...';
                        }
                        var course_slug = $('.mainHeader .header-title').data('slug');
                        $('.mainHeader .header-now').addClass('header-back').removeClass('header-now');
                        $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                        $('.mainHeader .header-title').append("<a href='/course/" + course_slug + "/"+ container_id +"' class='header-container header-now' data-id='"+container_id+"'>"+title+"</a>");
                    }
                    //Show progress btn
                    if(!learnerProgress){
                        blocksView.$('.js-start-course').removeClass('u-hide');
                    } else {
                        //Show all blocks
                        blocksView.$('.all-blocks').removeClass('u-hide');
                        //Show mark done btn
                        if(learnerProgress == 'certified'){
                            blocksView.$('.js-mark-done').removeClass('u-hide').addClass('js-certified').text('Download certificate');
                        } else if(learnerProgress == 'uncertified'){
                            blocksView.$('.js-mark-done').removeClass('u-hide').addClass('js-uncertified').text('Check for certificate');
                        } else if(learnerProgress == 'completed'){
                            blocksView.$('.js-mark-done').addClass('u-hide');
                        } else if(container_id && learnerContainers.length && learnerContainers.indexOf(container_id) > -1){
                            //Check if inside container
                            blocksView.$('.js-mark-done').addClass('u-hide');
                        } else {
                            blocksView.$('.js-mark-done').removeClass('u-hide');
                        }
                    }
                    //Mark containers as opaque
                    if(!container_id && (learnerProgress == 'active' || learnerProgress == 'certified') && learnerContainers.length){
                        for(var i=0; i<learnerContainers.length; i++){
                            blocksView.$(".one-block[data-id='" + learnerContainers[i] + "']").addClass('u-opaque');
                        }
                    }
                    //Show blocks
                    if($('.pageWrap').data('layout') == 'grid' && $('body').width() > 1100){
                        var totalWidth = parseInt(blocksView.$('.all-blocks').css('width'));
                        var start_index;
                        var heights = [];
                        blocksView.$('.all-blocks .one-block').each(function(i, obj) {
                            if(parseInt($(this).css('width')) != totalWidth){
                                if(!start_index) start_index = i;
                                heights.push(parseInt($(this).css('height')));
                            } else if(heights.length) {
                                var max_height = Math.max(...heights);
                                for(var j=start_index; j<i; j++){
                                    blocksView.$('.all-blocks .one-block').eq(j).css('height', max_height + 'px');
                                }
                                start_index = '';
                                heights = [];
                            }
                        });
                        blocksView.$('.all-blocks .one-block').removeClass('u-transparent');
                    } else {
                        blocksView.$('.all-blocks .one-block').removeClass('u-transparent');
                    }
                    //Show typeform
                    if(blocksView.$('.typeform-embed').length){
                        blocksView.$('iframe.typeform-embed').each(function(index){
                            var source = $('iframe.typeform-embed').eq(index).attr('src');
                            source = source + '#uniqueid=' + $('.pageWrap').data('uniqueid');
                            $('iframe.typeform-embed').eq(index).attr('src', source).attr('height', 600);
                        });
                    }
                    //Show video player
                    if(blocksView.$('.view-video').length){
                        blocksView.$('.view-video').each(function(index){
                            videojs(document.getElementsByClassName('view-video')[index], {}, function(){});
                        });
                    }
                    //Show audio player
                    blocksView.$('.audio-block audio').audioPlayer();
                    //Show audio player
                    if(blocksView.$('.view-audio').length){
                        var audioPlayerOptions = {
                            controls: true,
                            width: 600,
                            height: 300,
                            fluid: false,
                            plugins: {
                                wavesurfer: {
                                    src: "live",
                                    waveColor: "#ffffff",
                                    progressColor: "#ffffff",
                                    debug: false,
                                    cursorWidth: 1,
                                    msDisplayMax: 20,
                                    hideScrollbar: true
                                }
                            }
                        };
                        blocksView.$('.view-audio').each(function(index){
                            videojs(document.getElementsByClassName('view-audio')[index], audioPlayerOptions, function(){});
                        });
                    }
                    //Show audio response
                    var audioJournalOptions = {
                        controls: true,
                        width: 600,
                        height: 300,
                        fluid: false,
                        plugins: {
                            wavesurfer: {
                                src: "live",
                                waveColor: "#ffffff",
                                progressColor: "#ffffff",
                                debug: false,
                                cursorWidth: 1,
                                msDisplayMax: 20,
                                hideScrollbar: true
                            },
                            record: {
                                audio: true,
                                video: false,
                                maxLength: 20,
                                debug: false
                            }
                        }
                    };
                    var audioJournalPlayers = [];
                    var audioPlayerIds = [];
                    blocksView.$('.response-audio').each(function(){
                        audioPlayerIds.push(this.id);
                        audioJournalPlayers.push(videojs(this.id, audioJournalOptions));
                    });
                    audioJournalPlayers.forEach(function(player, i){
                        //data is available
                        player.on('finishRecord', function(){
                            //Upload file
                            var element = $('#' + audioPlayerIds[i]).next().next();
                            element.each(function(){
                                //For each file selected, process and upload
                                var form = $(this);
                                $(this).fileupload({
                                    url: form.attr('action'), //Grab form's action src
                                    type: 'POST',
                                    autoUpload: true,
                                    dataType: 'xml', //S3's XML response,
                                    add: function(event, data){
                                        //Upload through CORS
                                        $.ajax({
                                            url: '/api/signed',
                                            type: 'GET',
                                            dataType: 'json',
                                            data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                            async: false,
                                            success: function(data){
                                                // Now that we have our data, we update the form so it contains all
                                                // the needed data to sign the request
                                                form.find('input[name=key]').val(data.key);
                                                form.find('input[name=policy]').val(data.policy);
                                                form.find('input[name=signature]').val(data.signature);
                                                form.find('input[name=Content-Type]').val(data.contentType);
                                            }
                                        });
                                        data.files[0].s3Url = form.find('input[name=key]').val();
                                        data.submit();
                                    },
                                    start: function(e){
                                        form.prev().html('Uploaded <b></b>');
                                    },
                                    progressall: function(e, data){
                                        var progress = parseInt(data.loaded / data.total * 100, 10);
                                        form.prev().find('b').text(progress + '%'); // Update progress bar percentage
                                    },
                                    fail: function(e, data){
                                        form.prev().html('Click microphone above to record your audio');
                                    },
                                    done: function(e, data){
                                        var file_name = data.files[0].name;
                                        //Url
                                        var url = 'https://d1u3z33x3g234l.cloudfront.net/' +  encodeURIComponent(data.files[0].s3Url).replace(/'/g,"%27").replace(/"/g,"%22");
                                        //Add video response
                                        var edit_block = new ProjectManager.Entities.Block({
                                            _id: form.parent().parent().data('id'),
                                            _action: 'add_response'
                                        });
                                        edit_block.set({
                                            provider: {
                                                name: 'FramerSpace',
                                                url: url
                                            },
                                            file: {
                                                size: data.files[0].size,
                                                ext: 'webm'
                                            }
                                        });
                                        edit_block.save({}, {success: function(){
                                            location.reload();
                                        }});
                                    }
                                });
                                //upload data to server
                                var filesList = [player.recordedData];
                                $(this).fileupload('add', {files: filesList});
                            });
                        });
                    });
                    //Show video response
                    var videoJournalOptions = {
                        controls: true,
                        width: 480,
                        height: 360,
                        fluid: false,
                        plugins: {
                            record: {
                                audio: true,
                                video: true,
                                maxLength: 10,
                                debug: false
                            }
                        }
                    };
                    var videoJournalPlayers = [];
                    var videoPlayerIds = [];
                    blocksView.$('.response-video').each(function(){
                        videoPlayerIds.push(this.id);
                        videoJournalPlayers.push(videojs(this.id, videoJournalOptions));
                    });
                    videoJournalPlayers.forEach(function(player, i){
                        //data is available
                        player.on('finishRecord', function(){
                            //Upload file
                            var element = $('#' + videoPlayerIds[i]).next().next();
                            element.each(function(){
                                //For each file selected, process and upload
                                var form = $(this);
                                $(this).fileupload({
                                    url: form.attr('action'), //Grab form's action src
                                    type: 'POST',
                                    autoUpload: true,
                                    dataType: 'xml', //S3's XML response,
                                    add: function(event, data){
                                        //Upload through CORS
                                        $.ajax({
                                            url: '/api/signed',
                                            type: 'GET',
                                            dataType: 'json',
                                            data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                            async: false,
                                            success: function(data){
                                                // Now that we have our data, we update the form so it contains all
                                                // the needed data to sign the request
                                                form.find('input[name=key]').val(data.key);
                                                form.find('input[name=policy]').val(data.policy);
                                                form.find('input[name=signature]').val(data.signature);
                                                form.find('input[name=Content-Type]').val(data.contentType);
                                            }
                                        });
                                        data.files[0].s3Url = form.find('input[name=key]').val();
                                        data.submit();
                                    },
                                    start: function(e){
                                        form.prev().html('Uploaded <b></b>');
                                    },
                                    progressall: function(e, data){
                                        var progress = parseInt(data.loaded / data.total * 100, 10);
                                        form.prev().find('b').text(progress + '%'); // Update progress bar percentage
                                    },
                                    fail: function(e, data){
                                        form.prev().html('Click microphone above to record your video');
                                    },
                                    done: function(e, data){
                                        var file_name = data.files[0].name;
                                        //Url
                                        var url = 'https://d1u3z33x3g234l.cloudfront.net/' +  encodeURIComponent(data.files[0].s3Url).replace(/'/g,"%27").replace(/"/g,"%22");
                                        //Add video response
                                        var edit_block = new ProjectManager.Entities.Block({
                                            _id: form.parent().parent().data('id'),
                                            _action: 'add_response'
                                        });
                                        edit_block.set({
                                            provider: {
                                                name: 'FramerSpace',
                                                url: url
                                            },
                                            file: {
                                                size: data.files[0].size,
                                                ext: 'webm'
                                            }
                                        });
                                        edit_block.save({}, {success: function(){
                                            location.reload();
                                        }});
                                    }
                                });
                                //upload data to server
                                var filesList = [player.recordedData.video];
                                $(this).fileupload('add', {files: filesList});
                            });
                        });
                    });
                    //Upload file response
                    blocksView.$('.file-response').each(function(){
                        //For each file selected, process and upload
                        var form = $(this);
                        var fileCount = 0;
                        var uploadCount = 0;
                        var response_id = $(this).find('div.file-response-drop').attr('id');
                        $(this).fileupload({
                            dropZone: $('#' + response_id),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                if(data.files[0].size >= MAX_FILE_SIZE) return;
                                fileCount += 1;
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.files[0].s3Url = form.find('input[name=key]').val();
                                data.submit();
                            },
                            start: function(e){
                                $('#' + response_id + ' span').html('Uploaded <b></b>');
                            },
                            progressall: function(e, data){
                                var progress = parseInt(data.loaded / data.total * 100, 10);
                                $('#' + response_id + ' span b').text(progress + '%'); // Update progress bar percentage
                            },
                            fail: function(e, data){
                                $('#' + response_id + ' span').html('Choose files or drag and drop them here');
                            },
                            done: function(e, data){
                                var file_name = data.files[0].name;
                                //Get extension of the file
                                var index = file_name.lastIndexOf('.');
                                var file_ext = file_name.substring(index+1, file_name.length);
                                //Url
                                var url = 'https://d1u3z33x3g234l.cloudfront.net/' +  encodeURIComponent(data.files[0].s3Url).replace(/'/g,"%27").replace(/"/g,"%22");
                                //Add video response
                                var edit_block = new ProjectManager.Entities.Block({
                                    _id: response_id.split('-')[1],
                                    _action: 'add_response'
                                });
                                edit_block.set({
                                    provider: {
                                        name: 'FramerSpace',
                                        url: url
                                    },
                                    file: {
                                        size: data.files[0].size,
                                        ext: file_ext
                                    }
                                });
                                edit_block.save({}, {success: function(){
                                    location.reload();
                                }});
                            }
                        });
                    });
                    //Sortable grid
                    blocksView.$('.grid-block .block-options').sortable();
                });
                //Add block
                ProjectManager.vent.off('add:block');
                ProjectManager.vent.on('add:block', function(block){
                    var order = block.get('order') - 1;
                    blocks.add(block, {at: order});
                    //Remove transparency
                    $(".all-blocks .one-block[data-id='" + block.get('_id') + "']").removeClass('u-transparent');
                });
                //Show help
                ProjectManager.vent.off('help:show');
                ProjectManager.vent.on('help:show', function(){
                    //New message
                    var new_message = new ProjectManager.Entities.Message({
                        text: 'Hey! Thanks for sliding into our messages. We should get back to you within a few hours — in the meantime, check out https://bit.ly/howtoframerspace 👍'
                    });
                    new_message.save({}, {success: function(){
                        //Show message
                        $('.messagesWrap').removeClass('u-hide');
                        ProjectManager.vent.trigger('chats:show', new_message.get('_id'));
                    }});
                });
                //Add learner
                blocksView.on('add:learner', function(){
                    var course = new ProjectManager.Entities.Course({
                        _id: course_id,
                        _action: 'add_learner'
                    });
                    course.set({});
                    course.save({}, {
                        dataType:"text",
                        success: function(){
                            //Update learner progress
                            learnerProgress = 'started';
                            blocksView.$('.js-start-course').addClass('u-hide');
                            blocksView.$('.all-blocks').removeClass('u-hide');
                            blocksView.$('.js-mark-done').removeClass('u-hide');
                        }
                    });
                });
                //Edit learner progress
                blocksView.on('edit:learnerProgress', function(){
                    var course = new ProjectManager.Entities.Course({
                        _id: course_id,
                        _action: 'edit_learner'
                    });
                    if(container_id){
                        course.set({
                            container: container_id
                        });
                    } else {
                        course.set({});
                    }
                    course.save({}, {success: function(){
                        var progress = course.get('progress');
                        if(container_id){
                            //Update learner progress
                            learnerProgress = progress;
                            //Add to containers
                            learnerContainers.push(container_id);
                            //Check if certified
                            if(learnerProgress == 'certified'){
                                blocksView.$('.js-mark-done').addClass('js-certified').text('Download certificate');
                            } else {
                                //Go back to course
                                $('.mainHeader .header-back.header-course').click();
                            }
                        } else {
                            //Update learner progress
                            learnerProgress = progress;
                            //Check if certified
                            if(learnerProgress == 'certified'){
                                blocksView.$('.js-mark-done').addClass('js-certified').text('Download certificate');
                            } else if(learnerProgress == 'uncertified'){
                                alert('Please attempt all questions to get certified.');
                                blocksView.$('.js-mark-done').addClass('js-uncertified').text('Check for certificate');
                            } else {
                                //Show all courses
                                ProjectManager.vent.trigger('courses:show', 'public');
                            }
                        }
                    }});
                });
                //Download certificate
                blocksView.on('download:certificate', function(){
                    window.location.href = '/certificate/' + course_id;
                });
                //Select MCQ Option
                blocksView.on('childview:select:mcqOption', function(childView, model){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: model.block_id,
                        _action: 'select_option'
                    });
                    edit_block.set({
                        option: model.option_id
                    });
                    edit_block.save({}, {
                        dataType: 'text',
                        success: function(){
                        }
                    });
                });
                //Unselect MCQ Option
                blocksView.on('childview:unselect:mcqOption', function(childView, model){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: model.block_id,
                        _action: 'unselect_option'
                    });
                    edit_block.set({
                        option: model.option_id
                    });
                    edit_block.save({}, {
                        dataType: 'text',
                        success: function(){
                        }
                    });
                });
                //Unselect match option
                blocksView.on('childview:select:matchOption', function(childView, model){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: model.block_id,
                        _action: 'select_match'
                    });
                    edit_block.set({
                        option: model.option_id,
                        matched_to: model.matched_to
                    });
                    edit_block.save({}, {success: function(data){
                        if(data.get('color')){
                            childView.$(".match-block .block-option[data-id='" + model.option_id + "']").prepend("<p class='match-colors'><span class='one-color' style='background-color: "+data.get('color')+";'></span></p>");
                        } else {
                            var color = $(".match-block .block-option[data-id='" + model.matched_to + "'] .one-color").css('backgroundColor');
                            if(childView.$(".match-block .block-option[data-id='" + model.option_id + "'] .match-colors").length){
                                childView.$(".match-block .block-option[data-id='" + model.option_id + "'] .match-colors").append("<span class='one-color' style='background-color: "+color+";' data-id='"+model.matched_to+"'></span>");
                            } else {
                                childView.$(".match-block .block-option[data-id='" + model.option_id + "']").prepend("<p class='match-colors'><span class='one-color' style='background-color: "+color+";' data-id='"+model.matched_to+"'></span></p>");
                            }
                        }
                    }});
                });
                //Unselect match option
                blocksView.on('childview:unselect:matchOption', function(childView, model){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: model.block_id,
                        _action: 'unselect_match'
                    });
                    edit_block.set({
                        option: model.option_id,
                        matched_to: model.matched_to
                    });
                    edit_block.save();
                });
                //Fill blanks
                blocksView.on('childview:fill:Blanks', function(childView, model){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: model.block_id,
                        _action: 'fill_blanks'
                    });
                    edit_block.set({
                        fills: model.fills
                    });
                    edit_block.save({}, {
                        dataType: 'text',
                        success: function(){
                            childView.$('.js-fill-blanks').text('Update');
                        }
                    });
                });
                //Add text response
                blocksView.on('childview:add:textResponse', function(childView, model){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: model.block_id,
                        _action: 'add_response'
                    });
                    edit_block.set({
                        text: model.text
                    });
                    edit_block.save({}, {success: function(){
                        childView.$('.js-submit-response').text('Update').addClass('js-update-response');
                        childView.$('.js-update-response').after("<span class='remove-response u-delete'>Remove</span>");
                    }});
                });
                //Update text response
                blocksView.on('childview:update:textResponse', function(childView, model){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: model.block_id,
                        _action: 'edit_text_response'
                    });
                    edit_block.set({
                        text: model.text
                    });
                    edit_block.save({}, {success: function(){

                    }});
                });
                //Remove response
                blocksView.on('childview:remove:response', function(childView, model){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: model.block_id,
                        _action: 'remove_response'
                    });
                    edit_block.set({});
                    edit_block.save({}, {
                        dataType: 'text',
                        success: function(){
                            childView.$('.text-response').val('');
                            childView.$('.js-update-response').text('Save').removeClass('js-update-response');
                            childView.$('.remove-response').remove();
                        }
                    });
                });
                ProjectManager.contentRegion.show(blocksView);
            });
        },
        showBlockThemeOverlay: function(block_id){
            $('.overlay').show();
            var image_url, bound;
            //Fetch block
            var fetchingBlock = ProjectManager.request('block:entity', block_id);
            $.when(fetchingBlock).done(function(block){
                var blockThemeView = new ProjectManager.ProjectApp.EntityViews.BlockThemeView({
                    model: block
                });
                //Show
                blockThemeView.on('show', function(){
                    setTimeout(function(){
                        blockThemeView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Upload art
                    blockThemeView.$('.art-upload').each(function(){
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#drop-art'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Get bound
                                var image = new Image();
                                image.src = window.URL.createObjectURL(data.files[0]);
                                image.onload = function() {
                                    bound = ( image.naturalHeight * 400 ) / image.naturalWidth;
                                    bound = bound / 2; //for retina
                                    if(bound) bound = parseInt(bound);
                                    window.URL.revokeObjectURL(image.src);
                                };
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                blockThemeView.$('#drop-art span').html('Uploading <b>...</b>');
                                blockThemeView.$('.js-save-theme').addClass('u-disabled');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                blockThemeView.$('#drop-art span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                blockThemeView.$('#drop-art span').html('Add illustration');
                                blockThemeView.$('.js-save-theme').removeClass('u-disabled');
                            },
                            success: function(data){
                                image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                image_url = encodeURI(image_url);
                                //Show save button
                                blockThemeView.$('#drop-art span').addClass('u-hide');
                                blockThemeView.$('#drop-art').css('backgroundImage', 'url('+image_url+')');
                                blockThemeView.$('.js-save-theme').removeClass('u-disabled');
                            }
                        });
                    });
                    //Fill values
                    if(block.get('theme')){
                        blockThemeView.$('.block-themes .' + block.get('theme')).addClass('selected');
                    }
                    if(block.get('size') && block.get('size').width){
                        blockThemeView.$('.block-width').val(block.get('size').width);
                    }
                    if(block.get('size') && block.get('size').margin){
                        blockThemeView.$('.block-margin').val(block.get('size').margin);
                    }
                });
                //Update block theme
                blockThemeView.on('update:theme', function(value){
                    //Size
                    if(value.width){
                        var width = parseInt(value.width);
                    } else {
                        var width = 100;
                    }
                    if(value.margin){
                        var margin = parseInt(value.margin);
                    } else {
                        var margin = 0;
                    }
                    //Theme
                    if(blockThemeView.$('.block-themes .one-theme.selected').length){
                        var theme = blockThemeView.$('.block-themes .one-theme.selected').data('theme');
                    } else {
                        var theme = '';
                    }
                    //Update
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: block_id,
                        _action: 'edit'
                    });
                    edit_block.set({
                        art: image_url,
                        art_bound: bound,
                        width: width,
                        margin: margin,
                        theme: theme
                    });
                    edit_block.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        //Update block
                        if(theme){
                            $(".one-block[data-id='" + block_id + "']").addClass(theme).addClass('themed-block');
                        } else {
                            $(".one-block[data-id='" + block_id + "']").removeClass().addClass('one-block');
                        }
                        if(margin){
                            $(".one-block[data-id='" + block_id + "']").css({'width': 'calc('+ width +'% - '+ margin +'px)' });
                            $(".one-block[data-id='" + block_id + "']").css({'margin-right': margin + 'px'});
                        } else {
                            $(".one-block[data-id='" + block_id + "']").css({'width': width + '%'});
                        }
                    }});
                });
                //Remove art
                blockThemeView.on('remove:art', function(){
                    //Update
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: block_id,
                        _action: 'edit'
                    });
                    edit_block.set({
                        art: '',
                        art_bound: ''
                    });
                    edit_block.save({}, {success: function(){
                        blockThemeView.$('.js-remove-art').remove();
                    }});
                });
                ProjectManager.overlayRegion.show(blockThemeView);
            });
        },
        showDiscussionOverlay: function(block_id){
            $('.overlay').show();
            //Fetch block
            var fetchingBlock = ProjectManager.request('block:entity', block_id);
            $.when(fetchingBlock).done(function(block){
                var discussionView = new ProjectManager.ProjectApp.EntityViews.DiscussionView({
                    model: block
                });
                //Editor
                var commentEditor, oneCommentEditor, prevCommentHTML;
                var commentEditorFiles = [], oneCommentEditorFiles = [];
                //Show
                discussionView.on('show', function(){
                    setTimeout(function(){
                        discussionView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Hide if not editing
                    if(!$('.js-add-block').length){
                         discussionView.$('.overlay-box').addClass('only-view');
                    }
                    //Fill values
                    if(block.get('has_discussion')){
                        discussionView.$('.publish-label input').prop('checked', true);
                        //Add viewer
                        this.trigger('view:discussion', block.get('_id'));
                    }
                    if(block.get('is_restricted')){
                        discussionView.$('.moderation-label input').prop('checked', true);
                    }
                    if(block.get('is_collapsed')){
                        discussionView.$('.collapsed-label input').prop('checked', true);
                        discussionView.$('.date-comments').addClass('u-hide');
                        discussionView.$('.date-value').addClass('is-collapsed');
                    }
                    //Editor
                    //Wait till editor is ready
                    discussionView.$('.comment-text').bind('click mousedown dblclick', function(ev){
                       ev.preventDefault();
                       ev.stopImmediatePropagation();
                    });
                    commentEditor = setUpAlloyToolbar(false, document.querySelector('.comment-text'), false, false);
                    var nativeEditor = commentEditor.get('nativeEditor');
                    //On editor ready
                    nativeEditor.on('instanceReady', function(ev){
                        discussionView.$('.comment-text').unbind();
                    });
                    //On image upload
                    nativeEditor.on('imageAdd', function(ev){
                        var id = generateRandomUUID();
                        ev.data.file.id = id;
                        commentEditorFiles.push(ev.data.file);
                        $(ev.data.el.$).addClass('upload-image').attr('data-id', id);
                    });
                    //Socket
                    pathInDiscussion = true;
                    socket.emit('socketInDiscussion', true, block_id);
                    //Trigger socket events
                    ProjectManager.vent.off('socket:addComment');
                    ProjectManager.vent.off('socket:editComment');
                    ProjectManager.vent.off('socket:deleteComment');
                    //Socket: add comment
                    ProjectManager.vent.on('socket:addComment', function(data){
                        //Add comment
                        var commentJson = data.comment;
                        var new_comment = new ProjectManager.Entities.Comment(commentJson);
                        //Add
                        var dateModel = discussionView.collection.findWhere({date: 'Today'});
                        if(dateModel){
                            discussionView.children.findByModel(dateModel).collection.add(new_comment, {at: 0});
                        } else {
                            var dateModel = new Backbone.Model();
                            dateModel.set('date', 'Today');
                            dateModel.set('comments', [new_comment]);
                            discussionView.collection.add(dateModel, {at: 0});
                        }
                    });
                    //Socket: edit comment
                    ProjectManager.vent.on('socket:editComment', function(data){
                        //Update on client side
                        if($(".one-comment[data-id='" + data.commentId + "']").length){
                            discussionView.$(".one-comment[data-id='" + data.commentId + "']").find('.js-comment-html').html(data.comment);
                        }
                    });
                    //Socket: delete comment
                    ProjectManager.vent.on('socket:deleteComment', function(data){
                        var comment_date = formatDateInDDMMYYYY(new Date(data.createdAt));
                        //Today
                        var dateToday = new Date();
                        var today = formatDateInDDMMYYYY(dateToday);
                        //Yesterday
                        dateToday.setDate(dateToday.getDate() - 1);
                        var yesterday = formatDateInDDMMYYYY(dateToday);
                        //Get date model
                        if(comment_date == today){
                            var dateModel = discussionView.collection.findWhere({date: 'Today'});
                        } else if(comment_date == yesterday){
                            var dateModel = discussionView.collection.findWhere({date: 'Yesterday'});
                        } else {
                            var dateModel = discussionView.collection.findWhere({date: comment_date});
                        }
                        //Remove comment
                        var comments_collection = discussionView.children.findByModel(dateModel).collection;
                        if(comments_collection.length > 1){
                            var comment = comments_collection.findWhere({_id: data.commentId});
                            comments_collection.remove(comment);
                        } else {
                            discussionView.collection.remove(dateModel);
                        }
                    });
                });
                //View course
                discussionView.on('view:discussion', function(value){
                    var block = new ProjectManager.Entities.Block({
                        _id: value,
                        _action: 'view'
                    });
                    block.set({});
                    block.save();
                });
                //Update discussion
                discussionView.on('update:discussion', function(value){
                    var edit_block = new ProjectManager.Entities.Block({
                        _id: block_id,
                        _action: 'edit'
                    });
                    edit_block.set({
                        has_discussion: value.has_discussion,
                        is_restricted: value.is_restricted,
                        is_collapsed: value.is_collapsed
                    });
                    edit_block.save({}, {
                        dataType: 'text',
                        success: function(){
                            ProjectManager.commands.execute('close:overlay');
                        }
                    });
                });
                //Show editor for reply
                discussionView.on('childview:childview:show:editorForReply', function(childView, model, options){
                    //Destroy
                    if(commentEditor) commentEditor.destroy();
                    //Editor
                    //Wait till editor is ready
                    discussionView.$('.comment-text').bind('click mousedown dblclick', function(ev){
                       ev.preventDefault();
                       ev.stopImmediatePropagation();
                    });
                    commentEditor = setUpAlloyToolbar(false, document.querySelector('.comment-text'), false, false);
                    var nativeEditor = commentEditor.get('nativeEditor');
                    //On editor ready
                    nativeEditor.on('instanceReady', function(ev){
                        discussionView.$('.comment-text').unbind();
                        //Focus
                        nativeEditor.setData('');
                        nativeEditor.focus();
                    });
                    //On image upload
                    nativeEditor.on('imageAdd', function(ev){
                        var id = generateRandomUUID();
                        ev.data.file.id = id;
                        commentEditorFiles.push(ev.data.file);
                        $(ev.data.el.$).addClass('upload-image').attr('data-id', id);
                    });
                });
                //ADD COMMENT
                discussionView.on('add:comment', function(value){
                    //Get comment
                    var nativeEditor = commentEditor.get('nativeEditor');
                    //New comment
                    var new_comment = new ProjectManager.Entities.Comment({
                        text: nativeEditor.getData(),
                        block_id: block_id,
                        reply_to: value.reply_to
                    });
                    //Save and upload image
                    async.series([
                        function(callback){
                            if(discussionView.$('.upload-image').length){
                                discussionView.$('.js-add-comment.comment-btn').val('Uploading...').addClass('uploading');
                                editorUploadImage(commentEditorFiles, function(image_urls){
                                    commentEditorFiles = [];
                                    if(image_urls && image_urls.length){
                                        new_comment.set('text', nativeEditor.getData());
                                        new_comment.set('images', image_urls);
                                        callback();
                                    } else {
                                        callback();
                                    }
                                });
                            } else {
                                callback();
                            }
                        }
                    ], function(err){
                        new_comment.save({}, {success: function(){
                            //Add
                            var dateModel = discussionView.collection.findWhere({date: 'Today'});
                            if(dateModel){
                                discussionView.children.findByModel(dateModel).collection.add(new_comment, {at: 0});
                            } else {
                                var dateModel = new Backbone.Model();
                                dateModel.set('date', 'Today');
                                dateModel.set('comments', [new_comment]);
                                discussionView.collection.add(dateModel, {at: 0});
                            }
                            //Add
                            if(!value.reply_to){
                                //Focus on comment box
                                nativeEditor.setData('');
                                nativeEditor.focus();
                            } else {
                                //Hide reply box
                                discussionView.$('.one-comment.selected-reply .reply-btn').click();
                                //Scroll to top
                                $('.overlay').animate({scrollTop: 0}, 100);
                            }
                            discussionView.$('.js-add-comment.comment-btn').val('Add comment').removeClass('uploading');
                            //Emit socket
                            socket.emit('add_comment_toServer', {comment: new_comment});
                        }});
                    });
                });
                //SHOW ANALYSIS
                discussionView.on('show:analysis', function(value){
                    //Show loader
                    $('.chart-area, .chart-loader').show();
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: value.type
                    });
                    analysis.set({
                        text: value.text
                    });
                    analysis.save({}, {success: function(results){
                        //Hide loader
                        $('.chart-loader').hide();
                        if(value.type == 'sentiment'){
                            $('#myChart').show();
                            var positive_val = 0, negative_val = 0, neutral_val = 0;
                            var label_arr = [];
                            var positive_arr = [];
                            var negative_arr = [];
                            var neutral_arr = [];
                            var sentiment_arr = [];
                            for(var i=0; i<results.get('data').length; i++){
                                positive_val +=  results.get('data')[i].SentimentScore.Positive;
                                negative_val +=  results.get('data')[i].SentimentScore.Negative;
                                neutral_val +=  results.get('data')[i].SentimentScore.Neutral;
                                label_arr.push(i+1);
                                positive_arr.push(results.get('data')[i].SentimentScore.Positive.toFixed(2));
                                negative_arr.push(-results.get('data')[i].SentimentScore.Negative.toFixed(2));
                                neutral_arr.push(results.get('data')[i].SentimentScore.Neutral.toFixed(2));
                                sentiment_arr.push(results.get('data')[i].Sentiment);
                            }
                            positive_val = positive_val.toFixed(2);
                            negative_val = negative_val.toFixed(2);
                            neutral_val = neutral_val.toFixed(2);
                            //Show chart
                            var ctx = document.getElementById('myChart').getContext('2d');
                            myChart = new Chart(ctx, {
                                type: 'doughnut',
                                data: {
                                    labels: ['Positive', 'Negative', 'Neutral'],
                                    datasets: [{
                                        data: [positive_val, negative_val, neutral_val],
                                        backgroundColor: ['rgba(29, 209, 161,0.6)', 'rgba(255, 107, 107,0.6)', 'rgba(131, 149, 167,0.6)'],
                                        borderColor: ['rgba(29, 209, 161,1)', 'rgba(255, 107, 107,1)', 'rgba(131, 149, 167,1)'],
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    title: {
                                        display: true,
                                        text: 'Overall Sentiment Analysis',
                                        fontSize: 18,
                                        fontColor: globalFontColor
                                    },
                                    responsive: true,
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            fontSize: 18,
                                            fontColor: globalFontColor
                                        }
                                    },
                                    animation: {
                                        animateScale: true,
                                        animateRotate: true
                                    },
                                    onClick: function(c,i){
                                        //Drilldown
                                        myChart.destroy();
                                        //Show chart
                                        var ctx = document.getElementById('myChart').getContext('2d');
                                        myChart = new Chart(ctx, {
                                            type: 'bar',
                                            data: {
                                                labels: label_arr,
                                                datasets: [{
                                                    label: 'Positive',
                                                    backgroundColor: 'rgba(29, 209, 161,0.6)',
                                                    borderColor: 'rgba(29, 209, 161,1)',
                                                    borderWidth: 1,
                                                    data: positive_arr
                                                }, {
                                                    label: 'Negative',
                                                    backgroundColor: 'rgba(255, 107, 107,0.6)',
                                                    borderColor: 'rgba(255, 107, 107,1)',
                                                    borderWidth: 1,
                                                    data: negative_arr
                                                }, {
                                                    label: 'Neutral',
                                                    backgroundColor: 'rgba(131, 149, 167,0.6)',
                                                    borderColor: 'rgba(131, 149, 167,1)',
                                                    borderWidth: 1,
                                                    data: neutral_arr
                                                }]
                                            },
                                            options: {
                                                title: {
                                                    display: true,
                                                    text: 'Sentiment Analysis',
                                                    fontSize: 18,
                                                    fontColor: globalFontColor
                                                },
                                                tooltips: {
                                                    mode: 'index',
                                                    intersect: false,
                                                    width: 200,
                                                    callbacks: {
                                                        title: function(tooltipItem, data){
                                                            return sentiment_arr[tooltipItem[0].index];
                                                        }
                                                    }
                                                },
                                                responsive: true,
                                                legend: {
                                                    position: 'top',
                                                    labels: {
                                                        fontSize: 18,
                                                        fontColor: globalFontColor
                                                    }
                                                },
                                                scales: {
                                                    xAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }],
                                                    yAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }]
                                                },
                                                onClick: function(c,i){
                                                    e = i[0];
                                                    swal({
                                                        title: 'Comment',
                                                        html: true,
                                                        text: value.text[e._index]
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        } else if(value.type == 'tone' && value.subtype == 'emotiontone'){
                            $('#myChart').show();
                            var anger_val = 0, fear_val = 0, joy_val = 0, sadness_val = 0, analytical_val = 0, confident_val = 0, tentative_val = 0;
                            var label_arr = [];
                            var anger_arr = [];
                            var fear_arr = [];
                            var joy_arr = [];
                            var sadness_arr = [];
                            var analytical_arr = [];
                            var confident_arr = [];
                            var tentative_arr = [];
                            for(var i=0; i<results.get('data').length; i++){
                                label_arr.push(i+1);
                                anger_arr.push(0);
                                fear_arr.push(0);
                                joy_arr.push(0);
                                sadness_arr.push(0);
                                analytical_arr.push(0);
                                confident_arr.push(0);
                                tentative_arr.push(0);
                                for(var j=0; j<results.get('data')[i].length;j++){
                                    var tone_id = results.get('data')[i][j].tone_id;
                                    var score = results.get('data')[i][j].score;
                                    if(tone_id == 'anger'){
                                        anger_val += score;
                                        anger_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'fear'){
                                        fear_val += score;
                                        fear_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'joy'){
                                        joy_val += score;
                                        joy_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'sadness'){
                                        sadness_val += score;
                                        sadness_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'analytical'){
                                        analytical_val += score;
                                        analytical_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'confident'){
                                        confident_val += score;
                                        confident_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'tentative'){
                                        tentative_val += score;
                                        tentative_arr[i] = score.toFixed(2);
                                    }
                                }
                            }
                            anger_val = anger_val.toFixed(2);
                            fear_val = fear_val.toFixed(2);
                            joy_val = joy_val.toFixed(2);
                            sadness_val = sadness_val.toFixed(2);
                            analytical_val = analytical_val.toFixed(2);
                            confident_val = confident_val.toFixed(2);
                            tentative_val = tentative_val.toFixed(2);
                            //Show chart
                            var ctx = document.getElementById('myChart').getContext('2d');
                            myChart = new Chart(ctx, {
                                type: 'doughnut',
                                data: {
                                    labels: ['Anger', 'Fear', 'Joy', 'Sadness', 'Analytical', 'Confident', 'Tentative'],
                                    datasets: [{
                                        data: [anger_val, fear_val, joy_val, sadness_val, analytical_val, confident_val, tentative_val],
                                        backgroundColor: ['rgba(238, 82, 83,0.6)', 'rgba(255, 159, 67,0.6)', 'rgba(46, 134, 222,0.6)', 'rgba(255, 159, 243,0.6)', 'rgba(95, 39, 205,0.6)', 'rgba(29, 209, 161,0.6)', 'rgba(131, 149, 167,0.6)'],
                                        borderColor: ['rgba(238, 82, 83, 1)', 'rgba(255, 159, 67, 1)', 'rgba(46, 134, 222, 1)', 'rgba(255, 159, 243, 1)', 'rgba(95, 39, 205, 1)', 'rgba(29, 209, 161, 1)', 'rgba(131, 149, 167, 1)'],
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    title: {
                                        display: true,
                                        text: 'Overall Emotion and Tone Analysis',
                                        fontSize: 18,
                                        fontColor: globalFontColor
                                    },
                                    responsive: true,
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            fontSize: 18,
                                            fontColor: globalFontColor
                                        }
                                    },
                                    animation: {
                                        animateScale: true,
                                        animateRotate: true
                                    },
                                    onClick: function(c,i){
                                        //Drilldown
                                        myChart.destroy();
                                        //Show chart
                                        var ctx = document.getElementById('myChart').getContext('2d');
                                        myChart = new Chart(ctx, {
                                            type: 'bar',
                                            data: {
                                                labels: label_arr,
                                                datasets: [{
                                                    label: 'Anger',
                                                    backgroundColor: 'rgba(238, 82, 83,0.6)',
                                                    borderColor: 'rgba(238, 82, 83,1)',
                                                    borderWidth: 1,
                                                    data: anger_arr
                                                }, {
                                                    label: 'Fear',
                                                    backgroundColor: 'rgba(255, 159, 67,0.6)',
                                                    borderColor: 'rgba(255, 159, 67,1)',
                                                    borderWidth: 1,
                                                    data: fear_arr
                                                }, {
                                                    label: 'Joy',
                                                    backgroundColor: 'rgba(46, 134, 222,0.6)',
                                                    borderColor: 'rgba(46, 134, 222,1)',
                                                    borderWidth: 1,
                                                    data: joy_arr
                                                }, {
                                                    label: 'Sadness',
                                                    backgroundColor: 'rgba(255, 159, 243,0.6)',
                                                    borderColor: 'rgba(255, 159, 243,1)',
                                                    borderWidth: 1,
                                                    data: sadness_arr
                                                }, {
                                                    label: 'Analytical',
                                                    backgroundColor: 'rgba(95, 39, 205,0.6)',
                                                    borderColor: 'rgba(95, 39, 205,1)',
                                                    borderWidth: 1,
                                                    data: analytical_arr
                                                }, {
                                                    label: 'Confident',
                                                    backgroundColor: 'rgba(29, 209, 161,0.6)',
                                                    borderColor: 'rgba(29, 209, 161,1)',
                                                    borderWidth: 1,
                                                    data: confident_arr
                                                }, {
                                                    label: 'Tentative',
                                                    backgroundColor: 'rgba(131, 149, 167,0.6)',
                                                    borderColor: 'rgba(131, 149, 167,1)',
                                                    borderWidth: 1,
                                                    data: tentative_arr
                                                }]
                                            },
                                            options: {
                                                title: {
                                                    display: true,
                                                    text: 'Emotion and Tone Analysis',
                                                    fontSize: 18,
                                                    fontColor: globalFontColor
                                                },
                                                tooltips: {
                                                    mode: 'index',
                                                    intersect: false,
                                                    width: 200
                                                },
                                                responsive: true,
                                                legend: {
                                                    position: 'top',
                                                    labels: {
                                                        fontSize: 18,
                                                        fontColor: globalFontColor
                                                    }
                                                },
                                                scales: {
                                                    xAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }],
                                                    yAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }]
                                                },
                                                events: ['click'],
                                                onClick: function(c,i){
                                                    e = i[0];
                                                    swal({
                                                        title: 'Comment',
                                                        html: true,
                                                        text: value.text[e._index]
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        } else if(value.type == 'tone' && value.subtype == 'emotion'){
                            $('#myChart').show();
                            var anger_val = 0, fear_val = 0, joy_val = 0, sadness_val = 0;
                            var label_arr = [];
                            var anger_arr = [];
                            var fear_arr = [];
                            var joy_arr = [];
                            var sadness_arr = [];
                            for(var i=0; i<results.get('data').length; i++){
                                label_arr.push(i+1);
                                anger_arr.push(0);
                                fear_arr.push(0);
                                joy_arr.push(0);
                                sadness_arr.push(0);
                                for(var j=0; j<results.get('data')[i].length;j++){
                                    var tone_id = results.get('data')[i][j].tone_id;
                                    var score = results.get('data')[i][j].score;
                                    if(tone_id == 'anger'){
                                        anger_val += score;
                                        anger_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'fear'){
                                        fear_val += score;
                                        fear_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'joy'){
                                        joy_val += score;
                                        joy_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'sadness'){
                                        sadness_val += score;
                                        sadness_arr[i] = score.toFixed(2);
                                    }
                                }
                            }
                            anger_val = anger_val.toFixed(2);
                            fear_val = fear_val.toFixed(2);
                            joy_val = joy_val.toFixed(2);
                            sadness_val = sadness_val.toFixed(2);
                            //Show chart
                            var ctx = document.getElementById('myChart').getContext('2d');
                            myChart = new Chart(ctx, {
                                type: 'doughnut',
                                data: {
                                    labels: ['Anger', 'Fear', 'Joy', 'Sadness'],
                                    datasets: [{
                                        data: [anger_val, fear_val, joy_val, sadness_val],
                                        backgroundColor: ['rgba(238, 82, 83,0.6)', 'rgba(255, 159, 67,0.6)', 'rgba(46, 134, 222,0.6)', 'rgba(255, 159, 243,0.6)'],
                                        borderColor: ['rgba(238, 82, 83, 1)', 'rgba(255, 159, 67, 1)', 'rgba(46, 134, 222, 1)', 'rgba(255, 159, 243, 1)'],
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    title: {
                                        display: true,
                                        text: 'Overall Emotion Analysis',
                                        fontSize: 18,
                                        fontColor: globalFontColor
                                    },
                                    responsive: true,
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            fontSize: 18,
                                            fontColor: globalFontColor
                                        }
                                    },
                                    animation: {
                                        animateScale: true,
                                        animateRotate: true
                                    },
                                    onClick: function(c,i){
                                        //Drilldown
                                        myChart.destroy();
                                        //Show chart
                                        var ctx = document.getElementById('myChart').getContext('2d');
                                        myChart = new Chart(ctx, {
                                            type: 'bar',
                                            data: {
                                                labels: label_arr,
                                                datasets: [{
                                                    label: 'Anger',
                                                    backgroundColor: 'rgba(238, 82, 83,0.6)',
                                                    borderColor: 'rgba(238, 82, 83,1)',
                                                    borderWidth: 1,
                                                    data: anger_arr
                                                }, {
                                                    label: 'Fear',
                                                    backgroundColor: 'rgba(255, 159, 67,0.6)',
                                                    borderColor: 'rgba(255, 159, 67,1)',
                                                    borderWidth: 1,
                                                    data: fear_arr
                                                }, {
                                                    label: 'Joy',
                                                    backgroundColor: 'rgba(46, 134, 222,0.6)',
                                                    borderColor: 'rgba(46, 134, 222,1)',
                                                    borderWidth: 1,
                                                    data: joy_arr
                                                }, {
                                                    label: 'Sadness',
                                                    backgroundColor: 'rgba(255, 159, 243,0.6)',
                                                    borderColor: 'rgba(255, 159, 243,1)',
                                                    borderWidth: 1,
                                                    data: sadness_arr
                                                }]
                                            },
                                            options: {
                                                title: {
                                                    display: true,
                                                    text: 'Emotion Analysis',
                                                    fontSize: 18,
                                                    fontColor: globalFontColor
                                                },
                                                tooltips: {
                                                    mode: 'index',
                                                    intersect: false,
                                                    width: 200
                                                },
                                                responsive: true,
                                                legend: {
                                                    position: 'top',
                                                    labels: {
                                                        fontSize: 18,
                                                        fontColor: globalFontColor
                                                    }
                                                },
                                                scales: {
                                                    xAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }],
                                                    yAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }]
                                                },
                                                events: ['click'],
                                                onClick: function(c,i){
                                                    e = i[0];
                                                    swal({
                                                        title: 'Comment',
                                                        html: true,
                                                        text: value.text[e._index]
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        } else if(value.type == 'tone'){
                            $('#myChart').show();
                            var analytical_val = 0, confident_val = 0, tentative_val = 0;
                            var label_arr = [];
                            var analytical_arr = [];
                            var confident_arr = [];
                            var tentative_arr = [];
                            for(var i=0; i<results.get('data').length; i++){
                                label_arr.push(i+1);
                                analytical_arr.push(0);
                                confident_arr.push(0);
                                tentative_arr.push(0);
                                for(var j=0; j<results.get('data')[i].length;j++){
                                    var tone_id = results.get('data')[i][j].tone_id;
                                    var score = results.get('data')[i][j].score;
                                    if(tone_id == 'analytical'){
                                        analytical_val += score;
                                        analytical_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'confident'){
                                        confident_val += score;
                                        confident_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'tentative'){
                                        tentative_val += score;
                                        tentative_arr[i] = score.toFixed(2);
                                    }
                                }
                            }
                            analytical_val = analytical_val.toFixed(2);
                            confident_val = confident_val.toFixed(2);
                            tentative_val = tentative_val.toFixed(2);
                            //Show chart
                            var ctx = document.getElementById('myChart').getContext('2d');
                            myChart = new Chart(ctx, {
                                type: 'doughnut',
                                data: {
                                    labels: ['Analytical', 'Confident', 'Tentative'],
                                    datasets: [{
                                        data: [analytical_val, confident_val, tentative_val],
                                        backgroundColor: ['rgba(95, 39, 205,0.6)', 'rgba(29, 209, 161,0.6)', 'rgba(131, 149, 167,0.6)'],
                                        borderColor: ['rgba(95, 39, 205, 1)', 'rgba(29, 209, 161, 1)', 'rgba(131, 149, 167, 1)'],
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    title: {
                                        display: true,
                                        text: 'Overall Tone Analysis',
                                        fontSize: 18,
                                        fontColor: globalFontColor
                                    },
                                    responsive: true,
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            fontSize: 18,
                                            fontColor: globalFontColor
                                        }
                                    },
                                    animation: {
                                        animateScale: true,
                                        animateRotate: true
                                    },
                                    onClick: function(c,i){
                                        //Drilldown
                                        myChart.destroy();
                                        //Show chart
                                        var ctx = document.getElementById('myChart').getContext('2d');
                                        myChart = new Chart(ctx, {
                                            type: 'bar',
                                            data: {
                                                labels: label_arr,
                                                datasets: [{
                                                    label: 'Analytical',
                                                    backgroundColor: 'rgba(95, 39, 205,0.6)',
                                                    borderColor: 'rgba(95, 39, 205,1)',
                                                    borderWidth: 1,
                                                    data: analytical_arr
                                                }, {
                                                    label: 'Confident',
                                                    backgroundColor: 'rgba(29, 209, 161,0.6)',
                                                    borderColor: 'rgba(29, 209, 161,1)',
                                                    borderWidth: 1,
                                                    data: confident_arr
                                                }, {
                                                    label: 'Tentative',
                                                    backgroundColor: 'rgba(131, 149, 167,0.6)',
                                                    borderColor: 'rgba(131, 149, 167,1)',
                                                    borderWidth: 1,
                                                    data: tentative_arr
                                                }]
                                            },
                                            options: {
                                                title: {
                                                    display: true,
                                                    text: 'Tone Analysis',
                                                    fontSize: 18,
                                                    fontColor: globalFontColor
                                                },
                                                tooltips: {
                                                    mode: 'index',
                                                    intersect: false,
                                                    width: 200
                                                },
                                                responsive: true,
                                                legend: {
                                                    position: 'top',
                                                    labels: {
                                                        fontSize: 18,
                                                        fontColor: globalFontColor
                                                    }
                                                },
                                                scales: {
                                                    xAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }],
                                                    yAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }]
                                                },
                                                events: ['click'],
                                                onClick: function(c,i){
                                                    e = i[0];
                                                    swal({
                                                        title: 'Comment',
                                                        html: true,
                                                        text: value.text[e._index]
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        } else if(value.type == 'keyphrase'){
                            $('#wordcloud').show();
                            var key_phrases = [];
                            var key_phrases_lc = [];
                            var count = [];
                            for(var i=0; i<results.get('data').length; i++){
                                var phrases = results.get('data')[i].KeyPhrases;
                                if(phrases && phrases.length){
                                    for(var j=0; j<phrases.length; j++){
                                        var phrase_text_lc = phrases[j].Text.toLowerCase();
                                        if(key_phrases_lc.indexOf(phrase_text_lc) > -1){
                                            var index = key_phrases_lc.indexOf(phrase_text_lc);
                                            count[index] += 1;
                                        } else {
                                            key_phrases.push(phrases[j].Text);
                                            key_phrases_lc.push(phrase_text_lc);
                                            count.push(1);
                                        }
                                    }
                                }
                            }
                            //Get words
                            var words = [];
                            if(key_phrases.length){
                                for(var i=0; i<key_phrases.length; i++){
                                    words.push({text: key_phrases[i], weight: count[i]});
                                }
                            }
                            $('#wordcloud').jQCloud(words);
                        }
                    }});
                });
                //LIKE-UNLIKE COMMENT
                discussionView.on('childview:childview:toggle:like', function(childView, model, options){
                    _toggleLike(options.comment_id, options.like_action);
                });
                var _toggleLike = function(comment_id, like_action){
                    var comment = new ProjectManager.Entities.Comment({
                        _id: comment_id,
                        _action: like_action
                    });
                    comment.set({});
                    comment.save({}, {success: function(){
                    }});
                };
                //EDIT COMMENT
                discussionView.on('childview:childview:edit:comment', function(childView, model, options){
                    _editComment(childView);
                });
                var _editComment = function(childView){
                    //Editor
                    //Wait till editor is ready
                    childView.$('.comment-html').bind('click mousedown dblclick', function(ev){
                       ev.preventDefault();
                       ev.stopImmediatePropagation();
                    });
                    oneCommentEditor = setUpAlloyToolbar(false, document.querySelector('.selected-comment .comment-html'), false, false);
                    var nativeEditor = oneCommentEditor.get('nativeEditor');
                    //On editor ready
                    nativeEditor.on('instanceReady', function(ev){
                        childView.$('.comment-html').unbind();
                        prevCommentHTML = nativeEditor.getData();
                    });
                    //On image upload
                    nativeEditor.on('imageAdd', function(ev){
                        var id = generateRandomUUID();
                        ev.data.file.id = id;
                        oneCommentEditorFiles.push(ev.data.file);
                        $(ev.data.el.$).addClass('upload-image').attr('data-id', id);
                    });
                };
                //CANCEL COMMENT EDIT
                discussionView.on('childview:childview:cancel:editComment', function(childView, model, options){
                    _cancelEditComment(childView);
                });
                var _cancelEditComment = function(childView){
                    //Set previous data
                    var nativeEditor = oneCommentEditor.get('nativeEditor');
                    nativeEditor.setData(prevCommentHTML);
                    prevCommentHTML = '';
                    //Destroy
                    oneCommentEditor.destroy();
                    //Reset
                    childView.$('.js-comment-actions .save-btn').text('Edit').removeClass('save-btn');
                    childView.$('.js-comment-actions .delete-btn').text('Delete').removeClass('cancel-btn');
                    discussionView.$('.selected-comment').removeClass('selected-comment');
                };
                //UPDATE COMMENT
                discussionView.on('childview:childview:update:comment', function(childView, model, options){
                    _updateComment(options.comment_id, childView);
                });
                var _updateComment = function(comment_id, childView){
                    if(oneCommentEditor){
                        var nativeEditor = oneCommentEditor.get('nativeEditor');
                        var text = nativeEditor.getData();
                    }
                    //Update comment
                    var edit_comment = new ProjectManager.Entities.Comment({
                        _id: comment_id,
                        _action: 'edit'
                    });
                    edit_comment.set({
                        text: text
                    });
                    //Save and upload image
                    async.series([
                        function(callback){
                            if(childView.$('.comment-html .upload-image').length){
                                childView.$('.js-comment-actions .edit-btn').text('Uploading...').addClass('uploading');
                                childView.$('.js-comment-actions .delete-btn').addClass('u-hide');
                                //Upload
                                editorUploadImage(oneCommentEditorFiles, function(image_urls){
                                    oneCommentEditorFiles = [];
                                    if(image_urls && image_urls.length){
                                        edit_comment.set('text', nativeEditor.getData());
                                        edit_comment.set('images', image_urls);
                                        callback();
                                    } else {
                                        callback();
                                    }
                                });
                            } else {
                                callback();
                            }
                        }
                    ],
                    function(err){
                        edit_comment.save({}, {success: function(){
                            oneCommentEditor.destroy();
                            prevCommentHTML = '';
                            childView.$('.js-comment-actions .edit-btn').text('Edit').removeClass('uploading').removeClass('save-btn');
                            childView.$('.js-comment-actions .delete-btn').text('Delete').removeClass('u-hide').removeClass('cancel-btn');
                            discussionView.$('.selected-comment').removeClass('selected-comment');
                            //Emit socket
                            socket.emit('edit_comment_toServer', {commentId: comment_id, comment: text});
                        }});
                    });
                };
                //DELETE COMMENT
                discussionView.on('childview:childview:delete:comment', function(childView, model, options){
                    _deleteComment(options.comment_id, options.created_at);
                });
                var _deleteComment = function(comment_id, created_at){
                    var comment = new ProjectManager.Entities.Comment({_id: comment_id});
                    comment.destroy({
                        dataType:"text",
                        success: function(model, response){
                            var comment_date = formatDateInDDMMYYYY(new Date(created_at));
                            //Today
                            var dateToday = new Date();
                            var today = formatDateInDDMMYYYY(dateToday);
                            //Yesterday
                            dateToday.setDate(dateToday.getDate() - 1);
                            var yesterday = formatDateInDDMMYYYY(dateToday);
                            //Get date model
                            if(comment_date == today){
                                var dateModel = discussionView.collection.findWhere({date: 'Today'});
                            } else if(comment_date == yesterday){
                                var dateModel = discussionView.collection.findWhere({date: 'Yesterday'});
                            } else {
                                var dateModel = discussionView.collection.findWhere({date: comment_date});
                            }
                            //Remove comment
                            var comments_collection = discussionView.children.findByModel(dateModel).collection;
                            if(comments_collection.length > 1){
                                var comment = comments_collection.findWhere({_id: comment_id});
                                comments_collection.remove(comment);
                            } else {
                                discussionView.collection.remove(dateModel);
                            }
                            //Emit socket
                            socket.emit('delete_comment_toServer', {commentId: comment_id, createdAt: created_at});
                        }
                    });
                };
                //SHOW KEYPHRASE
                discussionView.on('childview:childview:show:keyphrase', function(childView, model, options){
                    _showKeyPhrase(options.text);
                });
                var _showKeyPhrase = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'keyphrase'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        var phrases_arr = [];
                        var phrases = results.get('data')[0].KeyPhrases;
                        if(phrases && phrases.length){
                            for(var i=0; i<phrases.length; i++){
                                phrases_arr.push(phrases[i].Text);
                            }
                        }
                        swal({
                            title: 'Key phrases',
                            text: phrases_arr.join(', ')
                        });
                        $('.context-menu').hide();
                    }});
                };
                //SHOW SYNTAX
                discussionView.on('childview:childview:show:syntax', function(childView, model, options){
                    _showSyntax(options.text);
                });
                var _showSyntax = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'syntax'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        var syntax_arr = [];
                        var syntaxtokens = results.get('data')[0].SyntaxTokens;
                        if(syntaxtokens && syntaxtokens.length){
                            for(var i=0; i<syntaxtokens.length; i++){
                                syntax_arr.push("<tr><td>"+syntaxtokens[i].Text+"</td><td>"+syntaxtokens[i].PartOfSpeech.Tag+"</td></tr>");
                            }
                        }
                        swal({
                            title: 'Syntax Analysis',
                            html: true,
                            text: "<table>"+syntax_arr.join('')+"</table>"
                        });
                        $('.context-menu').hide();
                    }});
                };
                //SHOW ENTITY
                discussionView.on('childview:childview:show:entity', function(childView, model, options){
                    _showEntity(options.text);
                });
                var _showEntity = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'entity'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        var entity_arr = [];
                        var entities = results.get('data')[0].Entities;
                        if(entities && entities.length){
                            for(var i=0; i<entities.length; i++){
                                entity_arr.push("<tr><td>"+entities[i].Text+"</td><td>"+entities[i].Type+"</td></tr>");
                            }
                        }
                        swal({
                            title: 'Entities',
                            html: true,
                            text: "<table>"+entity_arr.join('')+"</table>"
                        });
                        $('.context-menu').hide();
                    }});
                };
                //SHOW LANGUAGE
                discussionView.on('childview:childview:show:language', function(childView, model, options){
                    _showLanguage(options.text);
                });
                var _showLanguage = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'language'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        var language_arr = [];
                        var languages = results.get('data')[0].Languages;
                        if(languages && languages.length){
                            for(var i=0; i<languages.length; i++){
                                language_arr.push(languages[i].LanguageCode);
                            }
                        }
                        swal({
                            title: 'Dominant language',
                            text: language_arr.join(', ')
                        });
                        $('.context-menu').hide();
                    }});
                };
                //TRANSLATE TEXT
                discussionView.on('childview:childview:translate:text', function(childView, model, options){
                    _translateText(options.text);
                });
                var _translateText = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'translate'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        swal({
                            title: 'Translated text',
                            text: results.get('data').TranslatedText
                        });
                        $('.context-menu').hide();
                    }});
                };
                //SAVE MESSAGE
                discussionView.on('childview:childview:save:message', function(childView, model, options){
                    _saveMessage(options.user);
                });
                var _saveMessage = function(user){
                    //New message
                    var new_message = new ProjectManager.Entities.Message({
                        user: user
                    });
                    new_message.save({}, {success: function(){
                        //Close overlay
                        ProjectManager.commands.execute('close:overlay');
                        //Scroll to top
                        $(window).scrollTop(0);
                        //Show message
                        $('.messagesWrap').removeClass('u-hide');
                        ProjectManager.vent.trigger('chats:show', new_message.get('_id'));
                    }});
                };
                ProjectManager.overlayRegion.show(discussionView);
            });
        },
        showResponsesOverlay: function(block_id){
            $('.overlay').show();
            //Fetch block
            var fetchingBlock = ProjectManager.request('block:entity', block_id);
            $.when(fetchingBlock).done(function(block){
                var responsesView = new ProjectManager.ProjectApp.EntityViews.ResponsesView({
                    model: block
                });
                //Show
                responsesView.on('show', function(){
                    setTimeout(function(){
                        responsesView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Show bar chart if MCQ
                    if(block.get('type') == 'mcq'){
                        if(block.get('mcqs') && block.get('mcqs').length){
                            var mcqs = block.get('mcqs');
                            var labels = [];
                            var data = [];
                            for(var i=0; i<mcqs.length; i++){
                                labels.push(mcqs[i].text);
                                if(mcqs[i].voters && mcqs[i].voters.length){
                                    data.push(mcqs[i].voters.length);
                                } else {
                                    data.push(0);
                                }
                            }
                            //Show chart
                            var ctx = document.getElementById('mcqChart').getContext('2d');
                            var mcqChart = new Chart(ctx, {
                                type: 'horizontalBar',
                                data: {
                                    labels: labels,
                                    datasets: [{
                                        label: 'Voters',
                                        backgroundColor: 'rgba(29, 209, 161,0.6)',
                                        borderColor: 'rgba(29, 209, 161,1)',
                                        borderWidth: 1,
                                        data: data
                                    }]
                                },
                                options: {
                                    title: {
                                        display: true,
                                        text: 'Responses',
                                        fontSize: 18,
                                        fontColor: globalFontColor
                                    },
                                    tooltips: {
                                        mode: 'index',
                                        intersect: false,
                                        width: 200
                                    },
                                    responsive: true,
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            fontSize: 18,
                                            fontColor: globalFontColor
                                        }
                                    },
                                    scales: {
                                        xAxes: [{
                                            stacked: true,
                                            ticks: {
                                                fontSize: 18,
                                                fontColor: globalFontColor
                                            }
                                        }],
                                        yAxes: [{
                                            stacked: true,
                                            ticks: {
                                                fontSize: 18,
                                                fontColor: globalFontColor
                                            }
                                        }]
                                    }
                                }
                            });
                        }
                    }
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                });
                //SHOW ANALYSIS
                responsesView.on('show:analysis', function(value){
                    //Show loader
                    $('.chart-area, .chart-loader').show();
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: value.type
                    });
                    analysis.set({
                        text: value.text
                    });
                    analysis.save({}, {success: function(results){
                        //Hide loader
                        $('.chart-loader').hide();
                        if(value.type == 'sentiment'){
                            $('#myChart').show();
                            var positive_val = 0, negative_val = 0, neutral_val = 0;
                            var label_arr = [];
                            var positive_arr = [];
                            var negative_arr = [];
                            var neutral_arr = [];
                            var sentiment_arr = [];
                            for(var i=0; i<results.get('data').length; i++){
                                positive_val +=  results.get('data')[i].SentimentScore.Positive;
                                negative_val +=  results.get('data')[i].SentimentScore.Negative;
                                neutral_val +=  results.get('data')[i].SentimentScore.Neutral;
                                label_arr.push(i+1);
                                positive_arr.push(results.get('data')[i].SentimentScore.Positive.toFixed(2));
                                negative_arr.push(-results.get('data')[i].SentimentScore.Negative.toFixed(2));
                                neutral_arr.push(results.get('data')[i].SentimentScore.Neutral.toFixed(2));
                                sentiment_arr.push(results.get('data')[i].Sentiment);
                            }
                            positive_val = positive_val.toFixed(2);
                            negative_val = negative_val.toFixed(2);
                            neutral_val = neutral_val.toFixed(2);
                            //Show chart
                            var ctx = document.getElementById('myChart').getContext('2d');
                            myChart = new Chart(ctx, {
                                type: 'doughnut',
                                data: {
                                    labels: ['Positive', 'Negative', 'Neutral'],
                                    datasets: [{
                                        data: [positive_val, negative_val, neutral_val],
                                        backgroundColor: ['rgba(29, 209, 161,0.6)', 'rgba(255, 107, 107,0.6)', 'rgba(131, 149, 167,0.6)'],
                                        borderColor: ['rgba(29, 209, 161,1)', 'rgba(255, 107, 107,1)', 'rgba(131, 149, 167,1)'],
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    title: {
                                        display: true,
                                        text: 'Overall Sentiment Analysis',
                                        fontSize: 18,
                                        fontColor: globalFontColor
                                    },
                                    responsive: true,
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            fontSize: 18,
                                            fontColor: globalFontColor
                                        }
                                    },
                                    animation: {
                                        animateScale: true,
                                        animateRotate: true
                                    },
                                    onClick: function(c,i){
                                        //Drilldown
                                        myChart.destroy();
                                        //Show chart
                                        var ctx = document.getElementById('myChart').getContext('2d');
                                        myChart = new Chart(ctx, {
                                            type: 'bar',
                                            data: {
                                                labels: label_arr,
                                                datasets: [{
                                                    label: 'Positive',
                                                    backgroundColor: 'rgba(29, 209, 161,0.6)',
                                                    borderColor: 'rgba(29, 209, 161,1)',
                                                    borderWidth: 1,
                                                    data: positive_arr
                                                }, {
                                                    label: 'Negative',
                                                    backgroundColor: 'rgba(255, 107, 107,0.6)',
                                                    borderColor: 'rgba(255, 107, 107,1)',
                                                    borderWidth: 1,
                                                    data: negative_arr
                                                }, {
                                                    label: 'Neutral',
                                                    backgroundColor: 'rgba(131, 149, 167,0.6)',
                                                    borderColor: 'rgba(131, 149, 167,1)',
                                                    borderWidth: 1,
                                                    data: neutral_arr
                                                }]
                                            },
                                            options: {
                                                title: {
                                                    display: true,
                                                    text: 'Sentiment Analysis',
                                                    fontSize: 18,
                                                    fontColor: globalFontColor
                                                },
                                                tooltips: {
                                                    mode: 'index',
                                                    intersect: false,
                                                    width: 200,
                                                    callbacks: {
                                                        title: function(tooltipItem, data){
                                                            return sentiment_arr[tooltipItem[0].index];
                                                        }
                                                    }
                                                },
                                                responsive: true,
                                                legend: {
                                                    position: 'top',
                                                    labels: {
                                                        fontSize: 18,
                                                        fontColor: globalFontColor
                                                    }
                                                },
                                                scales: {
                                                    xAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }],
                                                    yAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }]
                                                },
                                                onClick: function(c,i){
                                                    e = i[0];
                                                    swal({
                                                        title: 'Response',
                                                        html: true,
                                                        text: value.text[e._index]
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        } else if(value.type == 'tone' && value.subtype == 'emotiontone'){
                            $('#myChart').show();
                            var anger_val = 0, fear_val = 0, joy_val = 0, sadness_val = 0, analytical_val = 0, confident_val = 0, tentative_val = 0;
                            var label_arr = [];
                            var anger_arr = [];
                            var fear_arr = [];
                            var joy_arr = [];
                            var sadness_arr = [];
                            var analytical_arr = [];
                            var confident_arr = [];
                            var tentative_arr = [];
                            for(var i=0; i<results.get('data').length; i++){
                                label_arr.push(i+1);
                                anger_arr.push(0);
                                fear_arr.push(0);
                                joy_arr.push(0);
                                sadness_arr.push(0);
                                analytical_arr.push(0);
                                confident_arr.push(0);
                                tentative_arr.push(0);
                                for(var j=0; j<results.get('data')[i].length;j++){
                                    var tone_id = results.get('data')[i][j].tone_id;
                                    var score = results.get('data')[i][j].score;
                                    if(tone_id == 'anger'){
                                        anger_val += score;
                                        anger_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'fear'){
                                        fear_val += score;
                                        fear_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'joy'){
                                        joy_val += score;
                                        joy_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'sadness'){
                                        sadness_val += score;
                                        sadness_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'analytical'){
                                        analytical_val += score;
                                        analytical_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'confident'){
                                        confident_val += score;
                                        confident_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'tentative'){
                                        tentative_val += score;
                                        tentative_arr[i] = score.toFixed(2);
                                    }
                                }
                            }
                            anger_val = anger_val.toFixed(2);
                            fear_val = fear_val.toFixed(2);
                            joy_val = joy_val.toFixed(2);
                            sadness_val = sadness_val.toFixed(2);
                            analytical_val = analytical_val.toFixed(2);
                            confident_val = confident_val.toFixed(2);
                            tentative_val = tentative_val.toFixed(2);
                            //Show chart
                            var ctx = document.getElementById('myChart').getContext('2d');
                            myChart = new Chart(ctx, {
                                type: 'doughnut',
                                data: {
                                    labels: ['Anger', 'Fear', 'Joy', 'Sadness', 'Analytical', 'Confident', 'Tentative'],
                                    datasets: [{
                                        data: [anger_val, fear_val, joy_val, sadness_val, analytical_val, confident_val, tentative_val],
                                        backgroundColor: ['rgba(238, 82, 83,0.6)', 'rgba(255, 159, 67,0.6)', 'rgba(46, 134, 222,0.6)', 'rgba(255, 159, 243,0.6)', 'rgba(95, 39, 205,0.6)', 'rgba(29, 209, 161,0.6)', 'rgba(131, 149, 167,0.6)'],
                                        borderColor: ['rgba(238, 82, 83, 1)', 'rgba(255, 159, 67, 1)', 'rgba(46, 134, 222, 1)', 'rgba(255, 159, 243, 1)', 'rgba(95, 39, 205, 1)', 'rgba(29, 209, 161, 1)', 'rgba(131, 149, 167, 1)'],
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    title: {
                                        display: true,
                                        text: 'Overall Emotion and Tone Analysis',
                                        fontSize: 18,
                                        fontColor: globalFontColor
                                    },
                                    responsive: true,
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            fontSize: 18,
                                            fontColor: globalFontColor
                                        }
                                    },
                                    animation: {
                                        animateScale: true,
                                        animateRotate: true
                                    },
                                    onClick: function(c,i){
                                        //Drilldown
                                        myChart.destroy();
                                        //Show chart
                                        var ctx = document.getElementById('myChart').getContext('2d');
                                        myChart = new Chart(ctx, {
                                            type: 'bar',
                                            data: {
                                                labels: label_arr,
                                                datasets: [{
                                                    label: 'Anger',
                                                    backgroundColor: 'rgba(238, 82, 83,0.6)',
                                                    borderColor: 'rgba(238, 82, 83,1)',
                                                    borderWidth: 1,
                                                    data: anger_arr
                                                }, {
                                                    label: 'Fear',
                                                    backgroundColor: 'rgba(255, 159, 67,0.6)',
                                                    borderColor: 'rgba(255, 159, 67,1)',
                                                    borderWidth: 1,
                                                    data: fear_arr
                                                }, {
                                                    label: 'Joy',
                                                    backgroundColor: 'rgba(46, 134, 222,0.6)',
                                                    borderColor: 'rgba(46, 134, 222,1)',
                                                    borderWidth: 1,
                                                    data: joy_arr
                                                }, {
                                                    label: 'Sadness',
                                                    backgroundColor: 'rgba(255, 159, 243,0.6)',
                                                    borderColor: 'rgba(255, 159, 243,1)',
                                                    borderWidth: 1,
                                                    data: sadness_arr
                                                }, {
                                                    label: 'Analytical',
                                                    backgroundColor: 'rgba(95, 39, 205,0.6)',
                                                    borderColor: 'rgba(95, 39, 205,1)',
                                                    borderWidth: 1,
                                                    data: analytical_arr
                                                }, {
                                                    label: 'Confident',
                                                    backgroundColor: 'rgba(29, 209, 161,0.6)',
                                                    borderColor: 'rgba(29, 209, 161,1)',
                                                    borderWidth: 1,
                                                    data: confident_arr
                                                }, {
                                                    label: 'Tentative',
                                                    backgroundColor: 'rgba(131, 149, 167,0.6)',
                                                    borderColor: 'rgba(131, 149, 167,1)',
                                                    borderWidth: 1,
                                                    data: tentative_arr
                                                }]
                                            },
                                            options: {
                                                title: {
                                                    display: true,
                                                    text: 'Emotion and Tone Analysis',
                                                    fontSize: 18,
                                                    fontColor: globalFontColor
                                                },
                                                tooltips: {
                                                    mode: 'index',
                                                    intersect: false,
                                                    width: 200
                                                },
                                                responsive: true,
                                                legend: {
                                                    position: 'top',
                                                    labels: {
                                                        fontSize: 18,
                                                        fontColor: globalFontColor
                                                    }
                                                },
                                                scales: {
                                                    xAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }],
                                                    yAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }]
                                                },
                                                events: ['click'],
                                                onClick: function(c,i){
                                                    e = i[0];
                                                    swal({
                                                        title: 'Response',
                                                        html: true,
                                                        text: value.text[e._index]
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        } else if(value.type == 'tone' && value.subtype == 'emotion'){
                            $('#myChart').show();
                            var anger_val = 0, fear_val = 0, joy_val = 0, sadness_val = 0;
                            var label_arr = [];
                            var anger_arr = [];
                            var fear_arr = [];
                            var joy_arr = [];
                            var sadness_arr = [];
                            for(var i=0; i<results.get('data').length; i++){
                                label_arr.push(i+1);
                                anger_arr.push(0);
                                fear_arr.push(0);
                                joy_arr.push(0);
                                sadness_arr.push(0);
                                for(var j=0; j<results.get('data')[i].length;j++){
                                    var tone_id = results.get('data')[i][j].tone_id;
                                    var score = results.get('data')[i][j].score;
                                    if(tone_id == 'anger'){
                                        anger_val += score;
                                        anger_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'fear'){
                                        fear_val += score;
                                        fear_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'joy'){
                                        joy_val += score;
                                        joy_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'sadness'){
                                        sadness_val += score;
                                        sadness_arr[i] = score.toFixed(2);
                                    }
                                }
                            }
                            anger_val = anger_val.toFixed(2);
                            fear_val = fear_val.toFixed(2);
                            joy_val = joy_val.toFixed(2);
                            sadness_val = sadness_val.toFixed(2);
                            //Show chart
                            var ctx = document.getElementById('myChart').getContext('2d');
                            myChart = new Chart(ctx, {
                                type: 'doughnut',
                                data: {
                                    labels: ['Anger', 'Fear', 'Joy', 'Sadness'],
                                    datasets: [{
                                        data: [anger_val, fear_val, joy_val, sadness_val],
                                        backgroundColor: ['rgba(238, 82, 83,0.6)', 'rgba(255, 159, 67,0.6)', 'rgba(46, 134, 222,0.6)', 'rgba(255, 159, 243,0.6)'],
                                        borderColor: ['rgba(238, 82, 83, 1)', 'rgba(255, 159, 67, 1)', 'rgba(46, 134, 222, 1)', 'rgba(255, 159, 243, 1)'],
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    title: {
                                        display: true,
                                        text: 'Overall Emotion Analysis',
                                        fontSize: 18,
                                        fontColor: globalFontColor
                                    },
                                    responsive: true,
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            fontSize: 18,
                                            fontColor: globalFontColor
                                        }
                                    },
                                    animation: {
                                        animateScale: true,
                                        animateRotate: true
                                    },
                                    onClick: function(c,i){
                                        //Drilldown
                                        myChart.destroy();
                                        //Show chart
                                        var ctx = document.getElementById('myChart').getContext('2d');
                                        myChart = new Chart(ctx, {
                                            type: 'bar',
                                            data: {
                                                labels: label_arr,
                                                datasets: [{
                                                    label: 'Anger',
                                                    backgroundColor: 'rgba(238, 82, 83,0.6)',
                                                    borderColor: 'rgba(238, 82, 83,1)',
                                                    borderWidth: 1,
                                                    data: anger_arr
                                                }, {
                                                    label: 'Fear',
                                                    backgroundColor: 'rgba(255, 159, 67,0.6)',
                                                    borderColor: 'rgba(255, 159, 67,1)',
                                                    borderWidth: 1,
                                                    data: fear_arr
                                                }, {
                                                    label: 'Joy',
                                                    backgroundColor: 'rgba(46, 134, 222,0.6)',
                                                    borderColor: 'rgba(46, 134, 222,1)',
                                                    borderWidth: 1,
                                                    data: joy_arr
                                                }, {
                                                    label: 'Sadness',
                                                    backgroundColor: 'rgba(255, 159, 243,0.6)',
                                                    borderColor: 'rgba(255, 159, 243,1)',
                                                    borderWidth: 1,
                                                    data: sadness_arr
                                                }]
                                            },
                                            options: {
                                                title: {
                                                    display: true,
                                                    text: 'Emotion Analysis',
                                                    fontSize: 18,
                                                    fontColor: globalFontColor
                                                },
                                                tooltips: {
                                                    mode: 'index',
                                                    intersect: false,
                                                    width: 200
                                                },
                                                responsive: true,
                                                legend: {
                                                    position: 'top',
                                                    labels: {
                                                        fontSize: 18,
                                                        fontColor: globalFontColor
                                                    }
                                                },
                                                scales: {
                                                    xAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }],
                                                    yAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }]
                                                },
                                                events: ['click'],
                                                onClick: function(c,i){
                                                    e = i[0];
                                                    swal({
                                                        title: 'Response',
                                                        html: true,
                                                        text: value.text[e._index]
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        } else if(value.type == 'tone'){
                            $('#myChart').show();
                            var analytical_val = 0, confident_val = 0, tentative_val = 0;
                            var label_arr = [];
                            var analytical_arr = [];
                            var confident_arr = [];
                            var tentative_arr = [];
                            for(var i=0; i<results.get('data').length; i++){
                                label_arr.push(i+1);
                                analytical_arr.push(0);
                                confident_arr.push(0);
                                tentative_arr.push(0);
                                for(var j=0; j<results.get('data')[i].length;j++){
                                    var tone_id = results.get('data')[i][j].tone_id;
                                    var score = results.get('data')[i][j].score;
                                    if(tone_id == 'analytical'){
                                        analytical_val += score;
                                        analytical_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'confident'){
                                        confident_val += score;
                                        confident_arr[i] = score.toFixed(2);
                                    }
                                    if(tone_id == 'tentative'){
                                        tentative_val += score;
                                        tentative_arr[i] = score.toFixed(2);
                                    }
                                }
                            }
                            analytical_val = analytical_val.toFixed(2);
                            confident_val = confident_val.toFixed(2);
                            tentative_val = tentative_val.toFixed(2);
                            //Show chart
                            var ctx = document.getElementById('myChart').getContext('2d');
                            myChart = new Chart(ctx, {
                                type: 'doughnut',
                                data: {
                                    labels: ['Analytical', 'Confident', 'Tentative'],
                                    datasets: [{
                                        data: [analytical_val, confident_val, tentative_val],
                                        backgroundColor: ['rgba(95, 39, 205,0.6)', 'rgba(29, 209, 161,0.6)', 'rgba(131, 149, 167,0.6)'],
                                        borderColor: ['rgba(95, 39, 205, 1)', 'rgba(29, 209, 161, 1)', 'rgba(131, 149, 167, 1)'],
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    title: {
                                        display: true,
                                        text: 'Overall Tone Analysis',
                                        fontSize: 18,
                                        fontColor: globalFontColor
                                    },
                                    responsive: true,
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            fontSize: 18,
                                            fontColor: globalFontColor
                                        }
                                    },
                                    animation: {
                                        animateScale: true,
                                        animateRotate: true
                                    },
                                    onClick: function(c,i){
                                        //Drilldown
                                        myChart.destroy();
                                        //Show chart
                                        var ctx = document.getElementById('myChart').getContext('2d');
                                        myChart = new Chart(ctx, {
                                            type: 'bar',
                                            data: {
                                                labels: label_arr,
                                                datasets: [{
                                                    label: 'Analytical',
                                                    backgroundColor: 'rgba(95, 39, 205,0.6)',
                                                    borderColor: 'rgba(95, 39, 205,1)',
                                                    borderWidth: 1,
                                                    data: analytical_arr
                                                }, {
                                                    label: 'Confident',
                                                    backgroundColor: 'rgba(29, 209, 161,0.6)',
                                                    borderColor: 'rgba(29, 209, 161,1)',
                                                    borderWidth: 1,
                                                    data: confident_arr
                                                }, {
                                                    label: 'Tentative',
                                                    backgroundColor: 'rgba(131, 149, 167,0.6)',
                                                    borderColor: 'rgba(131, 149, 167,1)',
                                                    borderWidth: 1,
                                                    data: tentative_arr
                                                }]
                                            },
                                            options: {
                                                title: {
                                                    display: true,
                                                    text: 'Tone Analysis',
                                                    fontSize: 18,
                                                    fontColor: globalFontColor
                                                },
                                                tooltips: {
                                                    mode: 'index',
                                                    intersect: false,
                                                    width: 200
                                                },
                                                responsive: true,
                                                legend: {
                                                    position: 'top',
                                                    labels: {
                                                        fontSize: 18,
                                                        fontColor: globalFontColor
                                                    }
                                                },
                                                scales: {
                                                    xAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }],
                                                    yAxes: [{
                                                        stacked: true,
                                                        ticks: {
                                                            fontSize: 18,
                                                            fontColor: globalFontColor
                                                        }
                                                    }]
                                                },
                                                events: ['click'],
                                                onClick: function(c,i){
                                                    e = i[0];
                                                    swal({
                                                        title: 'Response',
                                                        html: true,
                                                        text: value.text[e._index]
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        } else if(value.type == 'keyphrase'){
                            $('#wordcloud').show();
                            var key_phrases = [];
                            var key_phrases_lc = [];
                            var count = [];
                            for(var i=0; i<results.get('data').length; i++){
                                var phrases = results.get('data')[i].KeyPhrases;
                                if(phrases && phrases.length){
                                    for(var j=0; j<phrases.length; j++){
                                        var phrase_text_lc = phrases[j].Text.toLowerCase();
                                        if(key_phrases_lc.indexOf(phrase_text_lc) > -1){
                                            var index = key_phrases_lc.indexOf(phrase_text_lc);
                                            count[index] += 1;
                                        } else {
                                            key_phrases.push(phrases[j].Text);
                                            key_phrases_lc.push(phrase_text_lc);
                                            count.push(1);
                                        }
                                    }
                                }
                            }
                            //Get words
                            var words = [];
                            if(key_phrases.length){
                                for(var i=0; i<key_phrases.length; i++){
                                    words.push({text: key_phrases[i], weight: count[i]});
                                }
                            }
                            $('#wordcloud').jQCloud(words);
                        }
                    }});
                });
                //SHOW KEYPHRASE
                responsesView.on('show:keyphrase', function(value){
                    _showKeyPhrase(value.text);
                });
                var _showKeyPhrase = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'keyphrase'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        var phrases_arr = [];
                        var phrases = results.get('data')[0].KeyPhrases;
                        if(phrases && phrases.length){
                            for(var i=0; i<phrases.length; i++){
                                phrases_arr.push(phrases[i].Text);
                            }
                        }
                        swal({
                            title: 'Key phrases',
                            text: phrases_arr.join(', ')
                        });
                        $('.context-menu').hide();
                    }});
                };
                //SHOW SYNTAX
                responsesView.on('show:syntax', function(value){
                    _showSyntax(value.text);
                });
                var _showSyntax = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'syntax'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        var syntax_arr = [];
                        var syntaxtokens = results.get('data')[0].SyntaxTokens;
                        if(syntaxtokens && syntaxtokens.length){
                            for(var i=0; i<syntaxtokens.length; i++){
                                syntax_arr.push("<tr><td>"+syntaxtokens[i].Text+"</td><td>"+syntaxtokens[i].PartOfSpeech.Tag+"</td></tr>");
                            }
                        }
                        swal({
                            title: 'Syntax Analysis',
                            html: true,
                            text: "<table>"+syntax_arr.join('')+"</table>"
                        });
                        $('.context-menu').hide();
                    }});
                };
                //SHOW ENTITY
                responsesView.on('show:entity', function(value){
                    _showEntity(value.text);
                });
                var _showEntity = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'entity'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        var entity_arr = [];
                        var entities = results.get('data')[0].Entities;
                        if(entities && entities.length){
                            for(var i=0; i<entities.length; i++){
                                entity_arr.push("<tr><td>"+entities[i].Text+"</td><td>"+entities[i].Type+"</td></tr>");
                            }
                        }
                        swal({
                            title: 'Entities',
                            html: true,
                            text: "<table>"+entity_arr.join('')+"</table>"
                        });
                        $('.context-menu').hide();
                    }});
                };
                //SHOW LANGUAGE
                responsesView.on('show:language', function(value){
                    _showLanguage(value.text);
                });
                var _showLanguage = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'language'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        var language_arr = [];
                        var languages = results.get('data')[0].Languages;
                        if(languages && languages.length){
                            for(var i=0; i<languages.length; i++){
                                language_arr.push(languages[i].LanguageCode);
                            }
                        }
                        swal({
                            title: 'Dominant language',
                            text: language_arr.join(', ')
                        });
                        $('.context-menu').hide();
                    }});
                };
                //TRANSLATE TEXT
                responsesView.on('translate:text', function(value){
                    _translateText(value.text);
                });
                var _translateText = function(text){
                    //Analysis
                    var analysis = new ProjectManager.Entities.Analysis({
                        _type: 'translate'
                    });
                    analysis.set({
                        text: text
                    });
                    analysis.save({}, {success: function(results){
                        swal({
                            title: 'Translated text',
                            text: results.get('data').TranslatedText
                        });
                        $('.context-menu').hide();
                    }});
                };
                //SAVE MESSAGE
                responsesView.on('save:message', function(value){
                    _saveMessage(value.user);
                });
                var _saveMessage = function(user){
                    //New message
                    var new_message = new ProjectManager.Entities.Message({
                        user: user
                    });
                    new_message.save({}, {success: function(){
                        //Close overlay
                        ProjectManager.commands.execute('close:overlay');
                        //Scroll to top
                        $(window).scrollTop(0);
                        //Show message
                        $('.messagesWrap').removeClass('u-hide');
                        ProjectManager.vent.trigger('chats:show', new_message.get('_id'));
                    }});
                };
                ProjectManager.overlayRegion.show(responsesView);
            });
        },
        showBlockIftttOverlay: function(block_id){
            $('.overlay').show();
            var excluded_badges = [], excluded_skills = [];
            //Fetch block
            var fetchingBlock = ProjectManager.request('block:entity', block_id);
            $.when(fetchingBlock).done(function(block){
                var blockIftttView = new ProjectManager.ProjectApp.EntityViews.BlockIftttView({
                    model: block
                });
                //Show
                blockIftttView.on('show', function(){
                    setTimeout(function(){
                        blockIftttView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Typeahead for badges
                    var badgeList = new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                        queryTokenizer: Bloodhound.tokenizers.obj.whitespace,
                        remote: {
                            url: '/api/search/badges?text=%QUERY&excluded=%EXCLUDED&course=' + block.get('course'),
                            replace: function(url){
                                return url.replace('%EXCLUDED', JSON.stringify(excluded_badges)).replace('%QUERY', blockIftttView.$('.badges-input.tt-input').val());
                            },
                            filter: function(parsedResponse){
                                return parsedResponse;
                            }
                        }
                    });
                    //Initialize badgeList
                    badgeList.initialize();
                    //Show typeahead
                    blockIftttView.$('.badges-input').typeahead({
                        hint: true,
                        highlight: true,
                        minLength: 1
                    },
                    {
                        name: 'title',
                        displayKey: 'title',
                        limit: 5,
                        source: badgeList.ttAdapter(),
                        templates: {
                            empty: [
                              '<div class="no-find">',
                              'Unable to find any such badge in this course',
                              '</div>'
                            ].join('\n'),
                            suggestion: Handlebars.compile("<p class='title'>{{title}}</p>")
                        }
                    });
                    //Focus
                    blockIftttView.$('.badges-input').focus();
                    //Add new badge on typeahead autocomplete
                    blockIftttView.$('.badges-input').on('typeahead:selected typeahead:autocompleted', function(e, datum){
                        var $input = blockIftttView.$('.badges-input');
                        $input.typeahead('val','').focus();
                        blockIftttView.$('.badge-list').append("<span class='one-badge new-badge' data-id='"+datum._id+"'>"+datum.title+"</span>");
                        //Add to excluded
                        excluded_badges.push(datum._id);
                    });
                    //Typeahead for skills
                    var skillList = new Bloodhound({
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                        queryTokenizer: Bloodhound.tokenizers.obj.whitespace,
                        remote: {
                            url: '/api/search/skills?text=%QUERY&excluded=%EXCLUDED&course=' + block.get('course'),
                            replace: function(url){
                                return url.replace('%EXCLUDED', JSON.stringify(excluded_skills)).replace('%QUERY', blockIftttView.$('.skills-input.tt-input').val());
                            },
                            filter: function(parsedResponse){
                                return parsedResponse;
                            }
                        }
                    });
                    //Initialize skillList
                    skillList.initialize();
                    //Show typeahead
                    blockIftttView.$('.skills-input').typeahead({
                        hint: true,
                        highlight: true,
                        minLength: 1
                    },
                    {
                        name: 'title',
                        displayKey: 'title',
                        limit: 5,
                        source: skillList.ttAdapter(),
                        templates: {
                            empty: [
                              '<div class="no-find">',
                              'Unable to find any such skill in this course',
                              '</div>'
                            ].join('\n'),
                            suggestion: Handlebars.compile("<p class='title'>{{title}}</p>")
                        }
                    });
                    //Focus
                    blockIftttView.$('.skills-input').focus();
                    //Add new skill on typeahead autocomplete
                    blockIftttView.$('.skills-input').on('typeahead:selected typeahead:autocompleted', function(e, datum){
                        var $input = blockIftttView.$('.skills-input');
                        $input.typeahead('val','').focus();
                        //Check if inc
                        if(!blockIftttView.$('.skill-inc').val().trim() || isNaN(blockIftttView.$('.skill-inc').val().trim())){
                            blockIftttView.$('.skill-inc').val('').focus();
                        } else {
                            var inc = blockIftttView.$('.skill-inc').val().trim();
                            blockIftttView.$('.skill-list').append("<span class='one-badge new-badge' data-inc='"+inc+"' data-id='"+datum._id+"'>"+datum.title+"</span>");
                            //Add to excluded
                            excluded_skills.push(datum._id);
                            blockIftttView.$('.skill-inc').val('').focus();
                        }
                    });
                    //Show feedbacks, badges and skills
                    if(block.get('feedbacks') && block.get('feedbacks').length){
                        for(var i=0; i<block.get('feedbacks').length; i++){
                            var feedback = block.get('feedbacks')[i];
                            //If MCQ
                            if(block.get('type') == 'mcq'){
                                //Get selected options
                                var options_name = '';
                                for(var j=0; j<feedback.selected_options.length; j++){
                                    if(j== feedback.selected_options.length - 1){
                                        options_name += blockIftttView.$(".mcq-block .block-option[data-id='" + feedback.selected_options[j] + "'] .block-text").text();
                                    } else {
                                        options_name += blockIftttView.$(".mcq-block .block-option[data-id='" + feedback.selected_options[j] + "'] .block-text").text() + ', ';
                                    }
                                }
                                //Append feedback
                                if(feedback.text){
                                    blockIftttView.$('.feedback-list').append("<span class='one-badge' data-id='"+feedback._id+"'>"+options_name+ " &#8594; " +feedback.text+"</span>");
                                } else {
                                    //Get badge and skill names
                                    var badge_list = [];
                                    var skill_list = [];
                                    for(var k=0; k<feedback.badges.length; k++){
                                        if(feedback.badges[k].skill_inc){
                                            skill_list.push(feedback.badges[k].badge.title + ' (' + feedback.badges[k].skill_inc + ')');
                                        } else {
                                            badge_list.push(feedback.badges[k].badge.title);
                                        }
                                    }
                                    //Append badges and skills
                                    if(badge_list && badge_list.length){
                                        var badge_name = badge_list.join().replace(/,/g, ", ");
                                        blockIftttView.$('.badge-list').append("<span class='one-badge' data-id='"+feedback._id+"'>"+options_name+ " &#8594; " +badge_name+"</span>");
                                    }
                                    if(skill_list && skill_list.length){
                                        var skill_name = skill_list.join().replace(/,/g, ", ");
                                        blockIftttView.$('.skill-list').append("<span class='one-badge' data-id='"+feedback._id+"'>"+options_name+ " &#8594; " +skill_name+"</span>");
                                    }
                                }
                            } else if(block.get('type') == 'fill'){
                                //Fill name: Index of blank - Fill items
                                var fill_name = '';
                                fill_name += blockIftttView.$('.fill-block .blank-fill').index(blockIftttView.$(".blank-fill[data-id='" + feedback.fill_id + "']")) + 1;
                                fill_name += " &#8594; ";
                                fill_name += feedback.fill_items.join().replace(/,/g, ", ");
                                //Append feedback
                                if(feedback.text){
                                    blockIftttView.$('.feedback-list').append("<span class='one-badge' data-id='"+feedback._id+"'>"+fill_name+ " &#8594; " +feedback.text+"</span>");
                                } else {
                                    //Get badge and skill names
                                    var badge_list = [];
                                    var skill_list = [];
                                    for(var k=0; k<feedback.badges.length; k++){
                                        if(feedback.badges[k].skill_inc){
                                            skill_list.push(feedback.badges[k].badge.title + ' (' + feedback.badges[k].skill_inc + ')');
                                        } else {
                                            badge_list.push(feedback.badges[k].badge.title);
                                        }
                                    }
                                    //Append badges and skills
                                    if(badge_list && badge_list.length){
                                        var badge_name = badge_list.join().replace(/,/g, ", ");
                                        blockIftttView.$('.badge-list').append("<span class='one-badge' data-id='"+feedback._id+"'>"+fill_name+ " &#8594; " +badge_name+"</span>");
                                    }
                                    if(skill_list && skill_list.length){
                                        var skill_name = skill_list.join().replace(/,/g, ", ");
                                        blockIftttView.$('.skill-list').append("<span class='one-badge' data-id='"+feedback._id+"'>"+fill_name+ " &#8594; " +skill_name+"</span>");
                                    }
                                }
                            }
                        }
                    }
                    //Focus
                    blockIftttView.$('.feedback-text').focus();
                });
                //Remove badge
                blockIftttView.on('remove:badge', function(value){
                    if(value.is_new){
                        //New badge
                        //Exclude badge
                        var index = excluded_badges.indexOf(value.feedback);
                        if(index > -1){
                            excluded_badges.splice(index, 1);
                        }
                        //Exclude skill
                        var index = excluded_skills.indexOf(value.feedback);
                        if(index > -1){
                            excluded_skills.splice(index, 1);
                        }
                    } else {
                        //Remove
                        var block = new ProjectManager.Entities.Block({
                            _id: block_id,
                            _action: 'remove_feedback'
                        });
                        block.set({
                            feedback: value.feedback
                        });
                        block.save({}, {
                            dataType: 'text',
                            success: function(){
                                //Exclude badge
                                var index = excluded_badges.indexOf(value.feedback);
                                if(index > -1){
                                    excluded_badges.splice(index, 1);
                                }
                                //Exclude skill
                                var index = excluded_skills.indexOf(value.feedback);
                                if(index > -1){
                                    excluded_skills.splice(index, 1);
                                }
                            }
                        });
                    }
                });
                //Add feedback
                blockIftttView.on('add:feedback', function(value){
                    var new_feedback = new ProjectManager.Entities.Block({
                        _id: block_id,
                        _action: 'add_feedback'
                    });
                    new_feedback.set({
                        text: value.text,
                        selected_options: value.selected_options,
                        fill_items: value.fill_items,
                        fill_id: value.fill_id
                    });
                    //Check badges
                    if(blockIftttView.$('.one-badge.new-badge').length){
                        var badges = [];
                        blockIftttView.$('.one-badge.new-badge').each(function(){
                            if($(this).data('inc')){
                                badges.push({badge: $(this).data('id'), skill_inc: $(this).data('inc')});
                            } else {
                                badges.push({badge: $(this).data('id')});
                            }
                        });
                        new_feedback.set('badges', badges);
                    }
                    //Save
                    new_feedback.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                    }});
                });
                ProjectManager.overlayRegion.show(blockIftttView);
            });
        },
        showFeedback: function(block_id, feedback_id){
            //Fetch block
            var fetchingBlock = ProjectManager.request('block:entity', block_id);
            $.when(fetchingBlock).done(function(block){
                //Get feedback collection
                if(!feedbackCollection || !feedbackCollection.length){
                    feedbackCollection = new Backbone.Collection();
                }
                //Show view
                var feedbackView = new ProjectManager.ProjectApp.EntityViews.FeedBackView({
                    collection: feedbackCollection
                });
                //Show
                feedbackView.on('show', function(){
                    //Get feedback
                    var feedbacks = block.get('feedbacks');
                    var feedback;
                    for(var i=0; i<feedbacks.length; i++){
                        if(feedbacks[i]._id == feedback_id){
                            feedback = feedbacks[i];
                            break;
                        }
                    }
                    //Get feedback
                    if(feedback){
                        var feedback_model = new Backbone.Model(feedback);
                        feedbackView.collection.add(feedback_model);
                        setTimeout(function(){
                            feedbackView.collection.remove(feedback_model);
                        }, 6000);
                    }
                });
                ProjectManager.feedRegion.show(feedbackView);
            });
        },
        showAnimation: function(name){
            $('.overlay').show();
            //Animation view
            var animationView = new ProjectManager.ProjectApp.EntityViews.AnimationView();
            //Show
            animationView.on('show', function(){
                //Hide scroll on main page
                ProjectManager.commands.execute('show:overlay');
                //Show animation
                animationView.$('.' + name).removeClass('u-hide');
            });
            ProjectManager.overlayRegion.show(animationView);
        },
        showEnrolledCoursesOverlay: function(){
            $('.overlay').show();
            //Fetch courses
            var fetchingCourses = ProjectManager.request('course:entities', 'enrolled');
            $.when(fetchingCourses).done(function(courses){
                var coursesInsightView = new ProjectManager.ProjectApp.EntityViews.CoursesInsightView({
                    collection: courses
                });
                //Show
                coursesInsightView.on('show', function(){
                    setTimeout(function(){
                        coursesInsightView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Show number of enrolled courses
                    coursesInsightView.$('.js-enrolled-courses span').text(courses.length);
                });
                ProjectManager.overlayRegion.show(coursesInsightView);
            });
        },
        showInvitations: function(){
            $('.overlay').show();
            //Fetch invited users
            var fetchingUsers = ProjectManager.request('user:entities', 'inactive');
            $.when(fetchingUsers).done(function(users){
                var usersView = new ProjectManager.ProjectApp.EntityViews.UsersView({
                    collection: users
                });
                //Show
                usersView.on('show', function(){
                    setTimeout(function(){
                        usersView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Show user number
                    usersView.$('.users-data .overlay-label span').text(users.length);
                });
                //Activate user
                usersView.on('childview:activate:user', function(childView, model){
                    var user = new ProjectManager.Entities.User({
                        _id: model.user_id,
                        _action: 'activate'
                    });
                    user.set();
                    user.save({}, {
                        dataType: 'text',
                        success: function(){
                            childView.$el.remove();
                        }
                    });
                });
                ProjectManager.overlayRegion.show(usersView);
            });
        },
        showSettings: function(){
            $('.overlay').show();
            //Fetch current user
            var fetchingUser = ProjectManager.request('user:entity');
            $.when(fetchingUser).done(function(user){
                var settingsView = new ProjectManager.ProjectApp.EntityViews.SettingsView({
                    model:user
                });
                //Show
                settingsView.on('show', function(){
                    setTimeout(function(){
                        settingsView.$('.overlay-box').addClass('animate');
                    }, 100);
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                    //Focus
                    settingsView.$('.profile-name').focus();
                    //Show about
                    if(user.get('about')){
                        var tmp = document.createElement('div');
                        tmp.innerHTML = user.get('about').replace(/<br\s*[\/]?>/gi, '\n');
                        var about = tmp.textContent || tmp.innerText || "";
                        settingsView.$('.profile-about').val(about);
                    }
                    //Upload dp
                    settingsView.$('.dp-upload').each(function(){
                        /* For each file selected, process and upload */
                        var form = $(this);
                        $(this).fileupload({
                            dropZone: $('#drop-dp'),
                            url: form.attr('action'), //Grab form's action src
                            type: 'POST',
                            autoUpload: true,
                            dataType: 'xml', //S3's XML response,
                            add: function(event, data){
                                //Check file type
                                var fileType = data.files[0].name.split('.').pop(), allowedtypes = 'jpeg,jpg,png,gif';
                                if (allowedtypes.indexOf(fileType) < 0) {
                                    alert('Invalid file type, aborted');
                                    return false;
                                }
                                //Upload through CORS
                                $.ajax({
                                    url: '/api/signed',
                                    type: 'GET',
                                    dataType: 'json',
                                    data: {title: data.files[0].name}, // Send filename to /signed for the signed response
                                    async: false,
                                    success: function(data){
                                        // Now that we have our data, we update the form so it contains all
                                        // the needed data to sign the request
                                        form.find('input[name=key]').val(data.key);
                                        form.find('input[name=policy]').val(data.policy);
                                        form.find('input[name=signature]').val(data.signature);
                                        form.find('input[name=Content-Type]').val(data.contentType);
                                    }
                                });
                                data.submit();
                            },
                            send: function(e, data){
                                settingsView.$('#drop-dp span').html('Uploading <b>...</b>');
                                settingsView.$('.js-save').addClass('u-disabled');
                            },
                            progress: function(e, data){
                                var percent = Math.round((e.loaded / e.total) * 100);
                                settingsView.$('#drop-dp span b').text(percent + '%');
                            },
                            fail: function(e, data){
                                settingsView.$('#drop-dp span').html('Update profile picture');
                                settingsView.$('.js-save').removeClass('u-disabled');
                            },
                            success: function(data){
                                var image_url = 'https://d1u3z33x3g234l.cloudfront.net/' +  form.find('input[name=key]').val();
                                image_url = encodeURI(image_url);
                                //Update User
                                var user = new ProjectManager.Entities.User();
                                user.set({
                                    dp: image_url
                                });
                                user.save({}, {success: function(){
                                    //Show save button
                                    settingsView.$('#drop-dp span').addClass('u-hide');
                                    settingsView.$('#drop-dp').css('backgroundImage', 'url('+image_url+')');
                                    settingsView.$('.js-save').removeClass('u-disabled');
                                }});
                            }
                        });
                    });
                    //Show chosen on touch devices
                    if(!$('html').hasClass('touchevents')){
                        //Pre-populate gender and country
                        if(user.get('sex')) settingsView.$(".select-gender option[value="+user.get('sex')+"]").prop('selected', true);
                        if(user.get('country')) settingsView.$(".select-country option[value='"+user.get('country')+"']").prop('selected', true);
                        //Pre-populate theme and layout
                        if(user.get('theme')) settingsView.$(".select-theme option[value="+user.get('theme')+"]").prop('selected', true);
                        if(user.get('layout')) settingsView.$(".select-layout option[value="+user.get('layout')+"]").prop('selected', true);
                        //Add chosen to dropdown
                        settingsView.$('.select-gender').chosen({
                            width: "400px",
                            disable_search_threshold: 13
                        });
                        settingsView.$('.select-country').chosen({
                            width: "400px",
                            disable_search_threshold: 13
                        });
                        settingsView.$('.select-theme').chosen({
                            width: "400px",
                            disable_search_threshold: 13
                        });
                        settingsView.$('.select-layout').chosen({
                            width: "400px",
                            disable_search_threshold: 13
                        });
                    } else {
                        settingsView.$('.select-gender > option:first-child').remove();
                        settingsView.$('.select-country > option:first-child').remove();
                        settingsView.$('.select-gender').prepend("<option value='' disabled selected>Gender</option>").val('');
                        settingsView.$('.select-country').prepend("<option value='' disabled selected>Country</option>").val('');
                        //Pre-populate gender and country
                        if(user.get('sex')) settingsView.$(".select-gender option[value="+user.get('sex')+"]").prop('selected', true);
                        if(user.get('country')) settingsView.$(".select-country option[value='"+user.get('country')+"']").prop('selected', true);
                        //Pre-populate theme and layout
                        if(user.get('theme')) settingsView.$(".select-theme option[value="+user.get('theme')+"]").prop('selected', true);
                        if(user.get('layout')) settingsView.$(".select-layout option[value="+user.get('layout')+"]").prop('selected', true);
                    }
                });
                //Update profile
                settingsView.on('update:profile', function(value){
                    var user = new ProjectManager.Entities.User();
                    user.set({
                        name: value.name,
                        about: value.about,
                        job: {
                            title: value.job_title,
                            org: value.job_org
                        },
                        country: value.country,
                        city: value.city,
                        sex: value.sex,
                        phone: value.phone,
                        theme: value.theme,
                        layout: value.layout,
                        oldpwd: value.oldpwd,
                        newpwd: value.newpwd
                    });
                    user.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                        //Update theme and layout
                        if(value.theme != $('.pageWrap').data('theme') || value.layout != $('.pageWrap').data('layout')){
                            location.reload();
                        }
                    }});
                });
                ProjectManager.overlayRegion.show(settingsView);
            });
        },
        showSearchResults: function(text){
            //Fetch results
            var fetchingResults = ProjectManager.request('search:entities', 'all', text);
            $.when(fetchingResults).done(function(results){
                var resultsView = new ProjectManager.ProjectApp.EntityViews.SearchResultsView({
                    model: results
                });
                ProjectManager.resultsRegion.show(resultsView);
            });
        },
        showMessages: function(){
            //Fetch messages
            var fetchingMessages = ProjectManager.request('message:entities');
            $.when(fetchingMessages).done(function(messages){
                var messagesView = new ProjectManager.ProjectApp.EntityViews.MessagesView({
                    collection: messages
                });
                //Show
                messagesView.on('show', function(){
                    //Trigger socket events
                    ProjectManager.vent.off('socket:deleteChat');
                    //Socket: delete chat
                    ProjectManager.vent.on('socket:deleteChat', function(data){
                        //Remove message
                        var message = messages.get(data.messageId);
                        messages.remove(message);
                    });
                });
                ProjectManager.chatsRegion.show(messagesView);
            });
        },
        showChats: function(message_id){
            //Fetch message
            var fetchingMessage = ProjectManager.request('message:entity', message_id);
            $.when(fetchingMessage).done(function(message){
                var chatsView = new ProjectManager.ProjectApp.EntityViews.ChatsView({
                    model: message
                });
                //Show
                chatsView.on('show', function(){
                    //Autosize
                    autosize($('.new-chat textarea'));
                    //Scroll to last
                    chatsView.$('.all-chats').scrollTop(chatsView.$('.all-chats')[0].scrollHeight);
                    //Focus
                    chatsView.$('.new-chat textarea').focus();
                    //Hide unread message
                    $('.js-messages .unread-message').addClass('u-hide');
                    //Trigger socket events
                    ProjectManager.vent.off('socket:addChat');
                    ProjectManager.vent.off('socket:deleteChat');
                    //Socket: add chat
                    ProjectManager.vent.on('socket:addChat', function(data){
                        if(data.messageId != message_id) return;
                        //Hide unread message
                        $('.js-messages .unread-message').addClass('u-hide');
                        //Add chat
                        var chatJson = data.chat;
                        chatsView.collection.add(chatJson);
                        //Scroll to last
                        chatsView.$('.all-chats').scrollTop(chatsView.$('.all-chats')[0].scrollHeight);
                    });
                    //Socket: delete chat
                    ProjectManager.vent.on('socket:deleteChat', function(data){
                        if(data.messageId != message_id) return;
                        //Show messages
                        ProjectManager.vent.trigger('messages:show');
                    });
                });
                //Add chat
                chatsView.on('add:chat', function(value){
                    var edit_message = new ProjectManager.Entities.Message({
                        _id: message_id
                    });
                    edit_message.set({
                        text: value.text
                    })
                    edit_message.save({}, {success: function(new_chat){
                        var chat = new_chat.toJSON();
                        chatsView.collection.add(chat);
                        //Scroll to last
                        chatsView.$('.all-chats').scrollTop(chatsView.$('.all-chats')[0].scrollHeight);
                        //Emit socket
                        if($('.pageWrap').data('user') == message.get('creator')._id){
                            socket.emit('add_chat_toServer', {chat: new_chat, messageId: message_id, userId: message.get('user')._id});
                        } else {
                            socket.emit('add_chat_toServer', {chat: new_chat, messageId: message_id, userId: message.get('creator')._id});
                        }
                    }});
                });
                //Delete message
                chatsView.on('delete:message', function(value){
                    var edit_message = new ProjectManager.Entities.Message({
                        _id: message_id
                    });
                    edit_message.destroy({
                        dataType: 'text',
                        success: function(model, response){
                            //Show messages
                            ProjectManager.vent.trigger('messages:show');
                            //Emit socket
                            if($('.pageWrap').data('user') == message.get('creator')._id){
                                socket.emit('delete_chat_toServer', {messageId: message_id, userId: message.get('user')._id});
                            } else {
                                socket.emit('delete_chat_toServer', {messageId: message_id, userId: message.get('creator')._id});
                            }
                        }
                    });
                });
                ProjectManager.chatsRegion.show(chatsView);
            });
        }
    };
});
