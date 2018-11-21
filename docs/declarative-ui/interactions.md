# Interaction Types

## Layout Interaction Types

Layout interactions describe the ways that a layout element can be manipulated by a user. Layout
interactions are completely optional, so each layout element can have zero, one, or more layout
interactions applied to it. Currently supported layout interactions include:

- Drag to Reorder (`reorderable`)
- Drag out (`dragout`)

### Drag to Reorder

When a layout element supports the drag to reorder interaction, it means that the elements inside of
the layout element can be rearranged by clicking and dragging them. The formal type for drag to
reorder is `reorderable`.

### Drag Out

When a layout element supports the drag out interaction, it means that the components (and only the
components) can be moved outside of their layout element. A table, for example, could be clicked and
dragged to free float inside the application outside of the panel that originally contained it.
Components previously dragged out can be dragged back into the layout element that originally
contained them. The formal type for drag out is `dragout`.

## Component Interaction Types

Component interactions describe the ways that a component can be manipulated by a user. Unlike
layout interactions, component interactions are inherent to the components themselves. As an
example, a user can sort a table by the values in its columns without declaring the table as
sortable. Not all component interaction types apply to every component, so it is important to note
which interactions a component supports by looking at the documentation for the individual component
types. The currently supported component interactions:

- Highlight on Hover
- Copy
- Sort
- Filter
- Details on Hover
- Toggle Streams On/Off
- Select Source
- Video Settings Adjustment
- Change element (`onchange`)

The interactions supported by each component as well as how each interaction behaves and looks is
described below in the details of each individual component.
