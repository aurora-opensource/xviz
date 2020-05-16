/*
 * File: message.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Tuesday, 17th December 2019 2:36:21 am
 */

#ifndef XVIZ_MESSAGE_H_
#define XVIZ_MESSAGE_H_

#include "xviz/proto/core.pb.h"
#include "xviz/proto/session.pb.h"
#include "xviz/utils/json.hpp"
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
  // XVIZMessage(std::shared_ptr<StateUpdate> update = nullptr, std::shared_ptr<Metadata> meatadata = nullptr);
  XVIZMessage(std::shared_ptr<Metadata> metadata = nullptr);
  XVIZMessage(std::shared_ptr<StateUpdate> update = nullptr);

  nlohmann::json ToObject(bool unravel = true);
  std::string ToObjectString(bool unravel = true);
  std::shared_ptr<StateUpdate> GetStateUpdate();
  std::shared_ptr<Metadata> GetMetadata();
private:
  std::shared_ptr<StateUpdate> update_{nullptr};
  std::shared_ptr<Metadata> metadata_{nullptr};
};
  
} // namespace xviz


#endif