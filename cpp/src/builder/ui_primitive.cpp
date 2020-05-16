/*
 * File: ui_primitive.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 7th January 2020 3:06:21 am
 */

#include "xviz/builder/ui_primitive.h"

using namespace xviz;

XVIZTreeTableRowBuilder::XVIZTreeTableRowBuilder(int id, const std::vector<std::string>& values, std::optional<int> parent) {
  node_.set_id(id);
  if (parent != std::nullopt) {
    node_.set_parent(parent.value());
  }
  
  for (const auto& value : values) {
    auto added_string_ptr = node_.add_column_values();
    *added_string_ptr = value;
  }
}

XVIZTreeTableRowBuilder::XVIZTreeTableRowBuilder(int id, std::vector<std::string>&& values, std::optional<int> parent) {
  node_.set_id(id);
  if (parent != std::nullopt) {
    node_.set_parent(parent.value());
  }

  for (auto& value : values) {
    auto added_string_ptr = node_.add_column_values();
    *added_string_ptr = std::move(value);
  }
}

XVIZTreeTableRowBuilder& XVIZTreeTableRowBuilder::Children(int id, const std::vector<std::string>& values) {
  children_.emplace_back(id, values, node_.id());
  return *this;
}

XVIZTreeTableRowBuilder& XVIZTreeTableRowBuilder::Children(int id, std::vector<std::string>&& values) {
  children_.emplace_back(id, std::move(values), node_.id());
  return *this;
}

std::vector<TreeTableNode> XVIZTreeTableRowBuilder::GetData() {
  std::vector<TreeTableNode> nodes;
  nodes.push_back(std::move(node_));

  for (auto& child : children_) {
    auto child_nodes = child.GetData();
    for (auto& n : child_nodes) {
      nodes.push_back(std::move(n));
    }
  }

  return std::move(nodes);
}

XVIZUIPrimitiveBuilder::XVIZUIPrimitiveBuilder(const std::shared_ptr<Metadata>& metadata) : 
  XVIZBaseBuilder(Category::StreamMetadata_Category_UI_PRIMITIVE, metadata) {
  
  Reset();
  primitives_ = std::make_shared<std::unordered_map<std::string, UIPrimitiveState>>();
}

void XVIZUIPrimitiveBuilder::DeepCopyFrom(const XVIZUIPrimitiveBuilder& other) {
  XVIZBaseBuilder::DeepCopyFrom(other);
  DeepCopyPtr(primitives_, other.primitives_);
  DeepCopyPtr(type_, other.type_);
  // DeepCopyPtr(columns_, other.columns_);
  DeepCopyPtr(column_, other.column_);
  DeepCopyPtr(row_, other.row_);
}

XVIZUIPrimitiveBuilder& XVIZUIPrimitiveBuilder::Stream(const std::string& stream_id) {
  if (stream_id_.size() != 0) {
    Flush();
  }

  stream_id_ = stream_id;
  return *this;
}

// XVIZUIPrimitiveBuilder& XVIZUIPrimitiveBuilder::TreeTable(const std::vector<TreeTableColumn>& tree_table_columns) {
//   if (type_ != nullptr) {
//     Flush();
//   }
//   columns_ = std::make_shared<std::vector<TreeTableColumn>>(tree_table_columns);
//   type_ = std::make_shared<UIPrimitiveType>(UIPrimitiveType::StreamMetadata_UIPrimitiveType_TREETABLE);
//   return *this;
// }

// XVIZUIPrimitiveBuilder& XVIZUIPrimitiveBuilder::TreeTable(std::vector<TreeTableColumn>&& tree_table_columns) {
//   if (type_ != nullptr) {
//     Flush();
//   }
//   columns_ = std::make_shared<std::vector<TreeTableColumn>>(std::move(tree_table_columns));
//   type_ = std::make_shared<UIPrimitiveType>(UIPrimitiveType::StreamMetadata_UIPrimitiveType_TREETABLE);
//   return *this;
// }

XVIZUIPrimitiveBuilder& XVIZUIPrimitiveBuilder::Column(const std::string& display_text, xviz::TreeTableColumn::ColumnType type_id, std::optional<std::string> unit) {
  if (type_ != nullptr) {
    Flush();
  }
  column_ = std::make_shared<TreeTableColumn>();
  column_->set_display_text(display_text);
  column_->set_type(type_id);
  if (unit.has_value()) {
    column_->set_unit(unit.value());
  }
  type_ = std::make_shared<UIPrimitiveType>(UIPrimitiveType::StreamMetadata_UIPrimitiveType_TREETABLE);
  return *this;
}

XVIZTreeTableRowBuilder& XVIZUIPrimitiveBuilder::Row(int id) {
  if (type_ != nullptr) {
    Flush();
  }
  row_ = std::make_shared<XVIZTreeTableRowBuilder>(id, std::vector<std::string>());
  type_ = std::make_shared<UIPrimitiveType>(UIPrimitiveType::StreamMetadata_UIPrimitiveType_TREETABLE);
  return *row_;
}

XVIZUIPrimitiveBuilder& XVIZUIPrimitiveBuilder::Row(int id, const std::vector<std::string>& values) {
  if (type_ != nullptr) {
    Flush();
  }
  row_ = std::make_shared<XVIZTreeTableRowBuilder>(id, values);
  type_ = std::make_shared<UIPrimitiveType>(UIPrimitiveType::StreamMetadata_UIPrimitiveType_TREETABLE);
  return *this;
}

std::shared_ptr<std::unordered_map<std::string, UIPrimitiveState>> XVIZUIPrimitiveBuilder::GetData() {
  if (type_ != nullptr) {
    Flush();
  }

  if (primitives_->size() != 0) {
    return primitives_;
  }

  return nullptr;
}

void XVIZUIPrimitiveBuilder::Flush() {
  XVIZBaseBuilder::Validate();
  FlushPrimitives();
}

void XVIZUIPrimitiveBuilder::FlushPrimitives() {
  if (type_ == nullptr) {
    XVIZ_LOG_ERROR("Please at least indicate a type for ui primitive");
    return;
  }
  switch (*type_) {
    case UIPrimitiveType::StreamMetadata_UIPrimitiveType_TREETABLE: {
      if (primitives_->find(stream_id_) == primitives_->end()) {
        (*primitives_)[stream_id_] = UIPrimitiveState();
      }

      if (column_ == nullptr && row_ == nullptr) {
        XVIZ_LOG_ERROR("Plase first call Column() or Row()");
        Reset();
        return;
      }

      auto tree_table_ptr = (*primitives_)[stream_id_].mutable_treetable();
      // if (columns_ != nullptr) {
      //   for (auto& column : *columns_) {
      //     auto new_column_ptr = tree_table_ptr->add_columns();
      //     *new_column_ptr = std::move(column);
      //   }
      // }
      if (column_ != nullptr) {
        auto new_column_ptr = tree_table_ptr->add_columns();
        *new_column_ptr = std::move(*column_);
      }
      

      if (row_ != nullptr) {
        auto rows = row_->GetData();
        for (auto& row : rows) {
          auto new_row_ptr = tree_table_ptr->add_nodes();
          *new_row_ptr = std::move(row);
        }
      }
      break;
    }
    default:
      XVIZ_LOG_INFO("Unknown type");
  }

  Reset();
}

void XVIZUIPrimitiveBuilder::Reset() {
  type_ = nullptr;
  column_ = nullptr;
  // columns_ = nullptr;
  row_ = nullptr;
}