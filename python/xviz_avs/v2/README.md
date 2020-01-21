This folder is generated from protobuf definitions obtained from [xviz@9cb3c30](https://github.com/uber/xviz/tree/v1.0.1/xviz/v2).
TODO: Wait protobuf to be fixed

To build the definitions you need to download `protoc` compiler with version greater than `v3.3.0`. Then execute `protoc -I=<XVIZ_HOME> --python_out=<XVIZ_PY_HOME> <XVIZ_HOME>/xviz/v2/*.proto` to generated python bindings
