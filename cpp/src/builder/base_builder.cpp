/*
 * File: base_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 7th December 2019 2:44:22 pm
 */

#include "xviz/builder/base_builder.h"

using namespace xviz;


std::unordered_map<xviz::StreamMetadata::PrimitiveType,
    std::unordered_map<std::string, bool>>  // {field_name, is_per_object}
  XVIZBaseBuilder::primitive_style_map_ = 
  {
    {
      Primitive::StreamMetadata_PrimitiveType_CIRCLE, {
        {"opacity", false},
        {"stroked", false},
        {"filled", false},
        {"stroke_color", true},
        {"fill_color", true},
        {"radius", true},
        {"radius_min_pixels", false},
        {"radius_max_pixels", false},
        {"stroke_width", true},
        {"stroke_width_min_pixels", false},
        {"stroke_width_max_pixels", false}
      }
    },
    {
      Primitive::StreamMetadata_PrimitiveType_IMAGE, {
      }
    },
    {
      Primitive::StreamMetadata_PrimitiveType_POINT, {
        {"opacity", false},
        {"fill_color", false},
        {"radius_pixels", false},
        {"point_color_mode", false},
        {"point_color_domain", false},
      }
    },
    {
      Primitive::StreamMetadata_PrimitiveType_POLYGON, {
        {"stroke_color", true},
        {"fill_color", true},
        {"stroke_width", true},
        {"stroke_width_min_pixels", false},
        {"stroke_width_max_pixels", false},
        {"height", true},
        {"opacity", false},
        {"stroked", false},
        {"filled", false},
        {"extruded", false},
      }
    },
    {
      Primitive::StreamMetadata_PrimitiveType_POLYLINE, {
        {"opacity", false},
        {"stroke_color", true},
        {"stroke_width", true},
        {"stroke_width_min_pixels", false},
        {"stroke_width_max_pixels", false},
      }
    },
    {
      Primitive::StreamMetadata_PrimitiveType_TEXT, {
        {"opacity", false},
        {"font_family", false},
        {"font_weight", false},
        {"text_size", true},
        {"text_rotation", true},
        {"text_anchor", true},
        {"text_baseline", true},
        {"fill_color", true},
      }
    },
    {
      Primitive::StreamMetadata_PrimitiveType_STADIUM, {
        {"opacity", false},
        {"fill_color", true},
        {"radius", true},
        {"radius_min_pixels", false},
        {"radius_max_pixels", false},
      }
    }
  };


template <typename T>
void ValidateStyleObjectOrStyleValue(xviz::StreamMetadata::PrimitiveType primitive_type, 
  const std::shared_ptr<T>& style, bool is_object_style) {
  if (XVIZBaseBuilder::primitive_style_map_.find(primitive_type) == XVIZBaseBuilder::primitive_style_map_.end()) {
    XVIZ_LOG_WARNING("Type: %s is not supported currently.", xviz::StreamMetadata::PrimitiveType_Name(primitive_type).c_str());
    return;
  }

  auto desc = style->GetDescriptor();
  auto refl = style->GetReflection();
  std::vector<std::string> invalid_field_names;
  std::vector<std::string> invalid_per_object_style_names;
  std::vector<const google::protobuf::FieldDescriptor * > all_fields_set;
  std::vector<std::string> all_fields_set_names;
  refl->ListFields(*style, &all_fields_set);
  for (const auto& field : all_fields_set) {
    all_fields_set_names.push_back(field->name());
  }

  for (const auto& field_set_name : all_fields_set_names) {
    if ((XVIZBaseBuilder::primitive_style_map_)[primitive_type].find(field_set_name) == 
        (XVIZBaseBuilder::primitive_style_map_)[primitive_type].end()) {
      invalid_field_names.push_back(field_set_name);
      continue;
    }
    if (is_object_style && 
        !(XVIZBaseBuilder::primitive_style_map_)[primitive_type][field_set_name]) {
      invalid_per_object_style_names.push_back(field_set_name);
    }
  }

  if (!invalid_field_names.empty()) {
    XVIZ_LOG_WARNING("Primitive type: %s does not have these style options: %s.", xviz::StreamMetadata::PrimitiveType_Name(primitive_type).c_str(),
        xviz::VectorToString(invalid_field_names).c_str());
  }
  if (!invalid_per_object_style_names.empty()) {
    XVIZ_LOG_WARNING("Primitive type: %s cannot set these style options: %s per object. You should set these styles in the metadata.", 
        xviz::StreamMetadata::PrimitiveType_Name(primitive_type).c_str(),
        xviz::VectorToString(invalid_per_object_style_names).c_str());
  }
}

XVIZBaseBuilder::XVIZBaseBuilder(Category category, const std::shared_ptr<xviz::Metadata>& metadata) {
  category_ = category;
  metadata_ = metadata;
}

void XVIZBaseBuilder::DeepCopyFrom(const XVIZBaseBuilder& other) {
  stream_id_ = other.stream_id_;
  category_ = other.category_;
  if (other.metadata_ != nullptr) {
    metadata_ = std::make_shared<xviz::Metadata>();
    metadata_->CopyFrom(*other.metadata_);
  }
}

void XVIZBaseBuilder::Validate() {
  ValidateMatchMetadata();
}

void XVIZBaseBuilder::ValidateMatchMetadata() {
  if (metadata_ == nullptr) {
    XVIZ_LOG_WARNING("Metadata is missing.");
  } else if (metadata_->streams().find(stream_id_) == metadata_->streams().end()) {
    XVIZ_LOG_WARNING("%s is not defined in metadata.", stream_id_.c_str());
  } else {
    auto cat = (*(metadata_->streams().find(stream_id_))).second.category();
    if (cat != category_) {
      XVIZ_LOG_WARNING("Stream %s category %s does not match metadata definition %s", stream_id_.c_str(), 
        StreamMetadata::Category_Name(category_).c_str(), StreamMetadata::Category_Name(cat).c_str());
    }
  }
}

void XVIZBaseBuilder::ValidateStyle(xviz::StreamMetadata::PrimitiveType primitive_type, std::shared_ptr<xviz::StyleObjectValue> style_object) {
  ValidateStyleObjectOrStyleValue(primitive_type, style_object, true);
}

void XVIZBaseBuilder::ValidateStyle(xviz::StreamMetadata::PrimitiveType primitive_type, std::shared_ptr<xviz::StyleStreamValue> style_stream) {
  ValidateStyleObjectOrStyleValue(primitive_type, style_stream, false);
}

// std::shared_ptr<XVIZBaseBuilder> XVIZBaseBuilder::Stream(std::string stream_id) {
//   if (stream_id_.size() != 0) {
//     this->Flush();
//   }
//   stream_id_ = std::move(stream_id);
//   return shared_from_this();
// }