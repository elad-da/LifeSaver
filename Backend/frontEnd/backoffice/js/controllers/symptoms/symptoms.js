App.SymptomsController = Em.Object.extend({

	bodyPartName: function()
	{
		var status = App.symptomsBodyParts.findBy('id', this.get('bodyPart'));
	
		if(!status)
			return 'לא מוגדר';

		return status.name;
	}.property('bodyPart')
});