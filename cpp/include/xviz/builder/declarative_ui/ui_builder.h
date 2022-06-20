/*
 * File: ui_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 1:15:13 am
 */

#ifndef XVIZ_DECLARATIVE_UI_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_BUILDER_H_

#include "xviz/builder/declarative_ui/base_ui_builder.h"
#include "xviz/builder/declarative_ui/container_builder.h"
#include "xviz/builder/declarative_ui/panel_builder.h"

#include <vector>

namespace xviz {

class XVIZUIBuilder {
 public:
  XVIZUIBuilder();

  XVIZUIBuilder& Child(const XVIZPanelBuilder& panel);
  XVIZUIBuilder& Child(const XVIZContainerBuilder& container);
  // XVIZUIBuilder& Child(const std::shared_ptr<XVIZBaseUIBuilder>& child);

  // XVIZUIBuilder& Child(const XVIZContainerBuilder& child);
  // XVIZUIBuilder& Child(XVIZContainerBuilder&& child);

  // XVIZUIBuilder& Child(const XVIZMetricBuilder& child);
  // XVIZUIBuilder& Child(XVIZMetricBuilder&& child);

  // XVIZUIBuilder& Child(const XVIZVideoBuilder& child);
  // XVIZUIBuilder& Child(XVIZVideoBuilder&& child);

  // XVIZUIBuilder& Child(const XVIZPlotBuilder& child);
  // XVIZUIBuilder& Child(XVIZPlotBuilder&& child);

  // XVIZUIBuilder& Child(const XVIZTableBuilder& child);
  // XVIZUIBuilder& Child(XVIZTableBuilder&& child);

  std::unordered_map<std::string, nlohmann::json> GetUI() const;

 private:
  std::vector<XVIZPanelBuilder> panel_children_{};
  std::vector<XVIZContainerBuilder> container_children_{};
};

}  // namespace xviz
#endif