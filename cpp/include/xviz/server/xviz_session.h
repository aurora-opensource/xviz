/*
 * File: xviz_session.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 17th February 2020 12:42:59 pm
 */

#ifndef XVIZ_SESSION_H_
#define XVIZ_SESSION_H_
#define ASIO_STANDALONE

#include <functional>
#include <xviz/third_party/websocketpp/config/asio_no_tls.hpp>
#include <xviz/third_party/websocketpp/server.hpp>

namespace xviz {

class XVIZBaseSession {
public:
  XVIZBaseSession(std::shared_ptr<websocketpp::connection<websocketpp::config::asio>> conn_ptr);
  // void SetMainHandler(const std::function<void(websocketpp::connection_hdl, std::shared_ptr<asio::steady_timer>, 
  //   std::shared_ptr<void>)>& main_function);
  // void SetMainHandler(std::function<void(websocketpp::connection_hdl, std::shared_ptr<asio::steady_timer>, 
  //   std::shared_ptr<void>)>&& main_function);
  
  virtual void OnConnect() = 0;
  // Now it is multi-thread, consider changing it to coroutine
  virtual void Main() = 0;
  virtual void OnDisconnect() = 0;
protected:
  std::shared_ptr<websocketpp::connection<websocketpp::config::asio>> conn_ptr_{nullptr};
  // std::function<void(, std::shared_ptr<void>)> main_function_{};
};
  
} // namespace xviz


#endif
