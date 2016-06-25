App.UserReportsIndexSearchController = Ember.Object.extend({
			'gender': '',
			'age': '',
			'symptomId': '',


			params: function(){
				var params  = 'gender age symptomId'.split(' ');
        var fdata   = [];
        var pval = null;
        for(var i = 0; i < params.length; i++)
        {
        	pval = this.get(params[i]);
        	if(pval !== null)
        		fdata.push('['+params[i]+']='+pval);
        }
        return fdata.join('&');
			}.property('gender', 'age', 'symptomId')
});

App.UserReportsIndexRoute = App.ProtectedRoute.extend({

	setupController: function(ctrl, model)
	{
		ctrl.set('search', this.controllerFor('UserReportsIndexSearch'));
		ctrl.refresh();
	}

});

App.UserReportsRoute = App.ProtectedRoute.extend({
	actions: {
		'delete': function(id, view){
			var self = this;
			$.ajax({
				type: 'DELETE',
				url: App.get('apiurl') + 'userReports/'+id,
			}).then(function(){
				self.transitionTo('userReports');
			}).fail(function(data){
				//var error = data.responseJSON.error
				//form.find('.errors').html('<div class="alert alert-danger"> <strong>שגיאה:</strong> '+data.responseText+'</div>')
			});
		},

		save: function(model, view){

			console.log(model);
			//to ints
			var names = 
			"age gender";
			
			var latlng = 
			"lat lng";
			
			var toFloat = latlng.split(' ')

			var toInts = names.split(' ');


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


			for(var key in data)
			{
				if(toInts.indexOf(key) !== -1)
					data[key] = parseInt(data[key]);
				
				if(toFloat.indexOf(key) !== -1)
					data[key] = parseFloat(data[key]);

			}

			$.ajax({
				type: method,
				url: App.get('apiurl') + 'userReports',
				data: JSON.stringify(data)
			}).then(function(){
				self.transitionTo('userReports');
			}).fail(function(data){
				
				form.find('.errors').html('<div class="alert alert-danger"> <strong>שגיאה:</strong> '+data.responseText+'</div>')
			});
		}
	}
});