/*
 * File: ui_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 1:15:13 am
 */

#ifndef XVIZ_DECLARATIVE_UI_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_BUILDER_H_

#include "xviz/proto/declarativeui.pb.h"
#include "xviz/builder/declarative_ui/base_ui_builder.h"
#include "xviz/builder/declarative_ui/container_builder.h"
#include "xviz/builder/declarative_ui/metric_builder.h"
#include "xviz/builder/declarative_ui/video_builder.h"
#include "xviz/builder/declarative_ui/plot_builder.h"
#include "xviz/builder/declarative_ui/table_builder.h"

#include <vector>

namespace xviz {
  


class XVIZUIBuilder {
public:

  XVIZUIBuilder();

  XVIZUIBuilder& Child(const std::shared_ptr<XVIZBaseUIBuilder>& child);

  XVIZUIBuilder& Child(const XVIZContainerBuilder& child);
  XVIZUIBuilder& Child(XVIZContainerBuilder&& child);

  XVIZUIBuilder& Child(const XVIZMetricBuilder& child);
  XVIZUIBuilder& Child(XVIZMetricBuilder&& child);

  XVIZUIBuilder& Child(const XVIZVideoBuilder& child);
  XVIZUIBuilder& Child(XVIZVideoBuilder&& child);

  XVIZUIBuilder& Child(const XVIZPlotBuilder& child);
  XVIZUIBuilder& Child(XVIZPlotBuilder&& child);

  XVIZUIBuilder& Child(const XVIZTableBuilder& child);
  XVIZUIBuilder& Child(XVIZTableBuilder&& child);

  std::vector<xviz::UIPanel> GetUI();

private:
  std::vector<std::shared_ptr<XVIZBaseUIBuilder>> children_{};
};

} // namespace xviz
#endif