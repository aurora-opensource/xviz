/*
 * File: xviz_server.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 17th February 2020 12:40:44 pm
 */


#include "xviz/server/xviz_server.h"

using namespace xviz;

std::pair<std::string, std::string> xviz::ParseOnePair(const std::string& kv) {
  auto key_value = PercentDecode(kv);
  auto equal_sign = key_value.find('=');
  if (equal_sign == std::string::npos) {
    return {"", ""};
  }
  std::string key = key_value.substr(0, equal_sign);
  std::string value = key_value.substr(equal_sign + 1);
  // TODO decode
  return {key, value};
}

std::unordered_map<std::string, std::string> xviz::ParseURIParameters(const std::string& uri) {
  size_t and_sign = std::string::npos;
  size_t last_and_sign_pos = 0u;
  std::unordered_map<std::string, std::string> parameters;
  while ((and_sign = uri.find('&', last_and_sign_pos)) != std::string::npos) {
    auto key_value_pair = ParseOnePair(uri.substr(last_and_sign_pos, and_sign - last_and_sign_pos));
    last_and_sign_pos = and_sign + 1;
    if (key_value_pair.first.empty() || key_value_pair.second.empty()) {
      XVIZ_LOG_WARNING("This uri is not correct: %s", uri.c_str());
      break;
    }
    parameters.insert(std::move(key_value_pair));
  }
  if (last_and_sign_pos < uri.size()) {
    auto key_value_pair = ParseOnePair(uri.substr(last_and_sign_pos));
    if (key_value_pair.first.empty() || key_value_pair.second.empty()) {
      XVIZ_LOG_WARNING("This uri is not correct: %s", uri.c_str());
    } else {
      parameters.insert(std::move(key_value_pair));
    }
  }
  return parameters;
}

std::string xviz::PercentDecode(const std::string& uri) {
  std::ostringstream oss;
  for (int i = 0; i < uri.size(); ++i) {
    char c = uri[i];
    if (c == '%') {
      int d;
      std::istringstream iss(uri.substr(i+1, 2));
      iss >> std::hex >> d;
      oss << static_cast<char>(d);
      i += 2;
    } else {
      oss << c;
    }
  }
  return oss.str();
}

XVIZServer::XVIZServer(const std::vector<std::shared_ptr<XVIZBaseHandler>>& handlers, uint16_t port, 
    int max_payload, bool per_message_defalte) :
      handlers_(handlers), port_(port), max_payload_{max_payload}, per_message_deflate_(per_message_defalte) {
  InitInternalServer();
}
XVIZServer::XVIZServer(std::vector<std::shared_ptr<XVIZBaseHandler>>&& handlers, uint16_t port, 
    int max_payload, bool per_message_defalte) :
      handlers_(std::move(handlers)), port_(port), max_payload_{max_payload}, per_message_deflate_(per_message_defalte) {
  InitInternalServer();
}


void XVIZServer::InitInternalServer() {
  internal_server_ptr_ = std::make_shared<websocketpp::server<websocketpp::config::asio>>();

  internal_server_ptr_->set_error_channels(websocketpp::log::elevel::none);
  internal_server_ptr_->set_access_channels(websocketpp::log::alevel::none);
  internal_server_ptr_->set_reuse_addr(true);
  internal_server_ptr_->init_asio();

  internal_server_ptr_->set_open_handler(std::bind(
    &XVIZServer::HandleSession, this, std::placeholders::_1
  ));

  internal_server_ptr_->listen(port_);
  internal_server_ptr_->start_accept();
}


void XVIZServer::HandleSession(websocketpp::connection_hdl hdl) {
  auto conn = internal_server_ptr_->get_con_from_hdl(hdl);
  auto query = conn->get_uri()->get_query();
  auto params = ParseURIParameters(query);

  for (const auto& handler_ptr : handlers_) {
    auto session_ptr = handler_ptr->GetSession(params, conn);
    if (session_ptr) {
      std::thread t(std::bind(
        &XVIZServer::SessionThread, this, session_ptr
      ));
      t.detach();
      break;
    }
  }
}

void XVIZServer::SessionThread(std::shared_ptr<XVIZBaseSession> session_ptr) {
  try {
    session_ptr->OnConnect();
    session_ptr->Main();
    session_ptr->OnDisconnect();
  } catch (const websocketpp::exception& e) {
    XVIZ_LOG_WARNING("%s", e.what());
  }
}

void XVIZServer::Serve() {
  internal_server_ptr_->run();
}
