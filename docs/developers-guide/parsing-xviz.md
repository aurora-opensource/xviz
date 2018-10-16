# Parsing XVIZ

While a majority of XVIZ users are expected to want to generate (or convert existing data to) XVIZ in order to display it in an existing client UI, some applications will want to load and parse XVIZ, e.g. to implement custom display, post-processing or conversion.


## Loading XVIZ

XVIZ is intended to be served over socket in GLB file sized message chunks, but can also be read from file or via network requests.


## Parsing Steps

For XVIZ that is stored in binary GLB file format, the binary GLB file must be unpacked, the binary chunks must be rehydrated in to more convenient (JavaScript) objects and typed arrays.

Then postprocessing will take place to ensure the data is in a standardized, easy to work with format, and also apply some application configuration, for instance filtering certain streams etc.

