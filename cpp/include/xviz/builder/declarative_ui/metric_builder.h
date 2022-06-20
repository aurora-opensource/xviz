/*
 * File: metric_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 1:17:21 am
 */

#ifndef XVIZ_DECLARATIVE_UI_METRIC_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_METRIC_BUILDER_H_

#include "base_ui_component_builder.h"

namespace xviz {

class XVIZMetricBuilder : public XVIZBaseUIComponentBuilder {
 public:
  XVIZMetricBuilder(const std::vector<std::string>& streams,
                    const std::string& title = "",
                    const std::string& description = "");
  XVIZMetricBuilder(std::vector<std::string>&& streams,
                    const std::string& title = "",
                    const std::string& description = "");

  nlohmann::json GetUI() const override;

 private:
  std::vector<std::string> streams_{};
};

}  // namespace xviz
#endif