# Styling XVIZ

Styling in XVIZ happens at multiple levels. 

## Object inline styles

Object styling is defined during conversion using the XVIZBuilder.style() method. Simply pass an object with the appropriate style properties and values.

## Stream style classes

Using classes requires coordination at two places.

1. XVIZMetadataBuilder.styleClass() definition of classes for a streamId
2. Adding class selectors to the objects using XVIZBuilder.classes()

## Stream style defaults

Stream styles definition define the default style property values for all objects within a stream. They provide a single place to define styles for a stream and avoid unnecessary styling of individual element.

# Style Specification

For more detailed information on styling refer to the style specification.
