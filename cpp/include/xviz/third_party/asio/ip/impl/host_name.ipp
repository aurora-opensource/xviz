//
// ip/impl/host_name.ipp
// ~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2018 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef ASIO_IP_IMPL_HOST_NAME_IPP
#define ASIO_IP_IMPL_HOST_NAME_IPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include "xviz/third_party/asio/detail/config.hpp"
#include "xviz/third_party/asio/detail/socket_ops.hpp"
#include "xviz/third_party/asio/detail/throw_error.hpp"
#include "xviz/third_party/asio/detail/winsock_init.hpp"
#include "xviz/third_party/asio/ip/host_name.hpp"

#include "xviz/third_party/asio/detail/push_options.hpp"

namespace asio {
namespace ip {

std::string host_name()
{
  char name[1024];
  asio::error_code ec;
  if (asio::detail::socket_ops::gethostname(name, sizeof(name), ec) != 0)
  {
    asio::detail::throw_error(ec);
    return std::string();
  }
  return std::string(name);
}

std::string host_name(asio::error_code& ec)
{
  char name[1024];
  if (asio::detail::socket_ops::gethostname(name, sizeof(name), ec) != 0)
    return std::string();
  return std::string(name);
}

} // namespace ip
} // namespace asio

#include "xviz/third_party/asio/detail/pop_options.hpp"

#endif // ASIO_IP_IMPL_HOST_NAME_IPP
