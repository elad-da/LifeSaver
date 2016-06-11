TemplatesHelper = {
  load: function(templateNames) {
    templateNames.forEach(function(name) {
      $.ajax({
        url: "js/templates/" + name + ".hbs",
        async: false,
        success: function(template) {
            var compiledTemplate = Ember.Handlebars.precompile(template);
            Ember.TEMPLATES[name] = Ember.Handlebars.template(compiledTemplate);
        }
      });
    });
  }
};
