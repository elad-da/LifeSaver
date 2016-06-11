App.UsersIndexSearchController = Ember.Object.extend({
			'userName': '',
			'email': '',


			params: function(){
				var params  = 'userName email'.split(' ');
        var fdata   = [];
        var pval = null;
        for(var i = 0; i < params.length; i++)
        {
        	pval = this.get(params[i]);
        	if(pval !== null)
        		fdata.push('['+params[i]+']='+pval);
        }
        return fdata.join('&');
			}.property('userName', 'email')
});

App.UsersIndexRoute = App.ProtectedRoute.extend({

	setupController: function(ctrl, model)
	{
		ctrl.set('search', this.controllerFor('UsersIndexSearch'));
		ctrl.refresh();
	}

});

App.UsersRoute = App.ProtectedRoute.extend({
	actions: {
		'delete': function(id, view){
			var self = this;
			$.ajax({
				type: 'DELETE',
				url: App.get('apiurl') + 'users/'+id,
			}).then(function(){
				self.transitionTo('users');
			}).fail(function(data){
				//var error = data.responseJSON.error
				//form.find('.errors').html('<div class="alert alert-danger"> <strong>שגיאה:</strong> '+data.responseText+'</div>')
			});
		},

		save: function(model, view){

			console.log(model);
			//to ints
			//var names = "symptomId bodyPart expiry epidemicThreshold";

			//var toInts = names.split(' ');


			var self = this;
			

			var form = view.$('form');
			var valid = form.parsley('validate');
			if(!valid)
				return;


			var method;
			if(model.isnew == true)
			{
				method = 'POST';
			}
			else
			{
				method = 'PUT';
			}
			
			var data = JSON.stringify(model);
			data = JSON.parse(data);


			/*for(var key in data)
			{
				if(toInts.indexOf(key) !== -1)
					data[key] = parseInt(data[key]);

			}*/

			$.ajax({
				type: method,
				url: App.get('apiurl') + 'users',
				data: JSON.stringify(data)
			}).then(function(){
				self.transitionTo('users');
			}).fail(function(data){
				
				form.find('.errors').html('<div class="alert alert-danger"> <strong>שגיאה: משתמש זה כבר קיים</strong> '+data.responseText+'</div>')
			});
		}
	}
});