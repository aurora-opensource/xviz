/*
 * File: pose.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 7th December 2019 2:55:16 pm
 */

#include "xviz/builder/pose.h"

using namespace xviz;

XVIZPoseBuilder::XVIZPoseBuilder(const std::shared_ptr<xviz::Metadata>& metadata) : 
  XVIZBaseBuilder(xviz::StreamMetadata::POSE, metadata) {
  poses_ = nullptr;
  temp_poses_ = xviz::Pose();
}

void XVIZPoseBuilder::DeepCopyFrom(const XVIZPoseBuilder& other) {
  XVIZBaseBuilder::DeepCopyFrom(other);
  DeepCopyPtr(poses_, other.poses_);
  temp_poses_.CopyFrom(other.temp_poses_);
}

XVIZPoseBuilder& XVIZPoseBuilder::Stream(const std::string& stream_id) {
  if (stream_id_.size() > 0) {
    this->Flush();
  }
  stream_id_ = stream_id;
  return *this;
}

XVIZPoseBuilder& XVIZPoseBuilder::MapOrigin(double longitude, double latitude, double altitude) {
  temp_poses_.mutable_map_origin()->set_longitude(longitude);
  temp_poses_.mutable_map_origin()->set_latitude(latitude);
  temp_poses_.mutable_map_origin()->set_altitude(altitude);
  return *this;
}

XVIZPoseBuilder& XVIZPoseBuilder::Position(double x, double y, double z) {
  temp_poses_.add_position(x);
  temp_poses_.add_position(y);
  temp_poses_.add_position(z);
  return *this;
}

XVIZPoseBuilder& XVIZPoseBuilder::Orientation(double roll, double pitch, double yaw) {
  temp_poses_.add_orientation(roll);
  temp_poses_.add_orientation(pitch);
  temp_poses_.add_orientation(yaw);
  return *this;
}

XVIZPoseBuilder& XVIZPoseBuilder::Timestamp(double timestamp) {
  temp_poses_.set_timestamp(timestamp);
  return *this;
}

void XVIZPoseBuilder::Flush() {
  if (poses_ == nullptr) {
    poses_ = std::make_shared<std::unordered_map<std::string, xviz::Pose>>();
  }
  poses_->insert({stream_id_, temp_poses_});
  temp_poses_ = xviz::Pose();
}

std::shared_ptr<std::unordered_map<std::string, xviz::Pose>> XVIZPoseBuilder::GetData() {
  if (stream_id_.size() > 0) {
    Flush();
  }
  return poses_;
}