/*
 * File: base_ui_component_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * Github: https://github.com/wx9698
 * File Created: Sunday, 2nd August 2020 9:24:57 pm
 */

#include "xviz/builder/declarative_ui/base_ui_component_builder.h"
using namespace xviz;

XVIZBaseUIComponentBuilder::XVIZBaseUIComponentBuilder(
    const std::string& type, const std::string& title,
    const std::string& description)
    : XVIZBaseUIBuilder(type), title_(title), description_(description) {}

nlohmann::json XVIZBaseUIComponentBuilder::GetUI() const {
  auto json = XVIZBaseUIBuilder::GetUI();
  if (!title_.empty()) {
    json["title"] = title_;
  }

  if (!description_.empty()) {
    json["description"] = description_;
  }
  return json;
}