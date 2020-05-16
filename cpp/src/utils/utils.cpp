/*
 * File: utils.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 24th December 2019 8:42:41 pm
 */

#include "xviz/utils/utils.h"


using Json = nlohmann::json;

std::string ToUpper(const std::string& input) {
  auto output = input;
  for (char& c : output) {
    if (c >= 'a' && c <= 'z') {
      c += ('A' - 'a');
    }
  }
  return output;
}


std::shared_ptr<xviz::StyleObjectValue> xviz::JsonObjectToStyleObject(const nlohmann::json& json_ori) {
  auto json = json_ori;
  auto style_object = std::make_shared<xviz::StyleObjectValue>();
  auto desc = style_object->GetDescriptor();
  std::vector<std::string> invalid_json_fields;
  for (auto json_itr = json.begin(); json_itr != json.end(); json_itr++) {
    auto field_ptr = desc->FindFieldByLowercaseName(json_itr.key());
    if (!field_ptr) {
      invalid_json_fields.push_back(json_itr.key());
      continue;
    }
    if (std::string(json_itr->type_name()) == "string") {
      auto pb_type_name = std::string(field_ptr->cpp_type_name());
      if (std::string(pb_type_name) == "enum") {
        json[json_itr.key()] = ToUpper(json_itr->get<std::string>());
      }
    }
  }
  for (const auto& invalid_key : invalid_json_fields) {
    json.erase(invalid_key);
  }
  if (!invalid_json_fields.empty()) {
    XVIZ_LOG_WARNING("Keys: %s are invalid in StyleObject.", VectorToString(invalid_json_fields).c_str());
  }
  auto status = google::protobuf::util::JsonStringToMessage(json.dump(), style_object.get());
  if (!status.ok()) {
    XVIZ_LOG_WARNING("Parse style object json (%s) with error: %s, not parsing this one.", json_ori.dump().c_str(),
      status.ToString().c_str());
  }
  return style_object;

  // for (auto i = 0; i < desc->field_count(); i++) {
  //   auto field_name = desc->field(i)->name();
  //   auto field_type = std::string(desc->field(i)->type_name());
  // }


  // if (json.find("fill_color") != json.end()) {
  //   auto fill_color = json.value("fill_color", "#FFFFFF");
  //   style_object->set_fill_color(fill_color.c_str());
  //   json.erase("fill_color");
  // }

  // if (json.find("stroke_color") != json.end()) {
  //   auto stroke_color = json.value("stroke_color", "#FFFFFF");
  //   style_object->set_stroke_color(stroke_color);
  //   json.erase("stroke_color");
  // }

  // if (json.find("stroke_width") != json.end()) {
  //   auto stroke_width = json.value("stroke_width", 1.0);
  //   style_object->set_stroke_width(stroke_width);
  //   json.erase("stroke_width");
  // }

  // if (json.find("radius") != json.end()) {
  //   auto radius = json.value("radius", 1.0);
  //   style_object->set_radius(radius);
  //   json.erase("radius");
  // }

  // if (json.find("text_size") != json.end()) {
  //   auto text_size = json.value("text_size", 1.0);
  //   style_object->set_text_size(text_size);
  //   json.erase("text_size");
  // }

  // if (json.find("text_rotation") != json.end()) {
  //   auto text_rotation = json.value("text_rotation", 0.0);
  //   style_object->set_text_rotation(text_rotation);
  //   json.erase("text_rotation");
  // }

  // if (json.find("text_anchor") != json.end()) {
  //   auto text_anchro_str = ToUpper(json.value("text_anchor", "TEXT_ANCHOR_INVALID"));
  //   xviz::TextAnchor text_anchor = xviz::TextAnchor::TEXT_ANCHOR_INVALID;
  //   if (xviz::TextAnchor_Parse(text_anchro_str, &text_anchor)) {
  //     style_object->set_text_anchor(text_anchor);
  //   }
  //   json.erase("text_anchor");
  // }

  // if (json.find("text_baseline") != json.end()) {
  //   auto text_baseline_str = ToUpper(json.value("text_baseline", "TEXT_ALIGNMENT_BASELINE_INVALID"));
  //   xviz::TextAlignmentBaseline text_baseline = xviz::TextAlignmentBaseline::TEXT_ALIGNMENT_BASELINE_INVALID;
  //   if (xviz::TextAlignmentBaseline_Parse(text_baseline_str, &text_baseline)) {
  //     style_object->set_text_baseline(text_baseline);
  //   }
  //   json.erase("text_baseline");
  // }

  // if (json.find("height") != json.end()) {
  //   auto height = json.value("height", 1.0);
  //   style_object->set_height(height);
  //   json.erase("height");
  // }

  // if (json.size() != 0) {
  //   for (auto json_itr = json.begin(); json_itr != json.end(); json_itr++) {
  //     XVIZ_LOG_WARNING("Key: %s is not valid in a StyleObject.", json_itr.key().c_str());
  //   }
  // }
  // return style_object;
}

// std::shared_ptr<xviz::StyleObjectValue> xviz::JsonObjectToStyleObject(nlohmann::json&& json) {
//   auto style_object = std::make_shared<xviz::StyleObjectValue>();
//   if (json.find("fill_color") != json.end()) {
//     auto fill_color = json.value("fill_color", "#FFFFFF");
//     style_object->set_fill_color(fill_color.c_str());
//   }

//   if (json.find("stroke_color") != json.end()) {
//     auto stroke_color = json.value("stroke_color", "#FFFFFF");
//     style_object->set_stroke_color(stroke_color);
//   }

//   if (json.find("stroke_width") != json.end()) {
//     auto stroke_width = json.value("stroke_width", 1.0);
//     style_object->set_stroke_width(stroke_width);
//   }

//   if (json.find("radius") != json.end()) {
//     auto radius = json.value("radius", 1.0);
//     style_object->set_radius(radius);
//   }

//   if (json.find("text_size") != json.end()) {
//     auto text_size = json.value("text_size", 1.0);
//     style_object->set_text_size(text_size);
//   }

//   if (json.find("text_rotation") != json.end()) {
//     auto text_rotation = json.value("text_rotation", 0.0);
//     style_object->set_text_rotation(text_rotation);
//   }

//   if (json.find("text_anchor") != json.end()) {
//     XVIZ_LOG_ERROR("TEXT ANCHOR STYLE NOT IMPLEMENTED");
//     throw std::runtime_error("not implement");
//   }

//   if (json.find("text_baseline") != json.end()) {
//     XVIZ_LOG_ERROR("TEXT BASELINE STYLE NOT IMPLEMENTED");
//     throw std::runtime_error("not implement");
//   }

//   if (json.find("height") != json.end()) {
//     auto height = json.value("height", 1.0);
//     style_object->set_height(height);
//   }
//   return style_object;
// }

std::shared_ptr<xviz::StyleObjectValue> xviz::JsonStringToStyleObject(const std::string& json_str) {
  return JsonObjectToStyleObject(Json::parse(json_str));
}

// std::shared_ptr<xviz::StyleObjectValue> xviz::JsonStringToStyleObject(std::string&& json_str) {
//   return JsonObjectToStyleObject(Json::parse(std::move(json_str)));
// }

std::shared_ptr<xviz::StyleStreamValue> xviz::JsonObjectToStyleStream(const nlohmann::json& json_ori) {
  auto style_stream = std::make_shared<xviz::StyleStreamValue>();
  auto json = json_ori;

  auto desc = style_stream->GetDescriptor();
  std::vector<std::string> invalid_json_fields;
  for (auto json_itr = json.begin(); json_itr != json.end(); json_itr++) {
    auto field_ptr = desc->FindFieldByLowercaseName(json_itr.key());
    if (!field_ptr) {
      invalid_json_fields.push_back(json_itr.key());
      continue;
    }
    if (std::string(json_itr->type_name()) == "string") {
      auto pb_type_name = std::string(field_ptr->cpp_type_name());
      if (std::string(pb_type_name) == "enum") {
        json[json_itr.key()] = ToUpper(json_itr->get<std::string>());
      }
    }
  }
  for (const auto& invalid_key : invalid_json_fields) {
    json.erase(invalid_key);
  }
  if (!invalid_json_fields.empty()) {
    XVIZ_LOG_WARNING("Keys: %s are invalid in StyleStream.", VectorToString(invalid_json_fields).c_str());
  }
  auto status = google::protobuf::util::JsonStringToMessage(json.dump(), style_stream.get());
  if (!status.ok()) {
    XVIZ_LOG_WARNING("Parse style stream json (%s) with error: %s, not parsing this one.", json_ori.dump().c_str(),
      status.ToString().c_str());
  }

  return style_stream;



  // if (json.find("fill_color") != json.end()) {
  //   auto fill_color = json.value("fill_color", "#FFFFFF");
  //   style_stream->set_fill_color(fill_color.c_str());
  // }

  // if (json.find("stroke_color") != json.end()) {
  //   auto stroke_color = json.value("stroke_color", "#FFFFFF");
  //   style_stream->set_stroke_color(stroke_color);
  // }

  // if (json.find("stroke_width") != json.end()) {
  //   auto stroke_width = json.value("stroke_width", 1.0);
  //   style_stream->set_stroke_width(stroke_width);
  // }

  // if (json.find("radius") != json.end()) {
  //   auto radius = json.value("radius", 1.0);
  //   style_stream->set_radius(radius);
  // }

  // if (json.find("text_size") != json.end()) {
  //   auto text_size = json.value("text_size", 1.0);
  //   style_stream->set_text_size(text_size);
  // }

  // if (json.find("text_rotation") != json.end()) {
  //   auto text_rotation = json.value("text_rotation", 0.0);
  //   style_stream->set_text_rotation(text_rotation);
  // }

  // if (json.find("text_anchor") != json.end()) {
  //   XVIZ_LOG_ERROR("TEXT ANCHOR STYLE NOT IMPLEMENTED");
  //   throw std::runtime_error("not implement");
  // }

  // if (json.find("text_baseline") != json.end()) {
  //   XVIZ_LOG_ERROR("TEXT BASELINE STYLE NOT IMPLEMENTED");
  //   throw std::runtime_error("not implement");
  // }

  // if (json.find("height") != json.end()) {
  //   auto height = json.value("height", 1.0);
  //   style_stream->set_height(height);
  // }

  // if (json.find("radius_min_pixels") != json.end()) {
  //   auto raidus_min_pixels = json.value("radius_min_pixels", 1u);
  //   style_stream->set_radius_min_pixels(raidus_min_pixels);
  // }

  // if (json.find("radius_max_pixels") != json.end()) {
  //   auto raidus_max_pixels = json.value("radius_max_pixels", 1u);
  //   style_stream->set_radius_max_pixels(raidus_max_pixels);
  // }

  // if (json.find("stroke_width_min_pixels") != json.end()) {
  //   auto stroke_width_min_pixels = json.value("stroke_width_min_pixels", 1u);
  //   style_stream->set_stroke_width_min_pixels(stroke_width_min_pixels);
  // }

  // if (json.find("stroke_width_max_pixels") != json.end()) {
  //   auto stroke_width_max_pixels = json.value("stroke_width_max_pixels", 1u);
  //   style_stream->set_stroke_width_max_pixels(stroke_width_max_pixels);
  // }

  // if (json.find("opacity") != json.end()) {
  //   auto opacity = json.value("opacity", 0.0);
  //   style_stream->set_opacity(opacity);
  // }

  // if (json.find("stroked") != json.end()) {
  //   auto stroked = json.value("stroked", false);
  //   style_stream->set_stroked(stroked);
  // }

  // if (json.find("filled") != json.end()) {
  //   auto filled = json.value("filled", false);
  //   style_stream->set_filled(filled);
  // }

  // if (json.find("extruded") != json.end()) {
  //   auto extruded = json.value("extruded", false);
  //   style_stream->set_extruded(extruded);
  // }

  // if (json.find("radius_pixels") != json.end()) {
  //   auto radius_pixels = json.value("radius_pixels", 1u);
  //   style_stream->set_radius_pixels(radius_pixels);
  // }

  // if (json.find("font_weight") != json.end()) {
  //   auto font_weight = json.value("font_weight", 1u);
  //   style_stream->set_font_weight(font_weight);
  // }

  // if (json.find("font_family") != json.end()) {
  //   XVIZ_LOG_ERROR("FONT FAMILY STYLE NOT IMPLEMENTED");
  //   throw std::runtime_error("not implemented");
  // }

  // if (json.find("point_color_mode") != json.end()) {
  //   auto point_color_mode_str = ToUpper(json.value("point_color_mode", "DISTANCE_TO_VEHICLE"));
  //   xviz::PointColorMode point_color_mode = xviz::PointColorMode::POINT_COLOR_MODE_INVALID;
  //   if (xviz::PointColorMode_Parse(point_color_mode_str, &point_color_mode)) {
  //     style_stream->set_point_color_mode(point_color_mode);
  //   }
  // }
  // return style_stream;
}

// std::shared_ptr<xviz::StyleStreamValue> xviz::JsonObjectToStyleStream(nlohmann::json&& json) {
//   auto style_stream = std::make_shared<xviz::StyleStreamValue>();
//   if (json.find("fill_color") != json.end()) {
//     auto fill_color = json.value("fill_color", "#FFFFFF");
//     style_stream->set_fill_color(fill_color.c_str());
//   }

//   if (json.find("stroke_color") != json.end()) {
//     auto stroke_color = json.value("stroke_color", "#FFFFFF");
//     style_stream->set_stroke_color(stroke_color);
//   }

//   if (json.find("stroke_width") != json.end()) {
//     auto stroke_width = json.value("stroke_width", 1.0);
//     style_stream->set_stroke_width(stroke_width);
//   }

//   if (json.find("radius") != json.end()) {
//     auto radius = json.value("radius", 1.0);
//     style_stream->set_radius(radius);
//   }

//   if (json.find("text_size") != json.end()) {
//     auto text_size = json.value("text_size", 1.0);
//     style_stream->set_text_size(text_size);
//   }

//   if (json.find("text_rotation") != json.end()) {
//     auto text_rotation = json.value("text_rotation", 0.0);
//     style_stream->set_text_rotation(text_rotation);
//   }

//   if (json.find("text_anchor") != json.end()) {
//     XVIZ_LOG_ERROR("TEXT ANCHOR STYLE NOT IMPLEMENTED");
//     throw std::runtime_error("not implement");
//   }

//   if (json.find("text_baseline") != json.end()) {
//     XVIZ_LOG_ERROR("TEXT BASELINE STYLE NOT IMPLEMENTED");
//     throw std::runtime_error("not implement");
//   }

//   if (json.find("height") != json.end()) {
//     auto height = json.value("height", 1.0);
//     style_stream->set_height(height);
//   }

//   if (json.find("radius_min_pixels") != json.end()) {
//     auto raidus_min_pixels = json.value("radius_min_pixels", 1u);
//     style_stream->set_radius_min_pixels(raidus_min_pixels);
//   }

//   if (json.find("radius_max_pixels") != json.end()) {
//     auto raidus_max_pixels = json.value("radius_max_pixels", 1u);
//     style_stream->set_radius_max_pixels(raidus_max_pixels);
//   }

//   if (json.find("stroke_width_min_pixels") != json.end()) {
//     auto stroke_width_min_pixels = json.value("stroke_width_min_pixels", 1u);
//     style_stream->set_stroke_width_min_pixels(stroke_width_min_pixels);
//   }

//   if (json.find("stroke_width_max_pixels") != json.end()) {
//     auto stroke_width_max_pixels = json.value("stroke_width_max_pixels", 1u);
//     style_stream->set_stroke_width_max_pixels(stroke_width_max_pixels);
//   }

//   if (json.find("opacity") != json.end()) {
//     auto opacity = json.value("opacity", 0.0);
//     style_stream->set_opacity(opacity);
//   }

//   if (json.find("stroked") != json.end()) {
//     auto stroked = json.value("stroked", false);
//     style_stream->set_stroked(stroked);
//   }

//   if (json.find("filled") != json.end()) {
//     auto filled = json.value("filled", false);
//     style_stream->set_filled(filled);
//   }

//   if (json.find("extruded") != json.end()) {
//     auto extruded = json.value("extruded", false);
//     style_stream->set_extruded(extruded);
//   }

//   if (json.find("radius_pixels") != json.end()) {
//     auto radius_pixels = json.value("radius_pixels", 1u);
//     style_stream->set_radius_pixels(radius_pixels);
//   }

//   if (json.find("font_weight") != json.end()) {
//     auto font_weight = json.value("font_weight", 1u);
//     style_stream->set_font_weight(font_weight);
//   }

//   if (json.find("font_family") != json.end()) {
//     XVIZ_LOG_ERROR("FONT FAMILY STYLE NOT IMPLEMENTED");
//     throw std::runtime_error("not implemented");
//   }

//   if (json.find("point_color_mode") != json.end()) {
//     auto point_color_mode_str = ToUpper(json.value("point_color_mode", "DISTANCE_TO_VEHICLE"));
//     std::cerr << point_color_mode_str << std::endl;
//     xviz::PointColorMode point_color_mode = xviz::PointColorMode::POINT_COLOR_MODE_INVALID;
//     if (xviz::PointColorMode_Parse(point_color_mode_str, &point_color_mode)) {
//       style_stream->set_point_color_mode(point_color_mode);
//     } else {
//       std::cerr << "parse not success" << std::endl;
//     }
//   }
//   return style_stream;
// }

std::shared_ptr<xviz::StyleStreamValue> xviz::JsonStringToStyleStream(const std::string& json_str) {
  return JsonObjectToStyleStream(Json::parse(json_str));
}

// std::shared_ptr<xviz::StyleStreamValue> xviz::JsonStringToStyleStream(std::string&& json_str) {
//   return JsonObjectToStyleStream(Json::parse(std::move(json_str)));
// }

std::string xviz::AllEnumOptionNames(const google::protobuf::EnumDescriptor* enum_desc) {
  std::vector<std::string> names;
  for (int i = 0; i < enum_desc->value_count(); i++) {
    names.push_back(enum_desc->value(i)->full_name());
  }
  return VectorToString(names);
}