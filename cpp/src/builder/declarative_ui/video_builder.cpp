/*
 * File: video_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 2:28:51 am
 */

#include "xviz/builder/declarative_ui/video_builder.h"

using namespace xviz;

XVIZVideoBuilder::XVIZVideoBuilder(const std::vector<std::string>& cameras) 
  : XVIZBaseUIBuilder(ComponentType::VIDEO), cameras_(cameras) {}

XVIZVideoBuilder::XVIZVideoBuilder(std::vector<std::string>&& cameras)
  : XVIZBaseUIBuilder(ComponentType::VIDEO), cameras_(std::move(cameras)) {}

UIPanel XVIZVideoBuilder::GetUI() {
  UIPanel ui_panel = XVIZBaseUIBuilder::GetUI();
  for (auto& camera : cameras_) {
    auto new_camera_ptr = ui_panel.add_cameras();
    *new_camera_ptr = camera;
  }
  return ui_panel;
}