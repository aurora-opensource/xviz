/*
 * File: table_builder.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 11th January 2020 7:57:39 am
 */

#ifndef XVIZ_DECCLARATIVE_UI_TABLE_BUILDER_H_
#define XVIZ_DECCLARATIVE_UI_TABLE_BUILDER_H_

#include "base_ui_builder.h"

namespace xviz {

class XVIZTableBuilder : public XVIZBaseUIBuilder {
public: 
  XVIZTableBuilder(const std::string& title, const std::string& description, const std::string& stream, bool display_object_id);
  UIPanel GetUI() override;

private:
  std::string title_{};
  std::string description_{};
  std::string stream_{};
  bool display_object_id_{};

};
  
} // namespace xviz


#endif