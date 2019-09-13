# Philturz

A simple JavaScript library to allow filters to be created dynamically for a list of filterable items.

## Expectations

The implementation relies on the inclusion of empty HTML elements, to act as placeholders for the filters, with data attributes used to define the type of each filter.

The items to be filtered need to represent their own filterable data via data attributes that are named to match the filter definitions.

## Examples

These requirements are straightforward and can be observed in the implementation in the `/example` directory.

To run the example, you will need to serve the root directory and navigate to the `/example` path. E.g. `http://localhost/example`.

There is a simplified example included which can be accessed via the `/example/simple.html` path. The code for this example clearly shows the implementation details without anything extra.

## Usage

### CSS

Only one CSS rule is required.

```CSS
[hidden] {
  display: none !important;
}
```

### HTML

The filter container and filter items must be defined with data attributes detailing the type of filters required.

```HTML
<div id="car-filter">
  <div
    class="car-filter-item"
    data-philturz-key="origin"
    data-philturz-type="single"
    data-philturz-label="Origin"
    data-philturz-empty-label="Select origin..."
    data-philturz-values="France; Germany; South Korea; Australia; Japan">
  </div>
  <div
    class="car-filter-item"
    data-philturz-key="type"
    data-philturz-type="multiple"
    data-philturz-label="Type"
    data-philturz-values="Hatch; Sedan; SUV; 4WD; Wagon">
  </div>
</div>
```

Next, the list of items to be filtered needs to be defined with appropriate data attributes relating to the `philturz-key` attribute of the filter list items.

```HTML
<ul id="car-list">
  <li
    class="car-list-item"
    data-philturz-origin="Germany"
    data-philturz-type="Sedan">
    Mercedes C 300
  </li>
  <li
    class="car-list-item"
    data-philturz-origin="South Korea"
    data-philturz-type="Hatch">
    Hyundai i30
  </li>
  <li
    class="car-list-item"
    data-philturz-origin="Japan"
    data-philturz-type="4WD">
    Toyota Landcruiser
  </li>
  <li
    class="car-list-item"
    data-philturz-origin="Japan"
    data-philturz-type="Wagon; 4WD">
    Subaru Forrester
  </li>
</ul>
```

### JavaScript

Before the closing `</body>` tag is the prefered place to include the library file.

```HTML
<script type="text/javascript" src="/dist/philturz-0.1.0.min.js"></script>
```

After this, the `init()` method of the **Philturz** library must be called to initialise the creation of the filters. There are four paramaeters required: 

1. `filterId` - the ID of the HTML element which contains the individual filter items.
2. `filterItemClass` - the Class used to denote an individual filter item.
3. `listId` - the ID of the HTML element which contains the individual list items.
4. `listItemClass` - the Class used to denote an individual list item.

An example is show below.

```HTML
<script>
  philturz.init('car-filter', 'car-filter-item', 'car-list', 'car-list-item');
</script>
```
