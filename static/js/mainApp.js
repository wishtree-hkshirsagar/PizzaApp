
var ProjectManager = new Backbone.Marionette.Application();
//Initialize Variables and Functions
var totalQty;
//Variable to check if inside discussion
var pathInDiscussion = false;
//Default font family for ChartJS
// Chart.defaults.global.defaultFontFamily = "'IBM Plex Sans', sans-serif";
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
    //More btn
    $('.js-more').click(function(ev){
        ev.preventDefault();
        $('.navMore').toggle();
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
            'pizza/:slug': 'pizzaView',
            // 'course/:slug': 'courseView',
            // 'course/:slug/:container': 'courseContainerView'
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
        newBlockOverlayView: function(order){
            ProjectManager.ProjectApp.EntityController.Controller.showNewBlockOverlay(order);
        },
        editBlockOverlayView: function(block_id){
            ProjectManager.ProjectApp.EntityController.Controller.showEditBlockOverlay(block_id);
        },
        editPizzaOverlayView: function(pizza_id){
            ProjectManager.ProjectApp.EntityController.Controller.showEditPizzaOverlay(pizza_id);
        },
        publicPizzaView: function(){
            console.log($('.pageWrap').data('type'));
            ProjectManager.ProjectApp.EntityController.Controller.showPizzaHeader($('.pageWrap').data('type'));
            ProjectManager.ProjectApp.EntityController.Controller.showPizzas();
        },
        coursesView: function(type){
            conosole.log('coursesView')
            ProjectManager.ProjectApp.EntityController.Controller.showCoursesHeader(type);
            ProjectManager.ProjectApp.EntityController.Controller.showCourses(type);
        },
        pizzaView: function(slug){
            console.log('pizzaView');
            ProjectManager.ProjectApp.EntityController.Controller.showOnePizza(slug);     
        },
        courseView: function(slug, back_type){
            ProjectManager.ProjectApp.EntityController.Controller.showOneCourse(slug, '', back_type);
        },
        courseContainerView: function(slug, container){
            ProjectManager.ProjectApp.EntityController.Controller.showOneCourse(slug, container);
        },
        blocksView: function(course_id){
            ProjectManager.ProjectApp.EntityController.Controller.showBlocks(course_id);
        },
        settingsView: function(){
            ProjectManager.ProjectApp.EntityController.Controller.showSettings();
        },
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
    //Show new block overlay
    ProjectManager.vent.on('newBlockOverlay:show', function(order){
        API.newBlockOverlayView(order);
    });
    //Show edit block overlay
    ProjectManager.vent.on('editBlockOverlay:show', function(block_id){
        API.editBlockOverlayView(block_id);
    });
    ProjectManager.vent.on('editPizzaOverlay:show', function(pizza_id){
        API.editPizzaOverlayView(pizza_id);
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
        API.pizzaView(slug);
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

    //Show pizza details
    ProjectManager.vent.on('pizzaDetail:show', function(pizza_id){
        // console.log(pizza_id);
        var pizza_slug = $('.mainHeader .header-title').data('slug');
        // console.log(pizza_slug);
        ProjectManager.navigate('pizza/' + pizza_slug);
        API.blocksView(pizza_id);
    });
    //Show settings overlay
    ProjectManager.vent.on('settings:show', function(){
        API.settingsView();
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
            if(this._action == "update"){
                console.log('update')
                return '/api/pizza/' + this._id;
            } else if(this._id) {
                console.log(this._id)
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
    
    Entities.Block = Backbone.Model.extend({
        initialize: function(options){
            
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
    Entities.DetailCollection = Backbone.Collection.extend({
        initialize: function(models, options){
            //_id is pizza id
            this._id = options._id;
        },
        url: function(){
           
            return '/api/pizza/' + this._id
            
        },
        model: Entities.Pizza
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
            } else if(this._id){
                return '/api/blocks/' + this._id
            } else {
                return '/api/cart'
            }
        },
        model: Entities.Block
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
        getOnePizza: function(_id){
            var pizza = new Entities.Pizza({
                _id: _id
            });
            var defer = $.Deferred();
            pizza.fetch({
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
        getDetails: function(_id){
            var details = new Entities.DetailCollection([], {
                _id: _id
            });
            var defer = $.Deferred();
            details.fetch({
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
        getCartItems: function(){
            var blocks = new Entities.BlockCollection([], {});
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
    };
    //Request Response Callbacks
    ProjectManager.reqres.setHandler('pizza:entities', function(){
        console.log('Request Response Callbacks')
        return API.getPizza();
    });
    ProjectManager.reqres.setHandler('course:entities', function(_type){
        return API.getCourses(_type);
    });
    ProjectManager.reqres.setHandler('pizza:entity', function(_id){
        return API.getOnePizza(_id);
    });
    ProjectManager.reqres.setHandler('course:entity', function(_id){
        return API.getOneCourse(_id);
    });
    ProjectManager.reqres.setHandler('pizza:details', function(_id){
        return API.getDetails(_id);
    });
    ProjectManager.reqres.setHandler('block:entities', function(_id, _container){
        return API.getBlocks(_id, _container);
    });
    ProjectManager.reqres.setHandler('cart:entities', function(){
        return API.getCartItems();
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
    // EntityViews.NewPizzaView = Marionette.ItemView.extend({
    //     template: 'newPizzaTemplate',
    //     events: {
    //         'click .js-close': 'closeOverlay',
    //         'click .js-save:not(.u-disabled)': 'savePizza'
    //     },
    //     initialize: function(){
    //         console.log('initialize')
    //     },
    //     closeOverlay: function(ev){
    //         ev.preventDefault();
    //         ProjectManager.commands.execute('close:overlay');
    //     },
    //     savePizza: function(ev){
    //         console.log('save pizza');
    //     }
    // });
    //New course view
    EntityViews.NewPizzaView = Marionette.ItemView.extend({
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
        }
    });
    //Pizza header view
    EntityViews.PizzaHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'pizzasHeaderTemplate',
        initialize: function(){
            // console.log('pizzasHeaderTemplate')
            var fetchingCartDetails = ProjectManager.request('cart:entities');
            $.when(fetchingCartDetails).done(function(items){
                var pizzaHeaderView = new ProjectManager.ProjectApp.EntityViews.PizzaHeaderView({

                    collection: new Backbone.Collection(items.models[0].get('items'))
                });
                totalQty = items.models[0].get('totalQty');
            });
            $('#cart-counter').text(totalQty);
        },
        events: {
            'click .js-add-pizza': 'openNewPizzaOverlay'
        },
        openNewPizzaOverlay: function(ev){
            ev.preventDefault();
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
    //Empty blocks view
    EntityViews.EmptyBlocksView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'zero-items',
        template: 'emptyBlocksTemplate'
    });
    //Pizza collection view
    EntityViews.PizzaView = Marionette.CollectionView.extend({
        className: 'all-pizza sectionBox',
        childView: EntityViews.PizzaItemView,
        emptyView: EntityViews.EmptyBlocksView,
    });
    //Courses collection view
    EntityViews.CoursesView = Marionette.CollectionView.extend({
        className: 'all-courses sectionBox',
        childView: EntityViews.CourseItemView
    });
    // Pizza details header view
    EntityViews.PizzaDetailHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'pizzaDetailHeaderTemplate',
        initialize: function(){
            var fetchingCartDetails = ProjectManager.request('cart:entities');
            $.when(fetchingCartDetails).done(function(items){
                var pizzaDetailHeaderView = new ProjectManager.ProjectApp.EntityViews.PizzaDetailHeaderView({

                    collection: new Backbone.Collection(items.models[0].get('items'))
                });
                totalQty = items.models[0].get('totalQty');
            });
        },
        events: {

        }
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
            'click .js-add-block': 'showNewBlockOverlay',
            'click .js-show-insights': 'showBasicInsightsOverlay',
            'click .js-request-access': 'requestAccessToCourse',
            'click .js-remove-request': 'removeRequest',
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
        showNewBlockOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.vent.trigger('newBlockOverlay:show', 1);
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
    EntityViews.EditPizzaView = Marionette.ItemView.extend({
        template: 'editPizzaTemplate',
        events: {
            'click .js-close, .js-done': 'closeOverlay'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
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
            'click .js-save-block': 'editPizza',
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
        editPizza: function(ev){
            ev.preventDefault();  
            this.trigger('update:block');
        },
        deleteBlock: function(ev){
            ev.preventDefault();
            if(confirm('Are you sure you want to permanently delete this pizza?')) {
                this.trigger('delete:block');
            }
        }
    });
    //One Block view
    EntityViews.BlockItemView = Marionette.ItemView.extend({
        className: 'one-block u-transparent',
        template: 'blockOneTemplate',
        initialize: function(){
            console.log('block one template')
            $('#cart-counter').text(totalQty);
            this.$el.attr('data-id', this.model.get('_id'));
            // this.$el.attr('data-order', this.model.get('order'));
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
            'click .file-input': 'doNothing',
            'click .js-add-cart': 'addToCart'
        },
        addToCart: function(ev){
            ev.preventDefault();
            console.log('add');
            console.log(this.model.get('_id'));
            var fetchingPizza = ProjectManager.request('pizza:entity', this.model.get('slug'));
            $.when(fetchingPizza).done(function(pizza){
                var pizzaDetailHeaderView = new ProjectManager.ProjectApp.EntityViews.PizzaDetailHeaderView({
                    model: pizza
                });
                console.log(pizza);
            
                $.ajax({
                    url: '/api/cart',
                    type: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({
                        _id: pizza.get('_id'),
                        title: pizza.get('title'),
                        size: pizza.get('size'),
                        price: pizza.get('price'),
                        image: pizza.get('image')
                    }),
                    success: function(result){
                        console.log(result);
                        $('#cart-counter').text(result.totalQty)
                        totalQty = result.totalQty;
                        alert('Pizza has been added to the cart');
                    }
                });
            });
        },
        openEditPizzaOverlay: function(ev){
            console.log('editPizzaOverlay')
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('editPizzaOverlay:show', this.model.get('_id'));
        },
        showContainerBlocks: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('blocks:show', this.model.get('course'), this.model.get('_id'), this.model.get('title'));
        },
        editBlock: function(ev){
            console.log('edit block')
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
        template: 'pizzaBlocksTemplate',
        childView: EntityViews.BlockItemView,
        childViewContainer: 'div.all-blocks',
        emptyView: EntityViews.EmptyBlocksView,
        events: {
            
        },
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
            $('.overlay').show();
            //New course view
            var newPizzaView = new ProjectManager.ProjectApp.EntityViews.NewPizzaView();
            //Show
            newPizzaView.on('show', function(){
                setTimeout(function(){
                    newPizzaView.$('.overlay-box').addClass('animate');
                    newPizzaView.$('.save-pizza').addClass('disable-btn');
                    newPizzaView.$('.pizza-title').on('focusout', function(){
                        if(!newPizzaView.$('.pizza-title').val()){
                            newPizzaView.$('.pizza-name').text('Please enter a pizza name:').show();
                            newPizzaView.$('.pizza-title').addClass('hasError');
                        } else {
                            newPizzaView.$('.pizza-name').text('').show();
                            newPizzaView.$('.pizza-title').removeClass('hasError');
                        }
                    });
                    newPizzaView.$('#select-pizza').on('focusout', function(){
                        if(!newPizzaView.$('#select-pizza').find(":selected").val()){
                            newPizzaView.$('.pizza-size').text('Please select pizza size:').show();
                            newPizzaView.$('.select-pizza').addClass('hasError');
                            // newCourseView.$('label[name=wrap-pizzaType]:after').css({'top':'150px'});
                        } else {
                            newPizzaView.$('.pizza-size').text('').show();
                            newPizzaView.$('.select-pizza').removeClass('hasError');
                        }
                    });

                    newPizzaView.$('.pizza-price').on('focusout', function(){
                        if(!newPizzaView.$('.pizza-price').val()){
                            newPizzaView.$('.price').text('Please enter the pizza price:').show();
                            newPizzaView.$('.pizza-price').addClass('hasError');
                        } else {
                            newPizzaView.$('.price').text('').show();
                            newPizzaView.$('.pizza-price').removeClass('hasError');
                        }
                    });
                   
                }, 100);
                //Hide scroll on main page
                ProjectManager.commands.execute('show:overlay');
                //Focus
                newPizzaView.$('.course-title').focus();
                //Upload cover
                newPizzaView.$("#uploadFile").on('change',function(e) {
                    e.preventDefault();
                    var data = new FormData($('#uploadForm')[0]);
                    $.ajax({
                        url:'/api/upload',
                        type: 'POST',
                        contentType: false,
                        processData: false,
                        cache: false,
                        data: data,
                        success: function(res){
                            newPizzaView.$('.save-pizza').removeClass('disable-btn');
                        },
                        error: function (err) {
                            console.log(err, 'error');
                        }
                    });
                });
            });
            //Save new course
            newPizzaView.on('save:pizza', function(value){
                console.log(value)
                var new_pizza = new ProjectManager.Entities.Pizza({
                    title: value.title,
                    size: value.size,
                    price: value.price
                });
                new_pizza.save({}, {success: function(){
                    ProjectManager.vent.trigger('add:pizza', new_pizza);
                }});
            });
            ProjectManager.overlayRegion.show(newPizzaView);
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
            console.log(type)
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

        showPizzas: function(){
            console.log('show pizza');
            var loadingView = new ProjectManager.Common.Views.Loading();
            ProjectManager.contentRegion.show(loadingView);
             //Fetch pizzas
             var fetchingPizza = ProjectManager.request('pizza:entities');
             $.when(fetchingPizza).done(function(pizzas){
                console.log('fetching pizza');
                var pizzaView = new ProjectManager.ProjectApp.EntityViews.PizzaView({
                    collection: pizzas
                });
                console.log(pizzas);

                ProjectManager.vent.off('add:pizza');
                ProjectManager.vent.on('add:pizza', function(pizza){
                    pizzas.add(pizza, {at: 0});
                    ProjectManager.commands.execute('close:overlay');
                });

                ProjectManager.contentRegion.show(pizzaView);
             });
        },

        showOnePizza: function(slug){
            console.log('showOnePizza')
            var fetchingPizza = ProjectManager.request('pizza:entity', slug);
            $.when(fetchingPizza).done(function(pizza){
                var pizzaDetailHeaderView = new ProjectManager.ProjectApp.EntityViews.PizzaDetailHeaderView({
                    model: pizza
                });
                console.log(pizza)
                pizzaDetailHeaderView.on('show', function(){
                    document.title = 'Pizza Hut: ' + pizza.get('title');
                    
                    pizzaDetailHeaderView.$('.header-title').data('id', pizza.get('_id'));
                    pizzaDetailHeaderView.$('.header-title').data('slug', pizza.get('slug'));
                    $('.mainHeader .header-title').append("<a href='/' class='header-back header-home'>Pizza</a>");
                    $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                    $('.mainHeader .header-title').append("<a href='/pizza/" + pizza.get('slug') + "' class='header-course header-now' data-id='" + pizza.get('_id') + "'>" + pizza.get('title') + "</a>");
                    ProjectManager.vent.trigger('pizzaDetail:show', pizza.get('_id'));
                });

                ProjectManager.headerRegion.show(pizzaDetailHeaderView);
            });
        },
        // showOneCourse: function(slug, container, back_type){
        //     console.log('showOneCourse')
        //     //Fetch course
        //     var fetchingCourse = ProjectManager.request('course:entity', slug);
        //     $.when(fetchingCourse).done(function(course){
        //         var courseHeaderView = new ProjectManager.ProjectApp.EntityViews.CourseHeaderView({
        //             model: course
        //         });
        //         //Show
        //         courseHeaderView.on('show', function(){
        //             //Show course title
        //             document.title = 'FramerSpace: '+ course.get('title');
        //             //Add course id to header
        //             courseHeaderView.$('.header-title').data('id', course.get('_id'));
        //             courseHeaderView.$('.header-title').data('slug', course.get('slug'));
        //             //Update learner progress
        //             if(course.get('learners') && course.get('learners').length){
        //                 learnerProgress = course.get('learners')[0].progress;
        //                 learnerContainers = course.get('learners')[0].containers;
        //             }
        //             //Show course blocks
        //             if(container){
        //                 ProjectManager.vent.trigger('blocks:show', course.get('_id'), container);
        //             } else {
        //                 ProjectManager.vent.trigger('blocks:show', course.get('_id'));
        //             }
        //             //Show header title
        //             if(back_type == 'drafts'){
        //                 $('.mainHeader .header-title').append("<a href='/drafts' class='header-back header-drafts'>Draft Courses</a>");
        //             } else if(back_type == 'archived'){
        //                 $('.mainHeader .header-title').append("<a href='/archived' class='header-back header-archived'>Archived Courses</a>");
        //             } else {
        //                 $('.mainHeader .header-title').append("<a href='/' class='header-back header-home'>Courses</a>");
        //             }
        //             $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
        //             $('.mainHeader .header-title').append("<a href='/course/"+course.get('slug')+"' class='header-course header-now' data-id='"+course.get('_id')+"'>"+course.get('title')+"</a>");
        //             //Add viewer
        //             this.trigger('view:course', course.get('_id'));
        //         });
        //         //View course
        //         courseHeaderView.on('view:course', function(value){
        //             var course = new ProjectManager.Entities.Course({
        //                 _id: value,
        //                 _action: 'view'
        //             });
        //             course.set({});
        //             course.save();
        //         });
        //         //Join Course
        //         courseHeaderView.on('join:course', function(value){
        //             var course = new ProjectManager.Entities.Course({
        //                 _id: value,
        //                 _action: 'join'
        //             });
        //             course.set({});
        //             course.save({}, {
        //                 dataType:"text",
        //                 success: function(){
        //                     location.reload();
        //                 }
        //             });
        //         });
        //         //Unjoin Course
        //         courseHeaderView.on('unjoin:course', function(value){
        //             var course = new ProjectManager.Entities.Course({
        //                 _id: value,
        //                 _action: 'unjoin'
        //             });
        //             course.set({});
        //             course.save({}, {
        //                 dataType:"text",
        //                 success: function(){
        //                     location.reload();
        //                 }
        //             });
        //         });
        //         ProjectManager.headerRegion.show(courseHeaderView);
        //     });
        // },
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
        // showEditPizzaOverlay: function(pizza_id){
        //     $('.overlay').show();
        //     var fetchingPizza = ProjectManager.request('pizza:entity', pizza_id);
        //     $.when(fetchingPizza).done(function(pizza){
        //         console.log(pizza);
        //         var editPizzaView = new ProjectManager.ProjectApp.EntityViews.EditPizzaView();
        //         editPizzaView.on('show', function(){
        //             newBlockView.$('.overlay-box').addClass('edit-box');
        //             newBlockView.$('.overlay-form .message').html('Edit Pizza Details:');
        //         });
        //     });
        // },
        showEditBlockOverlay: function(block_id){
            $('.overlay').show();
            var fetchingBlock = ProjectManager.request('pizza:entity', block_id);
            $.when(fetchingBlock).done(function(block){
                var newBlockView = new ProjectManager.ProjectApp.EntityViews.NewBlockView();
                console.log(block);
                //Show
                newBlockView.on('show', function(){
                    //Add edit class
                    newBlockView.$('.overlay-box').addClass('edit-box');
                    newBlockView.$('.overlay-form .message').html('Edit Pizza Details:');
                    setTimeout(function(){
                        newBlockView.$('.overlay-box').addClass('animate');
                        newBlockView.$('.pizza-title').val(block.get('title')).focus();
                        newBlockView.$('#select-pizza').val(block.get('size'));
                        newBlockView.$('.pizza-price').val(block.get('price'));
                        let path = '../images/site/'+block.get('image');
                        console.log(path);
                        newBlockView.$('.image img').attr('src', path)
                    }, 100);

                    newBlockView.$("#uploadFile").on('change',function(e) {
                        console.log('upload')
                        e.preventDefault();
                        var data = new FormData($('#uploadForm')[0]);
                        $.ajax({
                            url:'/api/upload',
                            type: 'POST',
                            contentType: false,
                            processData: false,
                            cache: false,
                            data: data,
                            success: function(res){}
                        });
                    });
                    //Hide scroll on main page
                    ProjectManager.commands.execute('show:overlay');
                   
                });

                

                //Update block
                newBlockView.on('update:block', function(){
                    console.log('update block');
                    var edit_block = new ProjectManager.Entities.Pizza({
                        _id: block_id,
                        _action: 'update'
                    });
                    edit_block.set({
                        title: this.$('.pizza-title').val().trim(),
                        size: this.$('#select-pizza').find(":selected").val(),
                        price: parseInt(this.$('.pizza-price').val())
                    });
                    
                    edit_block.save({}, {
                        type: 'PUT',
                        success: function(){
                        ProjectManager.commands.execute('close:overlay');
                    }});
                });
               
                //Delete block
                newBlockView.on('delete:block', function(){
                    var block = new ProjectManager.Entities.Pizza({
                        _id: block_id
                    });
                    block.destroy({
                        dataType: 'text',
                        success: function(model, response){
                            location.assign('/')
                        }
                    });
                });
                ProjectManager.overlayRegion.show(newBlockView);
            });
        },
        showBlocks: function(course_id, container_id){
            //Show loading page
            console.log('showBlocks')
            var loadingView = new ProjectManager.Common.Views.Loading();
            ProjectManager.contentRegion.show(loadingView);
            
            var fetchingPizzaDetails = ProjectManager.request('pizza:details', course_id);
            $.when(fetchingPizzaDetails).done(function(details){
                var blocksView = new ProjectManager.ProjectApp.EntityViews.BlocksView({
                    collection: details
                });
                console.log(details);

                //Show
                blocksView.on('show', function(){
                   
                    if($('.pageWrap').data('type') == 'customer'){
                        blocksView.$('.action-edit-block').addClass('u-hide');
                    }
                        
                //Show all blocks
                blocksView.$('.all-blocks').removeClass('u-hide');
                    
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


                });
                //Add block
                ProjectManager.vent.off('add:block');
                ProjectManager.vent.on('add:block', function(block){
                    var order = block.get('order') - 1;
                    blocks.add(block, {at: order});
                    //Remove transparency
                    $(".all-blocks .one-block[data-id='" + block.get('_id') + "']").removeClass('u-transparent');
                });
                ProjectManager.contentRegion.show(blocksView);
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
    };
});
