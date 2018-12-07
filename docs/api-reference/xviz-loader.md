# XVIZ Load / Save Support

## Functions

### parseBinaryXVIZ(arrayBuffer) 

Parses an in-memory, GLB formatted `ArrayBuffer` into XVIZ.

Parameters:

- `arrayBuffer` (ArrayBuffer) - json object to encode

Returns: decoded data (Object).

### encodeBinaryXVIZ(json, options)
- `json` (Object) - Data to encode
- `options` (Object)
  - `options.flattenArrays`=`true` - Whether to flatten arrays
  - `options.magic`=`MAGIC_XVIZ` - Magic number (first four bytes in file)

Returns: encoded data (ArrayBuffer).

Encodes an XVIZ data structure into an arrayBuffer that can be written atomically to file.

Any typed arrays will be extracted from the JSON payload and stored in the binary chunk at the end
of the file.

If the `flattenArrays` option is not set to `false`, any nested JavaScript array that only contains
small arrays of numbers will be flattened to a typed array and stored in binary form.

Any arrays that are not typed arrays will be encoded in JSON text form.
