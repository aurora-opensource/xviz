/*
 * File: protobuf_writer.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * Github: https://github.com/wx9698
 * File Created: Tuesday, 4th August 2020 9:27:43 pm
 */

#include "xviz/io/protobuf_writer.h"

std::string xviz::WriteToProtobuf(const xviz::XVIZMessage& message,
                                  bool is_update) {
  std::string prefix = "\x50\x42\x45\x31";
  std::string result;
  if (is_update) {
    auto data =
        xviz::XVIZEnvelope(message).GetData();  // message.GetStateUpdate();
    if (!data->SerializeToString(&result)) {
      XVIZ_LOG_WARNING("protobuf serialization fails");
    }
  } else {
    auto data = message.GetMetadata();
    if (!data->SerializeToString(&result)) {
      XVIZ_LOG_WARNING("protobuf serialization fails");
    }
  }
  return prefix + result;
}
