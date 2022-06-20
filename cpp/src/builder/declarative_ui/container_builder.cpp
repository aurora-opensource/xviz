/*
 * File: container_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 3:23:56 am
 */

#include "xviz/builder/declarative_ui/container_builder.h"

using namespace xviz;
XVIZContainerBuilder::XVIZContainerBuilder(const std::string& name,
                                           const std::string& layout,
                                           const std::string& interactions)
    : XVIZBaseUIBuilder("CONTAINER"),
      name_(name),
      layout_(layout),
      interactions_(interactions) {}

const std::string XVIZContainerBuilder::Name() const { return name_; }

nlohmann::json XVIZContainerBuilder::GetUI() const {
  nlohmann::json ui_panel = XVIZBaseUIBuilder::GetUI();
  ui_panel["name"] = name_;
  uint32_t cnt = 0u;
  for (auto& child : children_) {
    ui_panel["children"][cnt] = child->GetUI();
    cnt++;
  }
  if (!layout_.empty()) {
    ui_panel["layout"] = layout_;
  }

  if (!interactions_.empty()) {
    ui_panel["interactions"] = interactions_;
  }
  return ui_panel;
}