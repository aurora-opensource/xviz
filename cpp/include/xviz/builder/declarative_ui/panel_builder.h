/*
 * File: panel_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * Github: https://github.com/wx9698
 * File Created: Sunday, 2nd August 2020 9:51:08 pm
 */

#ifndef XVIZ_DECLARATIVE_UI_PANEL_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_PANEL_BUILDER_H_

#include "base_ui_component_builder.h"

namespace xviz {

class XVIZPanelBuilder : public XVIZBaseUIBuilder {
 public:
  XVIZPanelBuilder(const std::string& name, const std::string& layout = "",
                   const std::string interactions = "");
  const std::string Name() const;

  template <typename UIBuilderType, typename... Args>
  UIBuilderType& Child(Args&&... args) {
    auto child = std::make_shared<UIBuilderType>(std::forward<Args>(args)...);
    children_.push_back(child);
    return *child;
  }

  nlohmann::json GetUI() const override;

 private:
  const std::string name_;
  const std::string layout_;
  const std::string interactions_;
  std::vector<std::shared_ptr<XVIZBaseUIBuilder>> children_;
};

}  // namespace xviz

#endif