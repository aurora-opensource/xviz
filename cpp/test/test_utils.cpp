
/*
 * File: test_utils.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Friday, 14th February 2020 11:04:08 am
 */

#include "test_utils.h"

::testing::AssertionResult xviz::test::IsSameJson(
    const nlohmann::json& expected_json, const nlohmann::json& given_json) {
  if (expected_json == given_json) {
    return ::testing::AssertionSuccess();
  }
  return ::testing::AssertionFailure()
         << "\nexpected: \n"
         << expected_json << "\nbut get:\n"
         << given_json << "\ndifference: \n"
         << nlohmann::json::diff(given_json, expected_json) << std::endl;
}

::testing::AssertionResult xviz::test::IsDifferentJson(
    const nlohmann::json& expected_json, const nlohmann::json& given_json) {
  if (expected_json != given_json) {
    return ::testing::AssertionSuccess();
  }
  return ::testing::AssertionFailure() << "\nexpected different json "
                                       << "but get same json: \n"
                                       << expected_json << std::endl;
}

std::unordered_map<std::string, xviz::XVIZUIBuilder>
xviz::test::GetTestUIBuilders() {
  using namespace xviz;

  std::unordered_map<std::string, XVIZUIBuilder> ui_builders;

  ui_builders["Camera"] = XVIZUIBuilder();
  ui_builders["Metrics"] = XVIZUIBuilder();
  ui_builders["Plot"] = XVIZUIBuilder();
  ui_builders["Table"] = XVIZUIBuilder();

  std::vector<std::string> cameras = {"/camera/images0"};
  std::vector<std::string> streams = {"/object/ts"};
  std::vector<std::string> dep_vars = {"ddd", "aaa"};
  // auto camera_builder = std::make_shared<XVIZVideoBuilder>(cameras);
  XVIZVideoBuilder camera_builder(cameras);
  XVIZPlotBuilder plot_builder("title", "des", "indep_var",
                               std::move(dep_vars));
  XVIZTableBuilder table_builder("title", "des", "/some_stream/table", true);

  std::shared_ptr<XVIZBaseUIBuilder> metric_builder1 =
      std::make_shared<XVIZMetricBuilder>(streams, "123", "123");
  std::shared_ptr<XVIZBaseUIBuilder> metric_builder2 =
      std::make_shared<XVIZMetricBuilder>(streams, "123", "123");

  std::shared_ptr<XVIZBaseUIBuilder> container_builder =
      std::make_shared<XVIZContainerBuilder>("metrics", LayoutType::VERTICAL);
  container_builder->Child(metric_builder1);
  container_builder->Child(metric_builder2);
  container_builder->Child<XVIZMetricBuilder>(streams, "123", "123");
  ui_builders["Camera"].Child(std::move(camera_builder));
  ui_builders["Metrics"].Child(container_builder);
  ui_builders["Plot"].Child(plot_builder);
  ui_builders["Table"].Child(table_builder);
  return ui_builders;
}

xviz::XVIZMetadataBuilder xviz::test::GetTestMetadataBuilder() {
  xviz::XVIZMetadataBuilder metadata_builder;
  std::string s = "{\"fill_color\": \"#fff\"}";
  // std::string s1 =
  //     "{\"fill_color\": \"#fff\", \"point_color_mode\": "
  //     "\"DISTANCE_TO_VEHICLE\"}";

  metadata_builder
      .Stream("/vehicle_pose")
        .Category(xviz::Category::StreamMetadata_Category_POSE)
      .Stream("/object/shape")
        .Category(xviz::Category::StreamMetadata_Category_PRIMITIVE)
        .Type(xviz::Primitive::StreamMetadata_PrimitiveType_POLYGON)
        .Coordinate(
          xviz::CoordinateType::
              StreamMetadata_CoordinateType_VEHICLE_RELATIVE)  //.Unit("123").Source("123")
        .StreamStyle(s)
        .StyleClass("name1", s)
      .Stream("/object/shape2")
        .Category(xviz::Category::StreamMetadata_Category_PRIMITIVE)
        .Type(xviz::Primitive::StreamMetadata_PrimitiveType_POLYGON)
        .TransformMatrix({1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16})
      .Stream("/object/circles")
        .Category(xviz::Category::StreamMetadata_Category_PRIMITIVE)
        .Type(xviz::Primitive::StreamMetadata_PrimitiveType_CIRCLE)
      .Stream("/camera/images0")
        .Category(xviz::Category::StreamMetadata_Category_PRIMITIVE)
        .Type(xviz::Primitive::StreamMetadata_PrimitiveType_IMAGE)
      .Stream("/object/text")
        .Category(xviz::Category::StreamMetadata_Category_PRIMITIVE)
        .Type(xviz::Primitive::StreamMetadata_PrimitiveType_TEXT)
      .Stream("/object/stadium")
        .Category(xviz::Category::StreamMetadata_Category_PRIMITIVE)
        .Type(xviz::Primitive::StreamMetadata_PrimitiveType_STADIUM)
      .Stream("/object/ts")
        .Category(xviz::Category::StreamMetadata_Category_TIME_SERIES)
        .Type(xviz::ScalarType::StreamMetadata_ScalarType_STRING)
        .Unit("m/s")
      .Stream("/object/uptest")
        .Category(xviz::Category::StreamMetadata_Category_UI_PRIMITIVE)
        .Source("unknown source")
      .LogInfo(100, 10000)
      .UI(std::move(GetTestUIBuilders()));
  metadata_builder.StartTime(1000).EndTime(1010);
  return metadata_builder;
}

xviz::XVIZMetadataBuilder xviz::test::GetBuilderTestMetadataBuilderForPrimitive() {
  xviz::XVIZMetadataBuilder metadata_builder;
  metadata_builder.Stream("/vehicle_pose").Category(xviz::StreamMetadata::POSE);
  std::vector<std::string> suffix = {
    "/copy", "/move", "/pointer"
  };
  uint32_t cnt = 0u;
  metadata_builder.Stream("/primitive").Category(xviz::StreamMetadata::PRIMITIVE).Type(xviz::StreamMetadata::POLYGON);
  for (auto primitive_type = xviz::StreamMetadata::PrimitiveType::StreamMetadata_PrimitiveType_CIRCLE;
            primitive_type <= xviz::StreamMetadata::PrimitiveType::StreamMetadata_PrimitiveType_TEXT;
            primitive_type = (xviz::StreamMetadata::PrimitiveType)((int) primitive_type + 1)) {
    for (auto cnt = 0u; cnt < 3u; cnt++) {
      std::string name = "/primitive/" + xviz::StreamMetadata::PrimitiveType_Name(primitive_type);
      name += suffix[cnt];
      metadata_builder.Stream(name)
                        .Category(xviz::StreamMetadata::PRIMITIVE)
                        .Type(primitive_type);
    }
  }
  return metadata_builder;
}

xviz::XVIZMetadataBuilder xviz::test::GetBuilderTestMetadataBuilderForTimeSeries() {
  xviz::XVIZMetadataBuilder metadata_builder;
  metadata_builder.Stream("/vehicle_pose").Category(xviz::StreamMetadata::POSE);
  for (auto ts_type = xviz::StreamMetadata::ScalarType::StreamMetadata_ScalarType_FLOAT;
       ts_type <= xviz::StreamMetadata::ScalarType::StreamMetadata_ScalarType_BOOL;
       ts_type = (xviz::StreamMetadata::ScalarType)((int) ts_type + 1)) {
    std::string name = "/ts/" + xviz::StreamMetadata::ScalarType_Name(ts_type);
    metadata_builder.Stream(name).Category(xviz::StreamMetadata::TIME_SERIES)
      .Type(ts_type);
  }
  return metadata_builder;
}

xviz::XVIZMetadataBuilder xviz::test::GetBuilderTestMetadataBuilderForUIPrimitive() {
  xviz::XVIZMetadataBuilder metadata_builder;
  metadata_builder.Stream("/vehicle_pose").Category(xviz::StreamMetadata::POSE);
  metadata_builder.Stream("/ui/1").Category(xviz::StreamMetadata::UI_PRIMITIVE);
  metadata_builder.Stream("/ui/2").Category(xviz::StreamMetadata::UI_PRIMITIVE);
  return metadata_builder;
}

nlohmann::json xviz::test::GetTestMetadataExpectedJson() {
  std::string expected_str =
      "{\"log_info\":{\"end_time\":1010,\"start_time\":1000},\"streams\":{\"/camera/images0\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"IMAGE\"},\"/object/circles\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"CIRCLE\"},\"/object/shape\":{\"category\":\"PRIMITIVE\",\"coordinate\":\"VEHICLE_RELATIVE\",\"primitive_type\":\"POLYGON\",\"stream_style\":{\"fill_color\":\"#fff\"},\"style_classes\":[{\"name\":\"name1\",\"style\":{\"fill_color\":\"#fff\"}}]},\"/object/shape2\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYGON\",\"transform\":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]},\"/object/stadium\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"STADIUM\"},\"/object/text\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"TEXT\"},\"/object/ts\":{\"category\":\"TIME_SERIES\",\"scalar_type\":\"STRING\",\"units\":\"m/s\"},\"/object/uptest\":{\"category\":\"UI_PRIMITIVE\",\"source\":\"unknown source\"},\"/vehicle_pose\":{\"category\":\"POSE\"}},\"ui_config\":{\"Camera\":{\"children\":[{\"cameras\":[\"/camera/images0\"],\"type\":\"VIDEO\"}],\"name\":\"Camera\",\"type\":\"panel\"},\"Metrics\":{\"children\":[{\"children\":[{\"description\":\"123\",\"streams\":[\"/object/ts\"],\"title\":\"123\",\"type\":\"METRIC\"},{\"description\":\"123\",\"streams\":[\"/object/ts\"],\"title\":\"123\",\"type\":\"METRIC\"},{\"description\":\"123\",\"streams\":[\"/object/ts\"],\"title\":\"123\",\"type\":\"METRIC\"}],\"name\":\"metrics\",\"type\":\"CONTAINER\"}],\"name\":\"Metrics\",\"type\":\"panel\"},\"Plot\":{\"children\":[{\"dependent_variables\":[\"ddd\",\"aaa\"],\"description\":\"des\",\"independent_variable\":\"indep_var\",\"title\":\"title\",\"type\":\"PLOT\"}],\"name\":\"Plot\",\"type\":\"panel\"},\"Table\":{\"children\":[{\"description\":\"des\",\"display_object_id\":true,\"stream\":\"/some_stream/table\",\"title\":\"title\",\"type\":\"TABLE\"}],\"name\":\"Table\",\"type\":\"panel\"}},\"version\":\"2.0.0\"}";
  return nlohmann::json::parse(expected_str);
}

xviz::XVIZBuilder xviz::test::GetTestUpdateBuilder(
    const std::shared_ptr<xviz::Metadata>& metadata) {
  std::string s = "{\"fill_color\": \"#fff\"}";
  std::string s1 =
      "{\"fill_color\": \"#fff\", \"point_color_mode\": "
      "\"DISTANCE_TO_VEHICLE\"}";
  xviz::XVIZBuilder builder(metadata);
  builder.Pose("/vehicle_pose")
      .Timestamp(1000)
      .MapOrigin(0.00, 0.00, 0.000)
      .Orientation(0, 0, 0);

  builder.Primitive("/object/shape")
      .Polygon({10, 14, 0, 7, 10, 0, 13, 6, 0})
      .Polygon({-2, 20, 0, 5, 14, 0, 8, 17, 0, 1, 23, 0})
      .Style(s);
  builder.Primitive("/object/shape2").Points({1, 2, 3}).Colors({0, 1, 2, 3});

  builder.Primitive("/object/circles").Circle({1, 2, 3}, 1.0).Style(s);

  builder.Primitive("/object/text").Text("hello world").Position({1, 2, 3});

  builder.Primitive("/object/stadium").Stadium({0, 0, 0}, {1, 1, 1}, 10);

  builder.Primitive("/camera/images0").Image("123231");

  builder.TimeSeries("/object/ts").Id("123").Timestamp(123).Value("123");

  builder.UIPrimitive("/object/uptest")
      // .TreeTable(std::vector<xviz::TreeTableColumn>())
      .Row(1, {"123"});
  return builder;
}

std::string xviz::test::ConvertBinaryToReadableChar(const std::string& input) {
  std::ostringstream oss;
  for (unsigned char c : input) {
    if (std::isprint(c)) {
      oss << c;
    } else {
      std::ostringstream tmp_oss;
      tmp_oss << "\\x" << std::setw(2) << std::setfill('0') << std::hex << (int)c;
      oss << tmp_oss.str();
    }
  }
  return oss.str();
}