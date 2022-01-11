var ProjectManager = new Backbone.Marionette.Application();
//Initialize Variables and Functions
var totalQty,
    datatable;
//Variable to check if inside discussion
var pathInDiscussion = false;

//Get global font color
if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
    var globalFontColor = '#fff';
} else {
    globalFontColor = '#232323';
}
//Add regions of the application
ProjectManager.addRegions({
    headerRegion: '.mainHeader',
    contentRegion: '.mainContent',
    overlayRegion: '.overlay'
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

    //More btn
    $('.js-more').click(function(ev){
        ev.preventDefault();
        $('.navMore').toggle();
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
            'admin/orders': 'adminOrdersView',
            'order/:slug': 'orderView'
        }
    });
    //API functions for each route
    var API = {
        newPizzaOverlayView: function(){
            console.log('newPizzaOverlayView')
            ProjectManager.ProjectApp.EntityController.Controller.showNewPizzaOverlay();
        },
        editPizzaOverlayView: function(pizza_id){
            ProjectManager.ProjectApp.EntityController.Controller.showEditPizzaOverlay(pizza_id);
        },
        publicPizzaView: function(){
            console.log('publicPizzaView');
            ProjectManager.ProjectApp.EntityController.Controller.showPizzaHeader($('.pageWrap').data('type'));
            ProjectManager.ProjectApp.EntityController.Controller.showPizzas();
        },
        pizzaView: function(slug){
            console.log('pizzaView');
            ProjectManager.ProjectApp.EntityController.Controller.showOnePizza(slug);     
        },
        blocksView: function(pizza_id){
            ProjectManager.ProjectApp.EntityController.Controller.showBlocks(pizza_id);
        },
        adminOrdersView: function(){
            console.log('adminOrdersView')
            ProjectManager.ProjectApp.EntityController.Controller.showPizzaHeader($('.pageWrap').data('type'));
            ProjectManager.ProjectApp.EntityController.Controller.showAllOrders();
        },
        orderView: function(order_id){
            console.log('orderview')
            ProjectManager.ProjectApp.EntityController.Controller.showPizzaHeader($('.pageWrap').data('type'));
            ProjectManager.ProjectApp.EntityController.Controller.showOrders(order_id);
        }
    };
    //Triggers to particular views
    //Show new pizza overlay
    ProjectManager.vent.on('newPizzaOverlay:show', function(){
        console.log('newPizzaOverlay:show')
        API.newPizzaOverlayView();
    });
    //Show new block overlay
    ProjectManager.vent.on('newBlockOverlay:show', function(order){
        API.newBlockOverlayView(order);
    });
    //Show edit pizza overlay
    ProjectManager.vent.on('editPizzaOverlay:show', function(block_id){
        API.editPizzaOverlayView(block_id);
    });

     //Show pizza and pizza modules
     ProjectManager.vent.on('pizza:show', function(slug){
        //Show course modules
        ProjectManager.navigate('pizza/' + slug);
        console.log('pizza navigate');
        API.pizzaView(slug);
    });

    //Show pizza details
    ProjectManager.vent.on('pizzaDetail:show', function(pizza_id){
        // console.log(pizza_id);
        var pizza_slug = $('.mainHeader .header-title').data('slug');
        // console.log(pizza_slug);
        ProjectManager.navigate('pizza/' + pizza_slug);
        API.blocksView(pizza_id);
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


    Entities.PizzaCollection = Backbone.Collection.extend({
        url: function(){
            console.log('PizzaCollection');
            return '/api/pizza'
        },
        model: Entities.Pizza
    });
    
    Entities.Block = Backbone.Model.extend({
        initialize: function(){},
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
            this._action = options._action;
        },
        url: function(){
            if(this._action == 'getOrder'){
                return '/api/order/' + this._id
            } else if(this._id){
                return '/api/blocks/' + this._id
            } else {
                return '/api/cart'
            }
        },
        model: Entities.Block
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
        getOneOrder: function(_id, _action){
            var blocks = new Entities.BlockCollection([], {
                _id: _id,
                _action: _action
            });
            var defer = $.Deferred();
            blocks.fetch({
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
        }
    };
    //Request Response Callbacks
    ProjectManager.reqres.setHandler('pizza:entities', function(){
        // console.log('Request Response Callbacks')
        return API.getPizza();
    });
    ProjectManager.reqres.setHandler('order:entities', function(){
        return API.getOrders();
    });
    ProjectManager.reqres.setHandler('pizza:entity', function(_id){
        return API.getOnePizza(_id);
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
    ProjectManager.reqres.setHandler('order:entity', function(_id, _action){
        return API.getOneOrder(_id, _action);
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
        initialize: function(){
           console.log(this.model);
        },
        // events: {
        //     'onchange .js-update-order': 'updateOrder',
        // },
        // updateOrder: function(ev){
            
        //     console.log('****updateOrder');
           

        // }

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
            'click .js-save-block': 'editPizza',
            'click .js-delete-block': 'deleteBlock'
        },
        closeOverlay: function(ev){
            ev.preventDefault();
            ProjectManager.commands.execute('close:overlay');
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
            console.log(this.model)
            if(this.model.get('item')){
                $('#cart-counter').text(totalQty);
            }

            // this.$el.width('100%');
            
        },
        events: {
            'click .js-edit-block': 'openEditPizzaOverlay',
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
            console.log('edit block')
            ev.preventDefault();
            ev.stopPropagation();
            ProjectManager.vent.trigger('editPizzaOverlay:show', this.model.get('_id'));
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
            var pizzaHeaderView = new ProjectManager.ProjectApp.EntityViews.PizzaHeaderView();
            //show
            pizzaHeaderView.on('show', function(){
                if(type == 'admin'){
                    pizzaHeaderView.$('.admin-view').removeClass('u-hide');
                   if(location.href.includes('/admin/orders')){
                       pizzaHeaderView.$('.js-add-pizza').addClass('u-hide');
                   }
                   pizzaHeaderView.$('.link-cart').addClass('u-hide');
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
                    $('.mainHeader .header-title').append("<a href='/' class='header-back header-home'>Pizza Hut</a>");
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

            var fetchingOrders = ProjectManager.request('pizza:entities');
            $.when(fetchingOrders).done(function (orders) {
                var ordersDatatable = new ProjectManager.ProjectApp.EntityViews.OrdersDatatable({
                    model: orders
                });
                console.log(orders);
                ordersDatatable.on('show', function () {
                    datatable = $('#orderDatatable').DataTable({
                        paging: true,
                        pageLength: 10,
                        procesing: true,
                        serverSide: true,
                        order: [[5, 'desc']],
                        ajax: {
                            url: "/api/admin/orders",
                            dataType: 'json',
                            dataSrc: 'data',
                            error: function () {
                                $('#orderDatatable tbody').html('<tr class="odd"><td valign="top" colspan="5" class="dataTables_empty">No data available in table</td></tr>')
                            }
                        },
                        columns: [
                            {
                                data: 'null',
                                sortable: false,
                                class: 'dt-index',
                                render: function (data, type, row, meta) {
                    
                                    let index = datatable.page.info().page * 10 + meta.row + 1;
                                    return index;
                                }
                            },
                            {
                                data: null, class: 'order-dt-orders', render: function (data) {
                                    console.log(data);
                                    return '<a class="show-order js-show-order" href="/order/' + data.slug + '">'+ data.slug +'</a>';
                                }
                            },
                            {
                                data: null, class: 'order-dt-name', render: function (data) {
                                        console.log(data);
                                        return data.customerId.name;
                                }
                            },
                            {
                                data: null, class: 'order-dt-address',render: function (data) {
                                        
                                        return data.address;
                                }
                            },
                            {
                                data: null, class: 'order-dt-status', render: function (data) {
                                        

                                        return '<form action="/api/order/status" method="POST"><input type="hidden" name="orderId" value="'+ `${data._id}`+'">'+'<select class="orderType" name="status" onchange="this.form.submit()"><option value="order_placed"'+ `${data.status === "order_placed" ? "selected" : "" }` + '>' + "Order Placed" + '</option><option value="confirmed"'+ `${data.status === "confirmed" ? "selected" : "" }` + '>' + "Confirmed" + '</option><option value="prepared"'+ `${data.status === "prepared" ? "selected" : "" }` + '>' + "Prepared" + '</option><option value="delivered"'+ `${data.status === "delivered" ? "selected" : "" }` + '>' + "Delivered" + '</option><option value="completed"'+ `${data.status === "completed" ? "selected" : "" }` + '>' + "Completed" + '</option></select></form>'
                                }
                            },
                            {
                                data: null, class: 'order-dt-time', render: function (data) {
                                        
                                        return moment(data.createdAt).format('hh:mm:ss A');
                                }
                            },
                        ],
                        language: {
                            search: "",
                            searchPlaceholder: "Search Pizza By OrderID, Address, Status",
                            class: 'entity-title',
                            emptyTable: 'No records found!'
                        }
                    }); 

                    $('.mainHeader .header-title').text('').append("<a href='/' class='header-back header-home'>Pizza Hut</a>");
                    $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                    $('.mainHeader .header-title').append("<a href='/admin/orders' class='header-course header-now'>Admin Orders</a>");

                })
                ProjectManager.contentRegion.show(ordersDatatable);
            });

        },
        showOrders: function(order_id){
            console.log('showOrders')
            
            var loadingView = new ProjectManager.Common.Views.Loading();
            ProjectManager.contentRegion.show(loadingView);
            var fetchingCustomerOrders = ProjectManager.request('order:entity', order_id, 'getOrder');
            // console.log(fetchingCustomerOrders);
            $.when(fetchingCustomerOrders).done(function(orders){
                var blocksView = new ProjectManager.ProjectApp.EntityViews.BlocksView({
                    collection: new Backbone.Collection(orders.models[0].get('items'))
                });
                console.log(orders.models);
                console.log(window.location.href)
                blocksView.on('show', function(){
                    //Show all blocks
                    blocksView.$('.all-blocks').removeClass('u-hide');
                    blocksView.$('.action-edit-block').addClass('u-hide');
                    blocksView.$('.item-price').addClass('u-hide');
                    blocksView.$('.all-blocks .one-block').removeClass('u-transparent');

                });
                if($('.pageWrap').data('type') === 'admin'){
                    $('.mainHeader .header-title').text('').append("<a href='/' class='header-back header-home'>Pizza Hut</a>");
                    $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                    $('.mainHeader .header-title').append("<a href='/admin/orders' class='header-course header-now'>Admin Orders</a>");
                    $('.mainHeader .header-title').append("<span class='header-seperator'>/</span>");
                    $('.mainHeader .header-title').append("<a href='" +window.location.href +"' class='header-course header-now'>Order Details</a>");
                }
                $('.js-add-pizza').addClass('u-hide');
                ProjectManager.contentRegion.show(blocksView);
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
                        ProjectManager.vent.trigger('pizzaDetail:show', block_id);
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
        showBlocks: function(pizza_id){
            //Show loading page
            console.log('showBlocks')
            var loadingView = new ProjectManager.Common.Views.Loading();
            ProjectManager.contentRegion.show(loadingView);
            
            var fetchingPizzaDetails = ProjectManager.request('pizza:details', pizza_id);
            $.when(fetchingPizzaDetails).done(function(details){
                var blocksView = new ProjectManager.ProjectApp.EntityViews.BlocksView({
                    collection: details
                });
                console.log(details);

                //Show
                blocksView.on('show', function(){
                   
                    if($('.pageWrap').data('type') == 'customer'){
                        blocksView.$('.action-edit-block').addClass('u-hide');
                        blocksView.$('.add-cart').removeClass('u-hide');
                        blocksView.$('.block-price').removeClass('u-hide');
                    }else if($('.pageWrap').data('type') == 'admin'){
                        blocksView.$('.action-edit-block').removeClass('u-hide');
                        blocksView.$('.add-cart').addClass('u-hide');
                        blocksView.$('.block-price').addClass('u-hide');
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
