/* global $, window */
import {View} from 'backbone';

import 'bootstrap';
import jsyaml from 'js-yaml';

import DialogView from './dialogView';
import ErrorView from './errorView';

import dataPopupTemplate from './../../templates/dataPopup.html';
import tableTemplate from './../../templates/table.html';

export default class TableView extends View {
  get tagName() {
    return 'div';
  }
  get className() {
    return 'tableview';
  }
  get events() {
    return {
      'click .gohan_create': 'createModel',
      'click .gohan_delete': 'deleteModel',
      'click .gohan_update': 'updateModel',
      'click a.title': 'sortData',
      'keyup input.search': 'searchByKey',
      'change select.search': 'searchByField',
      'click nav li:not(.disabled) a': 'paginationHandler'
    };
  }
  constructor(options) {
    super(options);

    this.errorView = new ErrorView();
    this.template = options.template || tableTemplate;
    this.dialogTemplate = options.dialogTemplate;
    this.app = options.app;
    this.schema = options.schema;
    this.fragment = options.fragment;
    this.childview = options.childview;
    this.polling = options.polling;
    this.activePage = 1;
    this.paginationSettings = {
      start: 1,
      limit: 7
    };
    this.activeSortFilter = {
      by: '',
      reverse: false
    };
    this.searchQuery = {
      sortKey: '',
      propField: ''
    };

    this.searchDelay = 500;
    this.searchTimeout = undefined;

    if (this.childview) {
      this.parentProperty = this.schema.get('parent') + '_id';
    }

    if (this.collection !== undefined) {
      this.collection.getPage().then(() => {
        this.searchQuery.propField = $('select.search', this.$el).val();
        if ( this.polling ) {
          this.collection.startLongPolling();
        }
      }, (...params) => {
        this.errorView.render(params[0]);
      });
    }

    this.listenTo(this.collection, 'update', this.render);
  }
  searchByKey(event) {
    event.stopPropagation();

    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {

      this.fetchData();

    }, this.searchDelay);
  }
  searchByField(event) {
    event.stopPropagation();

    this.fetchData();
  }
  fetchData() {
    const property = $('select.search', this.$el).val();
    const value = $('input.search', this.$el).val();

    this.searchQuery = {
      sortKey: value,
      propField: property
    };

    if (value === '') {
      this.fetchByQuery();
    } else {
      this.fetchByQuery(property, value);
    }
  }
  getPage(pageNo) {
    this.collection.getPage(pageNo - 1).then(() => {
      $('select.search', this.$el).val(this.searchQuery.propField);
    }, (...params) => {
      this.errorView.render(params[0]);
    });
  }
  fetchByQuery(property = 'name', value) {
    this.activePage = 1;

    this.collection.resetFilters();
    this.collection.filter(property, value).then(() => {
      $('select.search', this.$el).val(this.searchQuery.propField);
      $('input.search', this.$el).focus().val(this.searchQuery.sortKey);

    }, (...params) => {
      this.errorView.render(params[0]);
    });
  }

  sortData(event) {
    event.stopPropagation();

    const id = event.currentTarget.dataset.id;

    if (this.activeSortFilter.by !== id) {
      this.activeSortFilter.by = id;
      this.activeSortFilter.reverse = false;
    } else if (this.activeSortFilter.by === id && !this.activeSortFilter.reverse) {
      this.activeSortFilter.reverse = true;
    } else {
      this.activeSortFilter.by = '';
      this.activeSortFilter.reverse = false;
    }

    const key = this.activeSortFilter.by;
    const order = this.activeSortFilter.reverse ? 'desc' : 'asc';

    this.collection.sort(key, order).then(() => {

    }, (...params) => {
      this.errorView.render(params[0]);
    });
  }
  paginationHandler(event) {
    event.stopPropagation();
    let newActivePage = event.currentTarget.dataset.id;
    let showMorePages = event.currentTarget.dataset.more;

    if (newActivePage === 'next') {
      newActivePage = Number(this.activePage) + 1;
    } else if (newActivePage === 'prev') {
      newActivePage = Number(this.activePage) - 1;
    }

    if (this.activePage === Number(newActivePage)) {
      return;
    }

    if (newActivePage === this.paginationSettings.start - 1) {
      showMorePages = 'left';
    } else if (newActivePage === this.paginationSettings.start + this.paginationSettings.limit - 1) {
      showMorePages = 'right';
    }

    if (showMorePages === 'right') {
      this.paginationSettings.start = Number(newActivePage);
    } else if (showMorePages === 'left') {
      this.paginationSettings.start = this.paginationSettings.start - this.paginationSettings.limit + 1;
      if (this.paginationSettings.start < 1)
        this.paginationSettings.start = 1;
    }

    this.activePage = Number(newActivePage);

    this.getPage(Number(newActivePage));
  }
  dialogForm(action, formTitle, data, onsubmit) {
    this.schema.filterByAction(action, this.parentProperty).then(schema => {
      this.dialog = new DialogView({
        template: this.dialogTemplate,
        formTitle,
        data,
        onsubmit,
        schema: this.schema.toFormJSON(schema),
        unformattedSchema: this.schema,
        fields: schema.propertiesOrder
      });
      this.dialog.render();
    });
  }
  toLocal(data) {
    return this.schema.toLocal(data);
  }
  toServer(data) {
    return this.schema.toServer(data);
  }
  createModel(event) {
    event.stopPropagation();

    const data = this.toLocal({});
    const formTitle = '<h4>Create ' + this.schema.get('title') + '</h4>';
    const action = 'create';
    const onsubmit = values => {
      values = this.toServer(values);
      values.isNew = true;
      this.collection.create(values).then(() => {
        this.dialog.close();
        this.fetchData();
      }, error => {
        this.errorView.render(...error);
        this.dialog.stopSpin();
      });
    };

    this.dialogForm(action, formTitle, data, onsubmit);
  }
  updateModel(event) {
    event.stopPropagation();

    const $target = $(event.target);
    const id = $target.data('id');
    const model = this.collection.get(String(id));
    const data = this.toLocal(model.toJSON());
    const action = 'update';
    const formTitle = '<h4>Update ' + this.schema.get('title') + '</h4>';
    const onsubmit = values => {
      values = this.toServer(values);

      model.save(values).then(() => {
        this.collection.trigger('update');
        this.dialog.close();
      }, error => {
        this.errorView.render(...error);
        this.dialog.stopSpin();
      });
    };

    this.dialogForm(action, formTitle, data, onsubmit);
  }
  deleteModel(event) {
    event.stopPropagation();

    if (!window.confirm('Are you sure to delete?')) { // eslint-disable-line no-alert
      return;
    }
    const $target = $(event.target);
    const id = $target.data('id');
    const model = this.collection.get(String(id));

    model.destroy().then(() => {
      this.collection.fetch().catch(error => this.errorView.render(...error));
    }, error => this.errorView.render(...error));
  }
  renderProperty(data, key) {
    let content;
    const property = this.schema.get('schema').properties[key];
    const value = data[key];

    if (property === undefined) {
      return value;
    }

    if (value === undefined) {
      return '';
    }

    const relatedObject = data[property.relation_property]; // jscs:ignore requireCamelCaseOrUpperCaseIdentifiers

    if (relatedObject !== undefined) {
      if (relatedObject.name !== undefined) {
        return relatedObject.name;
      }
    }
    try {
      if (property.type === 'object' || property.originalType === 'object') {
        content = $('<pre style="width:500px;"></pre>').text(
          '<pre>' + jsyaml.safeDump(value) + '</pre>').html();
        content = content.replace('\'', '&#34;');
        return dataPopupTemplate({
          content
        });
      }
    } catch (error) {
      console.error(error);
    }

    try {
      if (property.type === 'array') {
        return '<pre>' + jsyaml.safeDump(value) + '</pre>';
      }
    } catch (error) {
      console.error(error);
    }

    return value;
  }

  render() {
    let list = this.collection.map(model => {
      const data = model.toJSON();
      const result = Object.assign({}, data);

      for (let key in data) {
        result[key] = this.renderProperty(data, key);
      }
      return result;
    });

    if (this.app && !this.childview) {
      this.app.breadCrumb.update([this.collection]);
    }

    this.$el.html(this.template({
      data: list,
      activePage: this.activePage,
      pageCount: this.collection.getPageCount(),
      schema: this.schema.toJSON(),
      searchQuery: this.searchQuery,
      sort: this.activeSortFilter,
      parentProperty: this.parentProperty,
      pagination: this.paginationSettings,
      fragment: this.fragment
    }));
    this.$('button[data-toggle=hover]').popover();
    return this;
  }
  close() {
    if (this.polling) {
      this.collection.stopLongPolling();
    }
    if (this.collection) {
      this.collection.resetFilters();
    }
    this.remove();
  }
}
