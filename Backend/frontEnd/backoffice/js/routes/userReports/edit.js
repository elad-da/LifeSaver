App.UserReportsEditController 		= Em.ArrayController.extend();
App.UserReportsCreateController 	= Em.ArrayController.extend();
App.UserReportsDeleteController 	= Em.Controller.extend();

App.UserReportsCreateRoute = App.UserReportsEditRoute = App.ProtectedRoute.extend({
	

	model: function(params)
	{
		if(params.userReport_id)
			return $.getJSON(App.get('apiurl') + 'userReports/'+params.userReport_id);
		
		return {isnew: true};
	},

	setupController: function(ctrl, model)
	{
		ctrl.set('userReport', App.UserReportsController.create(model));
	},


	renderTemplate: function()
	{		
		var data = this.render('userReports/modal', {
		  into: 'application',
		  outlet: 'modal',
		});

		this.render('userReports/index', {controller: this.controllerFor('userReports.index')});
	}

});

App.UserReportsDeleteRoute = App.ProtectedRoute.extend({
	

	model: function(params)
	{
		return params;
	},

	setupController: function(ctrl, model)
	{
		ctrl.set('id', model.userReport_id);
	},

	renderTemplate: function()
	{		
		var data = this.render('userReports/confirm', {
		  into: 'application',
		  outlet: 'modal',
		});

		this.render('userReports/index', {controller: this.controllerFor('userReports.index')});
	}

});