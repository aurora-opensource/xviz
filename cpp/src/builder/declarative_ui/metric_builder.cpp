/*
 * File: metric_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 2:59:47 am
 */

#include "xviz/builder/declarative_ui/metric_builder.h"

using namespace xviz;

XVIZMetricBuilder::XVIZMetricBuilder(const std::vector<std::string>& streams, const std::string& description, const std::string& title) 
  : XVIZBaseUIBuilder(ComponentType::METRIC), streams_(streams), description_(description), title_(title) {}
XVIZMetricBuilder::XVIZMetricBuilder(std::vector<std::string>&& streams, const std::string& description, const std::string& title)
  : XVIZBaseUIBuilder(ComponentType::METRIC), streams_(std::move(streams)), description_(description), title_(title) {}

UIPanel XVIZMetricBuilder::GetUI() {
  UIPanel ui_panel = XVIZBaseUIBuilder::GetUI();

  for (const auto& stream : streams_) {
    auto new_stream_ptr = ui_panel.add_streams();
    *new_stream_ptr = stream;
  }
  ui_panel.set_description(description_);
  ui_panel.set_title(title_);

  return ui_panel;
}