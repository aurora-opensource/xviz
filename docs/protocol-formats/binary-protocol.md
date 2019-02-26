# XVIZ Binary Container Protocol Format

XVIZ comes with parsing support for a binary container format based on the [GLB container](https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#glb-file-format-specification)
for [glTF](https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md). In this
format, each message is packaged in a binary container or "envelope", that contains two "chunks":

- a JSON chunk containing the JSON encoding of semantic parts of the data
- a BIN chunk containing compact, back-to-back binary representations of large numeric arrays,
  images etc.

An intended benefit of the binary format is that large segments of data can be sent and processed
natively.

## Details on Binary Container Format

XVIZ in GLB is implemented with 2 changes over a standard GLB.

### The `xviz` Property in the JSON chunk

The standard XVIZ JSON object is represented as a top-level property in the JSON chunk.

### Use of JSON Pointers to reference GLB assets

Inside the `xviz` property any entry that is stored in the accompaning GLB BINARY structures are
represented by a JSON Pointer, specifically URI Fragment format for JSON pointers. This format is
"#<json pointer path>" where the root is the JSON CHUNK of the GLB container.

Using JSON Pointers allows the XVIZ data to reference the container and reuse the glTF specification
for assets.

```
[... header]
{
  "accessors": [
    {
      "bufferView": 0,
      "type": "VEC4",
      "componentType": 5121,
      "count": 123397
    },
    {
      "bufferView": 1,
      "type": "VEC3",
      "componentType": 5126,
      "count": 123397
    }
  ],
  "bufferViews": [
    {
      "buffer": 0,
      "byteOffset": 0,
      "byteLength": 493588
    },
    {
      "buffer": 0,
      "byteOffset": 493588,
      "byteLength": 1480764
    }
    {
      "buffer": 0,
      "byteOffset": 493588,
      "byteLength": 1480764
    },
    {
      "buffer": 0,
      "byteOffset": 2164912
      "byteLength": 190560
    }
  ],
  "images": [
    {
      "bufferView":2,
      "mimeType":"image/png",l
      "width":397,
      "height":120
    }
  ],
  "xviz": {
    "type": "xviz/status_update",
    "data": {
      "update_type": "snapshot",
      "updates": [
        {
          "primitives": {
            "/lidar": {
              "points": [
                {
                  "colors": "#/accessors/0",
                  "points": "#/accessors/1"
                }
              ]
            },
            "/camera": {
              "images": [
                {
                  "data": "#/images/0",
                  "width_px": 397,
                  "height": 120,
                  "position": [0, 0, 0]
                }
              ]
            }
          }
        }
      ]
    }
  }
}
[... binary chunk start
 // first 493588 bytes are pointed at by 'bufferViews[0]'
 // next run is pointed at by 'bufferViews[1]'
 ... binary chunk end]
```

## XVIZ API References

# Encoding Support

[XVIZWriter](/docs/api-reference/xviz-writer.md) by default will output the GLB binary encoding of
the XVIZ data. This will be output for both Metadata and Frames, but not the FrameIndex, which is
always output as JSON.

# Parsing Support

[parseStreamMessage](/docs/api-reference/parse-xviz.md) will parse the data and handle GLB encoded
XVIZ as well as other encodings of the data.

XVIZ parsing functions will decode the binary container, parse the JSON and resolve binary
references. The application will get a "patched" JSON structure, with the difference from the basic
JSON protocol format being that certain arrays will be compact typed arrays instead of classic
JavaScript arrays.

If an attribute has been hydrated from binary then it will be transformed into the corresponding
TypeArray. Typed arrays do not support nesting so all numbers will be laid out flat and the
application needs to know how many values represent one element, for instance 3 values represent the
`x, y, z` coordinates of a point.

# References:

- [glTF 2 Poster](https://raw.githubusercontent.com/KhronosGroup/glTF/master/specification/2.0/figures/gltfOverview-2.0.0a.png)
- [glTF 2 Spec](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0)

## Remarks

Note on endianness:

- glTF is little endian: GLB header is little endian. glTF Buffer contents are specified to be
  little endian.
- Essentially all of the current web is little endian, so potential big-endian issues are igored for
  now.
