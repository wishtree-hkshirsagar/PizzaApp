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
            'admin/orders': 'adminOrdersView'
        }
    });
    //API functions for each route
    var API = {
        newPizzaOverlayView: function(){
            console.log('newPizzaOverlayView')
            ProjectManager.ProjectApp.EntityController.Controller.showNewPizzaOverlay();
        },
        newBlockOverlayView: function(order){
            ProjectManager.ProjectApp.EntityController.Controller.showNewBlockOverlay(order);
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
        adminOrdersView: function(){
            console.log('adminOrdersView')
            ProjectManager.ProjectApp.EntityController.Controller.showPizzaHeader($('.pageWrap').data('type'));
            ProjectManager.ProjectApp.EntityController.Controller.showAllOrders();
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
    //Show new block overlay
    ProjectManager.vent.on('newBlockOverlay:show', function(order){
        API.newBlockOverlayView(order);
    });
    //Show edit pizza overlay
    ProjectManager.vent.on('editPizzaOverlay:show', function(block_id){
        API.editPizzaOverlayView(block_id);
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

    Entities.Orders = Backbone.Model.extend({
        url: function(){
              
            return '/api/admin/orders'
           
        }
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

        getOrders: function(){
            var course = new Entities.Orders({});
            var defer = $.Deferred();
            course.fetch({
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
    ProjectManager.reqres.setHandler('order:entities', function(){
        return API.getOrders();
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

    EntityViews.OrdersDatatable = Marionette.ItemView.extend({
        template: 'allOrdersTemplate',

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
            if(this.model.get('item')){
                $('#cart-counter').text(totalQty);
            }
            this.$el.attr('data-id', this.model.get('_id'));
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
            'click .js-edit-block': 'openEditPizzaOverlay',
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
        showContainerBlocks: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('blocks:show', this.model.get('course'), this.model.get('_id'), this.model.get('title'));
        },
        openEditPizzaOverlay: function(ev){
            console.log('edit block')
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('editPizzaOverlay:show', this.model.get('_id'));
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
        showPizzaHeader: function(type){
            console.log(type)
            var pizzaHeaderView = new ProjectManager.ProjectApp.EntityViews.PizzaHeaderView();
            //show
            pizzaHeaderView.on('show', function(){
                if(type == 'admin'){
                    pizzaHeaderView.$('.admin-view').removeClass('u-hide');
                   if(location.href.includes('/admin/orders')){
                       pizzaHeaderView.$('.js-add-pizza').addClass('u-hide');
                   }
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
        showAllOrders: function(){
            console.log('show all orders');
            var loadingView = new ProjectManager.Common.Views.Loading();
            ProjectManager.contentRegion.show(loadingView);

            var fetchingOrders = ProjectManager.request('order:entities');
            $.when(fetchingOrders).done(function (orders) {
                var ordersDatatable = new ProjectManager.ProjectApp.EntityViews.OrdersDatatable({
                    model: orders
                });

                console.log(orders)
                ordersDatatable.on('show', function () {

                })
                ProjectManager.contentRegion.show(ordersDatatable);
            });

        },
        showEditPizzaOverlay: function(block_id){
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
                        newBlockView.$('.image img').attr('src', path);
                        newBlockView.$('.image').css({'text-align': 'center'});
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
    };
});
