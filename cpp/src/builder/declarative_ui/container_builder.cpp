/*
 * File: container_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 3:23:56 am
 */

#include "xviz/builder/declarative_ui/container_builder.h"

using namespace xviz;
XVIZContainerBuilder::XVIZContainerBuilder(const std::string& name, LayoutType layout)
  : XVIZBaseUIBuilder(ComponentType::CONTAINER), name_(name), layout_(layout) {}


UIPanel XVIZContainerBuilder::GetUI() {
  UIPanel ui_panel = XVIZBaseUIBuilder::GetUI();
  ui_panel.set_name(name_);
  ui_panel.set_layout(layout_);

  return ui_panel;
}