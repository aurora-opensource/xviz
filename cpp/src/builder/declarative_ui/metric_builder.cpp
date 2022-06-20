/*
 * File: metric_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 2:59:47 am
 */

#include "xviz/builder/declarative_ui/metric_builder.h"

using namespace xviz;

XVIZMetricBuilder::XVIZMetricBuilder(const std::vector<std::string>& streams,
                                     const std::string& title,
                                     const std::string& description)
    : XVIZBaseUIComponentBuilder("METRIC", title, description),
      streams_(streams) {}
XVIZMetricBuilder::XVIZMetricBuilder(std::vector<std::string>&& streams,
                                     const std::string& title,
                                     const std::string& description)
    : XVIZBaseUIComponentBuilder("METRIC", title, description),
      streams_(std::move(streams)) {}

nlohmann::json XVIZMetricBuilder::GetUI() const {
  nlohmann::json ui_panel = XVIZBaseUIComponentBuilder::GetUI();
  ui_panel["streams"] = streams_;
  return ui_panel;
}