App.LogoutRoute = Em.Route.extend({

	beforeModel: function(){
		var ctrl = this.controllerFor('login');
		ctrl.set('token', null);

		var appCtrl = this.controllerFor('application');
		appCtrl.set('permissions', []);
		
		$.ajaxSetup({
		  headers: { 'token': null }
		});

		this.transitionTo('login');
	}

});

App.LoginRoute  = Em.Route.extend({

	renderTemplate: function()
	{		
		var data = this.render('application/login', {
		  into: 'application',
		  outlet: 'modal'
		});

		//this.render('groups/index', {controller: this.controllerFor('groups.index')});
	},

	model: function(){
		return Ember.Object.create();
	},

	actions: {
		'login': function(model, view){
			var self = this;
			
			var form = view.$('form');
			var valid = form.parsley('validate');
			if(!valid)
				return;

			var data = {token: '5E97DB9B-6DC3-4B35-B81D-56F4F2EE5B39', permissions: [1,2,3,4,5,6]};

			//disable login
			// var ctrl = self.controllerFor('login');
			// var appCtrl = self.controllerFor('application');
			// ctrl.set('token', data.token);
			// appCtrl.set('permissions', data.permissions);
			// self.transitionTo('index');
			//return;
			//end of disable login;

			// $.ajaxSetup({
			// 	//crossDomain: true,
			// 	headers: { 'token': 'abc' }
	  //   });
	  //   return;

	    //localStorege.setItem('token', data.token);

			//self.transitionTo('index');

			$.ajax({
				type: 'POST',
				url: App.get('apiurl') + 'login',
				data: JSON.stringify(model)
			}).then(function(data){
				//console.log(data);
				
				var ctrl = self.controllerFor('login');
				var appCtrl = self.controllerFor('application');
				ctrl.set('token', data.token);
				appCtrl.set('permissions', [1,2,3,4,5,6]);
				
				$.ajaxSetup({
					//crossDomain: true,
					headers: { 'token': data.token }
		    });

		    //localStorege.setItem('token', data.token);

				self.transitionTo('index');
			}).fail(function(data){
				//console.log(data);
				var error = data.responseText
				form.find('.errors').html('<div class="alert alert-danger"> <strong>שגיאה:</strong> '+error+'</div>')
			});
		}
	}

});

App.LoginController = Em.ObjectController.extend({
	token: false
});

App.ProtectedRoute = Em.Route.extend({

	beforeModel: function(){
		var ctrl = this.controllerFor('login');
		if(!ctrl.get('token'))
			this.transitionTo('login');
	},

	actions: {
    error: function(reason, transition) {
    	if(reason.status === 0)
    		return;
      if (reason.status === 403) {
      	this.controllerFor('application').set('permissions', []);
        this.transitionTo('login');
      } else {
        alert('Something went wrong');
      }
    }
  }

});

App.ApplicationRoute = App.ProtectedRoute.extend({
	actions: {
		settings: function(){
			this.render('application/settings', {
			  into: 'application',
			  //outlet: 'modal'
			});
		}
	}
});