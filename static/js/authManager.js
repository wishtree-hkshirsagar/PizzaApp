var AccountManager = new Backbone.Marionette.Application();

//Add Regions where Login and other forms will be dynamically loaded
AccountManager.addRegions({
    overlayRegion: '.overlay'
});
//Navigate function to change url
AccountManager.navigate = function(route, options){
    options || (options = {});
    Backbone.history.navigate(route, options);
};
//Find current route
AccountManager.getCurrentRoute = function(){
    return Backbone.history.fragment;
};
//After JS is initialized start the Backbone history
AccountManager.on('start', function(){
    if (Backbone.history) {
        Backbone.history.start({pushState: true});
    }
    //Close overlay on ESC Key and mousedown
    $(document).keyup(function(e){
        if (e.keyCode == 27 && $('.overlay').css('display') != 'none') {
            AccountManager.commands.execute('close:overlay');
        }
    });
    $(document).mousedown(function(e){
        var $target = $(e.target);
        //Close overlay
        var container = $('.overlay-box');
        if (container.length && !container.is(e.target) && container.has(e.target).length === 0 && !$('.js-help').hasClass('active')) {
            AccountManager.commands.execute('close:overlay');
        }
    });
    //Show login overlay
    $('.js-login').click(function(e){
        e.preventDefault();
        AccountManager.vent.trigger('login:show');
    });
    //Show signup overlay
    $('.js-signup').click(function(e){
        e.preventDefault();
        AccountManager.vent.trigger('signup:show');
    });
    //Show help intro
    $('.js-help').click(function(e){
        e.preventDefault();
        $('.js-help').addClass('active');
        var intro = introJs();
        intro.setOptions({
            showProgress: false,
            steps: [
                {
                    title: "Welcome to FramerSpace!",
                    intro: "FramerSpace is a co-creation platform that provides building blocks to support the creation of online courses and connects learners to peers and creators through Artificial Intelligence.<br><br>If this is your first time, we can help you get started.",
                    tooltipClass: 'intro-start'
                },
                {
                    element: document.querySelector('.js-signup'),
                    intro: "Click here to signup!",
                    position: "left"
                }
            ]
        });
        intro.oncomplete(function(){
            $('.navBar .js-signup').click();
            return false;
        });
        intro.onexit(function(){
            return false;
        });
        intro.start();
    });
});
//Application wide commands
AccountManager.commands.setHandler('close:overlay', function(view){
    //remove animate class on overlay box
    $('.overlay-box').removeClass('animate');
    //after animation, remove view, change route and hide overlay
    setTimeout(function(){
        $('.overlay > div').remove();
        $('.overlay').removeClass('overlay-video').hide();
        var prevScroll = $('body').scrollTop();
        $('body').css('overflow', 'auto');
        AccountManager.navigate('');
        $('body').scrollTop(prevScroll);
    }, 300);
});
//Router of the Application
AccountManager.module('AccountApp', function(AccountApp, AccountManager, Backbone, Marionette, $, _){
    AccountApp.Router = Marionette.AppRouter.extend({
        appRoutes: {
            '': 'mainView',
            'login': 'loginView',
            'signup': 'signupView',
            'forgot': 'forgotView',
            'terms': 'termsView'
        }
    });
    var API = {
        mainView: function(){
            AccountManager.AccountApp.EntityController.Controller.showMain();
        },
        loginView: function(email){
            AccountManager.AccountApp.EntityController.Controller.showLogin(email);
        },
        signupView: function(){
            AccountManager.AccountApp.EntityController.Controller.showSignup();
        },
        forgotView: function(email){
            AccountManager.AccountApp.EntityController.Controller.showForgot(email);
        },
        termsView: function(){
            AccountManager.AccountApp.EntityController.Controller.showTerms();
        }
    };
    AccountManager.vent.on('login:show', function(email){
        AccountManager.navigate('login');
        API.loginView(email);
    });
    AccountManager.vent.on('signup:show', function(){
        AccountManager.navigate('signup');
        API.signupView();
    });
    AccountManager.vent.on('forgot:show', function(email){
        AccountManager.navigate('forgot');
        API.forgotView(email);
    });
    AccountManager.vent.on('terms:show', function(email){
        AccountManager.navigate('terms');
        API.termsView();
    });
    AccountManager.addInitializer(function(){
        new AccountApp.Router({ controller: API });
    });
});
//Models of the Application
AccountManager.module('Entities', function(Entities, AccountManager, Backbone, Marionette, $, _){
    Entities.Login = Backbone.Model.extend({
        urlRoot: '/login'
    });
    Entities.Signup = Backbone.Model.extend({
        urlRoot: '/signup'
    });
    Entities.Forgot = Backbone.Model.extend({
        urlRoot: '/forgot'
    });
});
//View of the Application
AccountManager.module('AccountApp.EntityViews', function(EntityViews, AccountManager, Backbone, Marionette, $, _){
    EntityViews.Login = Marionette.ItemView.extend({
        template: 'loginTemplate',
        events: {
            'mousedown .js-close, .js-forgot, .js-submit, .show-password, .label': 'doNothing',
            'click .js-close': 'closeOverlay',
            'click .js-forgot': 'forgotBox',
            'click .js-signup': 'signUpBox',
            'blur .js-email input': 'checkUsername',
            'blur .js-password input': 'checkPassword',
            'focus .input': 'showError',
            'submit .js-form': 'submitForm',
            'click .show-password': 'togglePassword'
        },
        //stop stealing focus from input boxes
        doNothing: function(e){
            e.preventDefault();
            e.stopPropagation();
        },
        //close overlay
        closeOverlay: function(e){
            e.preventDefault();
            AccountManager.commands.execute('close:overlay');
        },
        //show forgot password window
        forgotBox: function(e){
            e.preventDefault();
            var email = this.$( '.js-email input').val() || '';
            AccountManager.vent.trigger('forgot:show', email);
        },
        //show signup window
        signUpBox: function(e){
            e.preventDefault();
            AccountManager.vent.trigger('signup:show');
        },
        //check email erors
        checkUsername: function(){
            var emailVal = this.$('.js-email input').val();
            if(!emailVal){
                this.$('.js-email .u-formError').text('Please enter your email id:').show();
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
                this.$('.js-password .u-formError').text('Please enter a password:').show();
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
        showError: function(e){
            var $target = $(e.target);
            if($target.prev().text()){
                $target.removeClass('hasError');
                $target.prev().show();
            }
        },
        //check validation errors before submitting form
        submitForm: function(e){
            this.checkUsername();
            this.checkPassword();
            if (!this.$('.input.hasError').length) {
                return true;
            } else {
                e.preventDefault();
                this.$('.input.hasError').eq(0).focus();
                return false;
            }
        },
        //show - hide password
        togglePassword: function(){
            if (this.$('.show-password').hasClass('active')){
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
            'blur .js-email input': 'checkEmail',
            'blur .js-password input': 'checkPassword',
            'blur .js-confirm-password input': 'checkConfirmPassword',
            'input .js-confirm-password input': 'checkConfirmPassword',
            'blur .js-name input': 'checkName',
            'blur .js-contact input': 'checkContactNumber',
            'change .action-consent input': 'allowConsent',
            'focus .input': 'showError',
            'submit .js-form': 'submitForm',
            'click .show-password': 'togglePassword',
            'click .js-terms': 'termsBox'
        },
        //stop stealing focus from input boxes
        doNothing: function(e){
            e.preventDefault();
            e.stopPropagation();
        },
        //close overlay
        closeOverlay: function(e){
            e.preventDefault();
            AccountManager.commands.execute('close:overlay');
        },
        //show login window
        loginBox: function(e){
            e.preventDefault();
            AccountManager.vent.trigger('login:show');
        },
       //check email erors
       checkEmail: function(){
            let emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            let emailVal = this.$('.js-email input').val();
            if(!emailVal){
                this.$('.js-email .u-formError').text('Please enter an email address:').show();
                this.$('.js-email input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            } else if(!emailRegex.test(emailVal)){
                this.$('.js-email .u-formError').text('Please enter a valid email address:').show();
                this.$('.js-email input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            } else {
                this.$('.js-email .u-formError').text('').hide();
                this.$('.js-email input').removeClass('hasError');
                this.$('.js-submit').removeClass('u-disabled');
                 //Enable Button
                 if(this.$('.action-consent input').is(':checked') && !this.$('.input.hasError').length){
                    this.$('.js-submit').removeClass('u-disabled');
                } else {
                    this.$('.js-submit').addClass('u-disabled');
                }
            }
        },
        //check password errors
        checkPassword: function(){
            let passwordVal = this.$('.js-password input').val();
            let confirmPasswordVal = this.$('.js-confirm-password input').val();
            if(!passwordVal) {
                this.$('.js-password .u-formError').text('Please enter a password:').show();
                this.$('.js-password input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            } else if(passwordVal.length < 8) {
                this.$('.js-password .u-formError').text('Passwords must be 8 characters or more:').show();
                this.$('.js-password input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            } else if(confirmPasswordVal) {
                this.checkConfirmPassword();
            } else {
                this.$('.js-password .u-formError').text('').hide();
                this.$('.js-password input').removeClass('hasError');
                // //Enable Button
                if(this.$('.action-consent input').is(':checked') && !this.$('.input.hasError').length){
                    this.$('.js-submit').removeClass('u-disabled');
                } else {
                    this.$('.js-submit').addClass('u-disabled');
                }
            }
        },
        // Check confirm password errors
        checkConfirmPassword: function(){
            var confirmPasswordVal = this.$('.js-confirm-password input').val();
            var passwordVal = this.$('.js-password input').val();
            if(confirmPasswordVal != passwordVal) {
                this.$('.js-confirm-password .u-formError').text('Entered passwords do not match:').show();
                this.$('.js-confirm-password input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            } else {
                this.$('.js-confirm-password .u-formError').text('').hide();
                this.$('.js-confirm-password input').removeClass('hasError');
                //Enable Button
                if(this.$('.action-consent input').is(':checked') && !this.$('.input.hasError').length){
                    this.$('.js-submit').removeClass('u-disabled');
                } else {
                    this.$('.js-submit').addClass('u-disabled');
                }
            }
        },
        //Check name errors
        checkName: function() {
            let nameRegex = /^[a-zA-Z ]*$/;
            let nameVal = this.$('.js-name input').val();

            if(!nameVal){
                this.$('.js-name .u-formError').text('Please enter your name:').show();
                this.$('.js-name input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            }else if(!nameRegex.test(nameVal)){
                this.$('.js-name .u-formError').text('Please enter a valid name:').hide();
                this.$('.js-name input').addClass('hasError');
            }else {
                this.$('.js-name .u-formError').text('').hide();
                this.$('.js-name input').removeClass('hasError');
                 //Enable Button
                 if(this.$('.action-consent input').is(':checked') && !this.$('.input.hasError').length){
                    this.$('.js-submit').removeClass('u-disabled');
                } else {
                    this.$('.js-submit').addClass('u-disabled');
                }
            }
        },
        // check contact number
        checkContactNumber: function(){
            let contactNumberRegex = /^[7-9]{1}[0-9]{9}$/;
            let contactVal = this.$('.js-contact input').val();

            if(!contactVal){
                this.$('.js-contact .u-formError').text('Please enter your contact number:').show();
                this.$('.js-contact input').addClass('hasError');
                this.$('.js-submit').addClass('u-disabled');
            }else if(!contactNumberRegex.test(contactVal)){
                this.$('.js-contact .u-formError').text('Please enter a valid contact number:').show();
                this.$('.js-contact input').addClass('hasError');
            }else {
                this.$('.js-contact .u-formError').text('').hide();
                this.$('.js-contact input').removeClass('hasError');
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
            }  else{
                this.$('.js-submit').addClass('u-disabled');
            }
        },
        //show Error message on focus
        showError: function(e){
            var $target = $(e.target);
            if($target.prev().text()){
                $target.removeClass('hasError');
                $target.prev().show();
            }
        },
        //check validation errors before submitting form
        submitForm: function(e){
            this.checkEmail();
            this.checkPassword();
            this.checkConfirmPassword();
            if (this.$('.action-consent input').is(':checked') && !this.$('.input.hasError').length) {
                return true;
            } else {
                e.preventDefault();
                this.$('.js-submit').addClass('u-disabled');
                this.$('.input.hasError').eq(0).focus();
                return false;
            }
        },
        //show - hide password
        togglePassword: function(){
            if (this.$('.show-password').hasClass('active')){
                this.$('.js-password input').attr('type', 'password');
            } else {
                this.$('.js-password input').attr('type', 'text');
            }
            this.$('.show-password').toggleClass('active');
        },
        //show terms window
        termsBox: function(e){
            e.preventDefault();
            AccountManager.vent.trigger('terms:show');
        },
    });
    EntityViews.Forgot = Marionette.ItemView.extend({
        template: 'forgotTemplate',
        events: {
            'mousedown .js-close, .js-login, .js-submit': 'doNothing',
            'click .js-close': 'closeOverlay',
            'click .js-login': 'loginBox',
            'blur .js-email input': 'checkEmail',
            'focus .input': 'showError',
            'submit .js-form': 'submitForm'
        },
        //stop stealing focus from input boxes and buttons
        doNothing: function(e){
            e.preventDefault();
            e.stopPropagation();
        },
        //close overlay
        closeOverlay: function(e){
            e.preventDefault();
            AccountManager.commands.execute('close:overlay');
        },
        //show login window
        loginBox: function(e){
            e.preventDefault();
            var email = this.$( '.js-email input').val() || '';
            AccountManager.vent.trigger('login:show', email);
        },
        //check email erors
        checkEmail: function(){
            var emailRegex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            var emailVal = this.$('.js-email input').val();
            if(!emailVal){
                this.$('.js-email .u-formError').text('Please enter an email address:').hide();
                this.$('.js-email input').addClass('hasError');
            } else if(!emailRegex.test(emailVal)){
                this.$('.js-email .u-formError').text('Please enter a valid email address:').hide();
                this.$('.js-email input').addClass('hasError');
            } else {
                this.$('.js-email .u-formError').text('').hide();
                this.$('.js-email input').removeClass('hasError');
            }
        },
        //show Error message on focus
        showError: function(e){
            var $target = $(e.target);
            if($target.prev().text()){
                $target.removeClass('hasError');
                $target.prev().show();
            }
        },
        //check validation errors before submitting form
        submitForm: function(e){
            this.checkEmail();
            if (!this.$('.input.hasError').length) {
                return true;
            } else {
                e.preventDefault();
                this.$('.input.hasError').eq(0).focus();
                return false;
            }
        }
    });
    EntityViews.Terms = Marionette.ItemView.extend({
        template: 'termsTemplate',
        events: {
            'click .js-close': 'closeOverlay'
        },
        //close overlay
        closeOverlay: function(e){
            e.preventDefault();
            AccountManager.vent.trigger('signup:show');
        }
    });
});
//Controller of the Application
AccountManager.module('AccountApp.EntityController', function(EntityController, AccountManager, Backbone, Marionette, $, _){
    EntityController.Controller = {
        showMain: function(){
            if($('.overlay').css('display') != 'none') {
                $('.overlay > div').remove();
                $('.overlay').hide();
            }
        },
        showLogin: function(email){
            $('.overlay').show();
            var loginView = new AccountManager.AccountApp.EntityViews.Login();
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
            AccountManager.overlayRegion.show(loginView);
        },
        showSignup: function(){
            $('.overlay').show();
            var signupView = new AccountManager.AccountApp.EntityViews.Signup();
            signupView.on('show', function(){
                setTimeout(function(){
                    signupView.$('.overlay-box').addClass('animate');
                }, 100);
                $('body').css('overflow', 'hidden');
                signupView.$( '.js-email input').focus();
                //Show intro
                setTimeout(function(){
                    if($('.js-help').hasClass('active')){
                        var intro = introJs();
                        intro.setOptions({
                            showProgress: false,
                            steps: [
                                {
                                    element: document.querySelector('.js-age'),
                                    intro: "Enter your age and a strong password.",
                                    position: "left"
                                },
                                {
                                    element: document.querySelector('.action-consent'),
                                    intro: "Select the Terms and Data Policy checkbox after reading the terms.",
                                    position: "left"
                                },
                                {
                                    element: document.querySelector('.btn-submit'),
                                    intro: "Click the Sign up button.",
                                    position: "left"
                                }
                            ]
                        });
                        intro.onexit(function(){
                            $('.js-help').removeClass('active');
                            return false;
                        });
                        intro.start();
                    }
                }, 600);
            });
            AccountManager.overlayRegion.show(signupView);
        },
        showForgot: function(email){
            $('.overlay').show();
            var forgotView = new AccountManager.AccountApp.EntityViews.Forgot();
            forgotView.on('show', function(){
                setTimeout(function(){
                    forgotView.$('.overlay-box').addClass('animate');
                }, 100);
                $('body').css('overflow', 'hidden');
                forgotView.$( '.js-email input').val(email).focus();
            });
            AccountManager.overlayRegion.show(forgotView);
        },
        showTerms: function(email){
            $('.overlay').show();
            var termsView = new AccountManager.AccountApp.EntityViews.Terms();
            termsView.on('show', function(){
                //Animate overlay box
                setTimeout(function(){
                    termsView.$('.overlay-box').addClass('animate');
                }, 100);
                //hide scroll on main page
                $('body').css('overflow', 'hidden');
            });
            AccountManager.overlayRegion.show(termsView);
        }
    }
});
