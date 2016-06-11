App.SettingsIndexRoute = App.ProtectedRoute.extend({

	model: function()
	{
		return $.getJSON('settings');
	},

	renderTemplate: function()
	{
			var ctrl = this.controllerFor('settingsIndex');
			this.render('settings/index');
			this.render('settings/modal', {controller: ctrl, into: 'settings/index'});
	},

	actions: {
		save: function(settings){
			//console.log('settings', settings);
			$.ajax({
				type: 'POST',
				url: 'settings',
				data: JSON.stringify(settings)
			}).then(function(){
				//self.transitionTo('settings.index');
			});
		}
	}

});