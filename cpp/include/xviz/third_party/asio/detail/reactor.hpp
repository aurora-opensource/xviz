//
// detail/reactor.hpp
// ~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2018 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef ASIO_DETAIL_REACTOR_HPP
#define ASIO_DETAIL_REACTOR_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include "xviz/third_party/asio/detail/reactor_fwd.hpp"

#if defined(ASIO_HAS_EPOLL)
#include "xviz/third_party/asio/detail/epoll_reactor.hpp"
#elif defined(ASIO_HAS_KQUEUE)
#include "xviz/third_party/asio/detail/kqueue_reactor.hpp"
#elif defined(ASIO_HAS_DEV_POLL)
#include "xviz/third_party/asio/detail/dev_poll_reactor.hpp"
#elif defined(ASIO_HAS_IOCP) || defined(ASIO_WINDOWS_RUNTIME)
#include "xviz/third_party/asio/detail/null_reactor.hpp"
#else
#include "xviz/third_party/asio/detail/select_reactor.hpp"
#endif

#endif // ASIO_DETAIL_REACTOR_HPP
