message(STATUS "xviz-test CMAKE_CXX_FLAGS: " ${CMAKE_CXX_FLAGS})

enable_testing()
find_package(GTest CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)

include_directories(${XVIZ_ROOT_DIR}/include)
include_directories(${GTEST_INCLUDE_DIRS})

add_library(xviz-test-lib
  ${XVIZ_ROOT_DIR}/test/test_utils.cpp
)

add_executable(xviz-test 
  ${XVIZ_ROOT_DIR}/test/test_all.cpp
)


target_link_libraries(xviz-test-lib nlohmann_json nlohmann_json::nlohmann_json)
target_link_libraries(xviz-test-lib xviz)
target_link_libraries(xviz-test xviz-test-lib)
target_link_libraries(xviz-test GTest::gtest GTest::gtest_main GTest::gmock GTest::gmock_main)

set_target_properties(xviz-test PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${XVIZ_ROOT_DIR}/bin)
add_test(AllTestsInMain xviz-test)


# cmake targets for local tests
if (BUILD_XVIZ_TESTS_GCOVR)
  message(STATUS "---------------------")
  message(STATUS "Building code coverage with gcovr")
  message(STATUS "---------------------")
  include("code_coverage.cmake")
  setup_target_for_coverage_gcovr_html(
      NAME xviz-test-coverage
      EXECUTABLE xviz-test
      DEPENDENCIES xviz
      BASE_DIRECTORY "${XVIZ_ROOT_DIR}"
      EXCLUDE "/usr/*" "7/*" "test/*" "examples/*" "include/xviz/proto/*" "include/xviz/third_party/*" "include/xviz/utils/base64.h" "include/xviz/utils/gltf.h" "include/xviz/utils/json.hpp" "include/xviz/utils/macrologger.h" "src/proto/*" "src/utils/base64.cpp")
endif (BUILD_XVIZ_TESTS_GCOVR)

# cmake targets for traivs
if (BUILD_XVIZ_TESTS_LCOV)
  message(STATUS "---------------------")
  message(STATUS "Building code coverage with lcov")
  message(STATUS "---------------------")
  include("code_coverage.cmake")
  setup_target_for_coverage_lcov(
      NAME xviz-test-coverage
      EXECUTABLE xviz-test
      DEPENDENCIES xviz
      BASE_DIRECTORY "${XVIZ_ROOT_DIR}"
      EXCLUDE "/usr/*" "7/*" "test/*" "examples/*" "include/xviz/proto/*" "include/xviz/third_party/*" "include/xviz/utils/base64.h" "include/xviz/utils/gltf.h" "include/xviz/utils/json.hpp" "include/xviz/utils/macrologger.h" "src/proto/*" "src/utils/base64.cpp")
endif (BUILD_XVIZ_TESTS_LCOV)
