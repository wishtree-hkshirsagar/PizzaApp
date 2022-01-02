var OrderManager = new Backbone.Marionette.Application();

OrderManager.addRegions({
    headerRegion: '.mainHeader',
    contentRegion: '.mainContent',
    overlayRegion: '.overlay'
});

OrderManager.navigate = function(route, options){
    options || (options = {});
    Backbone.history.navigate(route, options);
};

OrderManager.getCurrentRoute = function(){
    return Backbone.history.fragment;
};

OrderManager.on('start', function(){
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
OrderManager.commands.setHandler('close:overlay', function(view){
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

OrderManager.module('OrderApp', function (OrderApp, OrderManager, Backbone, Marionette, $, _) {
    OrderApp.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'customer/orders': 'orderView'
        }
    });

    var API = {
        orderView: function(){
            console.log('order view')
            OrderManager.OrderApp.EntityController.Controller.showOrderHeader($('.pageWrap').data('type'));
            OrderManager.OrderApp.EntityController.Controller.showOrders();
        }
    };

    //Initialize router with API
    OrderManager.addInitializer(function(){
        new OrderApp.Router({ controller: API });
    });
});

OrderManager.module('Entities', function (Entities, OrderManager, Backbone, Marionette, $, _) {

            //Block Collection
            Entities.BlockCollection = Backbone.Collection.extend({
                initialize: function(models, options){
                    this._id = options._id;
                },
                url: function(){
                  
                    return '/api/customer/orders'
                   
                }
            });

            var API = {

                getOrderItems: function(){
                    var blocks = new Entities.BlockCollection([], {});
                    var defer = $.Deferred();
                    blocks.fetch({
                        success: function(data){
                            defer.resolve(data);
                        }
                    });
                    return defer.promise();
                },
            };

            OrderManager.reqres.setHandler('order:entities', function(){
                return API.getOrderItems();
            });
});

//Common Views of the application - Loading
OrderManager.module('Common.Views', function(Views,OrderManager, Backbone, Marionette, $, _){
    //Loading page
    Views.Loading = Marionette.ItemView.extend({
        tagName: 'div',
        className: 'loading-area',
        template: 'loadingTemplate'
    });
});

//Views of the application
OrderManager.module('OrderApp.EntityViews', function (EntityViews, OrderManager, Backbone, Marionette, $, _) {
    EntityViews.OrderHeaderView = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'pizzasHeaderTemplate',
    });

     //Empty blocks view
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
        }
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

//Controllers of the Application
OrderManager.module('OrderApp.EntityController', function (EntityController, OrderManager, Backbone, Marionette, $, _) {
    EntityController.Controller = {
        showOrderHeader: function(type){
            console.log('orderHeader')
            var fetchingOrderDetails = OrderManager.request('order:entities');
            $.when(fetchingOrderDetails).done(function(orders){
            var orderHeaderView = new OrderManager.OrderApp.EntityViews.OrderHeaderView({
                collection: orders
            });
            console.log(orders);
            orderHeaderView.on('show', function(){
                if(type == 'admin'){
                    orderHeaderView.$('.admin-view').removeClass('u-hide');
                } else {
                    orderHeaderView.$('.all-orders').removeClass('u-hide');
                    orderHeaderView.$('.public-view').removeClass('u-hide');
                }
            });

            OrderManager.headerRegion.show(orderHeaderView);
            });
        },

        showOrders: function(){
            var loadingView = new OrderManager.Common.Views.Loading();
            OrderManager.contentRegion.show(loadingView);
            console.log('showorder')
            var fetchingOrderDetails = OrderManager.request('order:entities');
            $.when(fetchingOrderDetails).done(function(items){
                var blocksView = new OrderManager.OrderApp.EntityViews.BlocksView({

                    collection: items
                });
                console.log(items);

                blocksView.on('show', function(){
                    //Show all blocks
                    blocksView.$('.all-blocks').removeClass('u-hide');
                    blocksView.$('.action-edit-block').addClass('u-hide');

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
                OrderManager.contentRegion.show(blocksView);
            });
        }
    }
});
