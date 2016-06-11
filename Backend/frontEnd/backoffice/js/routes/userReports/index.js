App.StoresIndexSearchController = Ember.Object.extend({
			'storeNo': '',
			'storeName': '',
			'region': '',


			params: function(){
				var params  = 'storeNo storeName region'.split(' ');
        var fdata   = [];
        var pval = null;
        for(var i = 0; i < params.length; i++)
        {
        	pval = this.get(params[i]);
        	if(pval !== null)
        		fdata.push('['+params[i]+']='+pval);//(pval == null ? '' : pval));
        }
        return fdata.join('&');
			}.property('storeNo', 'storeName', 'region')
});

App.StoresIndexRoute = App.ProtectedRoute.extend({

	setupController: function(ctrl, model)
	{
		ctrl.set('search', this.controllerFor('storesIndexSearch'));
		ctrl.refresh();
	}

});

App.StoresRoute = App.ProtectedRoute.extend({
	actions: {

		'delete': function(id, view){
			var self = this;
			$.ajax({
				type: 'DELETE',
				url: App.get('apiurl') + 'stores/'+id,
			}).then(function(){
				self.transitionTo('stores');
			}).fail(function(data){
				//var error = data.responseJSON.error
				//form.find('.errors').html('<div class="alert alert-danger"> <strong>שגיאה:</strong> '+data.responseText+'</div>')
			});
		},

		save: function(model, view){

			//console.log('save store');

			//to ints
			var names = 
			"storeNo storeServerPort debugMode numberOfMakeLinesEmployees "+
			"prepareSeconds ovenSeconds cutSeconds cutSecondPizza "+
			"makeOrdersLevel0 makeOrdersLevel1 makeOrdersLevel2 makeOrdersLevel3 "+
			"timeToWaitForSecondDelivery secondsAllowedBetweenCoupledOrders "+
			"secondsAllowedBetweenPreparedAndOvenOrder secondsFromStopToDoorWay "+
			"tripletsDistanceInSeconds secondsAllowedNotToBeDispatched "+
			"secondsForKm maxMinutesToNotifyCustomer timeOffset maxOrdersToHoldOnShelf";

			var toInts = names.split(' ');


			var self = this;
			

			var form = view.$('form');
			var valid = form.parsley('validate');
			if(!valid)
			{
				var tabName = form.find('.parsley-error').first().closest('.tab-pane').attr('id');
				Em.$('[href=#'+tabName+']').click();
				return;
			}


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


			}

			//conver to floats
			data.branchLocation.lat = parseFloat(data.branchLocation.lat);
			data.branchLocation.lng = parseFloat(data.branchLocation.lng);

			$.ajax({
				type: method,
				url: App.get('apiurl') + 'stores',
				data: JSON.stringify(data)
			}).then(function(){
				self.transitionTo('stores');
			}).fail(function(data){
				//var error = data.responseJSON.error
				form.find('.errors').html('<div class="alert alert-danger"> <strong>שגיאה:</strong> '+data.responseText+'</div>')
			});
		}
	}
});