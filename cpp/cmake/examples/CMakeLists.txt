
message(STATUS "example CMAKE_CXX_FLAGS: " ${CMAKE_CXX_FLAGS})

add_executable(example 
  ${XVIZ_ROOT_DIR}/examples/example.cpp
)
target_link_libraries(example xviz)
set_target_properties(example PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${XVIZ_ROOT_DIR}/bin)

add_executable(example-server 
  ${XVIZ_ROOT_DIR}/examples/example_xviz_server.cpp
)

target_link_libraries(example-server xviz)
set_target_properties(example-server PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${XVIZ_ROOT_DIR}/bin)