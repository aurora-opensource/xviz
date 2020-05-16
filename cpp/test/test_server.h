/*
 * File: test_server.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Friday, 21st February 2020 1:31:11 pm
 */

#ifndef XVIZ_TEST_SERVER_H_
#define XVIZ_TEST_SERVER_H_

#include "xviz/server/xviz_server.h"
#include <gtest/gtest.h>

class XVIZServerTest : public ::testing::Test {

};

class TestSession : public xviz::XVIZBaseSession {
 public:
  TestSession() : xviz::XVIZBaseSession(nullptr) {}
  void OnConnect() override {}
  void Main() override {}
  void OnDisconnect() override {}
  std::string Name() const {return "TestSession";}
};

class TestHandler : public xviz::XVIZBaseHandler {
 public:
  TestHandler() = default;
  std::shared_ptr<xviz::XVIZBaseSession> GetSession(const std::unordered_map<std::string, std::string>& params,
    std::shared_ptr<websocketpp::connection<websocketpp::config::asio>> conn_ptr) override {
    return std::make_shared<TestSession>();
  }
};

TEST_F(XVIZServerTest, PercentDecoderPassTest) {
  std::string original_str = "hello%20world%21";
  std::string expected_decoded_str = "hello world!";
  EXPECT_EQ(expected_decoded_str, xviz::PercentDecode(original_str));

  original_str = "%3A%3Eggg%4556";
  expected_decoded_str = ":>gggE56";
  EXPECT_EQ(expected_decoded_str, xviz::PercentDecode(original_str));

  original_str = "key1=value1&key2=value2%20&key3=value3";
  expected_decoded_str = "key1=value1&key2=value2 &key3=value3";
  EXPECT_EQ(expected_decoded_str, xviz::PercentDecode(original_str));

  original_str = "%25%25%255";
  expected_decoded_str = "%%%5";
  EXPECT_EQ(expected_decoded_str, xviz::PercentDecode(original_str));
}

TEST_F(XVIZServerTest, ParametersParserNoDecodePassTest) {
  std::unordered_map<std::string, std::string> expected_param_map = {
    {"key1", "value1"},
    {"key2", "value2"},
    {"key3", "value3"},
  };
  std::string uri = "key1=value1&key2=value2&key3=value3";

  EXPECT_EQ(expected_param_map, xviz::ParseURIParameters(uri));
}

TEST_F(XVIZServerTest, ParametersParserNoDecodeFailTest) {
  std::unordered_map<std::string, std::string> expected_param_map = {
    {"key1", "value1"},
    {"key2", "value2"},
    {"key3", "value3"},
    {"key4", "value4"},
  };
  std::string uri = "key1=value1&key2=value2&key3=value3&";
  EXPECT_NE(expected_param_map, xviz::ParseURIParameters(uri));

  uri = "key1=value1&key2=value2&key3=value3&key4";
  EXPECT_NE(expected_param_map, xviz::ParseURIParameters(uri));

  uri = "key1=value1&key2=value2&key3=value3&key4=";
  EXPECT_NE(expected_param_map, xviz::ParseURIParameters(uri));

  uri = "key1=value1&key2=value2&key3=value3&key4=vvv";
  EXPECT_NE(expected_param_map, xviz::ParseURIParameters(uri));

  expected_param_map["key4"] = "vvv";
  EXPECT_EQ(expected_param_map, xviz::ParseURIParameters(uri));
}

TEST_F(XVIZServerTest, ParametersParserDecodePassTest) {
  std::unordered_map<std::string, std::string> expected_param_map = {
    {"key1", "value 1"},
    {"key2", "value%2"},
    {"key3", "value&3"},
  };
  std::string uri = "key1=value%201&key2=value%252&key3=value%263";

  EXPECT_EQ(expected_param_map, xviz::ParseURIParameters(uri));
}

TEST_F(XVIZServerTest, ServerTest) {
  auto handler_ptr = std::make_shared<TestHandler>();
  auto base_session_ptr = handler_ptr->GetSession(
    std::unordered_map<std::string, std::string>(), nullptr
  );
  auto session_ptr = std::dynamic_pointer_cast<TestSession>(base_session_ptr);

  ASSERT_NE(session_ptr, nullptr);
  ASSERT_EQ(session_ptr->Name(), "TestSession");

  xviz::XVIZServer server({handler_ptr});
}

#endif