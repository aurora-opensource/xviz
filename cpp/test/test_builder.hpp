/*
 * File: test_builder.hpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 16th March 2020 9:54:04 pm
 */

#ifndef XVIZ_TEST_BUILDER_H_
#define XVIZ_TEST_BUILDER_H_

#include "xviz/builder/xviz_builder.h"
#include "test_utils.h"
#include <gtest/gtest.h>

#define TYPE_FUNC_1(FUNC_NAME, builder, base_name, vector_ori, value) \
  { \
    auto vector = vector_ori; \
    auto vec = vector; \
    auto vec_ptr = std::make_shared<decltype(vec)>(vector); \
    builder.Primitive(base_name + std::string("/copy")).FUNC_NAME(vector, value); \
    builder.Primitive(base_name + std::string("/move")).FUNC_NAME(std::move(vec), value); \
  } \
    // builder.Primitive(base_name + std::string("/pointer")).FUNC_NAME(vec_ptr, value); \

#define TYPE_FUNC_2(FUNC_NAME, builder, base_name, vector_ori) \
  { \
    auto vector = vector_ori; \
    auto vec = vector; \
    auto vec_ptr = std::make_shared<decltype(vec)>(vector); \
    builder.Primitive(base_name + std::string("/copy")).FUNC_NAME(vector); \
    builder.Primitive(base_name + std::string("/move")).FUNC_NAME(std::move(vec)); \
    builder.Primitive(base_name + std::string("/pointer")).FUNC_NAME(vec_ptr); \
  } \

#define TYPE_FUNC_3(FUNC_NAME, ADDON_FUNC_NAME, builder, base_name, vector_ori, addon_vector_ori) \
  { \
    auto vector = vector_ori; \
    auto addon_vector = addon_vector_ori; \
    auto vec = vector; \
    auto addon_vec = addon_vector; \
    auto vec_ptr = std::make_shared<decltype(vec)>(vector); \
    auto addon_vec_ptr = std::make_shared<decltype(addon_vec)>(addon_vector); \
    builder.Primitive(base_name + std::string("/copy")).FUNC_NAME(vector).ADDON_FUNC_NAME(addon_vector); \
    builder.Primitive(base_name + std::string("/move")).FUNC_NAME(std::move(vec)).ADDON_FUNC_NAME(std::move(addon_vector)); \
    builder.Primitive(base_name + std::string("/pointer")).FUNC_NAME(vec_ptr).ADDON_FUNC_NAME(addon_vec_ptr); \
  } \


class XVIZBuilderTest : public ::testing::Test {
 protected:
  xviz::XVIZBuilder GetInitialBuilderWithMetadata(xviz::XVIZMetadataBuilder& metadata_builder) {
    xviz::XVIZBuilder builder(metadata_builder.GetData());
    builder.Pose("/vehicle_pose")
      .MapOrigin(0, 0, 0)
      .Orientation(0, 0, 0)
      .Position(0, 0, 0)
      .Timestamp(1000.0);
    return builder;
  }

  std::vector<double> CreateNPointsVector(uint32_t point_size) {
    std::vector<double> points;
    for (auto i = 0u; i < point_size; i++) {
      points.push_back(3*i);
      points.push_back(3*i + 1);
      points.push_back(3*i + 2);
    }
    return points;
  }

};

TEST_F(XVIZBuilderTest, PritimiveTest) {
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForPrimitive();
  auto builder = GetInitialBuilderWithMetadata(metadata_builder);

  // circle
  TYPE_FUNC_1(Circle, builder, "/primitive/CIRCLE", CreateNPointsVector(1), 0.1);
  builder.Primitive("/primitive/CIRCLE/pointer")
    .Circle(std::make_shared<std::vector<double>>(CreateNPointsVector(1)), 0.1);

  // image
  TYPE_FUNC_1(Image, builder, "/primitive/IMAGE", std::string("123"), true);
  builder.Primitive("/primitive/IMAGE/pointer")
    .Image("AAA", false).Dimensions(100u, 100u);
  const std::string image_tmp("AAA");
  builder.Primitive("/primitive/IMAGE/pointer")
    .Image(image_tmp, false).Position({1, 2, 3});

  // point
  TYPE_FUNC_3(Points, Colors, builder, "/primitive/POINT", CreateNPointsVector(1), std::vector<uint8_t>(4, 4u));

  // polygon
  std::vector<std::string> classes_tmp = {"classes"};
  TYPE_FUNC_3(Polygon, Classes, builder, "/primitive/POLYGON", CreateNPointsVector(4), classes_tmp);
  
  // polyline
  TYPE_FUNC_3(Polyline, ObjectId, builder, "/primitive/POLYLINE", CreateNPointsVector(4), std::string("1123"));

  // stadium
  builder.Primitive("/primitive/STADIUM/copy")
    .Stadium(CreateNPointsVector(1), CreateNPointsVector(1), 0.5);

  // text
  TYPE_FUNC_3(Text, Position, builder, "/primitive/TEXT", std::string("text"), CreateNPointsVector(1));

  auto builder_json = builder.GetMessage().ToObject();
  auto expected_str = "{\"update_type\":\"SNAPSHOT\",\"updates\":[{\"poses\":{\"/vehicle_pose\":{\"map_origin\":{},\"orientation\":[0,0,0],\"position\":[0,0,0],\"timestamp\":1000}},\"primitives\":{\"/primitive/CIRCLE/copy\":{\"circles\":[{\"center\":[0,1,2],\"radius\":0.1}]},\"/primitive/CIRCLE/move\":{\"circles\":[{\"center\":[0,1,2],\"radius\":0.1}]},\"/primitive/CIRCLE/pointer\":{\"circles\":[{\"center\":[0,1,2],\"radius\":0.1}]},\"/primitive/IMAGE/copy\":{\"images\":[{\"data\":\"MTIz\",\"is_encoded\":true}]},\"/primitive/IMAGE/move\":{\"images\":[{\"data\":\"MTIz\",\"is_encoded\":true}]},\"/primitive/IMAGE/pointer\":{\"images\":[{\"data\":\"AAA\",\"height_px\":100,\"width_px\":100},{\"data\":\"AAA\",\"position\":[1,2,3]}]},\"/primitive/POINT/copy\":{\"points\":[{\"colors\":[4,4,4,4],\"points\":[0,1,2]}]},\"/primitive/POINT/move\":{\"points\":[{\"colors\":[4,4,4,4],\"points\":[0,1,2]}]},\"/primitive/POINT/pointer\":{\"points\":[{\"colors\":[4,4,4,4],\"points\":[0,1,2]}]},\"/primitive/POLYGON/copy\":{\"polygons\":[{\"base\":{\"classes\":[\"classes\"]},\"vertices\":[0,1,2,3,4,5,6,7,8,9,10,11]}]},\"/primitive/POLYGON/move\":{\"polygons\":[{\"base\":{\"classes\":[\"classes\"]},\"vertices\":[0,1,2,3,4,5,6,7,8,9,10,11]}]},\"/primitive/POLYGON/pointer\":{\"polygons\":[{\"base\":{\"classes\":[\"classes\"]},\"vertices\":[0,1,2,3,4,5,6,7,8,9,10,11]}]},\"/primitive/POLYLINE/copy\":{\"polylines\":[{\"base\":{\"object_id\":\"1123\"},\"vertices\":[0,1,2,3,4,5,6,7,8,9,10,11]}]},\"/primitive/POLYLINE/move\":{\"polylines\":[{\"base\":{\"object_id\":\"1123\"},\"vertices\":[0,1,2,3,4,5,6,7,8,9,10,11]}]},\"/primitive/POLYLINE/pointer\":{\"polylines\":[{\"base\":{\"object_id\":\"1123\"},\"vertices\":[0,1,2,3,4,5,6,7,8,9,10,11]}]},\"/primitive/STADIUM/copy\":{\"stadiums\":[{\"end\":[0,1,2],\"radius\":0.5,\"start\":[0,1,2]}]},\"/primitive/TEXT/copy\":{\"texts\":[{\"position\":[0,1,2],\"text\":\"text\"}]},\"/primitive/TEXT/move\":{\"texts\":[{\"position\":[0,1,2],\"text\":\"text\"}]},\"/primitive/TEXT/pointer\":{\"texts\":[{\"position\":[0,1,2],\"text\":\"text\"}]}},\"timestamp\":1000}]}";
  auto expected_json = nlohmann::json::parse(expected_str);

  ASSERT_TRUE(xviz::test::IsSameJson(expected_json, builder_json));
}

TEST_F(XVIZBuilderTest, PritimiveStyleTest) {
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForPrimitive();
  auto builder = GetInitialBuilderWithMetadata(metadata_builder);
  auto& primitive_builder = builder.Primitive("/primitive").Circle({1, 2, 3}, 0.1);
  std::string style_str = "{\"fill_color\": \"#ffa\"}";
  nlohmann::json style_json = nlohmann::json::parse(style_str);
  primitive_builder.Style(style_str);
  primitive_builder.Style(style_json);

  auto builder_json = builder.GetMessage().ToObject();
  auto expected_json = nlohmann::json::parse("{\"update_type\":\"SNAPSHOT\",\"updates\":[{\"poses\":{\"/vehicle_pose\":{\"map_origin\":{},\"orientation\":[0,0,0],\"position\":[0,0,0],\"timestamp\":1000}},\"primitives\":{\"/primitive\":{\"circles\":[{\"base\":{\"style\":{\"fill_color\":\"#ffa\"}},\"center\":[1,2,3],\"radius\":0.1}]}},\"timestamp\":1000}]}");
  ASSERT_TRUE(xviz::test::IsSameJson(expected_json, builder_json));
}

TEST_F(XVIZBuilderTest, PritimiveEmptyErrorTest) {
  // empty
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForPrimitive();
  auto builder = GetInitialBuilderWithMetadata(metadata_builder);
  auto empty_string = builder.GetMessage().ToObjectString();

  metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForPrimitive();
  builder = GetInitialBuilderWithMetadata(metadata_builder);
  builder.Primitive("/primitive")
    .Colors({0, 0, 0, 0}).Position({1, 2}).Dimensions(1, 1).ObjectId("123")
    .Classes({"123"});
  builder.Primitive("/primitive")
    .Stadium(CreateNPointsVector(2), CreateNPointsVector(1), 0.5);

  std::string image_tmp = "123";
  builder.Primitive("/primitive")
    .Points(nullptr)
    .Polyline(nullptr)
    .Points(nullptr)
    .Circle(nullptr, 1)
    .Image("123")
    .Image(image_tmp)
    .Text(std::shared_ptr<std::string>(nullptr))
    .Stadium({1}, {2}, 1)
    .Points({1, 2, 3}).Colors({0, 0, 0, 0, 0, 0, 0, 0});

  std::string style_str = "{\"fill_color\": \"#fff\", \"point_color_mode\": "
      "\"DISTANCE_TO_VEHICLE\"}";
  builder.Primitive("/primitive/POINT/copy").Style(style_str);

  builder.Primitive("/primitive/CIRCLE/copy").Circle({1}, 1);

  builder.Primitive("/primitive/TEXT/copy").Text("213").Position({2, 2});

  builder.Primitive("/primitive/STADIUM/copy").Stadium({1, 2, 3}, {1, 2, 3}, 1).Position({1, 2, 3});

  auto error_string = builder.GetMessage().ToObjectString();
}

TEST_F(XVIZBuilderTest, TimeSeriesTest) {
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForTimeSeries();
  metadata_builder.Stream("/ts/NONE").Category(xviz::StreamMetadata::TIME_SERIES) 
    .Type(xviz::StreamMetadata::STRING);
  auto builder = GetInitialBuilderWithMetadata(metadata_builder);
  std::string tmp = "123";
  builder.TimeSeries("/ts/STRING")
    .Id(tmp).Timestamp(123).Value(tmp);
  builder.TimeSeries("/ts/STRING")
    .Id(std::move(tmp)).Timestamp(123).Value(std::move(tmp));
  builder.TimeSeries("/ts/STRING")
    .Id("123").Timestamp(123).Value("123");
  builder.TimeSeries("/ts/STRING")
    .Id("123").Timestamp(123).Value(123);

  builder.TimeSeries("/ts/BOOL")
    .Id("1234").Timestamp(123).Value(true);

  builder.TimeSeries("/ts/INT32")
    .Id("1235").Timestamp(1234).Value(1);

  builder.TimeSeries("/ts/FLOAT")
    .Id("1236").Timestamp(123).Value(1.1);

  builder.TimeSeries("/ts/NONE")
    .Id("1236").Timestamp(123);

  builder.TimeSeries("/ts/NONE")
    .Id("1236").Timestamp(123);

  auto message = builder.GetMessage();
  auto expected_json = nlohmann::json::parse("{\"update_type\":\"SNAPSHOT\",\"updates\":[{\"timestamp\":1000,\"poses\":{\"/vehicle_pose\":{\"timestamp\":1000,\"map_origin\":{},\"position\":[0,0,0],\"orientation\":[0,0,0]}},\"time_series\":[{\"timestamp\":1234,\"object_id\":\"1235\",\"streams\":[\"/ts/INT32\"],\"values\":{\"int32s\":[1]}},{\"timestamp\":123,\"object_id\":\"1236\",\"streams\":[\"/ts/FLOAT\"],\"values\":{\"doubles\":[1.1]}},{\"timestamp\":123,\"object_id\":\"1234\",\"streams\":[\"/ts/BOOL\"],\"values\":{\"bools\":[true]}},{\"timestamp\":123,\"object_id\":\"123\",\"streams\":[\"/ts/STRING\"],\"values\":{\"int32s\":[123]}},{\"timestamp\":123,\"object_id\":\"123\",\"streams\":[\"/ts/STRING\",\"/ts/STRING\",\"/ts/STRING\"],\"values\":{\"strings\":[\"123\",\"\",\"123\"]}}]}]}");
  auto builder_json = message.ToObject();
  ASSERT_TRUE(xviz::test::IsSameJson(expected_json, builder_json));
}

TEST_F(XVIZBuilderTest, UIPrimitiveTest) {
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForUIPrimitive();
  auto builder = GetInitialBuilderWithMetadata(metadata_builder);

  auto& builder_column = builder.UIPrimitive("/ui/1")
    .Column("title", xviz::TreeTableColumn::ColumnType::TreeTableColumn_ColumnType_INT32, "m/s");
  std::vector<std::string>  values = {"123"};
  builder_column.Row(0)
      .Children(1, {"123"})
      .Children(2, values);
  builder_column.Column("title2", xviz::TreeTableColumn::ColumnType::TreeTableColumn_ColumnType_BOOLEAN)
      .Row(3, {"false"});

  builder.UIPrimitive("/ui/2")
    .Column("test", xviz::TreeTableColumn::BOOLEAN);
  auto expected_json = nlohmann::json::parse("{\"update_type\":\"SNAPSHOT\",\"updates\":[{\"poses\":{\"/vehicle_pose\":{\"map_origin\":{},\"orientation\":[0,0,0],\"position\":[0,0,0],\"timestamp\":1000}},\"timestamp\":1000,\"ui_primitives\":{\"/ui/1\":{\"treetable\":{\"columns\":[{\"display_text\":\"title\",\"type\":\"INT32\",\"unit\":\"m/s\"},{\"display_text\":\"title2\",\"type\":\"BOOLEAN\"}],\"nodes\":[{},{\"column_values\":[\"123\"],\"id\":1},{\"column_values\":[\"123\"],\"id\":2},{\"column_values\":[\"false\"],\"id\":3}]}},\"/ui/2\":{\"treetable\":{\"columns\":[{\"display_text\":\"test\",\"type\":\"BOOLEAN\"}]}}}}]}");
  auto builder_json = builder.GetMessage().ToObject();
  ASSERT_TRUE(xviz::test::IsSameJson(expected_json, builder_json));
}

TEST_F(XVIZBuilderTest, UIPrimitiveErrorTest) {
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForUIPrimitive();
  auto builder = GetInitialBuilderWithMetadata(metadata_builder);
  builder.UIPrimitive("/ui/1");//.Row(0);
  builder.UIPrimitive("/ui/2");//.Row(0);
  auto builder_json = builder.GetMessage().ToObject();
}

TEST_F(XVIZBuilderTest, XVIZBuilderNoPoseTest) {
  xviz::XVIZBuilder builder(nullptr);
  auto builder_json = builder.GetMessage().ToObject();
}
#endif
