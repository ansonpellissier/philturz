(function() {
  var cfg = {
    singleType: 'single',
    multipleType: 'multiple',
    hiddenClass: 'philturz__hidden',
    itemSelector: '.philturz__item',
    attributePrefix: 'data-philturz-',
    listDelimiter: '; ',
    emptyValue: '',
    emptyLabel: ''
  };
  var filters = [];


  /*
   * UTILS
   */
  function valuesFromList(list) {
    return list === cfg.emptyValue ? [] : list.split(cfg.listDelimiter);
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
  function filterItemValues(itemValues, filterValue) {
    var compareFn = isSimpleFilterValue() ? valuesEqual : valueInValues;
    return itemValues.some(function(itemValue) {
      return compareFn(filterValue, itemValue);
    });
  }

  function filterItem(item) {
    var isHidden = false;

    filters.some(function(filter) {
      var attribute = cfg.attributePrefix + filter.key;
      var itemValues = valuesFromList(item.attributes[attribute].value);
      if (itemValues.length === 0) return false;
      var isMatch = filterItemValues(itemValues, filter.value);
      if (isMatch) return false;
      isHidden = true;
      return true;
    });

    if (isHidden) {
      item.classList.add(cfg.hiddenClass);
    } else {
      item.classList.remove(cfg.hiddenClass);
    }
  }

  function filterItems() {
    var items = Array.from(document.querySelectorAll(cfg.itemSelector));
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
    return filters.concat(filter);
  }

  function updateFilter(key, value) {
    return filters.map(function(filter) {
      var newValue = (filter.key === key) ? value : filter.value;
      return createFilter(filter.key, newValue);
    });
  }

  function removeFilter(key) {
    return filters.filter(function(filter) {
      return filter.key !== key;
    });
  }

  function addFilterMultiple(key, value) {
    var isExisting = false;
    var newFilters = filters.map(function(filter) {
      var newValue = filter.value;
      if (filter.key === key) {
        isExisting = true;
        var hasValue = filter.value.indexOf(value) !== -1;
        if (!hasValue) newValue = newValue.concat(value);
      }
      return createFilter(filter.key, newValue);
    });
    filters = isExisting ? newFilters : newFilters.concat(createFilter(key, [value]));
  }

  function removeFilterMultiple(key, value) {
    filters = filters
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
        return filter.key === key && filter.value.length > 0;
      });
  }


  /*
   * EVENT LISTENERS
   */
  function onFilterChange(key) {
    return function(e) {
      var value = e.target.value;
      if (value === cfg.emptyValue) {
        filters = removeFilter(key);
      } else {
        var isIncluded = filters.some(function(filter) {
          return filter.key === key;
        });
        filters = isIncluded ? updateFilter(key, value) : addFilter(key, value);
      }
      filterItems();
    };
  }

  function onFilterMultipleChange(key) {
    return function(e) {
      var addRemoveFn = e.target.checked ? addFilterMultiple : removeFilterMultiple;
      addRemoveFn(key, e.target.value);
      filterItems();
    };
  }


  /*
   * INIT
   */
  var filterElements = Array.from(document.querySelectorAll('.philturz__filter'));
  filterElements.forEach(function(filterElement) {
    var attributes = {
      key: filterElement.dataset.philturzKey,
      type: filterElement.dataset.philturzType,
      label: filterElement.dataset.philturzLabel,
      emptyLabel: filterElement.dataset.philturzEmptyLabel || cfg.emptyLabel,
      values: filterElement.dataset.philturzValues.split(cfg.listDelimiter)
    };

    var label = document.createElement('label');
    var labelText = document.createTextNode(attributes.label);
    label.appendChild(labelText);

    switch(attributes.type) {
      case cfg.singleType:
        var select = document.createElement('select');
        select.autocomplete = 'off';
        var emptyOption = document.createElement('option');
        emptyOption.value = cfg.emptyValue;
        emptyOption.text = attributes.emptyLabel;
        select.appendChild(emptyOption);
        attributes.values.forEach(function(value) {
          var option = document.createElement('option');
          option.value = value;
          option.text = value;
          select.appendChild(option);
        });

        filterElement.appendChild(label);
        filterElement.appendChild(select);

        select.addEventListener('change', onFilterChange(attributes.key));
        break;
      case cfg.multipleType:
        var group = document.createElement('div');
        attributes.values.forEach(function(value) {
          var checkboxLabel = document.createElement('label');
          var checkboxLabelText = document.createTextNode(value);
          var checkbox = document.createElement('input');
          
          checkbox.type = 'checkbox';
          checkbox.autocomplete = 'off';
          checkbox.value = value;
          checkboxLabel.appendChild(checkbox);
          checkboxLabel.appendChild(checkboxLabelText);
          
          checkbox.addEventListener('change', onFilterMultipleChange(attributes.key));

          group.appendChild(checkboxLabel);
        });
        filterElement.appendChild(group);
        break;
    }
  });
})();