/*
 * File: ui_base_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 1:15:47 am
 */

#ifndef XVIZ_DECLARATIVE_UI_BASE_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_BASE_BUILDER_H_

#include "xviz/proto/declarativeui.pb.h"


#include <memory>
#include <vector>

namespace xviz {

class XVIZBaseUIBuilder : std::enable_shared_from_this<XVIZBaseUIBuilder> {
public:
  XVIZBaseUIBuilder(ComponentType type);

  virtual std::shared_ptr<XVIZBaseUIBuilder> Child(const std::shared_ptr<XVIZBaseUIBuilder>& child);

  template<typename UIBuilderType, typename... Args>
  std::shared_ptr<XVIZBaseUIBuilder> Child(Args&&... args) {
    auto child = std::make_shared<UIBuilderType>(std::forward<Args>(args)...);
    children_.push_back(child);
    return child;
  }

  // // Video child
  // virtual std::shared_ptr<XVIZBaseUIBuilder> Child(const std::vector<std::string>& cameras);
  // // Metric child
  // virtual std::shared_ptr<XVIZBaseUIBuilder> Child(const std::vector<std::string>& streams, const std::string& description, const std::string& title);
  // // Container child
  // virtual std::shared_ptr<XVIZBaseUIBuilder> Child(const std::string& name, LayoutType layout);

  // virtual void Child(const std::shared_ptr<XVIZBaseUIBuilder>& child);
  virtual UIPanel GetUI();
  void AddChildUIs(UIPanel& ui_panel);

protected:
  std::shared_ptr<ComponentType> type_{nullptr};
  std::vector<std::shared_ptr<XVIZBaseUIBuilder>> children_{};
};
  
} // namespace xviz


#endif