/*
 * File: base_ui_component_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * Github: https://github.com/wx9698
 * File Created: Sunday, 2nd August 2020 9:17:52 pm
 */

#ifndef XVIZ_DECLARATIVE_UI_BASE_COMPONENT_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_BASE_COMPONENT_BUILDER_H_

#include "base_ui_builder.h"

namespace xviz {

class XVIZBaseUIComponentBuilder : public XVIZBaseUIBuilder {
 public:
  XVIZBaseUIComponentBuilder(const std::string& type,
                             const std::string& title = "",
                             const std::string& description = "");

  virtual nlohmann::json GetUI() const override;

 private:
  std::string title_;
  std::string description_;
};

}  // namespace xviz

#endif
