/*
 * File: base_ui_builder
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 2:01:34 am
 */

#include "xviz/builder/declarative_ui/base_ui_builder.h"
#include "xviz/builder/declarative_ui/video_builder.h"
#include "xviz/builder/declarative_ui/container_builder.h"
#include "xviz/builder/declarative_ui/metric_builder.h"

using namespace xviz;

// template<typename... Args>
// std::shared_ptr<XVIZBaseUIBuilder> GetChild(ComponentType type, Args... args) {
//   std::shared_ptr<XVIZBaseUIBuilder> child = nullptr;

//   switch (type) {
//     case ComponentType::METRIC:
//       child = std::make_shared<XVIZMetricBuilder>(args...);
//       break;
    
//     case ComponentType::VIDEO:
//       break;

//     case ComponentType::CONTAINER:
//       child = std::make_shared<XVIZContainerBuilder>(args...);
//       break;

//     default:
//       break;
//   }
//   return child;
// }

XVIZBaseUIBuilder::XVIZBaseUIBuilder(ComponentType type) {
  type_ = std::make_shared<ComponentType>(type);
}

std::shared_ptr<XVIZBaseUIBuilder> XVIZBaseUIBuilder::Child(const std::shared_ptr<XVIZBaseUIBuilder>& child) {
  children_.push_back(child);
  return child;
}

// // Video child
// std::shared_ptr<XVIZBaseUIBuilder> XVIZBaseUIBuilder::Child(const std::vector<std::string>& cameras) {
//   auto child = std::make_shared<XVIZVideoBuilder>(cameras);
//   children_.push_back(child);
//   return child;
// }
// // Metric child
// std::shared_ptr<XVIZBaseUIBuilder> XVIZBaseUIBuilder::Child(const std::vector<std::string>& streams, const std::string& description, const std::string& title) {
//   auto child = std::make_shared<XVIZMetricBuilder>(streams, description, title);
//   children_.push_back(child);
//   return child;
// }
// // Container child
// std::shared_ptr<XVIZBaseUIBuilder> XVIZBaseUIBuilder::Child(const std::string& name, LayoutType layout) {
//   auto child = std::make_shared<XVIZContainerBuilder>(name, layout);
//   children_.push_back(child);
//   return child;
// }


UIPanel XVIZBaseUIBuilder::GetUI() {
  UIPanel uis;
  uis.set_type(*type_);
  if (children_.size() > 0) {
    for (auto& child : children_) {
      auto new_ui_panels = uis.add_children();
      *new_ui_panels = child->GetUI();
    }
  }
  return uis;
}

void XVIZBaseUIBuilder::AddChildUIs(UIPanel& ui_panel) {
  if (children_.size() > 0) {
    for (auto& child : children_) {
      auto new_ui_panels = ui_panel.add_children();
      *new_ui_panels = child->GetUI();
    }
  }
}