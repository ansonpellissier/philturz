(function() {
  var _cfg = {
    singleType: 'single',
    multipleType: 'multiple',
    classes: {
      hidden: 'philturz-hidden',
      filters: {
        filters: 'philturz-filters',
        filter: 'philturz-filter',
        singleType: 'philturz-filter-type-single',
        multipleType: 'philturz-filter-type-multiple',
        label: 'philturz-filter-label',
        control: 'philturz-filter-control',
        controlLabel: 'philturz-filter-control-label',
        controlInput: 'philturz-filter-control-input',
        form: 'philturz-filters-form',
        reset: 'philturz-filters-reset',
        resetButton: 'philturz-filters-reset-button'
      },
      list: 'philturz-list',
      listItem: 'philturz-list-item'
    },
    attributePrefix: 'data-philturz-',
    resetButtonText: 'Reset filters',
    listDelimiter: '; ',
    emptyValue: '',
    emptyLabel: ''
  };
  var _filters = [];


  /*
   * UTILS
   */
  function valuesFromList(list) {
    return list === _cfg.emptyValue ? [] : list.split(_cfg.listDelimiter);
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

  function getClassSelector(className) {
    return '.' + className;
  }


  /*
   * FILTER APPLICATION
   */
  function filterItemValues(itemValues, filterValue) {
    var compareFn = isSimpleFilterValue() ? valuesEqual : valueInValues;
    return itemValues.some(function(itemValue) {
      return compareFn(filterValue, itemValue);
    });
  }

  function filterItem(item) {
    var isHidden = false;

    _filters.some(function(filter) {
      var attribute = _cfg.attributePrefix + filter.key;
      var itemValues = valuesFromList(item.attributes[attribute].value);
      if (itemValues.length === 0) return false;
      var isMatch = filterItemValues(itemValues, filter.value);
      if (isMatch) return false;
      isHidden = true;
      return true;
    });

    if (isHidden) {
      item.classList.add(_cfg.classes.hidden);
    } else {
      item.classList.remove(_cfg.classes.hidden);
    }
  }

  function filterItems() {
    var items = Array.from(document.querySelectorAll(getClassSelector(_cfg.classes.listItem)));
    items.forEach(filterItem);
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
   * EVENT LISTENERS
   */
  function getOnFilterChange(key) {
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
      filterItems();
    };
  }

  function getOnFilterMultipleChange(key) {
    return function(e) {
      var addRemoveFn = e.target.checked ? addFilterMultiple : removeFilterMultiple;
      addRemoveFn(key, e.target.value);
      filterItems();
    };
  }

  function onResetClick() {
    _filters = [];
    filterItems();
  }

  function onFormSubmit(e) {
    console.log('Test');
    e.preventDefault();
  }


  /*
   * INIT
   */
  function init(filtersSelector, filterSelector, listSelector, itemSelector) {
    var listElement = document.querySelector(listSelector);
    var itemElements = Array.from(document.querySelectorAll(listSelector + ' ' + itemSelector));
    var filtersElement = document.querySelector(filtersSelector);
    var filterElements = Array.from(document.querySelectorAll(filtersSelector + ' ' + filterSelector));
    var parentElement = filtersElement.parentNode;

    listElement.classList.add(_cfg.classes.list);
    filtersElement.classList.add(_cfg.classes.filters.filters);

    itemElements.forEach(function(itemElement) {
      itemElement.classList.add(_cfg.classes.listItem);
    });

    filterElements.forEach(function(filterElement) {
      var attributes = {
        key: filterElement.dataset.philturzKey,
        type: filterElement.dataset.philturzType,
        label: filterElement.dataset.philturzLabel,
        emptyLabel: filterElement.dataset.philturzEmptyLabel || _cfg.emptyLabel,
        values: filterElement.dataset.philturzValues.split(_cfg.listDelimiter)
      };

      var label = document.createElement('label');
      var labelText = document.createTextNode(attributes.label);
      label.classList.add(_cfg.classes.filters.label);
      filterElement.classList.add(_cfg.classes.filters.filter);
      label.appendChild(labelText);
      filterElement.appendChild(label);

      switch(attributes.type) {
        case _cfg.singleType:
          var control = document.createElement('div');
          var select = document.createElement('select');
          var emptyOption = document.createElement('option');

          filterElement.classList.add(_cfg.classes.filters.singleType);
          control.classList.add(_cfg.classes.filters.control);
          select.classList.add(_cfg.classes.filters.controlInput);
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
          filterElement.appendChild(control);

          select.addEventListener('change', getOnFilterChange(attributes.key));
          break;
        case _cfg.multipleType:
          attributes.values.forEach(function(value) {
            var control = document.createElement('div');
            var checkboxLabel = document.createElement('label');
            var checkboxLabelText = document.createTextNode(value);
            var checkbox = document.createElement('input');

            filterElement.classList.add(_cfg.classes.filters.multipleType);
            control.classList.add(_cfg.classes.filters.control);
            checkboxLabel.classList.add(_cfg.classes.filters.controlLabel);
            checkbox.classList.add(_cfg.classes.filters.controlInput);

            checkbox.type = 'checkbox';
            checkbox.autocomplete = 'off';
            checkbox.value = value;

            checkboxLabel.appendChild(checkbox);
            checkboxLabel.appendChild(checkboxLabelText);
            control.appendChild(checkboxLabel);
            filterElement.appendChild(control);

            checkbox.addEventListener('change', getOnFilterMultipleChange(attributes.key));
          });
          break;
      }
    });

    var formElement = document.createElement('form');
    formElement.addEventListener('submit', onFormSubmit);
    formElement.addEventListener('reset', onResetClick);
    formElement.classList.add(_cfg.classes.filters.form);

    var resetElement = document.createElement('div');
    var resetButtonElement = document.createElement('input');
    resetElement.classList.add(_cfg.classes.filters.reset);
    resetButtonElement.type = 'reset';
    resetButtonElement.value = _cfg.resetButtonText;
    resetButtonElement.classList.add(_cfg.classes.filters.resetButton);

    resetElement.appendChild(resetButtonElement);
    filtersElement.appendChild(resetElement);
    parentElement.insertBefore(formElement, filtersElement);
    formElement.appendChild(filtersElement);
  }

  init('#scholarship-filters', '.scholarship-filter', '#scholarship-list', '.scholarship-list-item');
})();