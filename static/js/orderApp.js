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
            'customer/orders': 'orderView',
            'customer/orders/:slug': 'orderStatusView'
        }
    });

    var API = {
        orderView: function(){
            console.log('order view')
            OrderManager.OrderApp.EntityController.Controller.showOrderHeader($('.pageWrap').data('type'));
            OrderManager.OrderApp.EntityController.Controller.showOrders();
        },
        orderStatusView: function(order_id){
            console.log('order status view')
            OrderManager.OrderApp.EntityController.Controller.showOrderHeader('order status');
            OrderManager.OrderApp.EntityController.Controller.showOrderStatus(order_id);
        }
    };

    //Initialize router with API
    OrderManager.addInitializer(function(){
        new OrderApp.Router({ controller: API });
    });
});

OrderManager.module('Entities', function (Entities, OrderManager, Backbone, Marionette, $, _) {
            
            Entities.Order = Backbone.Model.extend({
                initialize: function(options){
                    this._id = options._id;
                },
                url: function(){
                    return '/api/customer/orders/' + this._id;
                },
                idAttribute: '_id'
            });



            //Block Collection
            Entities.BlockCollection = Backbone.Collection.extend({
                initialize: function(models, options){
                    this._id = options._id;
                },
                url: function(){
                    if(this._id){
                        console.log('inside if')
                        return '/api/customer/orders/' + this._id;
                    }else{
                        console.log('else')
                        return '/api/customer/orders'
                    }
                   
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

                getOneOrder: function(_id){
                    var order = new Entities.Order({
                        _id: _id
                    });
                    var defer = $.Deferred();
                    order.fetch({
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

            OrderManager.reqres.setHandler('order:entity', function(_id){
                return API.getOneOrder(_id);
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

    EntityViews.OrderStatus = Marionette.ItemView.extend({
        className: 'sectionBox',
        template: 'showOrderStatusTemplate',
        initialize: function(){
            console.log(this.model);
        }
    });
    
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
            // this.$el.width('100%');
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
            // console.log(orders);
            orderHeaderView.on('show', function(){
                if(type == 'admin'){
                    orderHeaderView.$('.admin-view').removeClass('u-hide');
                } else if (type == 'order status'){
                    orderHeaderView.$('.all-orders').removeClass('u-hide');
                    orderHeaderView.$('.public-view').removeClass('u-hide');
                    orderHeaderView.$('.all-orders h1').text('Track delivery status')
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
                    let time = items.models[0].get('createdAt');
                    // console.log(time)
                    let now = new Date(time);
                    blocksView.$('.order-date').text(moment.utc(now).format('DD-MMM-YYYY HH:mm:ss'));
                    blocksView.$('.all-blocks .one-block').removeClass('u-transparent');
                });
                $('.mainHeader .header-title').text('').append("<a href='/' class='header-back header-home'>Pizza Hut</a>");
                $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                $('.mainHeader .header-title').append("<a href='/customer/orders' class='header-course header-now'>My Orders</a>");
                OrderManager.contentRegion.show(blocksView);
            });
        },

        showOrderStatus: function(order_id){
            var loadingView = new OrderManager.Common.Views.Loading();
            OrderManager.contentRegion.show(loadingView);
            console.log('show order status')
            var fetchingOrderStatus = OrderManager.request('order:entity', order_id);
            $.when(fetchingOrderStatus).done(function(order){
                var orderStatusView = new OrderManager.OrderApp.EntityViews.OrderStatus({
                    model: order
                });
                console.log(order);
                console.log(order.get('order').updatedAt);
                orderStatusView.on('show', function(){
                    let stepCompleted = true;
                    orderStatusView.$('.order-input').val(JSON.stringify(order.get('order')));
                    let orderStatus = orderStatusView.$('.order-input').val();
                    orderStatus = JSON.parse(orderStatus)
                    let time = document.createElement('small');
                    console.log('hidden input', orderStatus);
                    let allStatus = orderStatusView.$('.status_line').toArray();
                    // console.log(allStatus)
                    allStatus.forEach((status) => {
                        let data = status.dataset.status;
                        // console.log(data);
                        if(stepCompleted){
                            status.classList.add('step-completed');
                        }

                        if(data == order.get('order').status){
                            stepCompleted = false;
                            time.innerText = moment(order.get('order').updatedAt).format('hh:mm A');
                            status.appendChild(time);
                            if(status.nextElementSibling){
                                status.nextElementSibling.classList.add('current')
                            }
                        }
                    }); 
                });
                
                $('.mainHeader .header-title').text('').append("<a href='/' class='header-back header-home'>Pizza Hut</a>");
                $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                $('.mainHeader .header-title').append("<a href='/customer/orders' class='header-course header-now'>My Orders</a>");
                $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                $('.mainHeader .header-title').append("<a href='" +window.location.href +"' class='header-course header-now'>Order Status</a>");
                OrderManager.contentRegion.show(orderStatusView);
            });
        }
    }
});
