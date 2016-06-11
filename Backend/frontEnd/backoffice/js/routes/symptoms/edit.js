App.SymptomsEditController 		= Em.ArrayController.extend();
App.SymptomsCreateController 	= Em.ArrayController.extend();
App.SymptomsDeleteController 	= Em.Controller.extend();

App.SymptomsCreateRoute = App.SymptomsEditRoute = App.ProtectedRoute.extend({
	

	model: function(params)
	{
		if(params.symptom_id)
			return $.getJSON(App.get('apiurl') + 'symptoms/'+params.symptom_id);
		
		return {isnew: true};
	},

	setupController: function(ctrl, model)
	{
		ctrl.set('symptom', App.SymptomsController.create(model));
	},


	renderTemplate: function()
	{		
		var data = this.render('symptoms/modal', {
		  into: 'application',
		  outlet: 'modal',
		});

		this.render('symptoms/index', {controller: this.controllerFor('symptoms.index')});
	}

});

App.SymptomsDeleteRoute = App.ProtectedRoute.extend({
	

	model: function(params)
	{
		return params;
	},

	setupController: function(ctrl, model)
	{
		ctrl.set('id', model.symptom_id);
	},

	renderTemplate: function()
	{		
		var data = this.render('symptoms/confirm', {
		  into: 'application',
		  outlet: 'modal',
		});

		this.render('symptoms/index', {controller: this.controllerFor('symptoms.index')});
	}

});