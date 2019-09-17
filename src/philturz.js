var _cfg = {
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
  valueListDelimiter: '; ',
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
var _filters = [];
var _elements = {};


/*
 * UTILS
 */
function valuesFromValueList(valueList) {
  return valueList === _cfg.emptyValue ? [] : valueList.split(_cfg.valueListDelimiter);
}

function valuesEqual(a, b) {
  return a === b;
}

function valueInValues(values, value) {
  return (values.indexOf(value) !== -1);
}

function isSimpleFilterValue(filterValue) {
  return typeof filterValue === 'string';
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
  var compareFn = isSimpleFilterValue() ? valuesEqual : valueInValues;
  return itemValues.some(function(itemValue) {
    return compareFn(filterValue, itemValue);
  });
}

function filterListItem(listItem) {
  var isHidden = false;

  _filters.some(function(filter) {
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

function filterListItems() {
  var listItems = Array.from(document.querySelectorAll(_cfg.selectors.listItems));
  listItems.forEach(filterListItem);
  setEvenListItems();
}


/*
 * FILTER SELECTIONS
 */
function createFilter(key, value) {
  return { key: key, value: value };
}

function addFilter(key, value) {
  var filter = createFilter(key, value);
  return _filters.concat(filter);
}

function updateFilter(key, value) {
  return _filters.map(function(filter) {
    var newValue = (filter.key === key) ? value : filter.value;
    return createFilter(filter.key, newValue);
  });
}

function removeFilter(key) {
  return _filters.filter(function(filter) {
    return filter.key !== key;
  });
}

function addFilterMultiple(key, value) {
  var isExisting = false;
  var newFilters = _filters.map(function(filter) {
    var newValue = filter.value;
    if (filter.key === key) {
      isExisting = true;
      var hasValue = filter.value.indexOf(value) !== -1;
      if (!hasValue) newValue = newValue.concat(value);
    }
    return createFilter(filter.key, newValue);
  });
  _filters = isExisting ? newFilters : newFilters.concat(createFilter(key, [value]));
}

function removeFilterMultiple(key, value) {
  _filters = _filters
    .map(function(filter) {
      var newValue = filter.value;
      if (filter.key === key) {
        newValue = newValue.filter(function(v) {
          return v !== value;
        });
      }
      return createFilter(filter.key, newValue);
    })
    .filter(function(filter) {
      return filter.key !== key || filter.value.length > 0;
    });
}


/*
 * CUSTOM EVENTS
 */
function raiseCustomEvent(element, type, detail = null) {
  var changeEvent = new CustomEvent(type, {
    bubbles: true,
    detail
  });

  element.dispatchEvent(changeEvent);
}


/*
 * EVENT LISTENERS
 */
function getOnFilterItemChange(key) {
  return function(e) {
    var value = e.target.value;
    
    if (value === _cfg.emptyValue) {
      _filters = removeFilter(key);
    } else {
      var isIncluded = _filters.some(function(filter) {
        return filter.key === key;
      });
      _filters = isIncluded ? updateFilter(key, value) : addFilter(key, value);
    }

    filterListItems();

    var eventDetail = {
      [_cfg.eventsDetail.filterItem]: e.target.parentElement.parentElement,
    };

    raiseCustomEvent(e.target, _cfg.events.change, eventDetail);
  };
}

function getOnFilterItemMultipleChange(key) {
  return function(e) {
    var addRemoveFn = e.target.checked ? addFilterMultiple : removeFilterMultiple;
    
    addRemoveFn(key, e.target.value);
    filterListItems();

    var eventDetail = {
      [_cfg.eventsDetail.filterItem]: e.target.parentElement.parentElement.parentElement,
    };
    
    raiseCustomEvent(e.target, _cfg.events.change, eventDetail);
  };
}

function onResetClick(e) {
  _filters = [];
  filterListItems();
  raiseCustomEvent(e.target, _cfg.events.reset);
}

function onFormSubmit(e) {
  e.preventDefault();
}


/*
 * INIT
 */
export function init(filterId, filterItemClass, listId, listItemClass, filterResetId, filterResetLabel = 'Reset filters') {
  _cfg.selectors.filterId = `#${filterId}`;
  _cfg.selectors.filterItem = `.${filterItemClass}`;
  _cfg.selectors.filterItems = `${_cfg.selectors.filterId} ${_cfg.selectors.filterItem}`;
  _cfg.selectors.listId = `#${listId}`;
  _cfg.selectors.listItem = `.${listItemClass}`;
  _cfg.selectors.listItems = `${_cfg.selectors.listId} ${_cfg.selectors.listItem}`;

  var list = document.getElementById(listId);
  var listItems = Array.from(document.querySelectorAll(_cfg.selectors.listItems));
  var filter = document.getElementById(filterId);
  var filterItems = Array.from(document.querySelectorAll(_cfg.selectors.filterItems));
  var filterReset = document.getElementById(filterResetId);

  _elements[_cfg.selectors.filterId] = filter;

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
      values: filterItem.dataset.philturzValues.split(_cfg.valueListDelimiter)
    };

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

        control.appendChild(select);
        filterItem.appendChild(control);

        select.addEventListener('change', getOnFilterItemChange(attributes.key));
        break;
      case _cfg.types.multiple:
        attributes.values.forEach(function(value) {
          var control = document.createElement('div');
          var checkboxLabel = document.createElement('label');
          var checkboxLabelText = document.createTextNode(value);
          var checkbox = document.createElement('input');

          filterItem.classList.add(_cfg.classes.filter.item.multipleType);
          control.classList.add(_cfg.classes.filter.item.control);
          checkboxLabel.classList.add(_cfg.classes.filter.item.controlLabel);
          checkbox.classList.add(_cfg.classes.filter.item.controlInput);

          checkbox.type = 'checkbox';
          checkbox.autocomplete = 'off';
          checkbox.value = value;

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
}