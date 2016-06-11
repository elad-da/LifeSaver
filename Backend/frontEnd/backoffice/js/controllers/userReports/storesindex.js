App.StoresIndexController = GRID.TableController.extend({

  hidesearch: true,

	limit: 10,

	endpoint: 'stores',
	collection: 'content',
	itemController: 'App.StoreController',

	url: 'stores',


    toolbar: [
    		Em.View.extend({
    			tagName: 'div',
    			classNames: 'panel-label',
    			template: Ember.Handlebars.compile('סניפים'),
    		}),

    		Em.View.extend({
    			tagName: 'div',
    			classNames: ['pull-left', 'actions'],
    			template: 
    				Ember.Handlebars.compile("{{#linkTo 'stores.create' class='btn btn-default'}}<i class='fa fa-plus'></i>{{/linkTo}}")
    		}),
            
    ],

    columns: [
        GRID.column('rowNum', 			{title: '#',					style: 'min center', isSortable: false, display: 'always'}),
        GRID.column('storeName', 		{title: 'שם הסניף',			    style: ''															}),
        GRID.column('storeNo',			{title: 'מספר',					style: 'min'													}),
        GRID.column('actions',			{title: 'פעולות',				style: 'min center', isSortable: false, templateName: 'stores/grid/actions'})
    ],

    rowClick: function(cnt)
    {
    },

});