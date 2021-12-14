//Client side of FramerSpace
var PublicManager = new Backbone.Marionette.Application();
//Add regions of the application
PublicManager.addRegions({
    headerRegion: '.mainHeader',
    contentRegion: '.mainContent',
    overlayRegion: '.overlay'
});
//Navigate function to change url
PublicManager.navigate = function(route, options){
    options || (options = {});
    Backbone.history.navigate(route, options);
};
//Find current route
PublicManager.getCurrentRoute = function(){
    return Backbone.history.fragment;
};
//Start
PublicManager.on('start', function(){
    if(Backbone.history){
        Backbone.history.start({pushState: true});
    }
    //Close overlay on ESC Key and mousedown
    $(document).keyup(function(ev){
        if(ev.keyCode == 27 && $('.overlay').css('display') != 'none') {
            PublicManager.commands.execute('close:overlay');
        }
    });
    $(document).mousedown(function(ev){
        var $target = $(ev.target);
        //Close overlay
        var container = $('.overlay-box');
        if(container.length && !container.is(ev.target) && container.has(ev.target).length === 0) {
            PublicManager.commands.execute('close:overlay');
        }
    });
    //Show login overlay
    $('.js-login').click(function(ev){
        ev.preventDefault();
        PublicManager.vent.trigger('login:show');
    });
    //Show signup overlay
    $('.js-signup').click(function(ev){
        ev.preventDefault();
        PublicManager.vent.trigger('signup:show');
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
//Application wide commands
PublicManager.commands.setHandler('close:overlay', function(view){
    //remove animate class on overlay box
    $('.overlay-box').removeClass('animate');
    //after animation, remove view, change route and hide overlay
    setTimeout(function(){
        $('.overlay > div').remove();
        $('.overlay').removeClass('overlay-video').hide();
        var prevScroll = $('body').scrollTop();
        $('body').css('overflow', 'auto');
        $('body').scrollTop(prevScroll);
    }, 300);
});
//Router of the application
PublicManager.module('PublicApp', function (PublicApp, PublicManager, Backbone, Marionette, $, _) {
    PublicApp.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'courses': 'coursesView',
            'course/:slug': 'courseView',
            'course/:slug/:container': 'courseContainerView'
        }
    });
    //API functions for each route
    var API = {
        loginView: function(email){
            PublicManager.PublicApp.EntityController.Controller.showLogin(email);
        },
        signupView: function(){
            PublicManager.PublicApp.EntityController.Controller.showSignup();
        },
        termsView: function(){
            PublicManager.PublicApp.EntityController.Controller.showTerms();
        },
        coursesView: function(){
            PublicManager.PublicApp.EntityController.Controller.showCoursesHeader();
            PublicManager.PublicApp.EntityController.Controller.showCourses();
        },
        courseView: function(slug){
            PublicManager.PublicApp.EntityController.Controller.showOneCourse(slug, '');
        },
        courseContainerView: function(slug, container){
            PublicManager.PublicApp.EntityController.Controller.showOneCourse(slug, container);
        },
        blocksView: function(course_id, container_id, container_title){
            PublicManager.PublicApp.EntityController.Controller.showBlocks(course_id, container_id, container_title);
        }
    };
    //Triggers to particular views
    //Show login
    PublicManager.vent.on('login:show', function(email){
        API.loginView(email);
    });
    //Show signup
    PublicManager.vent.on('signup:show', function(){
        API.signupView();
    });
    //Show terms
    PublicManager.vent.on('terms:show', function(email){
        API.termsView();
    });
    //Show courses
    PublicManager.vent.on('courses:show', function(){
        PublicManager.navigate('courses');
        API.coursesView();
    });
    //Show course and course modules
    PublicManager.vent.on('course:show', function(slug){
        //Show course modules
        PublicManager.navigate('course/' + slug);
        API.courseView(slug);
    });
    //Show course blocks
    PublicManager.vent.on('blocks:show', function(course_id, container_id, container_title){
        var course_slug = $('.mainHeader .header-title').data('slug');
        if(container_id){
            PublicManager.navigate('course/' + course_slug + '/' + container_id);
            API.blocksView(course_id, container_id, container_title);
        } else {
            PublicManager.navigate('course/' + course_slug);
            API.blocksView(course_id);
        }
    });
    //Initialize router with API
    PublicManager.addInitializer(function(){
        new PublicApp.Router({ controller: API });
    });
});
//Models and Collections of the application
PublicManager.module('Entities', function (Entities, PublicManager, Backbone, Marionette, $, _) {
    //Login
    Entities.Login = Backbone.Model.extend({
        urlRoot: '/login'
    });
    //Signup
    Entities.Signup = Backbone.Model.extend({
        urlRoot: '/signup'
    });
    //Course Models and Collection
    Entities.Course = Backbone.Model.extend({
        initialize: function(options){
            this._id = options._id;
        },
        url: function(){
            if(this._id) {
                return '/api/public/course/' + this._id
            }
        },
        idAttribute: '_id'
    });
    Entities.CourseCollection = Backbone.Collection.extend({
        url: '/api/public/courses',
        model: Entities.Course
    });
    //Block Collection
    Entities.BlockCollection = Backbone.Collection.extend({
        initialize: function(models, options){
            //_id is course id
            this._id = options._id;
            this._container = options._container;
        },
        url: function(){
            if(this._container){
                return '/api/public/blocks/container/' + this._container
            } else {
                return '/api/public/blocks/' + this._id
            }
        }
    });
    //Functions to get data
    var API = {
        getCourses: function(){
            var courses = new Entities.CourseCollection();
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
        }
    };
    //Request Response Callbacks
    PublicManager.reqres.setHandler('course:entities', function(){
        return API.getCourses();
    });
    PublicManager.reqres.setHandler('course:entity', function(_id){
        return API.getOneCourse(_id);
    });
    PublicManager.reqres.setHandler('block:entities', function(_id, _container){
        return API.getBlocks(_id, _container);
    });
});
//Views of the application
PublicManager.module('PublicApp.EntityViews', function (EntityViews, PublicManager, Backbone, Marionette, $, _) {
    EntityViews.Login = Marionette.ItemView.extend({
        template: 'loginTemplate',
        events: {
            'mousedown .js-close, .js-submit, .show-password, .label': 'doNothing',
            'click .js-close': 'closeOverlay',
            'click .js-signup': 'signUpBox',
            'blur .js-email input': 'checkUsername',
            'blur .js-password input': 'checkPassword',
            'focus .input': 'showError',
            'submit .js-form': 'submitForm',
            'click .show-password': 'togglePassword'
        },
        //stop stealing focus from input boxes
        doNothing: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
        },
        //close overlay
        closeOverlay: function(ev){
            ev.preventDefault();
            PublicManager.commands.execute('close:overlay');
        },
        //show signup window
        signUpBox: function(ev){
            ev.preventDefault();
            PublicManager.vent.trigger('signup:show');
        },
        //check email erors
        checkUsername: function(){
            var emailVal = this.$('.js-email input').val();
            if(!emailVal){
                this.$('.js-email .u-formError').text('Please enter your unique id:').hide();
                this.$('.js-email input').addClass('hasError');
            } else {
                this.$('.js-email .u-formError').text('').hide();
                this.$('.js-email input').removeClass('hasError');
            }
        },
        //check password errors
        checkPassword: function(){
            var passwordVal = this.$('.js-password input').val();
            if(!passwordVal) {
                this.$('.js-password .u-formError').text('Please enter a password:').hide();
                this.$('.js-password input').addClass('hasError');
            } else if(passwordVal.length < 8) {
                this.$('.js-password .u-formError').text('Passwords must be 8 characters or more:').hide();
                this.$('.js-password input').addClass('hasError');
            } else {
                this.$('.js-password .u-formError').text('').hide();
                this.$('.js-password input').removeClass('hasError');
            }
        },
        //show Error message on focus
        showError: function(ev){
            var $target = $(ev.target);
            if($target.prev().text()){
                $target.removeClass('hasError');
                $target.prev().show();
            }
        },
        //check validation errors before submitting form
        submitForm: function(ev){
            this.checkUsername();
            this.checkPassword();
            if(!this.$('.input.hasError').length) {
                return true;
            } else {
                ev.preventDefault();
                this.$('.input.hasError').eq(0).focus();
                return false;
            }
        },
        //show - hide password
        togglePassword: function(){
            if(this.$('.show-password').hasClass('active')){
                this.$('.js-password input').attr('type', 'password');
            } else {
                this.$('.js-password input').attr('type', 'text');
            }
            this.$('.show-password').toggleClass('active');
        }
    });
    EntityViews.Signup = Marionette.ItemView.extend({
        template: 'signupTemplate',
        events: {
            'mousedown .js-close, .js-login, .js-submit, .show-password, .js-terms': 'doNothing',
            'click .js-close': 'closeOverlay',
            'click .js-login': 'loginBox',
            'blur .js-age input': 'checkAge',
            'blur .js-password input': 'checkPassword',
            'change .action-consent input': 'allowConsent',
            'focus .input': 'showError',
            'submit .js-form': 'submitForm',
            'click .show-password': 'togglePassword',
            'click .js-terms': 'termsBox'
        },
        //stop stealing focus from input boxes
        doNothing: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
        },
        //close overlay
        closeOverlay: function(ev){
            ev.preventDefault();
            PublicManager.commands.execute('close:overlay');
        },
        //show login window
        loginBox: function(ev){
            ev.preventDefault();
            PublicManager.vent.trigger('login:show');
        },
        //check age errors
        checkAge: function(){
            var alphaSpace = /^[a-zA-Z\s]+$/;
            var ageVal = this.$('.js-age input').val().trim();
            if(!ageVal) {
                this.$('.js-age .u-formError').text('Please enter your age:').hide();
                this.$('.js-age input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            } else {
                var ageNum = parseInt(ageVal);
                if(isNaN(ageNum)){
                    this.$('.js-age .u-formError').text('Please enter your age:').hide();
                    this.$('.js-age input').addClass('hasError');
                    this.$('.js-submit').addClass('u-disabled');
                } else if(ageNum < 12){
                    this.$('.js-age .u-formError').text('FramerSpace is only open to students above 12:').hide();
                    this.$('.js-age input').addClass('hasError');
                    this.$('.js-submit').addClass('u-disabled');
                } else {
                    //hide age errors
                    this.$('.js-age .u-formError').text('').hide();
                    this.$('.js-age input').removeClass('hasError');
                    //Enable Button
                    if(this.$('.action-consent input').is(':checked') && !this.$('.input.hasError').length){
                        this.$('.js-submit').removeClass('u-disabled');
                    } else {
                        this.$('.js-submit').addClass('u-disabled');
                    }
                }
            }
        },
        //check password errors
        checkPassword: function(){
            var passwordVal = this.$('.js-password input').val();
            if(!passwordVal) {
                this.$('.js-password .u-formError').text('Please enter a password:').hide();
                this.$('.js-password input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            } else if(passwordVal.length < 8) {
                this.$('.js-password .u-formError').text('Passwords must be 8 characters or more:').hide();
                this.$('.js-password input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            } else {
                this.$('.js-password .u-formError').text('').hide();
                this.$('.js-password input').removeClass('hasError');
                //Enable Button
                if(this.$('.action-consent input').is(':checked') && !this.$('.input.hasError').length){
                    this.$('.js-submit').removeClass('u-disabled');
                } else {
                    this.$('.js-submit').addClass('u-disabled');
                }
            }
        },
        allowConsent: function(){
            if(this.$('.action-consent input').is(':checked') && !this.$('.input.hasError').length){
                this.$('.js-submit').removeClass('u-disabled');
            } else {
                this.$('.js-submit').addClass('u-disabled');
            }
        },
        //show Error message on focus
        showError: function(ev){
            var $target = $(ev.target);
            if($target.prev().text()){
                $target.removeClass('hasError');
                $target.prev().show();
            }
        },
        //check validation errors before submitting form
        submitForm: function(ev){
            this.checkAge();
            this.checkPassword();
            if(this.$('.action-consent input').is(':checked') && !this.$('.input.hasError').length) {
                return true;
            } else {
                ev.preventDefault();
                this.$('.js-submit').addClass('u-disabled');
                this.$('.input.hasError').eq(0).focus();
                return false;
            }
        },
        //show - hide password
        togglePassword: function(){
            if(this.$('.show-password').hasClass('active')){
                this.$('.js-password input').attr('type', 'password');
            } else {
                this.$('.js-password input').attr('type', 'text');
            }
            this.$('.show-password').toggleClass('active');
        },
        //show terms window
        termsBox: function(ev){
            ev.preventDefault();
            PublicManager.vent.trigger('terms:show');
        },
    });
    EntityViews.Terms = Marionette.ItemView.extend({
        template: 'termsTemplate',
        events: {
            'click .js-close': 'closeOverlay'
        },
        //close overlay
        closeOverlay: function(ev){
            ev.preventDefault();
            PublicManager.vent.trigger('signup:show');
        }
    });
    //Courses header view
    EntityViews.CoursesHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'coursesHeaderTemplate'
    });
    //Course item view
    EntityViews.CourseItemView = Marionette.ItemView.extend({
        tagName: 'a',
        className: 'one-course',
        template: 'courseOneTemplate',
        initialize: function(){
            this.$el.attr('href', '/courses/' + this.model.get('slug'));
            this.$el.attr('data-slug', this.model.get('slug'));
        },
        events: {
            'click': 'getOneCourse'
        },
        getOneCourse: function(ev){
            if(ev.metaKey || ev.ctrlKey) return;
            ev.preventDefault();
            PublicManager.vent.trigger('course:show', this.model.get('slug'));
        }
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
            'click .header-back.header-course': 'showCourseBlocks',
            'click .header-back.header-container': 'showContainerBlocks'
        },
        doNothing: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
        },
        showPublicCourses: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            PublicManager.vent.trigger('courses:show');
        },
        showCourseBlocks: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            var $target = $(ev.currentTarget);
            $target.nextAll().remove();
            $target.removeClass('header-back').addClass('header-now');
            //Show blocks
            PublicManager.vent.trigger('blocks:show', this.model.get('_id'));
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
            PublicManager.vent.trigger('blocks:show', this.model.get('_id'), container_id, container_title);
        }
    });
    //One Block view
    EntityViews.BlockItemView = Marionette.ItemView.extend({
        className: 'one-block',
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
        },
        events: {
            'click .container-item-block': 'showContainerBlocks',
            'click .one-toggle-item .item-title': 'toggleItem',
            'click .js-discuss, .block-comment': 'loginBox',
            'click .divider-btn': 'loginBox',
            'click .mcq-block .block-option': 'loginBox',
            'click .match-block .block-option': 'loginBox',
            'click .match-block .block-options-right .one-color': 'loginBox',
            'click .js-fill-blanks': 'loginBox',
            'click .js-submit-response': 'loginBox',
            'click .file-response-drop': 'loginBox',
            'click .file-input': 'doNothing'
        },
        showContainerBlocks: function(ev){
            ev.preventDefault();
            ev.stopPropagation();
            PublicManager.vent.trigger('blocks:show', this.model.get('course'), this.model.get('_id'), this.model.get('title'));
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
        loginBox: function(ev){
            ev.preventDefault();
            PublicManager.vent.trigger('login:show');
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
        emptyView: EntityViews.EmptyBlocksView
    });
});
//Common Views of the application - Loading
PublicManager.module('Common.Views', function(Views,PublicManager, Backbone, Marionette, $, _){
    //Loading page
    Views.Loading = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'loading-area',
        template: 'loadingTemplate'
    });
});
//Controllers of the Application
PublicManager.module('PublicApp.EntityController', function (EntityController, PublicManager, Backbone, Marionette, $, _) {
    EntityController.Controller = {
        showLogin: function(email){
            $('.overlay').show();
            var loginView = new PublicManager.PublicApp.EntityViews.Login();
            loginView.on('show', function(){
                //Animate overlay box
                setTimeout(function(){
                    loginView.$('.overlay-box').addClass('animate');
                }, 100);
                //hide scroll on main page
                $('body').css('overflow', 'hidden');
                //focus on email box
                if(email && validator.isEmail(email)){
                    loginView.$( '.js-email input').val(email).focus();
                } else {
                    loginView.$('.js-email input').focus();
                }
            });
            PublicManager.overlayRegion.show(loginView);
        },
        showSignup: function(){
            $('.overlay').show();
            var signupView = new PublicManager.PublicApp.EntityViews.Signup();
            signupView.on('show', function(){
                setTimeout(function(){
                    signupView.$('.overlay-box').addClass('animate');
                }, 100);
                $('body').css('overflow', 'hidden');
                signupView.$( '.js-name input').focus();
            });
            PublicManager.overlayRegion.show(signupView);
        },
        showTerms: function(email){
            $('.overlay').show();
            var termsView = new PublicManager.PublicApp.EntityViews.Terms();
            termsView.on('show', function(){
                //Animate overlay box
                setTimeout(function(){
                    termsView.$('.overlay-box').addClass('animate');
                }, 100);
                //hide scroll on main page
                $('body').css('overflow', 'hidden');
            });
            PublicManager.overlayRegion.show(termsView);
        },
        showCoursesHeader: function(){
            var coursesHeaderView = new PublicManager.PublicApp.EntityViews.CoursesHeaderView();
            //Show
            coursesHeaderView.on('show', function(){
                coursesHeaderView.$('.public-courses').removeClass('u-hide');
                coursesHeaderView.$('.js-add-course').addClass('u-hide');
            });
            PublicManager.headerRegion.show(coursesHeaderView);
        },
        showCourses: function(){
            //Show loading page
            var loadingView = new PublicManager.Common.Views.Loading();
            PublicManager.contentRegion.show(loadingView);
            //Fetch courses
            var fetchingCourses = PublicManager.request('course:entities');
            $.when(fetchingCourses).done(function(courses){
                var coursesView = new PublicManager.PublicApp.EntityViews.CoursesView({
                    collection: courses
                });
                PublicManager.contentRegion.show(coursesView);
            });
        },
        showOneCourse: function(slug, container){
            //Fetch course
            var fetchingCourse = PublicManager.request('course:entity', slug);
            $.when(fetchingCourse).done(function(course){
                var courseHeaderView = new PublicManager.PublicApp.EntityViews.CourseHeaderView({
                    model: course
                });
                //Show
                courseHeaderView.on('show', function(){
                    //Hide action buttons
                    courseHeaderView.$('.action-btns').addClass('u-hide');
                    //Add course id to header
                    courseHeaderView.$('.header-title').data('id', course.get('_id'));
                    courseHeaderView.$('.header-title').data('slug', course.get('slug'));
                    //Show course blocks
                    if(container){
                        PublicManager.vent.trigger('blocks:show', course.get('_id'), container);
                    } else {
                        PublicManager.vent.trigger('blocks:show', course.get('_id'));
                    }
                    //Show header title
                    $('.mainHeader .header-title').append("<a href='/' class='header-back header-home'>Courses</a>");
                    $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                    $('.mainHeader .header-title').append("<a href='/course/"+course.get('slug')+"' class='header-course header-now' data-id='"+course.get('_id')+"'>"+course.get('title')+"</a>");
                });
                PublicManager.headerRegion.show(courseHeaderView);
            });
        },
        showBlocks: function(course_id, container_id, container_title){
            //Show loading page
            var loadingView = new PublicManager.Common.Views.Loading();
            PublicManager.contentRegion.show(loadingView);
            //Fetch blocks
            var fetchingBlocks = PublicManager.request('block:entities', course_id, container_id);
            $.when(fetchingBlocks).done(function(blocks){
                var blocksView = new PublicManager.PublicApp.EntityViews.BlocksView({
                    collection: blocks
                });
                //Show
                blocksView.on('show', function(){
                    //Show all blocks
                    blocksView.$('.all-blocks').removeClass('u-hide');
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
                        player.on('startRecord', function(){
                            PublicManager.vent.trigger('login:show');
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
                        player.on('startRecord', function(){
                            PublicManager.vent.trigger('login:show');
                        });
                    });
                });
                PublicManager.contentRegion.show(blocksView);
            });
        }
    };
});
