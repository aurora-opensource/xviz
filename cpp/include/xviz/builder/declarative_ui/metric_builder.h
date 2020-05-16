/*
 * File: metric_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 1:17:21 am
 */


#ifndef XVIZ_DECLARATIVE_UI_METRIC_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_METRIC_BUILDER_H_

#include "base_ui_builder.h"
#include "xviz/proto/declarativeui.pb.h"

namespace xviz {
  


class XVIZMetricBuilder : public XVIZBaseUIBuilder {
public:
  XVIZMetricBuilder(const std::vector<std::string>& streams, const std::string& description, const std::string& title);
  XVIZMetricBuilder(std::vector<std::string>&& streams, const std::string& description, const std::string& title);

  UIPanel GetUI() override;

private:
  std::vector<std::string> streams_{};
  std::string description_{};
  std::string title_{};
};

} // namespace xviz
#endif