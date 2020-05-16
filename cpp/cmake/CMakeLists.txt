
# build code coverage
if (BUILD_XVIZ_TESTS_GCOVR OR BUILD_XVIZ_TESTS_LCOV)
  set(BUILD_XVIZ_TESTS_COVERAGE ON)
endif ()

if (BUILD_XVIZ_TESTS_COVERAGE)
  message(STATUS "---------------------")
  message(STATUS "Enable building with code coverage")
  message(STATUS "---------------------")
  set(CMAKE_BUILD_TYPE "Debug")
  set(BUILD_XVIZ_TESTS ON)
  set(CMAKE_CXX_FLAGS "-std=c++17 --coverage -pthread -fPIC -O0")
else (BUILD_XVIZ_TESTS_COVERAGE) 
  set(CMAKE_CXX_FLAGS "-std=c++17 -pthread -fPIC -O3 -DNDEBUG")
endif (BUILD_XVIZ_TESTS_COVERAGE)

add_subdirectory("src")
add_subdirectory("examples")

if (BUILD_XVIZ_TESTS)
    message(STATUS "---------------------")
    message(STATUS "Enable building tests")
    message(STATUS "---------------------")
    add_subdirectory("test")
endif (BUILD_XVIZ_TESTS)
