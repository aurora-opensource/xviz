/*
 * File: plot_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 11th January 2020 7:57:20 am
 */

#include "xviz/builder/declarative_ui/plot_builder.h"

using namespace xviz;

XVIZPlotBuilder::XVIZPlotBuilder(
    const std::string& independent_variable,
    const std::vector<std::string>& dependent_variables,
    const std::string& title, const std::string& description)
    : XVIZBaseUIComponentBuilder("PLOT", title, description),
      independent_variable_(independent_variable),
      dependent_variables_(dependent_variables) {}

nlohmann::json XVIZPlotBuilder::GetUI() const {
  nlohmann::json ui_panel = XVIZBaseUIComponentBuilder::GetUI();
  if (!independent_variable_.empty()) {
    ui_panel["independentVariable"] = independent_variable_;
    ui_panel["dependentVariables"] = dependent_variables_;
  }
  return ui_panel;
}