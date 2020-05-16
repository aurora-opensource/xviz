/*
 * File: metadata.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 24th December 2019 8:06:16 pm
 */

#ifndef XVIZ_METADATA_BUILDER_H_
#define XVIZ_METADATA_BUILDER_H_

#include "declarative_ui/ui_builder.h"
#include "base_builder.h"

#include "xviz/utils/macrologger.h"
#include "xviz/utils/definitions.h"
#include "xviz/utils/utils.h"

#include "xviz/message.h"
#include "xviz/proto/session.pb.h"

#include <memory>

namespace xviz {

class XVIZMetadataBuilder : public XVIZBaseBuilder {
public:
  XVIZMetadataBuilder();
  std::shared_ptr<Metadata> GetData();
  XVIZMessage GetMessage();

  XVIZMetadataBuilder& Stream(const std::string& stream_id);

  XVIZMetadataBuilder& StartTime(double time);
  XVIZMetadataBuilder& EndTime(double time);

  XVIZMetadataBuilder& UI(const std::unordered_map<std::string, XVIZUIBuilder>& ui_builder);
  XVIZMetadataBuilder& UI(std::unordered_map<std::string, XVIZUIBuilder>&& ui_builder);
  XVIZMetadataBuilder& UI(const std::shared_ptr<std::unordered_map<std::string, XVIZUIBuilder>>& ui_builder_ptr);

  XVIZMetadataBuilder& Source(const std::string& source);
  // XVIZMetadataBuilder& Source(std::string&& source);
  // XVIZMetadataBuilder& Source(const char* source);
  XVIZMetadataBuilder& Unit(const std::string& unit);
  // XVIZMetadataBuilder& Unit(std::string&& unit);
  // XVIZMetadataBuilder& Unit(const char* unit);

  XVIZMetadataBuilder& Category(Category category);
  XVIZMetadataBuilder& Type(Primitive primitive_type);
  XVIZMetadataBuilder& Type(ScalarType scalar_type);

  XVIZMetadataBuilder& Coordinate(CoordinateType coordinate_type);

  XVIZMetadataBuilder& TransformMatrix(const std::vector<double>& matrix);

  XVIZMetadataBuilder& StreamStyle(const std::string& style_str);
  XVIZMetadataBuilder& StyleClass(const std::string& name, const std::string& style_str);
  XVIZMetadataBuilder& StyleClass(const std::string& name, const nlohmann::json& style_json);

  XVIZMetadataBuilder& LogInfo(double start_time, double end_time);

private:
  void Flush();
  void Reset();

  void Vaildate();

  std::shared_ptr<Metadata> data_{nullptr};
  std::shared_ptr<std::unordered_map<std::string, XVIZUIBuilder>> ui_{nullptr};
  // std::string stream_id_{};
  StreamMetadata temp_stream_{};
  int type_ = -1;
  // TODO TMP TYPE
};
  
} // namespace xviz



#endif