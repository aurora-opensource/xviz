/*
 * File: table_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 11th January 2020 7:57:27 am
 */

#include "xviz/builder/declarative_ui/table_builder.h"

using namespace xviz;
XVIZTableBuilder::XVIZTableBuilder(const std::string& stream,
                                   bool display_object_id,
                                   const std::string& title,
                                   const std::string& description)
    : XVIZBaseUIComponentBuilder("TABLE", title, description),
      stream_(stream),
      display_object_id_(display_object_id) {}

nlohmann::json XVIZTableBuilder::GetUI() const {
  auto ui_panel = XVIZBaseUIComponentBuilder::GetUI();
  ui_panel["stream"] = stream_;
  ui_panel["displayObjectId"] = display_object_id_;
  return ui_panel;
}