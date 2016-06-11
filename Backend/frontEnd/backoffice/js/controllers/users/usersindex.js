
App.UsersIndexController = GRID.TableController.extend({

  hidesearch: true,

  limit: 10,

  endpoint: 'users',
  collection: 'content',
  itemController: 'App.UsersController',

  url: 'users',


    toolbar: [
        Em.View.extend({
          tagName: 'div',
          classNames: 'panel-label',
          template: Ember.Handlebars.compile('מנהלים'),
        }),

        Em.View.extend({
          tagName: 'div',
          classNames: ['pull-left', 'actions'],
          template: 
            Ember.Handlebars.compile("{{#linkTo 'users.create' class='btn btn-default'}}<i class='fa fa-plus'></i>{{/linkTo}}")
        }),
            
    ],

    columns: [
        //GRID.column('rowNum',           {title: '#',                style: 'min center', isSortable: false, display: 'always'}),
        GRID.column('userName',        {title: 'שם משתמש',         style: 'min'                         }),
        GRID.column('email',      		{title: 'דואר אלקטרוני',          style: 'min'                      }),
        GRID.column('actions',          {title: 'פעולות',       style: 'min center', isSortable: false, templateName: 'users/grid/actions'})
    ],

    rowClick: function(cnt){},

});