import 'core-js';

var _defaultCfg = {
  selectors: {},
  types: {
    single: 'single',
    multiple: 'multiple',
  },
  classes: {
    filter: {
      filter: 'philturz-filter',
      item: {
        item: 'philturz-filter-item',
        singleType: 'philturz-filter-item-type-single',
        multipleType: 'philturz-filter-item-type-multiple',
        label: 'philturz-filter-item-label',
        control: 'philturz-filter-item-control',
        controlLabel: 'philturz-filter-item-control-label',
        controlInput: 'philturz-filter-item-control-input',
      },
      form: 'philturz-filter-form',
      reset: 'philturz-filter-reset',
      resetButton: 'philturz-filter-reset-button',
    },
    list: {
      list: 'philturz-list',
      item: 'philturz-list-item',
      itemEven: 'philturz-list-item-even',
    }
  },
  attributePrefix: 'data-philturz-',
  parameterPrefix: 'philturz-',
  valueListDelimiter: ';',
  emptyValue: '',
  emptyLabel: '',
  events: {
    change: 'philturzChange',
    reset: 'philturzReset',
  },
  eventsDetail: {
    filterItem: 'philturzFilterItem',
  },
};
var _cfg = {};
var _filters = [];
var _urlParameters = [];


/*
 * UTILS
 */
function splitDelimitedValues(valueList) {
  return valueList
    .split(_cfg.valueListDelimiter)
    .map(x => x.trim());
}

function valuesFromValueList(valueList) {
  return valueList === _cfg.emptyValue ? [] : splitDelimitedValues(valueList);
}

function valuesEqual(a, b) {
  return a === b;
}

function valueInValues(values, value) {
  return (values.indexOf(value) !== -1);
}

function isFilterSimple(filterValue) {
  return typeof filterValue === 'string';
}

function getFilterValueCompareFn(filterValue) {
  return isFilterSimple(filterValue) ? valuesEqual : valueInValues;
}

function getUrlParameters() {
  let { search } = location;

  if (search.length > 0) {
    if (search.charAt(0) === '?') search = search.substring(1);

    return search
      .split('&')
      .map(x => {
        const [ key, value ] = x.split('=');
        return { key, value };
      });
  }

  return [];
}

function rebuildUrlParameters(urlParameters, filters) {
  const filterParameters = filters
    .map(x => {
      const key = _cfg.parameterPrefix.concat(x.key);
      const isSimple = isFilterSimple(x.value);
      const value = encodeURIComponent(isSimple ? x.value : x.value.join(_cfg.valueListDelimiter));

      return { key, value };
    });

  return urlParameters
    .filter(x => !x.key.startsWith(_cfg.parameterPrefix))
    .concat(filterParameters)
}

function updateQueryString(urlParameters) {
  if (!history.replaceState) return;

  const { origin, pathname, hash } = location;

  let search = urlParameters
    .map(x => x.key.concat('=', x.value))
    .join('&');

  if (search.length > 0) search = '?' + search;

  let url = origin + pathname + search + hash;

  history.replaceState(null, null, url);
}

function getPresetValues(urlParameters) {
  return urlParameters
    .filter(x => x.key.startsWith(_cfg.parameterPrefix))
    .reduce((previous, current) => {
      const key = current.key.substring(_cfg.parameterPrefix.length);
      const value = decodeURIComponent(current.value);

      return { ...previous, [key]: value };
    }, {});
}


/*
 * FILTER APPLICATION
 */
function setEvenListItems() {
  var even = false;
  var listItems = Array.from(document.querySelectorAll(_cfg.selectors.listItems + ':not([hidden])'));
  listItems.forEach(function(listItem) {
    if (even) {
      listItem.classList.add(_cfg.classes.list.itemEven);
    } else {
      listItem.classList.remove(_cfg.classes.list.itemEven);
    }
    even = !even;
  })
}

function filterListItemValues(itemValues, filterValue) {
  var compareFn = getFilterValueCompareFn(filterValue);
  return itemValues.some(function(itemValue) {
    return compareFn(filterValue, itemValue);
  });
}

function filterListItem(filters, listItem) {
  var isHidden = false;

  filters.some(function(filter) {
    var attribute = _cfg.attributePrefix + filter.key;
    var listItemValues = valuesFromValueList(listItem.attributes[attribute].value);
    if (listItemValues.length === 0) return false;
    var isMatch = filterListItemValues(listItemValues, filter.value);
    if (isMatch) return false;
    isHidden = true;
    return true;
  });

  if (isHidden) {
    listItem.setAttribute('hidden', '');
  } else {
    listItem.removeAttribute('hidden');
  }
}

function filterListItems(filters) {
  const listItems = Array.from(document.querySelectorAll(_cfg.selectors.listItems));
  const filterListItemFn = filterListItem.bind(null, filters);

  listItems.forEach(filterListItemFn);
  setEvenListItems();
}


/*
 * FILTER SELECTIONS
 */
function createFilter(key, value) {
  return { key, value };
}

function addFilter(filters, key, value) {
  const newFilter = createFilter(key, value);
  const index = filters.findIndex(f => f.key === key);

  if (index < 0) return filters.concat(newFilter);

  return [ ...filters.slice(0, index), newFilter, ...filters.slice(index + 1) ];
}

function removeFilter(filters, key) {
  return filters.filter(f => f.key !== key);
}

function addFilterMultiple(filters, key, value) {
  const index = filters.findIndex(f => f.key === key);

  if (index < 0) return filters.concat(createFilter(key, [value]));

  const existingFilter = filters[index];
  const newFilter = {
    ...existingFilter,
    value: existingFilter.value.concat(value)
  };

  return [ ...filters.slice(0, index), newFilter, ...filters.slice(index + 1) ];
}

function removeFilterMultiple(filters, key, value) {
  const index = filters.findIndex(f => f.key === key);

  if (index < 0) return filters;

  const existingFilter = filters[index];
  const newFilter = {
    ...existingFilter,
    value: existingFilter.value.filter(v => v !== value)
  };

  if (newFilter.value.length === 0) return [ ...filters.slice(0, index), ...filters.slice(index + 1) ];

  return [ ...filters.slice(0, index), newFilter, ...filters.slice(index + 1) ];
}


/*
 * CUSTOM EVENTS
 */
function raiseCustomEvent(element, type, detail = null) {
  // NOTE:
  // Implemented in this fashion to support IE 9+.
  // https://stackoverflow.com/questions/19345392/why-arent-my-parameters-getting-passed-through-to-a-dispatched-event/19345563#19345563

  var changeEvent = document.createEvent('CustomEvent');

  changeEvent.initCustomEvent(type, true, false, detail);

  element.dispatchEvent(changeEvent);
}


/*
 * EVENT LISTENERS
 */
function getOnFilterItemChange(key) {
  return function(e) {
    const { value } = e.target;
    const empty = (value === _cfg.emptyValue);
    
    _filters = empty ? removeFilter(_filters, key) : addFilter(_filters, key, value);
    _urlParameters = rebuildUrlParameters(_urlParameters, _filters);
    updateQueryString(_urlParameters);

    filterListItems(_filters);

    const eventDetail = {
      [_cfg.eventsDetail.filterItem]: e.target.parentElement.parentElement,
    };

    raiseCustomEvent(e.target, _cfg.events.change, eventDetail);
  };
}

function getOnFilterItemMultipleChange(key) {
  return function(e) {
    const { checked, value } = e.target;

    _filters = checked ? addFilterMultiple(_filters, key, value) : removeFilterMultiple(_filters, key, value);
    _urlParameters = rebuildUrlParameters(_urlParameters, _filters);
    updateQueryString(_urlParameters);

    filterListItems(_filters);

    const eventDetail = {
      [_cfg.eventsDetail.filterItem]: e.target.parentElement.parentElement.parentElement,
    };
    
    raiseCustomEvent(e.target, _cfg.events.change, eventDetail);
  };
}

function onResetClick(e) {
  _filters = [];
  _urlParameters = rebuildUrlParameters(_urlParameters, _filters);
  updateQueryString(_urlParameters);

  filterListItems(_filters);
  raiseCustomEvent(e.target, _cfg.events.reset);
}

function onFormSubmit(e) {
  e.preventDefault();
}


/*
 * INIT
 */
export function init(filterId, filterItemClass, listId, listItemClass, filterResetId, filterResetLabel = 'Reset filters', cfg = {}) {
  _cfg = {
    ..._defaultCfg,
    ...cfg
  };

  _cfg.selectors.filterId = `#${filterId}`;
  _cfg.selectors.filterItem = `.${filterItemClass}`;
  _cfg.selectors.filterItems = `${_cfg.selectors.filterId} ${_cfg.selectors.filterItem}`;
  _cfg.selectors.listId = `#${listId}`;
  _cfg.selectors.listItem = `.${listItemClass}`;
  _cfg.selectors.listItems = `${_cfg.selectors.listId} ${_cfg.selectors.listItem}`;
  _urlParameters = getUrlParameters();

  var list = document.getElementById(listId);
  var listItems = Array.from(document.querySelectorAll(_cfg.selectors.listItems));
  var filter = document.getElementById(filterId);
  var filterItems = Array.from(document.querySelectorAll(_cfg.selectors.filterItems));
  var filterReset = document.getElementById(filterResetId);
  var presetValues = getPresetValues(_urlParameters);

  list.classList.add(_cfg.classes.list.list);
  filter.classList.add(_cfg.classes.filter.filter);

  listItems.forEach(function(listItem) {
    listItem.classList.add(_cfg.classes.list.item);
  });

  filterItems.forEach(function(filterItem) {
    var attributes = {
      key: filterItem.dataset.philturzKey,
      type: filterItem.dataset.philturzType,
      label: filterItem.dataset.philturzLabel,
      emptyLabel: filterItem.dataset.philturzEmptyLabel || _cfg.emptyLabel,
      values: splitDelimitedValues(filterItem.dataset.philturzValues),
      default: splitDelimitedValues(filterItem.dataset.philturzDefault || ''),
    };
    var presetValue = presetValues[attributes.key];

    var label = document.createElement('label');
    var labelText = document.createTextNode(attributes.label);
    
    label.classList.add(_cfg.classes.filter.item.label);
    filterItem.classList.add(_cfg.classes.filter.item.item);
    label.appendChild(labelText);
    filterItem.appendChild(label);

    switch(attributes.type) {
      case _cfg.types.single:
        var control = document.createElement('div');
        var select = document.createElement('select');
        var emptyOption = document.createElement('option');

        filterItem.classList.add(_cfg.classes.filter.item.singleType);
        control.classList.add(_cfg.classes.filter.item.control);
        select.classList.add(_cfg.classes.filter.item.controlInput);
        select.autocomplete = 'off';

        emptyOption.value = _cfg.emptyValue;
        emptyOption.text = attributes.emptyLabel;
        select.appendChild(emptyOption);

        attributes.values.forEach(function(value) {
          var option = document.createElement('option');
          option.value = value;
          option.text = value;
          select.appendChild(option);
        });

        var selectedValue = presetValue || (attributes.default.length > 0 && attributes.default[0]);

        if (selectedValue) {
          select.value = selectedValue;
          _filters = addFilter(_filters, attributes.key, selectedValue);
        }

        control.appendChild(select);
        filterItem.appendChild(control);

        select.addEventListener('change', getOnFilterItemChange(attributes.key));
        break;
      case _cfg.types.multiple:
        var presetValueList = presetValue ? splitDelimitedValues(presetValue) : [];

        attributes.values.forEach(function(value) {
          var control = document.createElement('div');
          var checkboxLabel = document.createElement('label');
          var checkboxLabelText = document.createTextNode(value);
          var checkbox = document.createElement('input');
          var checked = presetValueList.length > 0
            ? presetValueList.includes(value)
            : attributes.default.includes(value);

          filterItem.classList.add(_cfg.classes.filter.item.multipleType);
          control.classList.add(_cfg.classes.filter.item.control);
          checkboxLabel.classList.add(_cfg.classes.filter.item.controlLabel);
          checkbox.classList.add(_cfg.classes.filter.item.controlInput);

          checkbox.type = 'checkbox';
          checkbox.autocomplete = 'off';
          checkbox.value = value;
          checkbox.checked = checked;

          if (checked) {
            _filters = addFilterMultiple(_filters, attributes.key, value);
          }

          checkboxLabel.appendChild(checkbox);
          checkboxLabel.appendChild(checkboxLabelText);
          control.appendChild(checkboxLabel);
          filterItem.appendChild(control);

          checkbox.addEventListener('change', getOnFilterItemMultipleChange(attributes.key));
        });
        break;
    }
  });
  
  var resetButton = document.createElement('input');

  if (filterReset) {
    resetButton.type = 'reset';
    resetButton.value = filterResetLabel;
    resetButton.classList.add(_cfg.classes.filter.resetButton);

    filterReset.classList.add(_cfg.classes.filter.reset);
    filterReset.appendChild(resetButton);
  }

  var form = document.createElement('form');
  var filterChildren = Array.from(filter.childNodes);

  form.classList.add(_cfg.classes.filter.form);
  filterChildren.forEach(function(filterChild) {
    form.appendChild(filterChild);
  });
  form.addEventListener('submit', onFormSubmit);
  form.addEventListener('reset', onResetClick);

  filter.appendChild(form);

  setEvenListItems();
  filterListItems(_filters);
}