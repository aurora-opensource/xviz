/*
 * File: primitive.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 17th December 2019 9:57:00 pm
 */

#ifndef XVIZ_PRIMITIVE_BUILDER_H_
#define XVIZ_PRIMITIVE_BUILDER_H_

#include "base_builder.h"
#include "xviz/utils/json.hpp"
#include "xviz/utils/macrologger.h"
#include "xviz/utils/base64.h"
#include "xviz/utils/utils.h"
#include "xviz/proto/core.pb.h"
#include "xviz/proto/primitives.pb.h"


namespace xviz {

class XVIZPrimitiveBuilder : public XVIZBaseBuilder {
public:
  XVIZPrimitiveBuilder(const std::shared_ptr<Metadata>& metadata);
  void DeepCopyFrom(const XVIZPrimitiveBuilder& other);

  XVIZPrimitiveBuilder& Stream(const std::string& stream_id);
  std::shared_ptr<std::unordered_map<std::string, PrimitiveState>> GetData();

  XVIZPrimitiveBuilder& Polygon(const std::vector<double>& vertices);
  XVIZPrimitiveBuilder& Polygon(std::vector<double>&& vertices);
  XVIZPrimitiveBuilder& Polygon(const std::shared_ptr<std::vector<double>>& vertices_ptr);

  XVIZPrimitiveBuilder& Polyline(const std::vector<double>& vertices);
  XVIZPrimitiveBuilder& Polyline(std::vector<double>&& vertices);
  XVIZPrimitiveBuilder& Polyline(const std::shared_ptr<std::vector<double>>& vertices_ptr);

  XVIZPrimitiveBuilder& Points(const std::vector<double>& vertices);
  XVIZPrimitiveBuilder& Points(std::vector<double>&& vertices);
  XVIZPrimitiveBuilder& Points(const std::shared_ptr<std::vector<double>>& vertices_ptr);

  XVIZPrimitiveBuilder& Colors(const std::vector<uint8_t>& colors);
  XVIZPrimitiveBuilder& Colors(std::vector<uint8_t>&& colors);
  XVIZPrimitiveBuilder& Colors(const std::shared_ptr<std::vector<uint8_t>>& colors_ptr);

  XVIZPrimitiveBuilder& Position(const std::vector<double>& vertices);
  XVIZPrimitiveBuilder& Position(std::vector<double>&& vertices);
  XVIZPrimitiveBuilder& Position(const std::shared_ptr<std::vector<double>>& vertices_ptr);

  XVIZPrimitiveBuilder& Circle(const std::vector<double>& vertices, double radius);
  XVIZPrimitiveBuilder& Circle(std::vector<double>&& vertices, double radius);
  XVIZPrimitiveBuilder& Circle(const std::shared_ptr<std::vector<double>>& vertices_ptr, double radius);

  XVIZPrimitiveBuilder& Dimensions(uint32_t width_pixel, uint32_t height_pixel);
  XVIZPrimitiveBuilder& Image(const std::string& raw_data_str, bool is_encoding_needed=false);
  XVIZPrimitiveBuilder& Image(std::string&& raw_data_str, bool is_encoding_needed=false);

  XVIZPrimitiveBuilder& Text(const std::string& message);
  XVIZPrimitiveBuilder& Text(std::string&& message);
  XVIZPrimitiveBuilder& Text(const std::shared_ptr<std::string>& message_ptr);

  XVIZPrimitiveBuilder& Classes(const std::vector<std::string>& classes);
  XVIZPrimitiveBuilder& Classes(std::vector<std::string>&& classes);
  XVIZPrimitiveBuilder& Classes(const std::shared_ptr<std::vector<std::string>>& classes_ptr);

  XVIZPrimitiveBuilder& ObjectId(const std::string& object_id);
  XVIZPrimitiveBuilder& ObjectId(std::string&& object_id);
  XVIZPrimitiveBuilder& ObjectId(const std::shared_ptr<std::string>& object_id);

  XVIZPrimitiveBuilder& Stadium(const std::vector<double>& start, const std::vector<double>& end, double radius);

  XVIZPrimitiveBuilder& Style(const nlohmann::json& style_json);
  // XVIZPrimitiveBuilder& Style(nlohmann::json&& style_json);
  XVIZPrimitiveBuilder& Style(const std::string& style_json_str);
  // XVIZPrimitiveBuilder& Style(std::string&& style_json_str);
  XVIZPrimitiveBuilder& Style(const std::shared_ptr<StyleObjectValue>& style_object);
private:
  void Reset();
  void Flush() override;
  void FlushPrimitives();
  std::pair<bool, PrimitiveBase> FlushPrimitiveBase();
  void Validate();
  void ValidatePrerequisite();
  void ValidatePrimitiveStyleObject();

  // void SetVertices(const std::shared_ptr<std::vector<double>>& vertices_ptr);
  

  std::shared_ptr<std::unordered_map<std::string, PrimitiveState>> primitives_{nullptr};

  std::shared_ptr<Primitive> type_{nullptr};

  std::shared_ptr<xviz::Image> image_{nullptr};
  std::shared_ptr<std::vector<double>> vertices_{nullptr};
  std::shared_ptr<double> radius_{nullptr};
  std::shared_ptr<std::string> text_{nullptr};
  std::shared_ptr<std::vector<uint8_t>> colors_{nullptr};

  std::shared_ptr<std::string> id_{nullptr};
  std::shared_ptr<StyleObjectValue> style_{nullptr};
  std::shared_ptr<std::vector<std::string>> classes_{nullptr};
  // TODO classes ????
};
  
} // namespace xviz


#endif