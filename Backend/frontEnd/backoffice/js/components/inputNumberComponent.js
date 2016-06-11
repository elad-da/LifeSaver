App.InputNumberComponent = Em.TextField.extend({
	init: function(){
		this._super();
		//console.log('input date init');
	},

	attributeBindings: ['value', 'type', 'class', 'required', 'parsley-type', 'parsley-min', 'parsley-max'],
	//attributeBinding: ['value'],

	tagName: 'input',
	//classNames: ['form-control'],
	//type: 'text',

	// update: function(){
	// 	//console.log('value', this.get('value'));
	// }.observes('value'),


	// _elementValueDidChange: function(){
	// 	//e.target.value;
	// 	//this.set('value', e.target.value);
	// 	//console.log(this.get('value'), this.$().val());
	// 	this.set('value', this.$().val());
	// },

	// didInsertElement: function()
	// {
	// 	this.$().datepicker({
	// 		 	format: 'yyyy/mm/dd',
	// 		 	todayBtn: true,
	// 			language: "he",
	// 			todayHighlight: true
	// 	});
	// 	//var value = this.get('value');
	// 	//console.log('value', value);
	// }
})