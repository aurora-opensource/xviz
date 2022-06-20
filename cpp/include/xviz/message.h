/*
 * File: message.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 17th December 2019 2:36:21 am
 */

#ifndef XVIZ_MESSAGE_H_
#define XVIZ_MESSAGE_H_

#include "xviz/v2/core.pb.h"
#include "xviz/v2/envelope.pb.h"
#include "xviz/v2/options.pb.h"
#include "xviz/v2/session.pb.h"

#include <nlohmann/json.hpp>
#include "xviz/utils/macrologger.h"
#include "xviz/utils/utils.h"

#include <google/protobuf/util/json_util.h>
#include <iostream>

namespace xviz {

class XVIZFrame {
 public:
  XVIZFrame(std::shared_ptr<StreamSet> data);
  nlohmann::json ToObject(bool unravel = true);
  std::string ToObjectString(bool unravel = true);
  std::shared_ptr<StreamSet> Data();

 private:
  std::shared_ptr<StreamSet> data_{nullptr};
};

class XVIZMessage {
 public:
  // TODO use overload method ?????
  // XVIZMessage(std::shared_ptr<StateUpdate> update = nullptr,
  // std::shared_ptr<Metadata> meatadata = nullptr);
  XVIZMessage(std::shared_ptr<Metadata> metadata = nullptr);
  XVIZMessage(std::shared_ptr<StateUpdate> update = nullptr);

  nlohmann::json ToObject(bool unravel = true);
  std::string ToObjectString(bool unravel = true);
  std::shared_ptr<StateUpdate> GetStateUpdate() const;
  std::shared_ptr<Metadata> GetMetadata() const;
  std::string GetSchema() const;

 private:
  std::shared_ptr<StateUpdate> update_{nullptr};
  std::shared_ptr<Metadata> metadata_{nullptr};
};

class XVIZEnvelope {
 public:
  XVIZEnvelope(const XVIZMessage& message, bool is_update = true);

  const std::shared_ptr<xviz::v2::Envelope> GetData() const;

 private:
  std::shared_ptr<xviz::v2::Envelope> data_{nullptr};
};

}  // namespace xviz

#endif