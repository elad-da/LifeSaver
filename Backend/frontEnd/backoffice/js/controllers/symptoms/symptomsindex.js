
App.SymptomsIndexController = GRID.TableController.extend({

  hidesearch: true,

  limit: 10,

  endpoint: 'symptoms',
  collection: 'content',
  itemController: 'App.SymptomsController',

  url: 'symptoms',


    toolbar: [
        Em.View.extend({
          tagName: 'div',
          classNames: 'panel-label',
          template: Ember.Handlebars.compile('סימפטומים'),
        }),

        Em.View.extend({
          tagName: 'div',
          classNames: ['pull-left', 'actions'],
          template: 
            Ember.Handlebars.compile("{{#linkTo 'symptoms.create' class='btn btn-default'}}<i class='fa fa-plus'></i>{{/linkTo}}")
        }),
            
    ],

    columns: [
        //GRID.column('rowNum',           {title: '#',                style: 'min center', isSortable: false, display: 'always'}),
        GRID.column('symptomId',        {title: 'מספר סימפטום',         style: 'min'                         }),
        GRID.column('description',      {title: 'שם סימפטום',          style: 'min'                      }),
        GRID.column('bodyPart',         {title: 'חלק בגוף',            style: 'min'   , formatter:'{{view.content.bodyPartName}}'         }),
        GRID.column('expiry',           {title: 'זמן תפוגה (בדקות)',        style: 'min'                      }),
        GRID.column('epidemicThreshold',           {title: 'סף התפרצות (דיווחים)',         style: 'min'                       }),
        GRID.column('actions',          {title: 'פעולות',       style: 'min center', isSortable: false, templateName: 'symptoms/grid/actions'})
    ],

    rowClick: function(cnt){},

});