/*
 * File: definitions.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 7th December 2019 2:46:43 pm
 */


#ifndef XVIZ_DEFINES_H_
#define XVIZ_DEFINES_H_

#include "xviz/proto/session.pb.h"
#include "xviz/proto/style.pb.h"

namespace xviz {

using AnnotationType = xviz::StreamMetadata::AnnotationType;
using Category = xviz::StreamMetadata::Category;
using CoordinateType = xviz::StreamMetadata::CoordinateType;
using Primitive = xviz::StreamMetadata::PrimitiveType;
using ScalarType = xviz::StreamMetadata::ScalarType;
using UIPrimitiveType = xviz::StreamMetadata::UIPrimitiveType;

// ui

// struct PurePoint {
//   double x, y, z;
//   PurePoint(double xx, double yy, double zz) :
//     x(xx), y(yy), z(zz) {}
// };

} // namespace minjun


#endif