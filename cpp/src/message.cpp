/*
 * File: message.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 17th December 2019 2:42:17 am
 */

#include "xviz/message.h"

using Json = nlohmann::json;
using namespace xviz;

void UnravelStyle(nlohmann::json& style_json, const std::string& style_name) {
  if (style_json.find(style_name) != style_json.end()) {
    style_json[style_name] = base64_decode(style_json[style_name]);
  }
}

Json MessageObjectToJson(std::shared_ptr<google::protobuf::Message> data) {
  if (data == nullptr) {
    throw std::runtime_error(
        "dynamic cast from StreamSet to google::protobuf::Message error");
    return Json();
  }
  std::string json_str;
  google::protobuf::util::JsonOptions options;
  options.preserve_proto_field_names = true;
  google::protobuf::util::MessageToJsonString(*data, &json_str, options);
  auto json = Json::parse(json_str);

  // process colors and style
  // update message
  if (json.find("updates") != json.end()) {
    if (json["updates"].is_array()) {
      for (auto& value : json["updates"]) {
        if (value.find("primitives") != value.end()) {
          for (auto& item : value["primitives"].items()) {
            if (item.value().find("points") != item.value().end()) {
              auto& point_items = item.value()["points"];
              for (auto& point_item : point_items) {
                if (point_item.find("colors") != point_item.end()) {
                  auto encoded_colors = point_item["colors"].get<std::string>();
                  auto decoded_colors = base64_decode(encoded_colors);
                  std::vector<unsigned char> colors(decoded_colors.begin(),
                                                    decoded_colors.end());
                  point_item["colors"] = std::move(colors);
                }
              }
            }
            for (auto& primitive_item : item.value()) {
              for (auto& property_item : primitive_item) {
                if (property_item.find("base") != property_item.end() &&
                    property_item["base"].find("style") !=
                        property_item["base"].end()) {
                  UnravelStyle(property_item["base"]["style"], "fill_color");
                  UnravelStyle(property_item["base"]["style"], "stroke_color");
                }
              }
            }
          }
        }
      }
    }
  }

  // process style
  // metadata message
  if (json.find("streams") != json.end()) {
    for (auto& metadata_stream_itr : json["streams"].items()) {
      auto& metadata_stream_value = metadata_stream_itr.value();
      if (metadata_stream_value.find("stream_style") !=
          metadata_stream_value.end()) {
        UnravelStyle(metadata_stream_value["stream_style"], "fill_color");
        UnravelStyle(metadata_stream_value["stream_style"], "stroke_color");
      }
      if (metadata_stream_value.find("style_classes") !=
          metadata_stream_value.end()) {
        for (auto& style_class : metadata_stream_value["style_classes"]) {
          UnravelStyle(style_class["style"], "fill_color");
          UnravelStyle(style_class["style"], "stroke_color");
        }
      }
    }
  }

  return json;
}

std::string MessageObjectToString(
    std::shared_ptr<google::protobuf::Message> data) {
  // if (data == nullptr) {
  //   throw std::runtime_error("dynamic cast from StreamSet to
  //   google::protobuf::Message error"); return Json();
  // }
  // std::string json_str;
  // google::protobuf::util::JsonOptions options;
  // options.preserve_proto_field_names = true;
  // google::protobuf::util::MessageToJsonString(*data, &json_str, options);
  return MessageObjectToJson(data).dump();
}

XVIZFrame::XVIZFrame(std::shared_ptr<StreamSet> data) : data_(data) {}

Json XVIZFrame::ToObject(bool unravel) {
  auto message_ptr =
      std::dynamic_pointer_cast<google::protobuf::Message>(data_);
  return MessageObjectToJson(message_ptr);
  // if (message_ptr == nullptr) {
  //   throw std::runtime_error("dynamic cast from StreamSet to
  //   google::protobuf::Message error"); return Json();
  // }
  // std::string json_str;
  // google::protobuf::util::MessageToJsonString(*message_ptr, &json_str);
  // return Json(json_str);
}

std::string XVIZFrame::ToObjectString(bool unravel) {
  auto message_ptr =
      std::dynamic_pointer_cast<google::protobuf::Message>(data_);
  return MessageObjectToString(message_ptr);
}

std::shared_ptr<StreamSet> XVIZFrame::Data() { return data_; }

// XVIZMessage::XVIZMessage(std::shared_ptr<StateUpdate> update,
// std::shared_ptr<Metadata> meatadata) :
//   update_(update), meatadata_(meatadata) {
// }

XVIZMessage::XVIZMessage(std::shared_ptr<Metadata> meatadata)
    : metadata_(meatadata), update_(nullptr) {}

XVIZMessage::XVIZMessage(std::shared_ptr<StateUpdate> update)
    : metadata_(nullptr), update_(update) {}

nlohmann::json XVIZMessage::ToObject(bool unravel) {
  if (update_ != nullptr) {
    auto message_ptr =
        std::dynamic_pointer_cast<google::protobuf::Message>(update_);
    if (!unravel) {
      return MessageObjectToJson(message_ptr);
    }
    return MessageObjectToJson(message_ptr);
  } else if (metadata_ != nullptr) {
    auto message_ptr =
        std::dynamic_pointer_cast<google::protobuf::Message>(metadata_);
    if (!unravel) {
      return MessageObjectToJson(message_ptr);
    }
    return MessageObjectToJson(message_ptr);
  } else {
    throw std::runtime_error("no message needs to be output");
  }
  return Json();
}

std::string XVIZMessage::ToObjectString(bool unravel) {
  if (update_ != nullptr) {
    auto message_ptr =
        std::dynamic_pointer_cast<google::protobuf::Message>(update_);
    if (!unravel) {
      return MessageObjectToString(message_ptr);
    }
    return MessageObjectToString(message_ptr);
  } else if (metadata_ != nullptr) {
    auto message_ptr =
        std::dynamic_pointer_cast<google::protobuf::Message>(metadata_);
    if (!unravel) {
      return MessageObjectToString(message_ptr);
    }
    return MessageObjectToString(message_ptr);
  } else {
    throw std::runtime_error("no message needs to be output");
  }
  return std::string();
}

std::shared_ptr<StateUpdate> XVIZMessage::GetStateUpdate() const {
  return update_;
}

std::shared_ptr<Metadata> XVIZMessage::GetMetadata() const { return metadata_; }

std::string XVIZMessage::GetSchema() const {
  return update_->descriptor()->options().GetExtension(
      xviz::v2::xviz_json_schema);
}

XVIZEnvelope::XVIZEnvelope(const XVIZMessage& message, bool is_update) {
  data_ = std::make_shared<xviz::v2::Envelope>();
  auto schema_str = message.GetSchema();
  schema_str = std::string("xviz") + schema_str.substr(schema_str.find("/"));
  data_->set_type(schema_str);
  auto data_ptr = data_->mutable_data();
  if (is_update) {
    data_ptr->PackFrom(*(message.GetStateUpdate()));
  } else {
    data_ptr->PackFrom(*(message.GetMetadata()));
  }
}

const std::shared_ptr<xviz::v2::Envelope> XVIZEnvelope::GetData() const {
  return data_;
}
