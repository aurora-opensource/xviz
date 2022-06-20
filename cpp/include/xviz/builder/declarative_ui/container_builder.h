/*
 * File: container_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 1:17:51 am
 */

#ifndef XVIZ_DECLARATIVE_UI_CONTAINER_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_CONTAINER_BUILDER_H_

#include "base_ui_builder.h"

namespace xviz {

class XVIZContainerBuilder : public XVIZBaseUIBuilder {
 public:
  XVIZContainerBuilder(const std::string& name, const std::string& layout = "",
                       const std::string& interactions = "");
  nlohmann::json GetUI() const override;
  const std::string Name() const;

  template <typename UIBuilderType, typename... Args>
  UIBuilderType& Child(Args&&... args) {
    auto child = std::make_shared<UIBuilderType>(std::forward<Args>(args)...);
    children_.push_back(child);
    return *child;
  }

 private:
  std::string name_;
  std::string layout_;
  std::string interactions_;
  std::vector<std::shared_ptr<XVIZBaseUIBuilder>> children_{};
};

}  // namespace xviz

#endif