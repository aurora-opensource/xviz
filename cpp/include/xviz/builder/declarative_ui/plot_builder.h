/*
 * File: plot_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 11th January 2020 7:51:56 am
 */

#ifndef XVIZ_DECLARATIVE_UI_PLOT_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_PLOT_BUILDER_H_

#include "base_ui_component_builder.h"

namespace xviz {

class XVIZPlotBuilder : public XVIZBaseUIComponentBuilder {
 public:
  XVIZPlotBuilder(const std::string& independent_variable,
                  const std::vector<std::string>& dependent_variables,
                  const std::string& title = "",
                  const std::string& description = "");
  nlohmann::json GetUI() const override;

 private:
  std::string independent_variable_{};
  std::vector<std::string> dependent_variables_{};
  // TODO add regions
};

}  // namespace xviz

#endif