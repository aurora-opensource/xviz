/*
 * File: ui_primitive.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 7th January 2020 2:49:33 am
 */

#ifndef XVIZ_UI_PRIMITIVE_H_
#define XVIZ_UI_PRIMITIVE_H_

#include "base_builder.h"
#include "xviz/proto/core.pb.h"
#include "xviz/proto/uiprimitives.pb.h"
#include "xviz/utils/utils.h"

#include <memory>
#include <optional>

namespace xviz {

class XVIZTreeTableRowBuilder {
public:
  XVIZTreeTableRowBuilder(int id, const std::vector<std::string>& values, std::optional<int> parent = std::nullopt);
  XVIZTreeTableRowBuilder(int id, std::vector<std::string>&& values, std::optional<int> parent = std::nullopt);

  XVIZTreeTableRowBuilder& Children(int id, const std::vector<std::string>& values);
  XVIZTreeTableRowBuilder& Children(int id, std::vector<std::string>&& values);

  std::vector<TreeTableNode> GetData();

private:
  TreeTableNode node_{};
  std::vector<XVIZTreeTableRowBuilder> children_{};
};

class XVIZUIPrimitiveBuilder : public XVIZBaseBuilder {
public:
  XVIZUIPrimitiveBuilder(const std::shared_ptr<Metadata>& metadata);
  void DeepCopyFrom(const XVIZUIPrimitiveBuilder& other);

  XVIZUIPrimitiveBuilder& Stream(const std::string& stream_id);

  // XVIZUIPrimitiveBuilder& TreeTable(const std::vector<TreeTableColumn>& tree_table_columns);
  // XVIZUIPrimitiveBuilder& TreeTable(std::vector<TreeTableColumn>&& tree_table_columns);
  XVIZUIPrimitiveBuilder& Column(const std::string& display_text, xviz::TreeTableColumn::ColumnType type_id, std::optional<std::string> unit=std::nullopt);
  XVIZUIPrimitiveBuilder& Row(int id, const std::vector<std::string>& values);
  XVIZTreeTableRowBuilder& Row(int id);

  std::shared_ptr<std::unordered_map<std::string, UIPrimitiveState>> GetData();

private:
  void Flush() override;
  void FlushPrimitives();
  void Reset();

  std::shared_ptr<std::unordered_map<std::string, UIPrimitiveState>> primitives_{nullptr};
  std::shared_ptr<UIPrimitiveType> type_{nullptr};
  // std::shared_ptr<std::vector<TreeTableColumn>> columns_{nullptr};
  std::shared_ptr<TreeTableColumn> column_{nullptr};
  std::shared_ptr<XVIZTreeTableRowBuilder> row_{nullptr};
};
  
} // namespace xviz


#endif