/*
 * File: test_writer.hpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 17th March 2020 6:20:29 pm
 */

#ifndef XVIZ_TEST_WRITER_H_
#define XVIZ_TEST_WRITER_H_

#include "test_utils.h"
#include "xviz/builder/xviz_builder.h"
#include "xviz/io/glb_writer.h"

#include <gtest/gtest.h>

class XVIZWriterTest : public ::testing::Test {
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
};

TEST_F(XVIZWriterTest, GLBTest) {
  auto metadata_builder = xviz::test::GetBuilderTestMetadataBuilderForPrimitive();
  auto builder = GetInitialBuilderWithMetadata(metadata_builder);


  builder.Primitive("/primitive/IMAGE/copy")
    .Image("123");

  builder.Primitive("/primitive/IMAGE/move")
    .Image("123", true);

  builder.Primitive("/primitive/IMAGE/pointer")
    .Image("", true);
  
  builder.Primitive("/primitive/POINT/copy")
    .Points({1, 2, 3}).Colors({0, 0, 0, 0});

  std::vector<double> empty_points;
  std::vector<uint8_t> empty_colors;
  builder.Primitive("/primitive/POINT/move")
    .Points(empty_points).Colors(empty_colors);

  builder.Primitive("/primitive/POINT/pointer")
    .Points({1, 2, 3}).Colors({0, 0, 0, 0, 0, 0, 0, 0});
  
  xviz::XVIZGLBWriter writer;
  std::string output;
  auto message = builder.GetMessage();
  writer.WriteMessage(output, builder.GetMessage());
  writer.WriteMessage(output, message);

  // TODO add EXPECT_EQ()
  auto readable_output = xviz::test::ConvertBinaryToReadableChar(output);
  // std::cerr << readable_output << std::endl;
}

#endif