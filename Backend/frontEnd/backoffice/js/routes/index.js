App.IndexRoute = Ember.Route.extend({

	beforeModel: function(){
		var self = this;

		var p = Ember.RSVP.hash({
      //data1: $.getJSON(App.get('apiurl') + 'combos/vehicles'),
      //data2: $.getJSON(App.get('apiurl') + 'combos/stores'),
	  data3: $.getJSON(App.get('apiurl') + 'combos/symptoms')
    });
    
    p.then(function(data){
		App.symptomsBodyParts.set('content', data.data3.bodyparts);
  		//App.vehiclesStatuses.set('content', data.data1.statuses);
			//App.vehiclesStores.set('content', data.data1.stores);
			//App.storesRegions.set('content', data.data2.regions);
			

			self.transitionTo('symptoms');
    });
    
	}
	
});