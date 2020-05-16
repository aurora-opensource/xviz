/*
 * File: table_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 11th January 2020 7:57:27 am
 */

#include "xviz/builder/declarative_ui/table_builder.h"

using namespace xviz;
XVIZTableBuilder::XVIZTableBuilder(const std::string& title, const std::string& description, const std::string& stream, bool display_object_id) 
  : XVIZBaseUIBuilder(ComponentType::TABLE), title_(title), description_(description), stream_(stream), display_object_id_(display_object_id) {}

UIPanel XVIZTableBuilder::GetUI() {
  auto ui_panel = XVIZBaseUIBuilder::GetUI();
  ui_panel.set_title(title_);
  ui_panel.set_description(description_);
  ui_panel.set_stream(stream_);
  ui_panel.set_display_object_id(display_object_id_);
  return ui_panel;
}