/*
 * File: definitions.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 7th December 2019 2:46:43 pm
 */

#ifndef XVIZ_DEFINES_H_
#define XVIZ_DEFINES_H_

#include "xviz/v2/session.pb.h"
#include "xviz/v2/style.pb.h"

namespace xviz {

using AnnotationType = v2::StreamMetadata::AnnotationType;
using Category = v2::StreamMetadata::Category;
using CoordinateType = v2::StreamMetadata::CoordinateType;
using Primitive = v2::StreamMetadata::PrimitiveType;
using ScalarType = v2::StreamMetadata::ScalarType;
using UIPrimitiveType = v2::StreamMetadata::UIPrimitiveType;

using StreamSet = v2::StreamSet;
using Metadata = v2::Metadata;
using StateUpdate = v2::StateUpdate;
using StreamMetadata = v2::StreamMetadata;
using StyleObjectValue = v2::StyleObjectValue;
using StyleStreamValue = v2::StyleStreamValue;
using PrimitiveBase = v2::PrimitiveBase;
using Stadium = v2::Stadium;
using Pose = v2::Pose;
using Text = v2::Text;
using Image = v2::Image;
using Circle = v2::Circle;
using Point = v2::Point;
using Polyline = v2::Polyline;
using Polygon = v2::Polygon;
using TreeTableNode = v2::TreeTableNode;
using TreeTableColumn = v2::TreeTableColumn;
using TimeSeriesState = v2::TimeSeriesState;
using UIPrimitiveState = v2::UIPrimitiveState;
using PrimitiveState = v2::PrimitiveState;

// ui

// struct PurePoint {
//   double x, y, z;
//   PurePoint(double xx, double yy, double zz) :
//     x(xx), y(yy), z(zz) {}
// };

}  // namespace xviz

#endif