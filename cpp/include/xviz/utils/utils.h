/*
 * File: utils.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 24th December 2019 8:39:03 pm
 */


#ifndef XVIZ_UTILS_H_
#define XVIZ_UTILS_H_

#include "xviz/utils/definitions.h"
#include "xviz/utils/macrologger.h"
#include "xviz/utils/json.hpp"
#include "xviz/proto/style.pb.h"

#include <memory>
#include <google/protobuf/util/json_util.h>
#include <sstream>

namespace xviz {

std::shared_ptr<StyleObjectValue> JsonObjectToStyleObject(const nlohmann::json& json);
// std::shared_ptr<StyleObjectValue> JsonObjectToStyleObject(nlohmann::json&& json);
std::shared_ptr<StyleObjectValue> JsonStringToStyleObject(const std::string& json_str);
// std::shared_ptr<StyleObjectValue> JsonStringToStyleObject(std::string&& json_str);
  
std::shared_ptr<StyleStreamValue> JsonObjectToStyleStream(const nlohmann::json& json);
// std::shared_ptr<StyleStreamValue> JsonObjectToStyleStream(nlohmann::json&& json);
std::shared_ptr<StyleStreamValue> JsonStringToStyleStream(const std::string& json_str);
// std::shared_ptr<StyleStreamValue> JsonStringToStyleStream(std::string&& json_str);

template<typename T>
std::string VectorToString(const std::vector<T>& vector) {
  std::string output = "[";
  std::ostringstream ss;
  if (!vector.empty()) {
    std::copy(vector.begin(), vector.end() - 1, std::ostream_iterator<T>(ss, ", "));
    ss << vector.back();
  }
  output += ss.str();
  output += "]";
  return output;
}

std::string AllEnumOptionNames(const google::protobuf::EnumDescriptor* enum_desc);

template<typename T>
void DeepCopyPtr(std::shared_ptr<T>& dest_ptr, const std::shared_ptr<T>& source_ptr) {
  if (source_ptr != nullptr) {
    dest_ptr = std::make_shared<T>(*source_ptr);
  } else {
    dest_ptr = nullptr;
  }
}
} // namespace xviz


#endif