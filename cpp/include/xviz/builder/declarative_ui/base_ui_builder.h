/*
 * File: ui_base_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 1:15:47 am
 */

#ifndef XVIZ_DECLARATIVE_UI_BASE_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_BASE_BUILDER_H_

#include <nlohmann/json.hpp>
#include "xviz/utils/definitions.h"

#include <memory>
#include <vector>

namespace xviz {

class XVIZBaseUIBuilder : std::enable_shared_from_this<XVIZBaseUIBuilder> {
 public:
  XVIZBaseUIBuilder(const std::string& type);

  // virtual std::shared_ptr<XVIZBaseUIBuilder> Child(const
  // std::shared_ptr<XVIZBaseUIBuilder>& child);

  // template<typename UIBuilderType, typename... Args>
  // UIBuilderType& Child(Args&&... args) {
  //   auto child =
  //   std::make_shared<UIBuilderType>(std::forward<Args>(args)...);
  //   children_.push_back(child);
  //   return *child;
  // }

  // // Video child
  // virtual std::shared_ptr<XVIZBaseUIBuilder> Child(const
  // std::vector<std::string>& cameras);
  // // Metric child
  // virtual std::shared_ptr<XVIZBaseUIBuilder> Child(const
  // std::vector<std::string>& streams, const std::string& description, const
  // std::string& title);
  // // Container child
  // virtual std::shared_ptr<XVIZBaseUIBuilder> Child(const std::string& name,
  // LayoutType layout);

  // virtual void Child(const std::shared_ptr<XVIZBaseUIBuilder>& child);
  virtual nlohmann::json GetUI() const;
  // void AddChildUIs(const nlohmann::json& ui_panel);

 protected:
  std::string type_;
  // std::vector<std::shared_ptr<XVIZBaseUIBuilder>> children_{};
};

}  // namespace xviz

#endif