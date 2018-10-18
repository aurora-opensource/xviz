# XVIZ Binary Container Protocol Format

XVIZ comes with parsing support for a binary container format. In this format, each message is
packaged in a binary container or "envelope", that contains two "chunks":

- a JSON chunk containing the JSON encoding of semantic parts of the data
- a BIN chunk containing compact, back-to-back binary representations of large numeric arrays,
  images etc.

An intended benefit of the binary format is that large segments of data can be sent and processed
natively.

# Parsing Support

XVIZ parsing functions will decode the binary container, parse the JSON and resolve binary
references. The application will get a "patched" JSON structure, with the difference from the basic
JSON protocol format being that certain arrays will be compact typed arrays instead of classic
JavaScript arrays.

Typed arrays do not support nesting so all numbers will be laid out flat and the application needs
to know how many values represent one element, for instance 3 values represent the `x, y, z`
coordinates of a point.

## Details on Binary Container Format

The container format is an implementation of the GLB binary container format defined in the glTF
specification. However the `accessor`/`bufferView` tables specified by `glTF` are quite verbose for
the many small buffers used by XVIZ, and accordingly XVIZ may use custom tables for more compact
messages.

References:

- [glTF 2 Poster](https://raw.githubusercontent.com/KhronosGroup/glTF/master/specification/2.0/figures/gltfOverview-2.0.0a.png)
- [glTF 2 Spec](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0)

## Remarks

Note on endianness:

- glTF is little endian: GLB header is little endian. glTF Buffer contents are specified to be
  little endian.
- Essentially all of the current web is little endian, so potential big-endian issues are igored for
  now.
