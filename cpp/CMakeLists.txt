
cmake_minimum_required(VERSION 3.14)

project(libxviz
        VERSION 1.0.0
        DESCRIPTION "C++ Implementation of the XVIZ Protocol"
        LANGUAGES CXX)

set(XVIZ_ROOT_DIR ${CMAKE_CURRENT_SOURCE_DIR})
set(CMAKE_CXX_STANDARD 17)

add_subdirectory("cmake")

