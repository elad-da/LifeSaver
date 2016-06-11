App.UsersEditController  = Em.ArrayController.extend();
App.UsersCreateController 	= Em.ArrayController.extend();
App.UsersDeleteController 	= Em.Controller.extend();

App.UsersCreateRoute = App.UsersEditRoute = App.ProtectedRoute.extend({
	

	model: function(params)
	{
		if(params.user_id)
			return $.getJSON(App.get('apiurl') + 'users/'+params.user_id);
		
		return {isnew: true};
	},

	setupController: function(ctrl, model)
	{
		ctrl.set('user', App.UsersController.create(model));
	},


	renderTemplate: function()
	{		
		var data = this.render('users/modal', {
		  into: 'application',
		  outlet: 'modal',
		});

		this.render('users/index', {controller: this.controllerFor('users.index')});
	}

});

App.UsersDeleteRoute = App.ProtectedRoute.extend({
	

	model: function(params)
	{
		return params;
	},

	setupController: function(ctrl, model)
	{
		ctrl.set('id', model.user_id);
	},

	renderTemplate: function()
	{		
		var data = this.render('users/confirm', {
		  into: 'application',
		  outlet: 'modal',
		});

		this.render('users/index', {controller: this.controllerFor('users.index')});
	}

});