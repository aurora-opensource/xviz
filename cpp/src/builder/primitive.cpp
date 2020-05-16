/*
 * File: primitive.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 17th December 2019 10:00:38 pm
 */

#include "xviz/builder/primitive.h"

using namespace xviz;
using Json = nlohmann::json;

// TODO: It is not correct, should be divided into per object
// and per stream


template<typename T>
void AddVertices(T& vertice_to_add, const std::shared_ptr<std::vector<double>>& vertices) {
  if (vertices == nullptr) {
    XVIZ_LOG_ERROR("Vertice pointer is NULL");
    return;
  }
  for (const auto& v : *vertices) {
    vertice_to_add.add_vertices(v);
  }
}

template<typename T>
void AddBase(T* ptr_to_add, const std::pair<bool, xviz::PrimitiveBase>& base_to_add) {
  if (base_to_add.first) {
    ptr_to_add->mutable_base()->MergeFrom(base_to_add.second);
  }
}

XVIZPrimitiveBuilder::XVIZPrimitiveBuilder(const std::shared_ptr<Metadata>& metadata) :
  XVIZBaseBuilder(xviz::StreamMetadata::PRIMITIVE, metadata) {
  primitives_ = std::make_shared<std::unordered_map<std::string, PrimitiveState>>();
}

void XVIZPrimitiveBuilder::DeepCopyFrom(const XVIZPrimitiveBuilder& other) {
  XVIZBaseBuilder::DeepCopyFrom(other);
  DeepCopyPtr(primitives_, other.primitives_);
  DeepCopyPtr(type_, other.type_);
  DeepCopyPtr(image_, other.image_);
  DeepCopyPtr(vertices_, other.vertices_);
  DeepCopyPtr(radius_, other.radius_);
  DeepCopyPtr(text_, other.text_);
  DeepCopyPtr(colors_, other.colors_);
  DeepCopyPtr(id_, other.id_);
  DeepCopyPtr(style_, other.style_);
  DeepCopyPtr(classes_, other.classes_);
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Stream(const std::string& stream_id) {
  if (stream_id_.size() > 0) {
    this->Flush();
  }
  stream_id_ = stream_id;
  return *this;
}

// Polygon
XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Polygon(const std::vector<double>& vertices) {
  auto vertices_ptr = std::make_shared<std::vector<double>>(vertices);
  return Polygon(vertices_ptr);
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Polygon(std::vector<double>&& vertices) {
  auto vertices_ptr = std::make_shared<std::vector<double>>(std::move(vertices));
  return Polygon(vertices_ptr);
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Polygon(const std::shared_ptr<std::vector<double>>& vertices_ptr) {
  if (type_ != nullptr) {
    Flush();
  }
  vertices_ = vertices_ptr;
  type_ = std::make_shared<Primitive>();
  *type_ = Primitive::StreamMetadata_PrimitiveType_POLYGON;
  return *this;
}

// Polyline
XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Polyline(const std::vector<double>& vertices) {
  auto vertices_ptr = std::make_shared<std::vector<double>>(vertices);
  return Polyline(vertices_ptr);
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Polyline(std::vector<double>&& vertices) {
  auto vertices_ptr = std::make_shared<std::vector<double>>(std::move(vertices));
  return Polyline(vertices_ptr);
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Polyline(const std::shared_ptr<std::vector<double>>& vertices_ptr) {
  if (type_ != nullptr) {
    Flush();
  }
  vertices_ = vertices_ptr;
  type_ = std::make_shared<Primitive>();
  *type_ = Primitive::StreamMetadata_PrimitiveType_POLYLINE;
  return *this;
}

// Points
XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Points(const std::vector<double>& vertices) {
  auto vertices_ptr = std::make_shared<std::vector<double>>(vertices);
  return Points(vertices_ptr);
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Points(std::vector<double>&& vertices) {
  auto vertices_ptr = std::make_shared<std::vector<double>>(std::move(vertices));
  return Points(vertices_ptr);
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Points(const std::shared_ptr<std::vector<double>>& vertices_ptr) {
  if (type_ != nullptr) {
    Flush();
  }
  vertices_ = vertices_ptr;
  type_ = std::make_shared<Primitive>();
  *type_ = Primitive::StreamMetadata_PrimitiveType_POINT;
  return *this;
}

// Color
XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Colors(const std::vector<uint8_t>& colors) {
  return Colors(std::make_shared<std::vector<uint8_t>>(colors));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Colors(std::vector<uint8_t>&& colors) {
  return Colors(std::make_shared<std::vector<uint8_t>>(std::move(colors)));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Colors(const std::shared_ptr<std::vector<uint8_t>>& colors_ptr) {
  if (type_ == nullptr || *type_ != xviz::StreamMetadata::POINT) {
    XVIZ_LOG_ERROR("Points() needs to be called before calling Colors()");
    return *this;
  }
  colors_ = colors_ptr;
  return *this;
}

// Position
XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Position(const std::vector<double>& vertices) {
  return Position(std::make_shared<std::vector<double>>(vertices));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Position(std::vector<double>&& vertices) {
  return Position(std::make_shared<std::vector<double>>(std::move(vertices)));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Position(const std::shared_ptr<std::vector<double>>& vertices_ptr) {
  if (vertices_ptr == nullptr || vertices_ptr->size() != 3u) {
    XVIZ_LOG_ERROR("A position should not be null and must be of the form [x, y, z]");
    return *this;
  }
  vertices_ = vertices_ptr;
  return *this;
}

// Circle
XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Circle(const std::vector<double>& vertices, double radius) {
  return Circle(std::make_shared<std::vector<double>>(vertices), radius);
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Circle(std::vector<double>&& vertices, double radius) {
  return Circle(std::make_shared<std::vector<double>>(std::move(vertices)), radius);
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Circle(const std::shared_ptr<std::vector<double>>& vertices_ptr, double radius) {
  if (type_ != nullptr) {
    Flush();
  }

  Position(vertices_ptr);
  radius_ = std::make_shared<double>(radius);
  type_ = std::make_shared<Primitive>();
  *type_ = Primitive::StreamMetadata_PrimitiveType_CIRCLE;
  return *this;
}

// Image
XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Dimensions(uint32_t width_pixel, uint32_t height_pixel) {
  if (image_ == nullptr) {
    XVIZ_LOG_ERROR("An image must be set before call Dimensions()");
    return *this;
  }

  image_->set_width_px(width_pixel);
  image_->set_height_px(height_pixel);
  return *this;
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Image(const std::string& raw_data_str, bool is_encoding_needed) {
  if (type_ != nullptr) {
    Flush();
  }
  type_ = std::make_shared<Primitive>();
  *type_ = Primitive::StreamMetadata_PrimitiveType_IMAGE;
  image_ = std::make_shared<xviz::Image>();
  if (is_encoding_needed) {
    image_->set_data(base64_encode((const unsigned char*)raw_data_str.c_str(), raw_data_str.size()));
    image_->set_is_encoded(true);
  } else {
    image_->set_data(raw_data_str);
    image_->set_is_encoded(false);
  }
  return *this;
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Image(std::string&& raw_data_str, bool is_encoding_needed) {
  if (type_ != nullptr) {
    Flush();
  }
  type_ = std::make_shared<Primitive>();
  *type_ = Primitive::StreamMetadata_PrimitiveType_IMAGE;
  image_ = std::make_shared<xviz::Image>();
  if (is_encoding_needed) {
    image_->set_data(base64_encode((const unsigned char*)raw_data_str.c_str(), raw_data_str.size()));
    image_->set_is_encoded(true);
  } else {
    image_->set_data(std::move(raw_data_str));
    image_->set_is_encoded(false);
  }
  return *this;
}

// Text

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Text(const std::string& message) {
  return Text(std::make_shared<std::string>(message));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Text(std::string&& message) {
  return Text(std::make_shared<std::string>(std::move(message)));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Text(const std::shared_ptr<std::string>& message_ptr) {
  if (type_ != nullptr) {
    Flush();
  }

  type_ = std::make_shared<Primitive>();
  *type_ = Primitive::StreamMetadata_PrimitiveType_TEXT;

  text_ = message_ptr;
  return *this;
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Classes(const std::vector<std::string>& classes) {
  return Classes(std::make_shared<std::vector<std::string>>(classes));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Classes(std::vector<std::string>&& classes) {
  return Classes(std::make_shared<std::vector<std::string>>(std::move(classes)));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Classes(const std::shared_ptr<std::vector<std::string>>& classes_ptr) {
  if (type_ == nullptr) {
    XVIZ_LOG_WARNING("Must call some pritimive functions like Points() before calling Classes()");
    return *this;
  }
  classes_ = classes_ptr;
  return *this;
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::ObjectId(const std::string& object_id) {
  return ObjectId(std::make_shared<std::string>(object_id));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::ObjectId(std::string&& object_id) {
  return ObjectId(std::make_shared<std::string>(std::move(object_id)));
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::ObjectId(const std::shared_ptr<std::string>& object_id) {
  if (type_ == nullptr) {
    XVIZ_LOG_WARNING("Must call some pritimive functions like Points() before calling ObjectId()");
    return *this;
  }
  id_ = object_id;
  return *this;
}

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Stadium(const std::vector<double>& start, const std::vector<double>& end, double radius) {
  if (type_ != nullptr) {
    Flush();
  }

  if (start.size() != 3 || end.size() != 3) {
    XVIZ_LOG_ERROR("The start/end position should be the form of [x, y, z]");
    return *this;
  }
  vertices_ = std::make_shared<std::vector<double>>();
  vertices_->insert(vertices_->end(), start.begin(), start.end());
  vertices_->insert(vertices_->end(), end.begin(), end.end());

  radius_ = std::make_shared<double>(radius);

  type_ = std::make_shared<Primitive>();
  *type_ = Primitive::StreamMetadata_PrimitiveType_STADIUM;
  return *this;
}


// Style
XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Style(const std::string& style_json_str) {
  return Style(JsonStringToStyleObject(style_json_str));
}

// XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Style(std::string&& style_json_str) {
//   return Style(JsonStringToStyleObject(std::move(style_json_str)));
// }

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Style(const Json& style_json) {
  return Style(JsonObjectToStyleObject(style_json));
}

// XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Style(Json&& style_json) {
//   return Style(JsonObjectToStyleObject(std::move(style_json)));
// }

XVIZPrimitiveBuilder& XVIZPrimitiveBuilder::Style(const std::shared_ptr<StyleObjectValue>& style_object) {
  ValidatePrerequisite();
  style_ = style_object;
  return *this;
}

std::shared_ptr<std::unordered_map<std::string, PrimitiveState>> XVIZPrimitiveBuilder::GetData() {
  if (type_ != nullptr) {
    Flush();
  }
  if (primitives_->empty()) {
    return nullptr;
  }
  return primitives_;
}

void XVIZPrimitiveBuilder::Flush() {
  Validate();
  FlushPrimitives();
}

void XVIZPrimitiveBuilder::Validate() {
  XVIZBaseBuilder::Validate();
  if (type_ != nullptr && style_ != nullptr) {
    ValidatePrimitiveStyleObject();
  }
  // SUPER :: VALIDATE
  // TODO imple this function
}

void XVIZPrimitiveBuilder::ValidatePrerequisite() {
  if (type_ == nullptr) {
    XVIZ_LOG_ERROR("Start from a primitive first, e.g Polygon(), Image(), etc.");
  }
}

void XVIZPrimitiveBuilder::FlushPrimitives() {
  if (primitives_->find(stream_id_) == primitives_->end()) {
    (*primitives_)[stream_id_] = PrimitiveState();
  }
  auto stream_ptr = &(*primitives_)[stream_id_];
  auto base_pair = FlushPrimitiveBase();
  // auto has_base = base_pair.first;
  // auto base = base_pair.second;

  if (type_ == nullptr) {
    Reset();
    return;
  }
  switch (*type_) {
    case Primitive::StreamMetadata_PrimitiveType_POLYGON:
      {
        auto polygon_ptr = stream_ptr->add_polygons();
        AddVertices<xviz::Polygon>(*polygon_ptr, vertices_);
        AddBase<xviz::Polygon>(polygon_ptr, base_pair);
        // if (has_base) {
        //   auto cur_base_ptr = polygon_ptr->mutable_base();
        //   cur_base_ptr->MergeFrom(base);
        // }
        break;
      }

    case Primitive::StreamMetadata_PrimitiveType_POLYLINE:
      {
        auto polyline_ptr = stream_ptr->add_polylines();
        AddVertices<xviz::Polyline>(*polyline_ptr, vertices_);
        AddBase<xviz::Polyline>(polyline_ptr, base_pair);
        // if (has_base) {
        //   auto cur_base_ptr = polyline_ptr->mutable_base();
        //   cur_base_ptr->MergeFrom(base);
        // }
        break;
      }
    
    case Primitive::StreamMetadata_PrimitiveType_POINT:
      {
        if (vertices_ == nullptr) {
          XVIZ_LOG_ERROR("Vertice pointer is NULL");
          break;
        }
        auto point_size = vertices_->size();
        auto point_ptr = stream_ptr->add_points();
        google::protobuf::Value* points_value_ptr = new google::protobuf::Value();
        google::protobuf::ListValue* points_list_value_ptr = new google::protobuf::ListValue();
        for (auto v : *vertices_) {
          google::protobuf::Value tmp_point_value;
          tmp_point_value.set_number_value(v);
          auto new_value_ptr = points_list_value_ptr->add_values();
          (*new_value_ptr) = std::move(tmp_point_value);
        }
        points_value_ptr->set_allocated_list_value(points_list_value_ptr);
        point_ptr->set_allocated_points(points_value_ptr);

        AddBase<xviz::Point>(point_ptr, base_pair);

        if (colors_ != nullptr) {
          if (colors_->size() / 4u != point_size / 3u) {
            XVIZ_LOG_WARNING("Point size and color size not match, not showing colors");
            break;
          }
          google::protobuf::Value* colors_value_ptr = new google::protobuf::Value();
          google::protobuf::ListValue* colors_list_value_ptr = new google::protobuf::ListValue();

          for (auto v : *colors_) {
            google::protobuf::Value tmp_color_value;
            tmp_color_value.set_number_value(v);
            auto new_value_ptr = colors_list_value_ptr->add_values();
            (*new_value_ptr) = std::move(tmp_color_value);
          }

          colors_value_ptr->set_allocated_list_value(colors_list_value_ptr);
          point_ptr->set_allocated_colors(colors_value_ptr);
        }
        // if (has_base) {
        //   auto cur_base_ptr = point_ptr->mutable_base();
        //   cur_base_ptr->MergeFrom(base);
        // }
        break;
      }

    case Primitive::StreamMetadata_PrimitiveType_IMAGE:
      {
        if (vertices_ != nullptr && vertices_->size() > 2) {
          image_->add_position((*vertices_)[0]);
          image_->add_position((*vertices_)[1]);
          image_->add_position((*vertices_)[2]);
        }
        auto image_ptr = stream_ptr->add_images();
        *image_ptr = std::move(*image_);
        AddBase<xviz::Image>(image_ptr, base_pair);
        // if (has_base) {
        //   auto cur_base_ptr = image_ptr->mutable_base();
        //   cur_base_ptr->MergeFrom(base);
        // }
        break;
      }

    case Primitive::StreamMetadata_PrimitiveType_CIRCLE:
      {
        auto circle_ptr = stream_ptr->add_circles();
        if (vertices_ == nullptr || vertices_->size() != 3) {
          XVIZ_LOG_ERROR("Circle's center must be the form of [x, y, z]");
          break;
        }
        for (auto v : *vertices_) {
          circle_ptr->add_center(v);
        }
        circle_ptr->set_radius(*radius_);
        AddBase<xviz::Circle>(circle_ptr, base_pair);
        // if (has_base) {
        //   auto cur_base_ptr = circle_ptr->mutable_base();
        //   cur_base_ptr->MergeFrom(base);
        // }
        break;
      }
    
    case Primitive::StreamMetadata_PrimitiveType_TEXT:
      {
        auto text_ptr = stream_ptr->add_texts();
        if (vertices_ == nullptr || vertices_->size() != 3) {
          XVIZ_LOG_ERROR("Text's position must be the form of [x, y, z]");
          break;
        }
        text_ptr->set_text(*text_);
        for (auto v : *vertices_) {
          text_ptr->add_position(v);
        }
        AddBase<xviz::Text>(text_ptr, base_pair);
        break;
      }
    
    // STADIUM,
    case xviz::StreamMetadata::STADIUM:
     {
       auto stadium_ptr = stream_ptr->add_stadiums();
       if (vertices_ == nullptr || vertices_->size() != 6) {
         XVIZ_LOG_ERROR("Stadium should give start and end.");
         break;
       }
       for (int i = 0; i < 3; i++) {
         stadium_ptr->add_start((*vertices_)[i]);
       }
       for (int i = 3; i < 6; i++) {
         stadium_ptr->add_end((*vertices_)[i]);
       }
       stadium_ptr->set_radius(*radius_);
       AddBase<xviz::Stadium>(stadium_ptr, base_pair);
       break;
     }


    default:
      XVIZ_LOG_ERROR("This type is not supported currently %d.", *type_);
      return;
  }


  Reset();
}

std::pair<bool, PrimitiveBase> XVIZPrimitiveBuilder::FlushPrimitiveBase() {
  bool has_base = false;
  PrimitiveBase base;

  if (id_ != nullptr) {
    has_base = true;
    auto id_ptr = base.mutable_object_id();
    *id_ptr = *id_;
  }

  if (style_ != nullptr) {
    has_base = true;
    auto style_ptr = base.mutable_style();
    style_ptr->MergeFrom(*style_);
  }

  if (classes_ != nullptr) {
    has_base = true;
    for (auto& c : *classes_) {
      auto new_class_ptr = base.add_classes();
      *new_class_ptr = std::move(c);
    }
  }


  return {has_base, std::move(base)};
}

void XVIZPrimitiveBuilder::Reset() {
  type_ = nullptr;

  image_ = nullptr;
  vertices_ = nullptr;
  radius_ = nullptr;
  text_ = nullptr;
  colors_ = nullptr;

  id_ = nullptr;
  style_ = nullptr;
  classes_ = nullptr;
}

void XVIZPrimitiveBuilder::ValidatePrimitiveStyleObject() {
  ValidateStyle(*type_, style_);
}