App.InputDateTimeComponent = Em.TextField.extend({
	init: function(){
		this._super();
	},

	attributeBindings: ['value', 'type', 'class', 'required'],

	tagName: 'input',


	picker: "datetime",

	update: function(){
	}.observes('value'),


	_elementValueDidChange: function(){
		this.set('value', this.$().val());
	},

	didInsertElement: function()
	{
		var picker = this.get('picker');
		var pickDate = (picker == 'date' || picker == 'datetime');
		var pickTime = (picker == 'time' || picker == 'datetime');
		
		var format = "DD-MM-YYYY";

		this.$().datetimepicker({

				format: format,
			 	pickDate: pickDate,
			 	pickTime: pickTime,
			 	
				language: "he",
				icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-arrow-up",
                    down: "fa fa-arrow-down"
        },
        direction: 'auto'

		});
	},

	willDestroyElement:function()
	{
		this.$().data("DateTimePicker").destroy();
	}
})