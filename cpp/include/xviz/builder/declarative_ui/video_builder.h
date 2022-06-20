/*
 * File: video_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Wednesday, 8th January 2020 1:16:24 am
 */

#ifndef XVIZ_DECLARATIVE_UI_VIDEO_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_VIDEO_BUILDER_H_

#include "base_ui_component_builder.h"

#include <string>
#include <vector>

namespace xviz {

class XVIZVideoBuilder : public XVIZBaseUIComponentBuilder {
 public:
  XVIZVideoBuilder(const std::vector<std::string>& cameras);
  XVIZVideoBuilder(std::vector<std::string>&& cameras);

  nlohmann::json GetUI() const override;

 private:
  std::vector<std::string> cameras_{};
};

}  // namespace xviz

#endif