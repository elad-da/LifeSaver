App.IndexRoute = Ember.Route.extend({

	beforeModel: function(){
		var self = this;

		var p = Ember.RSVP.hash({
      data1: $.getJSON(App.get('apiurl') + 'combos/userReports'),
      //data2: $.getJSON(App.get('apiurl') + 'combos/symptoms'),
	  data3: $.getJSON(App.get('apiurl') + 'combos/symptoms')
    });
    
    p.then(function(data){
		App.symptomsBodyParts.set('content', data.data3.bodyparts);
		App.symptomsPrecisions.set('content', data.data3.precisions);
  		App.userReportsGenders.set('content', data.data1.genders);
		App.userReportsSymptomIds.set('content', data.data1.symptomIds);
			//App.storesRegions.set('content', data.data2.regions);
			

			self.transitionTo('userReports');
    });
    
	}
	
});