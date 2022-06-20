
message(STATUS "libxviz CMAKE_CXX_FLAGS: " ${CMAKE_CXX_FLAGS})


find_package(protobuf REQUIRED)
find_package(websocketpp CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)
find_path(CPP_BASE64_INCLUDE_DIRS "cpp-base64/base64.cpp")


include_directories(${XVIZ_ROOT_DIR}/include)
include_directories(${CMAKE_CURRENT_BINARY_DIR})

# all headers
install(DIRECTORY ${XVIZ_ROOT_DIR}/include/xviz DESTINATION include)

# utils sources
file(GLOB libxviz_utils_sources
  "${XVIZ_ROOT_DIR}/src/utils/utils.cpp"
  "${XVIZ_ROOT_DIR}/src/utils/base64.cpp"
)
set(libxviz_sources "${libxviz_sources};${libxviz_utils_sources}")

# builder sources
file(GLOB libxviz_builder_sources
  "${XVIZ_ROOT_DIR}/src/builder/declarative_ui/ui_builder.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/declarative_ui/container_builder.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/declarative_ui/plot_builder.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/declarative_ui/table_builder.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/declarative_ui/video_builder.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/declarative_ui/panel_builder.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/declarative_ui/metric_builder.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/declarative_ui/base_ui_builder.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/declarative_ui/base_ui_component_builder.cpp"

  "${XVIZ_ROOT_DIR}/src/builder/metadata.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/base_builder.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/pose.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/primitive.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/time_series.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/ui_primitive.cpp"
  "${XVIZ_ROOT_DIR}/src/builder/xviz_builder.cpp"
)
set(libxviz_sources "${libxviz_sources};${libxviz_builder_sources}")

# io sources
file(GLOB libxviz_io_sources
  "${XVIZ_ROOT_DIR}/src/io/protobuf_writer.cpp"
)
set(libxviz_sources "${libxviz_sources};${libxviz_io_sources}")

# message sources
file(GLOB libxviz_message_sources
  "${XVIZ_ROOT_DIR}/src/message.cpp"
)
set(libxviz_sources "${libxviz_sources};${libxviz_message_sources}")

# server sources
file(GLOB libxviz_server_sources
  "${XVIZ_ROOT_DIR}/src/server/xviz_server.cpp"
  "${XVIZ_ROOT_DIR}/src/server/xviz_handler.cpp"
  "${XVIZ_ROOT_DIR}/src/server/xviz_session.cpp"
)
set(libxviz_sources "${libxviz_sources};${libxviz_server_sources}")

add_library(cpp-base64
  ${CPP_BASE64_INCLUDE_DIRS}/cpp-base64/base64.h
  ${CPP_BASE64_INCLUDE_DIRS}/cpp-base64/base64.cpp
)

add_library(xviz 
  STATIC
  ${libxviz_sources}
)

# generate protobuf files
file(GLOB PROTO_FILES "${XVIZ_ROOT_DIR}/pb/xviz/v2/*.proto")
protobuf_generate(
  LANGUAGE CPP
  TARGET xviz
  IMPORT_DIRS ${XVIZ_ROOT_DIR}/pb/ ${protobuf_DIR}/../../include/
  PROTOS ${PROTO_FILES})

target_link_libraries(xviz protobuf::libprotoc protobuf::libprotobuf protobuf::libprotobuf-lite)
target_link_libraries(xviz websocketpp::websocketpp)
target_link_libraries(xviz cpp-base64)
target_link_libraries(xviz nlohmann_json nlohmann_json::nlohmann_json)
target_include_directories(xviz PUBLIC ${CMAKE_CURRENT_BINARY_DIR})
target_include_directories(xviz PUBLIC ${XVIZ_ROOT_DIR}/include)


install(TARGETS xviz DESTINATION lib)

# target_include_directories(xviz PUBLIC ${XVIZ_ROOT_DIR}/include)
# target_include_directories(xviz PUBLIC ${XVIZ_ROOT_DIR}/include/xviz/proto)
