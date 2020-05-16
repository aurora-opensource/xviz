/*
 * File: base_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 7th December 2019 2:22:21 pm
 */

#ifndef XVIZ_BASE_BUILDER_H_
#define XVIZ_BASE_BUILDER_H_

#include "xviz/utils/definitions.h"
#include "xviz/utils/macrologger.h"
#include "xviz/utils/utils.h"

#include "xviz/proto/session.pb.h"

#include <string>
#include <memory>

namespace xviz {


class XVIZBaseBuilder {
public:
  XVIZBaseBuilder() = default;
  XVIZBaseBuilder(Category category, const std::shared_ptr<xviz::Metadata>& metadata);
  void DeepCopyFrom(const XVIZBaseBuilder& other);

  static std::unordered_map<xviz::StreamMetadata::PrimitiveType,
    std::unordered_map<std::string, bool>> primitive_style_map_;
protected:
  std::string stream_id_{};
  Category category_{};
  std::shared_ptr<xviz::Metadata> metadata_{nullptr};


  void Validate();
  void ValidateStyle(xviz::StreamMetadata::PrimitiveType primitive_type, std::shared_ptr<xviz::StyleObjectValue> style_object);
  void ValidateStyle(xviz::StreamMetadata::PrimitiveType primitive_type, std::shared_ptr<xviz::StyleStreamValue> style_stream);
  void ValidateMatchMetadata();
  virtual void Flush() = 0;

  // static std::unordered_map<Primitive, std::unordered_set<std::string>> primitive_style_map_;
};

}

#endif