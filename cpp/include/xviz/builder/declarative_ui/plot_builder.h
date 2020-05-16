/*
 * File: plot_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 11th January 2020 7:51:56 am
 */

#ifndef XVIZ_DECLARATIVE_UI_PLOT_BUILDER_H_
#define XVIZ_DECLARATIVE_UI_PLOT_BUILDER_H_

#include "base_ui_builder.h"

namespace xviz {

class XVIZPlotBuilder : public XVIZBaseUIBuilder {
public: 
  XVIZPlotBuilder(const std::string& title, const std::string& description, const std::string& independent_variable,
    const std::vector<std::string>& dependent_variables);
  XVIZPlotBuilder(const std::string& title, const std::string& description, const std::string& independent_variable,
    std::vector<std::string>&& dependent_variables);
  UIPanel GetUI() override;

private:
  std::string title_{};
  std::string description_{};
  std::string independent_variable_{};
  std::vector<std::string> dependent_variables_{};

};
  
} // namespace xviz



#endif