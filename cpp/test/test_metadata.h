/*
 * File: test_metadata_json.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 10th February 2020 10:43:37 am
 */

#ifndef XVIZ_TEST_METADATA_H_
#define XVIZ_TEST_METADATA_H_

#include "xviz/builder/metadata.h"

#include "test_utils.h"

#include <gtest/gtest.h>
#include <chrono>
#include <thread>

class XVIZMetadataTest : public ::testing::Test {
 protected:

  xviz::XVIZMetadataBuilder metadata_builder_{};
  std::string expected_str_{};
  nlohmann::json expected_json_{};

  void SetUpMetadataBuilder() {
    metadata_builder_ = xviz::test::GetTestMetadataBuilder();
  }

  void SetUpExpectedValue() {
    expected_json_ = xviz::test::GetTestMetadataExpectedJson();
    expected_str_ = expected_json_.dump();
  }

  void SetUp() override {
    SetUpMetadataBuilder();
    SetUpExpectedValue();
  }
};

TEST_F(XVIZMetadataTest, SameJsonTest) {
  auto output = metadata_builder_.GetMessage().ToObject();
  ASSERT_TRUE(xviz::test::IsSameJson(expected_json_, output));
}

TEST_F(XVIZMetadataTest, NotSameJsonTest) {
  auto output = metadata_builder_.GetMessage().ToObject();
  auto tmp_json = expected_json_;
  tmp_json["dummy"] = "dummy";
  ASSERT_TRUE(xviz::test::IsDifferentJson(tmp_json, output));
}

#endif