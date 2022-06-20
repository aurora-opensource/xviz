# XVIZ In C++ [![Build Status](https://travis-ci.com/wx9698/xviz.svg?branch=master)](https://travis-ci.com/wx9698/xviz) [![codecov](https://codecov.io/gh/wx9698/xviz/branch/master/graph/badge.svg)](https://codecov.io/gh/wx9698/xviz)

## Minimum Requirements
1. CMake 3.14+ (This is high temporarily because of a protobuf cmake problem. I will lower this requirement upon the problem is resolved.)
2. [vcpkg](https://github.com/microsoft/vcpkg/tree/master)

## Example

Please see [example.cpp](https://github.com/wx9698/xviz/blob/master/examples/example.cpp), [example_xviz_server.cpp](https://github.com/wx9698/xviz/blob/master/examples/example_xviz_server.cpp) and [CMakeLists.txt](https://github.com/wx9698/xviz/blob/master/CMakeLists.txt) for more information.

## Use Case
1. [CarlaViz](https://github.com/wx9698/carlaviz)

## Build

### Download required packages
```bash
cd VCPKG_PATH
./vcpkg install websocketpp nlohmann-json cpp-base64 protobuf
# if you want to build tests, don't forget to download gtest
./vcpkg install gtest
```

### Build xviz builder example
```bash
mkdir build && cd build
cmake ../ -DCMAKE_TOOLCHAIN_FILE=VCPKG_PATH/scripts/buildsystems/vcpkg.cmake
make example -j12
../bin/example
```

### Build xviz server example
Frontend is needed. You can refer to these two repos for frontend:
1. [CarlaViz Frontend](https://github.com/wx9698/carlaviz/tree/master/frontend)
2. [uber streetscape.gl](https://github.com/uber/streetscape.gl)
```bash
mkdir build && cd build
cmake ../ -DCMAKE_TOOLCHAIN_FILE=VCPKG_PATH/scripts/buildsystems/vcpkg.cmake
make example-server -j12
../bin/example-server [PNG FILE PATH (this is optional)]
```

### Build tests
```bash
mkdir build && cd build
cmake ../ -DBUILD_XVIZ_TESTS=ON -DCMAKE_TOOLCHAIN_FILE=VCPKG_PATH/scripts/buildsystems/vcpkg.cmake
make xviz-test -j12
../bin/xviz-test
```

### Install
This is not tested.
```bash
mkdir build && cd build
cmake ../ -DCMAKE_INSTALL_PREFIX=/path/you/want/to/install/ -DCMAKE_TOOLCHAIN_FILE=VCPKG_PATH/scripts/buildsystems/vcpkg.cmake
make example example-server xviz-test -j12
make install
```

### Format
```bash
find . -name "*.h" -not -exec clang-format -style=file -i {} \;
find . -name "*.cpp" -not -wholename "./build/*" -exec clang-format -style=file -i {} \;
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