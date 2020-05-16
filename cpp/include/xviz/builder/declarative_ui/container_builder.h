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
  XVIZContainerBuilder(const std::string& name, LayoutType layout);
  UIPanel GetUI() override;
private:
  std::string name_{};
  LayoutType layout_{};
};
  
} // namespace xviz


#endif