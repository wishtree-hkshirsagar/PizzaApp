//Client side of FramerSpace
var PublicManager = new Backbone.Marionette.Application();

var totalQty;
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
            'pizzas': 'publicPizzaView',
            'pizza/:slug': 'pizzaView',
            'cart': 'cartView'
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
 
        publicPizzaView: function(){
            console.log('publicPizzaView');
            PublicManager.PublicApp.EntityController.Controller.showPizzasHeader();
            PublicManager.PublicApp.EntityController.Controller.showPizzas();
        },
        pizzaView: function(slug){
            console.log('pizzaView');
            PublicManager.PublicApp.EntityController.Controller.showOnePizza(slug);
        },
 
        blocksView: function(pizza_id){
            PublicManager.PublicApp.EntityController.Controller.showBlocks(pizza_id);
        },

        cartView: function(){
            console.log('cart view')
            PublicManager.PublicApp.EntityController.Controller.showPizzasHeader('cart');
            PublicManager.PublicApp.EntityController.Controller.showCart();
        }
    };
    //Triggers to particular views
    //Show login
    PublicManager.vent.on('login:show', function(email){
        console.log('login trigger')
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

    //Show pizza and pizza modules
    PublicManager.vent.on('pizza:show', function(slug){
        //Show course modules
        PublicManager.navigate('pizza/' + slug);
        API.pizzaView(slug);
    });

    //Show course blocks
    PublicManager.vent.on('blocks:show', function(pizza_id){
        var pizza_slug = $('.mainHeader .header-title').data('slug');
        PublicManager.navigate('pizza/' + pizza_slug);
        API.blocksView(pizza_id);
    });
    //Show pizza details
    PublicManager.vent.on('pizzaDetail:show', function(pizza_id){
        // console.log(pizza_id);
        var pizza_slug = $('.mainHeader .header-title').data('slug');
        // console.log(pizza_slug);
        PublicManager.navigate('pizza/' + pizza_slug);
        API.blocksView(pizza_id);
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
    //Pizza Models and Collection
    Entities.Pizza = Backbone.Model.extend({
        initialize: function(options){
            this._id = options._id;
        },
        url: function(){
            if(this._id) {
                return '/api/public/pizza/' + this._id
            }
        },
        idAttribute: '_id'
    });
    Entities.PizzaCollection = Backbone.Collection.extend({
        url: '/api/public/pizza',
        model: Entities.Pizza
    });
  
    //Block Collection
    Entities.BlockCollection = Backbone.Collection.extend({
        initialize: function(models, options){
            this._id = options._id;
        },
        url: function(){
            if(this._id) {
                return '/api/public/pizza/' + this._id;
            } else {
                return '/api/cart'
            }
        }
    });
    //Functions to get data
    var API = {
        getPizzas: function(){
            var pizzas = new Entities.PizzaCollection();
            var defer = $.Deferred();
            pizzas.fetch({
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
        }
    };
    //Request Response Callbacks
    PublicManager.reqres.setHandler('pizza:entities', function(){
        return API.getPizzas();
    });

    PublicManager.reqres.setHandler('pizza:entity', function(_id){
        return API.getOnePizza(_id);
    });

    PublicManager.reqres.setHandler('block:entities', function(_id, _container){
        return API.getBlocks(_id, _container);
    });
    PublicManager.reqres.setHandler('cart:entities', function(){
        return API.getCartItems();
    });
});
//Views of the application
PublicManager.module('PublicApp.EntityViews', function (EntityViews, PublicManager, Backbone, Marionette, $, _) {
    EntityViews.Login = Marionette.ItemView.extend({
        template: 'loginTemplate',
        initialize: function(){
            console.log('initialize');
        },
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
    //Pizzas header view
    EntityViews.PizzasHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'pizzasHeaderTemplate',
        initialize: function(){
            var fetchingCartDetails = PublicManager.request('cart:entities');
            $.when(fetchingCartDetails).done(function(items){
                var pizzasHeaderView = new PublicManager.PublicApp.EntityViews.PizzasHeaderView({

                    collection: new Backbone.Collection(items.models[0].get('items'))
                });
                totalQty = items.models[0].get('totalQty');
            });
            $('#cart-counter').text(totalQty);
        },
    });

    //Pizza item view
    EntityViews.PizzaItemView = Marionette.ItemView.extend({
        tagName: 'a',
        className: 'one-pizza',
        template: 'pizzaOneTemplate',
        initialize: function(){
            this.$el.attr('href', '/pizza/' + this.model.get('slug'));
            this.$el.attr('data-slug', this.model.get('slug'));
        },
        events: {
            'click': 'getOnePizza'
        },
        getOnePizza: function(ev){
            if(ev.metaKey || ev.ctrlKey) return;
            ev.preventDefault();
            PublicManager.vent.trigger('pizza:show', this.model.get('slug'));
        }
    });

    //Pizzas collection view
    EntityViews.PizzasView = Marionette.CollectionView.extend({
        className: 'all-pizzas sectionBox',
        childView: EntityViews.PizzaItemView
    });

    // Pizza details header view
    EntityViews.PizzaDetailHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'pizzaDetailHeaderTemplate',
        events: {}
    });
    EntityViews.PizzaHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'pizzaHeaderTemplate',
        initialize: function(){
            var fetchingCartDetails = PublicManager.request('cart:entities');
            $.when(fetchingCartDetails).done(function(items){
                var pizzasHeaderView = new PublicManager.PublicApp.EntityViews.PizzasHeaderView({

                    collection: new Backbone.Collection(items.models[0].get('items'))
                });
                totalQty = items.models[0].get('totalQty');
            });
        }
    });

    //One Block view
    EntityViews.BlockItemView = Marionette.ItemView.extend({
        className: 'one-block',
        template: 'blockOneTemplate',
        initialize: function(){
            $('#cart-counter').text(totalQty);
            if(this.model.get('item')){
                console.log(this.model.get('item'))
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
        },
        events: {
            'click .container-item-block': 'showContainerBlocks',
            'click .js-add-cart': 'addToCart'
        },
        addToCart: function(ev){
            ev.preventDefault();
            console.log(this.model.get('_id'));
            var fetchingPizza = PublicManager.request('pizza:entity', this.model.get('slug'));
            $.when(fetchingPizza).done(function(pizza){
                var pizzaHeaderView = new PublicManager.PublicApp.EntityViews.PizzaHeaderView({
                    model: pizza
                });

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
        // showContainerBlocks: function(ev){
        //     ev.preventDefault();
        //     ev.stopPropagation();
        //     PublicManager.vent.trigger('blocks:show', this.model.get('course'), this.model.get('_id'), this.model.get('title'));
        // }
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
                    console.log('login overlay')
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
        showPizzasHeader: function(type){
            console.log('showPizzasHeader');
            
            var fetchingCartDetails = PublicManager.request('cart:entities');
            $.when(fetchingCartDetails).done(function(items){
                var pizzasHeaderView = new PublicManager.PublicApp.EntityViews.PizzasHeaderView({

                    collection: new Backbone.Collection(items.models[0].get('items'))
                });
                // console.log(items)
                totalQty = items.models[0].get('totalQty');
                // console.log(totalQty)

            pizzasHeaderView.on('show', function(){
                if(type == 'cart'){
                    pizzasHeaderView.$('.flex-items').removeClass('u-hide');
                    pizzasHeaderView.$('.align-right').removeClass('u-hide');
                    pizzasHeaderView.$('.login-cart').removeClass('u-hide');
                    pizzasHeaderView.$('.total-amount').text(items.models[0].get('totalPrice'));
                    pizzasHeaderView.$('.total-items').text(items.models[0].get('totalQty'))
                }
                pizzasHeaderView.$('.public-view').removeClass('u-hide');
                pizzasHeaderView.$('.js-add-pizza').addClass('u-hide');
            });
       
            PublicManager.headerRegion.show(pizzasHeaderView);
        });
        },

        showPizzas: function(){
            console.log('showPizzas');
            //Show loading page
            var loadingView = new PublicManager.Common.Views.Loading();
            PublicManager.contentRegion.show(loadingView);

            var fetchingPizzas = PublicManager.request('pizza:entities');
            $.when(fetchingPizzas).done(function(pizzas){
                var pizzasView = new PublicManager.PublicApp.EntityViews.PizzasView({
                    collection: pizzas
                });
                console.log(pizzas)
                PublicManager.contentRegion.show(pizzasView);
            });
        },
        showOnePizza: function(slug){
            console.log('showOnePizza')
            console.log(totalQty)
            //Fetch course
            var fetchingPizza = PublicManager.request('pizza:entity', slug);
            $.when(fetchingPizza).done(function(pizza){
                var pizzaHeaderView = new PublicManager.PublicApp.EntityViews.PizzaHeaderView({
                    model: pizza
                });
                console.log(pizza);
                //Show
                pizzaHeaderView.on('show', function(){
                    
                    pizzaHeaderView.$('.header-title').data('id', pizza.get('_id'));
                    pizzaHeaderView.$('.header-title').data('slug', pizza.get('slug'));
                    PublicManager.vent.trigger('blocks:show', pizza.get('_id'));

                    //Show header title
                    $('.mainHeader .header-title').append("<a href='/' class='header-back header-home'>Pizza</a>");
                    $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                    $('.mainHeader .header-title').append("<a href='/pizza/"+pizza.get('slug')+"' class='header-course header-now' data-id='"+pizza.get('_id')+"'>"+pizza.get('title')+"</a>");
                });
                PublicManager.headerRegion.show(pizzaHeaderView);
            });
        },
        showBlocks: function(pizza_id){
            console.log('showBlocks')
            //Show loading page
            console.log(pizza_id);
            var loadingView = new PublicManager.Common.Views.Loading();
            PublicManager.contentRegion.show(loadingView);
            //Fetch blocks
            var fetchingPizzaDetails = PublicManager.request('block:entities', pizza_id);
            $.when(fetchingPizzaDetails).done(function(details){
                var blocksView = new PublicManager.PublicApp.EntityViews.BlocksView({
                    collection: details
                });
                console.log(details);
                //Show
                blocksView.on('show', function(){
                    //Show all blocks
                    blocksView.$('.all-blocks').removeClass('u-hide');
                    blocksView.$('.action-edit-block').addClass('u-hide');
                    blocksView.$('.block-price').removeClass('u-hide');
                    blocksView.$('.add-cart').removeClass('u-hide');
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
                PublicManager.contentRegion.show(blocksView);
            });
        },
        showCart: function(){
            console.log('showCart');
            var loadingView = new PublicManager.Common.Views.Loading();
            PublicManager.contentRegion.show(loadingView);

            var fetchingPizzaDetails = PublicManager.request('cart:entities');
            $.when(fetchingPizzaDetails).done(function(items){
                var blocksView = new PublicManager.PublicApp.EntityViews.BlocksView({

                    collection: new Backbone.Collection(items.models[0].get('items'))
                });
                console.log(items);
                // totalAmount = items.models[0].get('totalPrice');
                // console.log(items.models[0].get('totalPrice'));
                // console.log(items.models[0].get('items'))
                blocksView.on('show', function(){
                    //Show all blocks
                    blocksView.$('.all-blocks').removeClass('u-hide');
                    blocksView.$('.action-edit-block').addClass('u-hide');
                    // blocksView.$('.total-price')
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
                PublicManager.contentRegion.show(blocksView);
            });
        }
    };
});
