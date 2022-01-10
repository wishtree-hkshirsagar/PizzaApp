

var CartManager = new Backbone.Marionette.Application();

var totalQty;
var stripe;
var card = null;
CartManager.addRegions({
    headerRegion: '.mainHeader',
    contentRegion: '.mainContent',
    overlayRegion: '.overlay'
});

CartManager.navigate = function(route, options){
    options || (options = {});
    Backbone.history.navigate(route, options);
};

CartManager.getCurrentRoute = function(){
    return Backbone.history.fragment;
};

CartManager.on('start', function(){
    if(Backbone.history){
        Backbone.history.start({pushState: true});
    }

    //More btn
    $('.js-more').click(function(ev){
        ev.preventDefault();
        $('.navMore').toggle();
    });

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
CartManager.commands.setHandler('close:overlay', function(view){
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

CartManager.module('CartApp', function (CartApp, CartManager, Backbone, Marionette, $, _) {
    CartApp.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'cart': 'cartView'
        }
    });

    var API = {
        cartView: function(){
            console.log('cart view')
            CartManager.CartApp.EntityController.Controller.showCartHeader($('.pageWrap').data('type'));
            CartManager.CartApp.EntityController.Controller.showCart();
        }
    };

    //Initialize router with API
    CartManager.addInitializer(function(){
        new CartApp.Router({ controller: API });
    });
});

CartManager.module('Entities', function (Entities, CartManager, Backbone, Marionette, $, _) {
        //Block Collection
        Entities.BlockCollection = Backbone.Collection.extend({
            initialize: function(models, options){
                this._id = options._id;
            },
            url: function(){
                if(this._id){
                    return '/api/customer/orders/' + this._id;
                }else{

                    return '/api/cart';
                }
               
            }
        });


        var API = {

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
            getOneOrder: function(_id){
                var blocks = new Entities.BlockCollection([], {
                    _id: _id
                });
                var defer = $.Deferred();
                blocks.fetch({
                    success: function(data){
                        defer.resolve(data);
                    }
                });
                return defer.promise();
            },
        };

        CartManager.reqres.setHandler('cart:entities', function(){
            return API.getCartItems();
        });

        CartManager.reqres.setHandler('order:entity', function(_id){
            return API.getOneOrder(_id);
        });

        CartManager.reqres.setHandler('place:order', function(){
            return API.placeOrder();
        });
});



//Common Views of the application - Loading
CartManager.module('Common.Views', function(Views,CartManager, Backbone, Marionette, $, _){
    //Loading page
    Views.Loading = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'loading-area',
        template: 'loadingTemplate'
    });
});

//Views of the application
CartManager.module('CartApp.EntityViews', function (EntityViews, CartManager, Backbone, Marionette, $, _) {
    EntityViews.CartHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'pizzasHeaderTemplate',
        initialize: function(){
            var fetchingCartDetails = CartManager.request('cart:entities');
            $.when(fetchingCartDetails).done(function(items){
                var cartHeaderView = new CartManager.CartApp.EntityViews.CartHeaderView({

                    collection: new Backbone.Collection(items.models[0].get('items'))
                });
                totalQty = items.models[0].get('totalQty');
            });
            $('#cart-counter').text(totalQty);
        },
        events: {
            'click .js-save': 'orderPizza',
        },
        orderPizza: function(ev){
            ev.preventDefault();
            console.log('orderPizza');
            console.log(this.$('#payment-type').find(":selected").val());
             let contactNumberRegex = /^[7-9]{1}[0-9]{9}$/;
            let contactVal = this.$('.js-delivery-contact input').val();
            if(!$('.delivery-contact').val() && !$('.delivery-address').val() && !$('#payment-type').find(":selected").val()){
                this.$('.js-delivery-contact .u-formError').text('Please enter your contact number:').show();
                this.$('.js-delivery-contact input').addClass('hasError');
                this.$('.js-delivery-contact input').css({'border': '2px solid red'})
                this.$('.js-delivery-address .u-formError').text('Please enter your delivery address:').show();
                this.$('.js-delivery-address textarea').addClass('hasError');
                this.$('.js-delivery-address textarea').css({'border': '2px solid red'})
                this.$('.js-payment-type .u-formError').text('Please select payment mode:').show();
                this.$('.payment-type').addClass('hasError');
                this.$('.payment-type').css({'border': '2px solid red'})
                return;
            }else{
                this.$('.js-delivery-contact .u-formError').text('').show();
                this.$('.js-delivery-contact input').removeClass('hasError');
                this.$('.js-delivery-contact input').css({'border': '2px solid #000'})
                this.$('.js-delivery-address .u-formError').text('').show();
                this.$('.js-delivery-address textarea').removeClass('hasError');
                this.$('.js-delivery-address textarea').css({'border': '2px solid #000'})
            }

            if(!$('.delivery-contact').val()){
                this.$('.js-delivery-contact .u-formError').text('Please enter your contact number:').show();
                this.$('.js-delivery-contact input').addClass('hasError');
                this.$('.js-delivery-contact input').css({'border': '2px solid red'});
                return;
            } else if(!contactNumberRegex.test(contactVal)){
                this.$('.js-delivery-contact .u-formError').text('Please enter a valid contact number:').show();
                this.$('.js-delivery-contact input').addClass('hasError');
                this.$('.js-delivery-contact input').css({'border': '2px solid red'});
                return;
            } else {
                this.$('.js-delivery-contact .u-formError').text('').show();
                this.$('.js-delivery-contact input').removeClass('hasError');
                this.$('.js-delivery-contact input').css({'border': '2px solid #000'})
            }

            if(!$('.delivery-address').val()){
                this.$('.js-delivery-address .u-formError').text('Please enter your delivery address:').show();
                this.$('.js-delivery-address textarea').addClass('hasError');
                this.$('.js-delivery-address textarea').css({'border': '2px solid red'})
                return;
            } else {
                this.$('.js-delivery-address .u-formError').text('').show();
                this.$('.js-delivery-address textarea').removeClass('hasError');
                this.$('.js-delivery-address textarea').css({'border': '2px solid #000'})
            }

            if(!$('#payment-type').find(":selected").val()){
                this.$('.js-payment-type .u-formError').text('Please select payment mode:').show();
                this.$('.payment-type').addClass('hasError');
                this.$('.payment-type').css({'border': '2px solid red'})
            }else{
                this.$('.js-payment-type .u-formError').text('').show();
                this.$('.payment-type').removeClass('hasError');
                this.$('.payment-type').css({'border': '2px solid #000'})
            }
            var value = {
                paymentType: this.$('#payment-type').find(':selected').val(),
                contactNumber: this.$('.delivery-contact').val(),
                address: this.$('.delivery-address').val(),
            }
            
           
            if(card){
                console.log('inside if')
              let stripeToken = stripe.createToken(card).then((result) => {
                    console.log(result);
                    stripeToken = result.token.id;
                    value.stripeToken = stripeToken;
                    console.log(value);
                    $.ajax({
                        url: '/api/order',
                        type: 'POST',
                        contentType: 'application/json',
                        dataType: 'json',
                        data: JSON.stringify(value),
                        success: function(result){
                            console.log(result);
                            location.assign('/')
                        }
                    })
                }).catch((err) => {
                    console.log(err)
                })
                
            } else {
                console.log('else')
                $.ajax({
                    url: '/api/order',
                    type: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify(value),
                    success: function(result){
                        console.log(result);
                        location.assign('/')
                    }
                })
            }
           
        }
    });

    
    EntityViews.EmptyBlocksView = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'zero-items',
        template: 'emptyBlocksTemplate'
    });
    
    EntityViews.BlockItemView = Marionette.ItemView.extend({
        className: 'one-block',
        template: 'blockOneTemplate',
        initialize: function(){
            console.log(this.model);
            $('#cart-counter').text(totalQty);
           
           
            this.$el.width('100%');
           
        }
    });


    EntityViews.BlocksView = Marionette.CompositeView.extend({
    className: 'sectionBox',
    template: 'pizzaBlocksTemplate',
    childView: EntityViews.BlockItemView,
    childViewContainer: 'div.all-blocks',
    emptyView: EntityViews.EmptyBlocksView
    });
    
});

//Controllers of the Application
CartManager.module('CartApp.EntityController', function (EntityController, CartManager, Backbone, Marionette, $, _) {

    EntityController.Controller = {

        showCartHeader: function(type){
            console.log('header');
            
            var fetchingCartDetails = CartManager.request('cart:entities');
            $.when(fetchingCartDetails).done(function(items){
            var cartHeaderView = new CartManager.CartApp.EntityViews.CartHeaderView({
                collection: new Backbone.Collection(items.models[0].get('items'))
            });
            totalQty = items.models[0].get('totalQty');
            cartHeaderView.on('show', function(){
                if(type == 'admin'){
                    cartHeaderView.$('.admin-view').removeClass('u-hide');
                } else {
                    cartHeaderView.$('.public-view').removeClass('u-hide');
                }
                function mountWidget(){
                    stripe = Stripe('pk_test_51KFtEUCiI18G0MYYyc1LgjlF8gXdS67JF0zApvVRzoNkMGB5HdYkHXj029s7SaOI3SPNdNVRRQ3lD22vA02qX9Tc002YjVGh7d');
                    
                    const elements = stripe.elements();
                    card = elements.create('card', {hidePostalCode: true});
                    card.mount('#js-card-number');
                }
                cartHeaderView.$('#payment-type').on('change', function(){
                   if($('#payment-type').find(":selected").val() == 'card'){
                        mountWidget();
                   }else {
                       if(card != null){
                           card.destroy();
                       }
                   }
                });
                
                cartHeaderView.$('.flex-items').removeClass('u-hide');
                cartHeaderView.$('.align-right').removeClass('u-hide');
                cartHeaderView.$('.login-cart').addClass('u-hide');
                cartHeaderView.$('.delivery-form').removeClass('u-hide');
                cartHeaderView.$('.total-amount').text(items.models[0].get('totalPrice'));
                cartHeaderView.$('.total-items').text(items.models[0].get('totalQty'))
            });

            CartManager.headerRegion.show(cartHeaderView);
        });
        },
        showCart: function(){
            var loadingView = new CartManager.Common.Views.Loading();
            CartManager.contentRegion.show(loadingView);
            console.log('showCart')
            var fetchingCartDetails = CartManager.request('cart:entities');
            $.when(fetchingCartDetails).done(function(items){
                var blocksView = new CartManager.CartApp.EntityViews.BlocksView({

                    collection: new Backbone.Collection(items.models[0].get('items'))
                });
                console.log(items.models[0].get('items'));

                blocksView.on('show', function(){
                    blocksView.$('.all-blocks').removeClass('u-hide');
                    blocksView.$('.action-edit-block').addClass('u-hide');

               
                    blocksView.$('.all-blocks .one-block').removeClass('u-transparent');
                
                });
                CartManager.contentRegion.show(blocksView);
            });

        }
    };
});