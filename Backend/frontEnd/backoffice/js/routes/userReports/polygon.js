App.StoresPolygonRoute = App.ProtectedRoute.extend({
	

	model: function(params)
	{
		return $.getJSON(App.get('apiurl') + 'stores/'+params.store_id);
	},

	setupController: function(ctrl, model)
	{	
		var loc = model.branchLocation;
		model.polygonEditLink = App.get('apiurl')+"backoffice/polygon/index1.html?storeNo="+model.storeNo+"&lat="+loc.lat+"&lng="+loc.lng;
		ctrl.set('store', Em.Object.create(model));	
	},


	renderTemplate: function()
	{		
		var data = this.render('stores/polygon', {
		  into: 'application',
		  outlet: 'modal',
		});

		this.render('stores/index', {controller: this.controllerFor('stores.index')});
	}

});