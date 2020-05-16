/*
 * File: plot_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 11th January 2020 7:57:20 am
 */

#include "xviz/builder/declarative_ui/plot_builder.h"

using namespace xviz;
XVIZPlotBuilder::XVIZPlotBuilder(const std::string& title, const std::string& description, const std::string& independent_variable,
    const std::vector<std::string>& dependent_variables) : XVIZBaseUIBuilder(ComponentType::PLOT),
      title_(title), description_(description), independent_variable_(independent_variable), dependent_variables_(dependent_variables) {}

XVIZPlotBuilder::XVIZPlotBuilder(const std::string& title, const std::string& description, const std::string& independent_variable,
    std::vector<std::string>&& dependent_variables) : XVIZBaseUIBuilder(ComponentType::PLOT),
      title_(title), description_(description), independent_variable_(independent_variable), dependent_variables_(std::move(dependent_variables)) {}

UIPanel XVIZPlotBuilder::GetUI() {
  UIPanel ui_panel = XVIZBaseUIBuilder::GetUI();
  ui_panel.set_title(title_);
  ui_panel.set_description(description_);
  ui_panel.set_independent_variable(independent_variable_);
  for (const auto& dependent_variable : dependent_variables_) {
    auto new_var_ptr = ui_panel.add_dependent_variables();
    *new_var_ptr = dependent_variable;
  }

  return ui_panel;
}