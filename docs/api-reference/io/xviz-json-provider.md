# XVIZJSONProvider

Supports the Provider interface for JSON XVIZ data.

## Example

```js
```

## Constructor

Parameters:

- **params** -
  - **params.reader** -
  - **params.source** -
  - **params.options** -

## Methods

### init()

Performs required actions to determine if the supplied parameters specify a data source this
Provider can consume. If so, then this will set the internal state such that the method valid()
returns True.

### valid()

Returns **true** if the arguments are a valid data source for this Provider. This is not meaningful
until **init()** has been called.

### xvizMetadata()

Returns the XVIZMetadata

## getFrameIterator(startTime, endTime)

Returns an iterator that can be used to access the XVIZ data between the time range [startTime,
endTime]. If the arguments are not specified it will default to the full time range implicit within
the data.

- **startTime** - optional
- **endTime** - optional

### xvizFrame(iterator)

Returns the next Provider defined frame of XVIZ data. When the iteration is complete this returns
`null`.

Parameters:

- **iterator** - An object returned from `getFrameIterator()`
