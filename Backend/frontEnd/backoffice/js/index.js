App = Ember.Application.create({});

App.set('apiurl', API_URL);


//App.vehiclesStatuses = Em.ArrayController.create();
//App.vehiclesStores = Em.ArrayController.create();
//App.storesRegions = Em.ArrayController.create();
App.symptomsBodyParts = Em.ArrayController.create();
App.symptomsPrecisions = Em.ArrayController.create();
App.userReportsGenders = Em.ArrayController.create();
App.userReportsSymptomIds = Em.ArrayController.create();



Ember.Application.initializer({
  name: "options",
 
  initialize: function(container, application) {}

});

App.Router.map(function(){

	this.route('login');
	this.route('logout');

	this.resource('vehiclespeedrules', function(){

	});
	
	this.resource('stores', function(){
		this.route('create');
		this.route('edit', {path: ':store_id/edit'});
		this.route('polygon', {path: ':store_id/polygon'});
		this.route('delete', {path: ':store_id/delete'});
	});

	this.resource('vehicles', function(){
		this.route('create');
		this.route('edit', {path: ':vehicle_id/edit'});
		this.route('delete', {path: ':vehicle_id/delete'});
	});
	
	this.resource('symptoms', function(){
		this.route('create');
		this.route('edit', {path: ':symptom_id/edit'});
		this.route('polygon', {path: ':symptom_id/polygon'});
		this.route('delete', {path: ':symptom_id/delete'});
	});
	
	this.resource('users', function(){
		this.route('create');
		this.route('edit', {path: ':user_id/edit'});
		this.route('delete', {path: ':user_id/delete'});
	});
	
	this.resource('userReports', function(){
		this.route('create');
		this.route('edit', {path: ':userReport_id/edit'});
		this.route('delete', {path: ':userReport_id/delete'});
	});

});

Em.TextField.reopen({
  attributeBindings: ['required', 'readonly']
});

Em.Select.reopen({
	attributeBindings: ['required', 'readonly', 'disabled']
});


App.ModalView = Em.View.extend({
	didInsertElement: function(){
		this.$('.modal').show().addClass('in');
		this.$('form').parsley();
	},
	
	willDestroyElement: function(){
	}
});