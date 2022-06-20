/*
 * File: panel_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * Github: https://github.com/wx9698
 * File Created: Sunday, 2nd August 2020 9:55:01 pm
 */

#include "xviz/builder/declarative_ui/panel_builder.h"

using namespace xviz;

XVIZPanelBuilder::XVIZPanelBuilder(const std::string& name,
                                   const std::string& layout,
                                   const std::string interactions)
    : XVIZBaseUIBuilder("PANEL"),
      name_(name),
      layout_(layout),
      interactions_(interactions) {}

const std::string XVIZPanelBuilder::Name() const { return name_; }

nlohmann::json XVIZPanelBuilder::GetUI() const {
  auto json = XVIZBaseUIBuilder::GetUI();
  json["name"] = name_;

  uint32_t cnt = 0u;
  for (const auto& child : children_) {
    json["children"][cnt] = child->GetUI();
    cnt++;
  }

  if (!layout_.empty()) {
    json["layout"] = layout_;
  }

  if (!interactions_.empty()) {
    json["interactions"] = interactions_;
  }
  return json;
}
