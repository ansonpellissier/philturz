(function() {
    var cfg = {
      hiddenClass: 'philturz__hidden',
      itemSelector: '.philturz__item',
      attributePrefix: 'data-philturz-',
      listDelimiter: '; ',
      emptyValue: ''
    };

    var filters = [
      // { key: 'study-level', value: 'Undergraduate' },
      // { key: 'student-type', value: 'Domestic' },
      // { key: 'school', value: ['School of Arts', 'School of Business'] }
    ];



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



    /*
     * FILTER APPLICATION
     */
    function filterItemValues(itemValues, filterValue) {
      var compareFn = typeof filterValue === 'string' ? valuesEqual : valueInValues;
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

    function includesFilter(key) {
      return filters.includes(function(filter) {
        return filter.key === key;
      });
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

    function changeFilter(key, value) {
      if (value === cfg.emptyValue) {
        filters = removeFilter(key);
      } else if (includesFilter(key)) {
        filters =  updateFilter(key, value)
      } else {
        filters = addFilter(key, value);
      }
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
      filters = filters.map(function(filter) {
        var newValue = filter.value;
        if (filter.key === key) {
          newValue = newValue.filter(function(v) {
            return v !== value;
          });
        }
        return createFilter(filter.key, newValue);
      });
    }



    // TESTING
    console.log(filters);
    changeFilter('study-level', 'Postgraduate');
    console.log(filters);
    changeFilter('student-type', 'Domestic');
    console.log(filters);
    changeFilter('study-level', 'Undergraduate');
    console.log(filters);
    changeFilter('study-level', '');
    console.log(filters);
    addFilterMultiple('school', 'School of Nursing and Healthcare Professions');
    console.log(filters);
    addFilterMultiple('school', 'School of Arts');
    console.log(filters);
    addFilterMultiple('school', 'School of Arts');
    console.log(filters);
    removeFilterMultiple('school', 'School of Arts');
    console.log(filters);

    function test() {
      filterItems();
    }

    document.getElementById('test').addEventListener('click', test);
  })();