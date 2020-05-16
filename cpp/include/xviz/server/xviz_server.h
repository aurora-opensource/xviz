/*
 * File: xviz_server.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 17th February 2020 12:40:58 pm
 */

#ifndef XVIZ_SERVER_H_
#define XVIZ_SERVER_H_
#define ASIO_STANDALONE

#include <vector>
#include <stdint.h>
#include <limits>
#include <functional>
#include <unordered_map>

#include <xviz/third_party/websocketpp/config/asio_no_tls.hpp>
#include <xviz/third_party/websocketpp/server.hpp>

#include "xviz_handler.h"
#include "xviz/utils/macrologger.h"

namespace xviz {

class XVIZServer {
public:
  // void SetMainFunction(const std::function<void(websocketpp::connection_hdl, std::shared_ptr<asio::steady_timer>, 
  //   std::shared_ptr<void>)>& main_function);
  // void SetMainFunction(std::function<void(websocketpp::connection_hdl, std::shared_ptr<asio::steady_timer>, 
  //   std::shared_ptr<void>)>&& main_function);

  XVIZServer(const std::vector<std::shared_ptr<XVIZBaseHandler>>& handlers, uint16_t port=8081u, 
    int max_payload=std::numeric_limits<int>::max(), bool per_message_defalte=false);
  XVIZServer(std::vector<std::shared_ptr<XVIZBaseHandler>>&& handlers, uint16_t port=8081u, 
    int max_payload=std::numeric_limits<int>::max(), bool per_message_defalte=false);
  void Serve();

private:
  // virtual void Main() = 0;
  void HandleSession(websocketpp::connection_hdl hdl);
  void SessionThread(std::shared_ptr<XVIZBaseSession> session_ptr);

  // std::function<void(websocketpp::connection_hdl, std::shared_ptr<asio::steady_timer>, std::shared_ptr<void>)> main_function_{};

  std::vector<std::shared_ptr<XVIZBaseHandler>> handlers_{};
  uint16_t port_{};
  int max_payload_{};
  bool per_message_deflate_{};

  void InitInternalServer();
  std::shared_ptr<websocketpp::server<websocketpp::config::asio>> internal_server_ptr_{nullptr};


  // helper functions
  // std::unordered_map<std::string, std::string> ParseParameters(const std::string& uri);

};

std::pair<std::string, std::string> ParseOnePair(const std::string& key_value);
std::unordered_map<std::string, std::string> ParseURIParameters(const std::string& uri);
std::string PercentDecode(const std::string& uri);
  
} // namespace xviz


#endif