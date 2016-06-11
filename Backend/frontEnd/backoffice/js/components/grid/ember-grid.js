
window.GRID = Ember.Namespace.create();

GRID.PaginatedMixin = Ember.Mixin.create({

    page: 1,
    limit: 5,
    query: '',
    sortOrder: null,
    sortField: null,

    meta: {
        pages: 0,
        count: 0,
        page: 0
    },

    offset: Ember.computed(function () {
        return this.get('page') * this.get('limit');
    }).property('page', 'limit'),


    refresh: function()
    {
        this.update();
    },

    sortUpdate: function()
    {
        this.set('page', 1);
        this.update();
    }.observes('sortOrder', 'sortField'),

    searchUpdate: function()
    {
        if(this.get('page') != 1)
            this.set('page', 1);
        else
            this.update(); 
    }.observes('query', 'search.params'),

    update: function(page, limit, query)
    {
        //var self = this;
        var endpoint = this.get('endpoint');
        var query = this.get('query');

        var self = this;
        var page = this.get('page');
        var limit = this.get('limit');
        var sortOrder = this.get('sortOrder');
        var sortField = this.get('sortField');
        var collection = this.get('collection');
        var controller = Em.get(this.get('itemController'));
        
        //console.log(this.get('search.params'));
        var addParmas = this.get('search.params') || ('query='+this.get('query'));

        var addSort = [];
        if(sortOrder)
        {
            addSort.push('sortOrder='+sortOrder);
        }
        if(sortField)
        {
            addSort.push('sortField='+sortField);
        }

        if(addSort.length)
        {
           addSort =  '&' +  addSort.join('&') + '&';
        }else{
            addSort = '&';
        }


        var fullUrl = App.get('apiurl') + endpoint + '?page=' + page + '&items=' + limit + addSort +  addParmas;

        var lastXhr = self.get('lastXhr');
        if(lastXhr && lastXhr.readyState != 4)
        {
            lastXhr.abort();
        }

        var xhr = $.ajax({
            type: 'GET',
            url: fullUrl,
            dataType: 'json'
        });

        xhr.then(function(data){
            
            var items = [];
            for(var i = 0; i < data[collection].length; i++)
            {
                items.push(controller.create(data[collection][i]));
            }

            self.set('rows', items);

            if(page > data.meta.pages)
                self.set('page', 1);
            //data.meta.count = data.meta.items;
            self.set('meta', data.meta);

        });

        xhr.fail(function(data){
            self.get('target').send('error', data);
        });

        self.set('lastXhr', xhr);

    }.observes('page', 'limit'),

    pages: function()
    {
        return Math.ceil(this.get('meta.count') / this.get('limit'));
    }.property('meta'),

    firstPage: function () {
        this.set('page', 1);
    },

    previousPage: function () {
        this.set('page', Math.max( this.get('page') - 1, 0 ));
    },

    nextPage: function () {
        this.set('page', Math.min( this.get('page') + 1, this.get('pages')));
    },

    lastPage: function () {
        this.set('page', this.get('pages'));
    }

});

GRID.TableController = Ember.ArrayController.extend(Ember.ControllerMixin, GRID.PaginatedMixin, {

    columns: [],


    queryProperties: function () {
        if (!this.get('visibleColumns')) return [];
        return this.get('visibleColumns').mapProperty('property');
    }.property('visibleColumns'),

    visibleColumns: function () {
        return this.get('columns').filterProperty('visible', true);
    }.property('columns.@each.visible'),

    toolbar: [],

});

// COLUMN DEFINITION

GRID.Column = Ember.Object.extend({
    property: null,
    style: '',

    header: function () {
        if(!this.get('title')) return '';
        return this.get('title');
    }.property('property'),

    display: true,
    
    visible: function () {
        return this.get('display') != false;
    }.property('display'),

    always: function () {
        return this.get('display') === 'always';
    }.property('display'),

    formatter: '{{view.content.%@}}',

    viewClass: function () {
        var formatter = this.get('formatter');
        if(this.get('templateName'))
        {
            return GRID.CellView.extend({
                templateName: this.get('templateName')
            });
        }
        else if (GRID.CellView.detect(formatter)) 
        {
            return formatter;
        } 
        else
        {
            Ember.assert('Formatter has to be extended CellView or Handlebar template', Ember.typeOf(formatter) === 'string');
            var property = this.get('property');
            if (!property) {
                property = 'constructor';
            }
            var template = this.get('formatter').fmt(property);
            return GRID.CellView.extend({
                template: Ember.Handlebars.compile(template)
            });
        }
    }.property()
});

GRID.column = function (property, options) {
    if (Ember.typeOf(property) === 'object') {
        options = property;
        property = null;
    }
    var column = GRID.Column.create({
        property: property
    });
    if (options) {
        for (var key in options) {
            column.set(key, options[key])
        }
    }
    return column;
};

// VIEWS

GRID.TableView = Ember.View.extend({
    classNames: ['ember-grid', 'panel', 'panel-default', 'grid'],
    defaultTemplate: Ember.Handlebars.compile('{{view GRID.ToolbarView}}{{view GRID.InnerTableView}}{{view GRID.FooterView}}')
});

GRID.ToolbarView = Ember.ContainerView.extend({
    classNames: ['table-toolbar', 'panel-heading'],
    classNameBindings: ['childViews.length::hide'],
    childViewsBinding: 'controller.toolbar'
});

GRID.InnerTableView = Ember.View.extend({
    tagName: 'table',
    classNames: ['table', 'table-striped', 'table-bordered'],
    attributeBindings: ['style'],
    style: 'margin: 0;',
    defaultTemplate: Ember.Handlebars.compile('<thead>{{view GRID.HeaderView}}</thead>{{view GRID.BodyView}}')
});

GRID.HeaderView = Ember.CollectionView.extend({
    tagName: 'tr',
    contentBinding: 'controller.visibleColumns',
    classNames: ['table-header'],
    itemViewClass: Ember.View.extend({
        tagName: 'th',
        template: Ember.Handlebars.compile('{{view.content.header}}<span></span>'),
        classNames: ['table-header-cell'],

        classNameBindings: ['sort','style'],

        style: function(){
            return this.get('content.style');
        }.property(),

        sort: function () 
        {
            if(this.get('controller.sortField') == this.get('content.property'))
            {
                return this.get('controller.sortOrder') == 'asc' ? 'sort-asc' : 'sort-desc';
            }
        }.property('controller.sortField', 'controller.sortOrder'),

        click: function () {
            if(this.get('content.isSortable') === false)
                return false;
            //console.log(this.get('content'),this.get('content.isSortable'));
            //console.log('sortBy', this.get('content.property'), this.get('sort'));
            //this.get('controller').sortBy(this.get('content.property'));
            var newOrder = this.get('controller.sortOrder') == 'desc' ? 'asc' : 'desc';
            //this.get('controller').set('sortOrder', newOrder);
            //this.get('controller').set('sortField', this.get('content.property'));
            this.get('controller').setProperties({
                'sortOrder': newOrder,
                'sortField': this.get('content.property')
            });
            //console.log(this.get('sort'));
        }
    })
});

GRID.BodyView = Ember.CollectionView.extend({
    tagName: 'tbody',
    contentBinding: 'controller.rows',
    classNames: ['table-body'],
    itemViewClass: 'GRID.RowView',
    emptyView: Ember.View.extend({
        tagName: 'tr',
        template: Ember.Handlebars.compile('<td {{bindAttr colspan="controller.columns.length"}} class="muted">אין נתונים להצגה.</td>')
    })
});

GRID.RowView = Ember.ContainerView.extend({
    tagName: 'tr',
    classNames: ['table-row'],
    rowBinding: 'content',
    columnsBinding: 'controller.visibleColumns',

    columnsDidChange: function () {
        //var row = this.get('row');
        //console.log(row);
        if (this.get('columns')) {
            this.clear();
            this.get('columns').forEach(function (column) {
                //console.log(this.get('row'));
                var cell = column.get('viewClass').create({
                    column: column,
                    content: this.get('row')
                });
                this.pushObject(cell);
            }, this);
        }
    }.observes('columns.@each'),

    init: function () {
        this._super();
        this.columnsDidChange();
    },

    click: function()
    {
        //console.log('row clicked', this.get('controller'), this.get('content'));

        var ctrl = this.get('controller');
        var content = this.get('content');
        if(ctrl.rowClick)
            return ctrl.rowClick(content)
        else
            return false;
        
    }
 
});

GRID.CellView = Ember.View.extend({
    tagName: 'td',
    classNameBindings: ['style'],

    style: function()
    {
        var column = this.get('column');
        return column.get('style');
    }.property()
});

// PAGINATION

GRID.FooterView = Ember.View.extend({
    classNames: ['table-footer', 'panel-footer'],
    defaultTemplate: Ember.Handlebars.compile('{{view GRID.PageView}}{{view GRID.PaginationView}}')
})

GRID.PageListView = Ember.ContainerView.extend({
    
    classNames: ['pagination', 'pagination-sm', 'pagination-right', 'table-pagination'],

    tagName: 'ul',

    firstPageView: Ember.View.extend({
        tagName: 'li',
        classNameBindings: ['parentView.hasFirstPage::disabled'],
        template: Ember.Handlebars.compile('<a href="javascript:void(0);" {{action firstPage target="view.parentView"}}>&laquo;</a>')
    }),

    prevPageView: Ember.View.extend({
        tagName: 'li',
        classNameBindings: ['parentView.hasPrevPage::disabled'],
        template: Ember.Handlebars.compile('<a href="javascript:void(0);" {{action prevPage target="view.parentView"}}>&lsaquo;</a>')
    }),

    pageView: Ember.View.extend({
        tagName: 'li',
        classNameBindings: ['content.isActive:active'],
        template: Ember.Handlebars.compile('<a href="javascript:void(0);" {{action setPage view.content target="view.parentView"}}>{{view.content.page}}</a>')
    }),

    nextPageView: Ember.View.extend({
        tagName: 'li',
        classNameBindings: ['parentView.hasNextPage::disabled'],
        template: Ember.Handlebars.compile('<a href="javascript:void(0);" {{action nextPage target="view.parentView"}}>&rsaquo;</a>')
    }),

    lastPageView: Ember.View.extend({
        tagName: 'li',
        classNameBindings: ['parentView.hasLastPage::disabled'],
        template: Ember.Handlebars.compile('<a href="javascript:void(0);" {{action lastPage target="view.parentView"}}>&raquo;</a>')
    }),

    init: function () {
        this._super();
        this.refreshPageListItems();
    },

    refreshPageListItems: function () {
        var pages = this.get('pages');
        if (!pages.get('length'))
            return;

        this.clear();
        this.pushObject(this.get('firstPageView').create());
        this.pushObject(this.get('prevPageView').create());
        var self = this;
        this.get('pages').forEach(function (page) {
            var pageView = self.get('pageView').create({
                content: page
            });
            self.pushObject(pageView);
        });
        this.pushObject(this.get('nextPageView').create());
        this.pushObject(this.get('lastPageView').create());
    }.observes('pages'),

    pages: [],

    visiblePages: 2,

    createPages: function () {
        if (!this.get('controller')) return [];

        var page = this.get('controller.page');
        var pages = this.get('controller.meta.pages');

        var pagesFrom = Math.max(1, page - this.visiblePages);
        var pagesTo = Math.min(pages, page + this.visiblePages);
        var limit = this.get('controller.limit');
        
        var pages = [];
        for (var i = pagesFrom; i <= pagesTo; i++) {
            pages.push({
                index: i,
                page: i,
                isActive: (i == page)
            });
        }
        this.set('pages', pages);
    },

    didControllerContentChanged: function () {

        this.createPages();
        var pages = this.get('controller.meta.pages');
        var page = this.get('controller.page');
        this.set('pagesCount', pages);
        this.set('hasNextPage', page < pages);
        this.set('hasPrevPage', page > 1);
        this.set('hasFirstPage', page > 1);
        this.set('hasLastPage', page < pages);
    }.observes('controller', 'controller.meta.pages', 'controller.page'),

    actions: {
        setPage: function (context) {
            this.get('controller').set('page', context.index);
        },

        firstPage: function () {
            if (!this.get('hasFirstPage'))
                return;

            this.get('controller').firstPage();
        },

        lastPage: function () {
            if (!this.get('hasLastPage'))
                return;

            this.get('controller').lastPage();
        },

        prevPage: function () {
            if (!this.get('hasPrevPage'))
                return;

            this.get('controller').previousPage();
        },

        nextPage: function () {
            if (!this.get('hasNextPage'))
                return;

            this.get('controller').nextPage();
        }
    }
});

GRID.PaginationView = Ember.ContainerView.extend({
    tagName: 'div',
    
    childViews: ['pageList'],
    pageList: function () {
        return GRID.PageListView.create();
    }.property()
});

GRID.PageView = Ember.View.extend({
    classNames: ['pull-left', 'table-page', 'totals'],
    defaultTemplate: Ember.Handlebars.compile('עמוד {{controller.meta.page}} מ {{controller.meta.pages}} - סה״כ {{controller.meta.count}} פריטים'),
});

// COMPONENTS

GRID.ColumnSelector = Ember.View.extend({
    classNames: ['btn-group'],
    defaultTemplate: Ember.Handlebars.compile(
        '<button class="btn dropdown-toggle" data-toggle="dropdown"><i class="icon-th-list"></i> <span class="caret"></span></button>' +
        '<ul class="dropdown-menu dropdown-column-selector">' +
            '{{#each columns}}' +
                '<li><label class="checkbox">{{view Ember.Checkbox checkedBinding="display" disabledBinding="always"}} {{header}}</label></li>' +
            '{{/each}}' +
        '</ul>')
});

GRID.Filter = Ember.View.extend({
    tagName: 'div',
    classNames: ['search'],
    defaultTemplate: Ember.Handlebars.compile('{{#unless hidesearch}}{{view Ember.TextField class="search-query input-medium search" placeholder="חיפוש..." valueBinding="query"}}{{/unless}}')
});
