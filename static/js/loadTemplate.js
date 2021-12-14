/* Integrate handlebars template with Marionette.
First attempt to load pre-compiled templates, then by selector, and finally via XHR */
(function(Handlebars, Backbone){
    var Marionette = Backbone.Marionette;
    Marionette.Handlebars = {
        path: '/templates/',
        extension: '.handlebars'
    };
    Marionette.TemplateCache.prototype.load = function(){
        // Guard clause to prevent loading this template more than once
        if (this.compiledTemplate) {
            return this.compiledTemplate;
        }
        //load precompiled template - for production
        if (Handlebars.templates && Handlebars.templates[this.templateId]) {
            this.compiledTemplate = Handlebars.templates[this.templateId];
        }
        //load template via script tag or external file
        else {
            var template = this.loadTemplate(this.templateId);
            this.compiledTemplate = this.compileTemplate(template);
        }
        return this.compiledTemplate;
    };
    Marionette.TemplateCache.prototype.loadTemplate = function(templateId){
        var template, templateUrl;
        //if present as script tag. In that case templateId should be #elementId
        try {
            template = Backbone.$('#'+templateId).html();
        }
        catch(e) {}
        //load via ajax
        if (!template || template.length === 0) {
            templateUrl = Marionette.Handlebars.path + templateId + Marionette.Handlebars.extension;
            Backbone.$.ajax({
                url: templateUrl,
                success: function(data){
                    template = data;
                },
                async: false
            });
            if (!template || template.length === 0) {
                throw "NoTemplateError - Could not find template:'" + templateUrl + "'";
            }
        }
        return template;
    };
    Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate){
        return Handlebars.compile(rawTemplate);
    };
}(Handlebars, Backbone));