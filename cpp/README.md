# XVIZ In C++ [![Build Status](https://travis-ci.com/wx9698/xviz.svg?branch=master)](https://travis-ci.com/wx9698/xviz) [![codecov](https://codecov.io/gh/wx9698/xviz/branch/master/graph/badge.svg)](https://codecov.io/gh/wx9698/xviz)

## Minimum Requirements
1. CMake 3.5.0+
2. Protobuf 3.11.0+

## Example

Please see [example.cpp](https://github.com/wx9698/xviz/blob/master/examples/example.cpp), [example_xviz_server.cpp](https://github.com/wx9698/xviz/blob/master/examples/example_xviz_server.cpp) and [CMakeLists.txt](https://github.com/wx9698/xviz/blob/master/CMakeLists.txt) for more information.

## Use Case
1. [CarlaViz](https://github.com/wx9698/carlaviz)

## Build

### Build xviz builder example
```bash
mkdir build && cd build
cmake ../
make example -j12
../bin/example
```

### Build xviz server example
Frontend is needed. You can refer to these two repos for frontend:
1. [CarlaViz Frontend](https://github.com/wx9698/carlaviz/tree/master/frontend)
2. [uber streetscape.gl](https://github.com/uber/streetscape.gl)
```bash
mkdir build && cd build
cmake ../
make example-server -j12
../bin/example-server [PNG FILE PATH (this is optional)]
```

### Build tests
```bash
mkdir build && cd build
cmake ../ -DBUILD_XVIZ_TESTS=ON
make xviz-test -j12
../bin/xviz-test
```

### Install
```bash
mkdir build && cd build
cmake ../ -DCMAKE_INSTALL_PREFIX=/path/you/want/to/install/
make example example-server xviz-test -j12
make install
```

## Related Work
1. [uber xviz](https://github.com/uber/xviz)
2. [cmpute xviz.py](https://github.com/cmpute/xviz.py)

## Third-Party Libraries
1. [zaphoyd websocketpp](https://github.com/zaphoyd/websocketpp)
2. [chriskohlhoff asio](https://github.com/chriskohlhoff/asio)
3. [mcrodrigues macro-logger](https://github.com/dmcrodrigues/macro-logger)
4. [nlohmann json](https://github.com/nlohmann/json)
5. [jessey-git fx-gltf](https://github.com/jessey-git/fx-gltf)
6. [ReneNyffenegger cpp-base64](https://github.com/ReneNyffenegger/cpp-base64)