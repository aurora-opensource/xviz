/*
 * File: ui_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 1:37:33 am
 */

#include "xviz/builder/declarative_ui/ui_builder.h"

using namespace xviz;

// template<typename T>
// void AddChild(std::vector<std::shared_ptr<XVIZBaseUIBuilder>>& children, T&&
// child) {
//   children.push_back(std::move(child));
// }

// template<typename T>
// void AddChild(std::vector<std::shared_ptr<XVIZBaseUIBuilder>>& children,
// const T& child) {
//   children.push_back(child);
// }

XVIZUIBuilder::XVIZUIBuilder() {}

XVIZUIBuilder& XVIZUIBuilder::Child(const XVIZPanelBuilder& panel) {
  panel_children_.emplace_back(panel);
  return *this;
}

XVIZUIBuilder& XVIZUIBuilder::Child(const XVIZContainerBuilder& container) {
  container_children_.emplace_back(container);
  return *this;
}
// XVIZUIBuilder& XVIZUIBuilder::Child(const std::shared_ptr<XVIZBaseUIBuilder>&
// child) {
//   children_.push_back(child);
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(const XVIZContainerBuilder& child) {
//   children_.push_back(std::make_shared<XVIZContainerBuilder>(child));
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(XVIZContainerBuilder&& child) {
//   children_.push_back(std::make_shared<XVIZContainerBuilder>(std::move(child)));
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(const XVIZMetricBuilder& child) {
//   children_.push_back(std::make_shared<XVIZMetricBuilder>(child));
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(XVIZMetricBuilder&& child) {
//   children_.push_back(std::make_shared<XVIZMetricBuilder>(std::move(child)));
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(const XVIZVideoBuilder& child) {
//   children_.push_back(std::make_shared<XVIZVideoBuilder>(child));
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(XVIZVideoBuilder&& child) {
//   children_.push_back(std::make_shared<XVIZVideoBuilder>(std::move(child)));
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(const XVIZPlotBuilder& child) {
//   children_.push_back(std::make_shared<XVIZPlotBuilder>(child));
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(XVIZPlotBuilder&& child) {
//   children_.push_back(std::make_shared<XVIZPlotBuilder>(std::move(child)));
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(const XVIZTableBuilder& child) {
//   children_.push_back(std::make_shared<XVIZTableBuilder>(child));
//   return *this;
// }

// XVIZUIBuilder& XVIZUIBuilder::Child(XVIZTableBuilder&& child) {
//   children_.push_back(std::make_shared<XVIZTableBuilder>(std::move(child)));
//   return *this;
// }

std::unordered_map<std::string, nlohmann::json> XVIZUIBuilder::GetUI() const {
  std::unordered_map<std::string, nlohmann::json> uis;
  for (const auto& child : panel_children_) {
    uis[child.Name()] = child.GetUI();
  }
  for (const auto& child : container_children_) {
    uis[child.Name()] = child.GetUI();
  }
  return uis;
}