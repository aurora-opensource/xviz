/*
 * File: video_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 2:28:51 am
 */

#include "xviz/builder/declarative_ui/video_builder.h"

using namespace xviz;

XVIZVideoBuilder::XVIZVideoBuilder(const std::vector<std::string>& cameras)
    : XVIZBaseUIComponentBuilder("VIDEO"), cameras_(cameras) {}

XVIZVideoBuilder::XVIZVideoBuilder(std::vector<std::string>&& cameras)
    : XVIZBaseUIComponentBuilder("VIDEO"), cameras_(std::move(cameras)) {}

nlohmann::json XVIZVideoBuilder::GetUI() const {
  nlohmann::json ui_panel = XVIZBaseUIBuilder::GetUI();
  ui_panel["cameras"] = cameras_;
  return ui_panel;
}