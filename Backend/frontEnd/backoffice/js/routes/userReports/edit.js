App.StoresEditController 		= Em.ArrayController.extend();
App.StoresCreateController 	= Em.ArrayController.extend();
App.StoresDeleteController 	= Em.Controller.extend();

App.StoresCreateRoute = App.StoresEditRoute = App.ProtectedRoute.extend({
	

	model: function(params)
	{
		if(params.store_id)
			return $.getJSON(App.get('apiurl') + 'stores/'+params.store_id);
		
		return $.getJSON(App.get('apiurl') + 'stores/0');
	},

	setupController: function(ctrl, model)
	{

		if(model.storeNo == 0)
		{
			delete model.storeNo;
			model.isnew = true;
		}	
		
		ctrl.set('store', Em.Object.create(model));
		
	},


	renderTemplate: function()
	{		
		var data = this.render('stores/modal', {
		  into: 'application',
		  outlet: 'modal',
		});

		this.render('stores/index', {controller: this.controllerFor('stores.index')});
	}

});

App.StoresDeleteRoute = App.ProtectedRoute.extend({
	

	model: function(params)
	{
		return params;
	},

	setupController: function(ctrl, model)
	{
		ctrl.set('id', model.store_id);
	},


	renderTemplate: function()
	{		
		var data = this.render('stores/confirm', {
		  into: 'application',
		  outlet: 'modal',
		});

		this.render('stores/index', {controller: this.controllerFor('stores.index')});
	}

});