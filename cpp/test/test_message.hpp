/*
 * File: test_message.hpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 17th March 2020 6:50:00 pm
 */

#ifndef XVIZ_TEST_MESSAGE_H_
#define XVIZ_TEST_MESSAGE_H_

#include "xviz/message.h"
#include "test_utils.h"

#include <gtest/gtest.h>

class XVIZMessageTest : public ::testing::Test {

};

TEST_F(XVIZMessageTest, MessageTest) {
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForPrimitive();
  auto metadata_str = metadata_builder.GetMessage().ToObjectString();
  auto metadata_data = metadata_builder.GetMessage().GetMetadata();

  auto expected_json = nlohmann::json::parse("{\"version\":\"2.0.0\",\"streams\":{\"/primitive/POLYGON/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYGON\"},\"/primitive/CIRCLE/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"CIRCLE\"},\"/primitive/STADIUM/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"STADIUM\"},\"/primitive/IMAGE/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"IMAGE\"},\"/primitive/TEXT/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"TEXT\"},\"/primitive\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYGON\"},\"/primitive/POINT/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POINT\"},\"/primitive/POLYLINE/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYLINE\"},\"/primitive/POLYGON/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYGON\"},\"/primitive/TEXT/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"TEXT\"},\"/primitive/STADIUM/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"STADIUM\"},\"/primitive/IMAGE/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"IMAGE\"},\"/vehicle_pose\":{\"category\":\"POSE\"},\"/primitive/STADIUM/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"STADIUM\"},\"/primitive/IMAGE/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"IMAGE\"},\"/primitive/POLYLINE/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYLINE\"},\"/primitive/CIRCLE/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"CIRCLE\"},\"/primitive/POINT/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POINT\"},\"/primitive/POLYLINE/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYLINE\"},\"/primitive/CIRCLE/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"CIRCLE\"},\"/primitive/TEXT/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"TEXT\"},\"/primitive/POLYGON/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYGON\"},\"/primitive/POINT/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POINT\"}}}");
  auto metadata_json = nlohmann::json::parse(metadata_str);
  EXPECT_TRUE(xviz::test::IsSameJson(expected_json, metadata_json));
}

TEST_F(XVIZMessageTest, FrameTest) {
  auto data = std::make_shared<xviz::StreamSet>();
  xviz::XVIZFrame frame(data);

  auto frame_json = frame.ToObject();
  auto frame_str = frame.ToObjectString();
  auto expected_json = nlohmann::json::parse("{}");

  EXPECT_TRUE(xviz::test::IsSameJson(expected_json, frame_json));
}

TEST_F(XVIZMessageTest, MessageUnravelTest) {
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForPrimitive();
  xviz::XVIZBuilder builder(metadata_builder.GetData());
  auto metadata_str_unravel = metadata_builder.GetMessage().ToObjectString(false);
  auto metadata_json_unravel = metadata_builder.GetMessage().ToObject(false);

  auto expected_json = nlohmann::json::parse("{\"version\":\"2.0.0\",\"streams\":{\"/primitive/POLYGON/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYGON\"},\"/primitive/CIRCLE/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"CIRCLE\"},\"/primitive/STADIUM/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"STADIUM\"},\"/primitive/IMAGE/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"IMAGE\"},\"/primitive/TEXT/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"TEXT\"},\"/primitive\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYGON\"},\"/primitive/POINT/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POINT\"},\"/primitive/POLYLINE/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYLINE\"},\"/primitive/POLYGON/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYGON\"},\"/primitive/TEXT/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"TEXT\"},\"/primitive/STADIUM/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"STADIUM\"},\"/primitive/IMAGE/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"IMAGE\"},\"/vehicle_pose\":{\"category\":\"POSE\"},\"/primitive/STADIUM/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"STADIUM\"},\"/primitive/IMAGE/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"IMAGE\"},\"/primitive/POLYLINE/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYLINE\"},\"/primitive/CIRCLE/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"CIRCLE\"},\"/primitive/POINT/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POINT\"},\"/primitive/POLYLINE/move\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYLINE\"},\"/primitive/CIRCLE/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"CIRCLE\"},\"/primitive/TEXT/copy\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"TEXT\"},\"/primitive/POLYGON/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POLYGON\"},\"/primitive/POINT/pointer\":{\"category\":\"PRIMITIVE\",\"primitive_type\":\"POINT\"}}}");
  auto metadata_json = nlohmann::json::parse(metadata_str_unravel);
  EXPECT_TRUE(xviz::test::IsSameJson(expected_json, metadata_json));

}

TEST_F(XVIZMessageTest, NoPoseTest) {
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForPrimitive();
  xviz::XVIZBuilder builder(metadata_builder.GetData());
  auto update_str_unravel = builder.GetMessage().ToObjectString(false);
  auto update_json_unravel = builder.GetMessage().ToObject(false);

  auto expected_json = nlohmann::json::parse("{\"update_type\":\"SNAPSHOT\",\"updates\":[{}]}");
  auto update_json = nlohmann::json::parse(update_str_unravel);
  EXPECT_TRUE(xviz::test::IsSameJson(expected_json, update_json));
}

#endif