App.ApplicationController = Em.Controller.extend({
	permissions: [],

	hasPermissions: function()
	{
		if(this.get('permissions.length'))
			return true;
		else
			return false;
	}.property('permissions')

});