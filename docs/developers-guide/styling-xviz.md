# Styling XVIZ

## Overview

Stylesheets enables the application to control rendering properties of all XVIZ data.


## Format

Stylesheets are is in the following shape:

```js
{
    '/object/shape':                          // channel name
    [
        {
          strokeColor: '#FFFFFF'
        },
        {
          class: 'label=OBJECT_LABEL',            // selector
          strokeColor: '#9D9DA3'
        },
        {
          class: 'label=OBJECT_LABEL selected',   // selector
          strokeColor: '#FFC000',
          fillColor: '#FFC00080'
        }
    ]
}
```

## Selectors

Each style object contains an optional `class` field that specifies the selector of the style. A style only applies to an object if the selector is matched. The default selector is `*`.

* `<name>` matches an object if it contains the given field.
* `<name>=<value>` matches an object if the given field is equal to the given value.
* Space separate multiple selectors to match an objects that satisfies them all.
* `*` matches all objects.
* If an object matches multiple selectors in a stylesheet, the one that is defined last trumps.
