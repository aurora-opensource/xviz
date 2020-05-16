/*
 * File: test_all.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 10th February 2020 10:53:23 am
 */

#include <gtest/gtest.h>
#include "test_metadata.h"
#include "test_update.h"
#include "test_server.h"
#include "test_builder.hpp"
#include "test_writer.hpp"
#include "test_message.hpp"

int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}