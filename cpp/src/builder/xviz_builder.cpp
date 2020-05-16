/*
 * File: xviz_builder.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 17th December 2019 2:24:17 am
 */

#include "xviz/builder/xviz_builder.h"

using namespace xviz;

std::string primary_pose_stream = "/vehicle_pose";

template<typename K, typename V>
void ConvertFromStdMapToProtoBufMap(google::protobuf::Map<K, V>* map, std::unordered_map<K, V>& m) {
  map->clear();
  for (auto& [k, v] : m) {
    // TODO is it correct
    (*map)[k] = std::move(v);
  }
}

template<typename T>
void DeepCopy(std::shared_ptr<T>& dest_ptr, const std::shared_ptr<T>& source_ptr,
  const std::shared_ptr<Metadata>& metadata) {
  if (source_ptr == nullptr) {
    dest_ptr = nullptr;
    return;
  }
  if (dest_ptr == nullptr) {
    dest_ptr = std::make_shared<T>(metadata);
  }
  dest_ptr->DeepCopyFrom(*source_ptr);
}

XVIZBuilder::XVIZBuilder(std::shared_ptr<Metadata> metadata) :
  metadata_(metadata) {

  pose_builder_ = std::make_shared<XVIZPoseBuilder>(metadata_);
  primitive_builder_ = std::make_shared<XVIZPrimitiveBuilder>(metadata_);
  time_series_builder_ = std::make_shared<XVIZTimeSeriesBuilder>(metadata_);
  ui_primitive_builder_ = std::make_shared<XVIZUIPrimitiveBuilder>(metadata_);
}

void XVIZBuilder::DeepCopyFrom(const XVIZBuilder& other) {
  DeepCopyPtr(metadata_, other.metadata_);
  DeepCopy(pose_builder_, other.pose_builder_, metadata_);
  DeepCopy(primitive_builder_, other.primitive_builder_, metadata_);
  DeepCopy(time_series_builder_, other.time_series_builder_, metadata_);
  DeepCopy(ui_primitive_builder_, other.ui_primitive_builder_, metadata_);
}

XVIZPoseBuilder& XVIZBuilder::Pose(const std::string& stream_id) {
  return pose_builder_->Stream(stream_id);
}
XVIZPrimitiveBuilder& XVIZBuilder::Primitive(const std::string& stream_id) {
  return primitive_builder_->Stream(stream_id);
}

XVIZTimeSeriesBuilder& XVIZBuilder::TimeSeries(const std::string& stream_id) {
  return time_series_builder_->Stream(stream_id);
}

XVIZUIPrimitiveBuilder& XVIZBuilder::UIPrimitive(const std::string& stream_id) {
  return ui_primitive_builder_->Stream(stream_id);
}

XVIZFrame XVIZBuilder::GetData() {
  auto data = std::make_shared<StreamSet>();
  auto poses = pose_builder_->GetData();
  if (poses == nullptr || poses->find(primary_pose_stream) == poses->end()) {
    XVIZ_LOG_ERROR("every frame requires a %s message", primary_pose_stream.c_str());
  }
  if (poses != nullptr) {
    data->set_timestamp((*poses)[primary_pose_stream].timestamp());
    auto pose_map = data->mutable_poses();
    ConvertFromStdMapToProtoBufMap<std::string, xviz::Pose>(pose_map, *poses);
  }

  auto primitives = primitive_builder_->GetData();
  auto primitives_map = data->mutable_primitives();
  if (primitives != nullptr) {
    ConvertFromStdMapToProtoBufMap<std::string, xviz::PrimitiveState>(primitives_map, *primitives);
  }

  auto time_series = time_series_builder_->GetData();
  for (auto& time_series_state : *time_series) {
    auto state_ptr = data->add_time_series();
    // TODO is this correct?
    *state_ptr = std::move(time_series_state);
  }

  auto ui_primitives = ui_primitive_builder_->GetData();
  auto ui_primitives_map = data->mutable_ui_primitives();
  if (ui_primitives != nullptr) {
    ConvertFromStdMapToProtoBufMap<std::string, xviz::UIPrimitiveState>(ui_primitives_map, *ui_primitives);
  }

  return XVIZFrame(data);
}

XVIZMessage XVIZBuilder::GetMessage() {
  auto state_update = std::make_shared<StateUpdate>();
  state_update->set_update_type(StateUpdate::UpdateType::StateUpdate_UpdateType_SNAPSHOT);
  auto new_update = state_update->add_updates();
  auto frame = GetData();
  *new_update = std::move(*(frame.Data()));
  return XVIZMessage(state_update);
}