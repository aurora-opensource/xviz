/*
 * File: xviz_handler.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 17th February 2020 12:42:52 pm
 */

#ifndef XVIZ_HANDLER_H_
#define XVIZ_HANDLER_H_
#define ASIO_STANDALONE

#include <memory>

#include "xviz_session.h"

namespace xviz {

class XVIZBaseHandler {
public:
  XVIZBaseHandler() = default;
  virtual std::shared_ptr<XVIZBaseSession> GetSession(const std::unordered_map<std::string, std::string>& params,
    std::shared_ptr<websocketpp::connection<websocketpp::config::asio>> conn_ptr) = 0;
};
  
} // namespace xviz


#endif