/*
 * File: test_update.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Thursday, 20th February 2020 8:58:39 pm
 */
#ifndef XVIZ_TEST_UPDATE_H_
#define XVIZ_TEST_UPDATE_H_

#include "xviz/builder/xviz_builder.h"
#include "test_utils.h"
#include "gtest/gtest.h"

class XVIZUpdateTest : public ::testing::Test {
};

TEST_F(XVIZUpdateTest, DeepCopySameTest) {
  auto metadata_builder = xviz::test::GetTestMetadataBuilder();
  auto builder = xviz::test::GetTestUpdateBuilder(metadata_builder.GetData());
  xviz::XVIZBuilder new_builder(nullptr);
  new_builder.DeepCopyFrom(builder);
  auto builder_json = builder.GetMessage().ToObject();
  auto new_builder_json = new_builder.GetMessage().ToObject();
  ASSERT_TRUE(xviz::test::IsSameJson(builder_json, new_builder_json));
  ASSERT_FALSE(xviz::test::IsDifferentJson(builder_json, new_builder_json));
}

TEST_F(XVIZUpdateTest, DeepCopyDifferentTest) {
  auto metadata_builder = xviz::test::GetTestMetadataBuilder();
  auto builder = xviz::test::GetTestUpdateBuilder(metadata_builder.GetData());
  xviz::XVIZBuilder new_builder = builder;
  auto builder_json = builder.GetMessage().ToObject();
  auto new_builder_json = new_builder.GetMessage().ToObject();
  ASSERT_TRUE(xviz::test::IsDifferentJson(builder_json, new_builder_json));
  ASSERT_FALSE(xviz::test::IsSameJson(builder_json, new_builder_json));
}

#endif