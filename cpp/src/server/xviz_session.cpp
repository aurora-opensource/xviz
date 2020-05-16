/*
 * File: xviz_session.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 17th February 2020 3:13:44 pm
 */

#include "xviz/server/xviz_session.h"

using namespace xviz;

XVIZBaseSession::XVIZBaseSession(std::shared_ptr<websocketpp::connection<websocketpp::config::asio>> conn_ptr) :
  conn_ptr_(conn_ptr) {}