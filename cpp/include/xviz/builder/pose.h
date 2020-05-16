/*
 * File: pose.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 7th December 2019 2:21:32 pm
 */

#ifndef XVIZ_POSE_BUILDER_H_
#define XVIZ_POSE_BUILDER_H_

#include "xviz/builder/base_builder.h"
#include "xviz/proto/core.pb.h"
#include "xviz/utils/utils.h"

#include <memory>
#include <unordered_map>
#include <string>

namespace xviz {

class XVIZPoseBuilder : public XVIZBaseBuilder {
public:

  XVIZPoseBuilder(const std::shared_ptr<xviz::Metadata>& metadata);
  void DeepCopyFrom(const XVIZPoseBuilder& other);

  XVIZPoseBuilder& MapOrigin(double longitude, double latitude, double altitude);
  XVIZPoseBuilder& Position(double x, double y, double z);
  XVIZPoseBuilder& Orientation(double roll, double pitch, double yaw);
  XVIZPoseBuilder& Timestamp(double timestamp);

  XVIZPoseBuilder& Stream(const std::string& stream_id);

  std::shared_ptr<std::unordered_map<std::string, xviz::Pose>> GetData();

private:
  std::shared_ptr<std::unordered_map<std::string, xviz::Pose>> poses_{nullptr};
  xviz::Pose temp_poses_{};

  void Flush() override;
};
  
} // namespace minjun 

#endif