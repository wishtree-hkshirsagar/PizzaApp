//Client side of FramerSpace
var ProjectManager = new Backbone.Marionette.Application();
//Initialize Variables and Functions
var ENTER_KEY = 13,             //ENTER_KEY
    MAX_FILE_SIZE = 31457280,  //Maximum upload file size
    PAGE_SIZE = 20,            //Page size
    prevScroll, scrollHandler, //Scroll value and scroll handler
    linkEmbedData,             //Variable to save link data
    findTimer,                 //Find timer
    feedbackCollection;        //Feedback collection
//Add regions of the application
ProjectManager.addRegions({
    contentRegion: '.mainWrap'
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
    //Update unique id
    $('.js-update-id').click(function(ev){
        ev.preventDefault();
        //User id
        var currentUser = $('.pageWrap').data('user');
        //Update
        $.ajax({
            url: '/api/user/' + currentUser + '/unique_id',
            type: 'PUT',
            success: function(result){
                $('.unique-id').val(result.id);
                $('.overlay-label b').text(result.id);
            }
        });
    });
    //Show update btn
    $('.invited-box .reset-email').on('input', function(ev){
        var resetEmail = $('.invited-box .reset-email').val().trim();
        if(resetEmail && validator.isEmail(resetEmail)){
            $('.js-update-email').removeClass('u-hide');
        } else {
            $('.js-update-email').addClass('u-hide');
        }
    });
    //Update reset email
    $('.js-update-email').click(function(ev){
        ev.preventDefault();
        //User id
        var currentUser = $('.pageWrap').data('user');
        //Reset email
        var resetEmail = $('.invited-box .reset-email').val().trim();
        //Update
        $.ajax({
            url: '/api/user/' + currentUser + '/reset_email',
            type: 'PUT',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({'email': resetEmail}),
            success: function(result){
                $('.js-update-email').addClass('u-hide');
            }
        });
    });
});
//Router of the application
ProjectManager.module('ProjectApp', function (ProjectApp, ProjectManager, Backbone, Marionette, $, _) {
    ProjectApp.Router = Marionette.AppRouter.extend({
        appRoutes: {
            '': 'settingsView'
        }
    });
    //API functions for each route
    var API = {
        settingsView: function(){
            ProjectManager.ProjectApp.EntityController.Controller.showSettings();
        }
    };
    //Initialize router with API
    ProjectManager.addInitializer(function(){
        new ProjectApp.Router({ controller: API });
    });
});
//Models and Collections of the application
ProjectManager.module('Entities', function (Entities, ProjectManager, Backbone, Marionette, $, _) {
    //User
    Entities.User = Backbone.Model.extend({
        url: function(){
            return '/api/me'
        },
        idAttribute: '_id'
    });
    //Functions to get data
    var API = {
        getUserDetails: function(_id) {
            var user = new Entities.User({
                _id: _id
            });
            var defer = $.Deferred();
            user.fetch({
                success: function (data) {
                    defer.resolve(data);
                }
            });
            return defer.promise();
        }
    };
    //Request Response Callbacks
    ProjectManager.reqres.setHandler('userDetails:entity', function(slug) {
        return API.getUserDetails(slug);
    });
});
//Views of the application
ProjectManager.module('ProjectApp.EntityViews', function (EntityViews, ProjectManager, Backbone, Marionette, $, _) {
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
                phone: this.$('.profile-phone').val().trim()
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
        showSettings: function(){
            //Show loading page
            var loadingView = new ProjectManager.Common.Views.Loading();
            ProjectManager.contentRegion.show(loadingView);
            //Fetch current user
            var fetchingUser = ProjectManager.request('userDetails:entity');
            $.when(fetchingUser).done(function(user){
                var settingsView = new ProjectManager.ProjectApp.EntityViews.SettingsView({
                    model:user
                });
                //Show
                settingsView.on('show', function(){
                    settingsView.$('.overlay-box').addClass('invited-box');
                    settingsView.$('.message').text('Edit profile while you wait for your invitation:');
                    settingsView.$('.profile-security').addClass('u-hide');
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
                        //Add chosen to dropdown
                        settingsView.$('.select-gender').chosen({
                            width: "400px",
                            disable_search_threshold: 13
                        });
                        settingsView.$('.select-country').chosen({
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
                        oldpwd: value.oldpwd,
                        newpwd: value.newpwd
                    });
                    user.save({}, {success: function(){
                        ProjectManager.commands.execute('close:overlay');
                    }});
                });
                ProjectManager.contentRegion.show(settingsView);
            });
        }
    };
});
