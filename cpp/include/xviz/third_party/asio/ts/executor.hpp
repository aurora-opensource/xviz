//
// ts/executor.hpp
// ~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2018 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef ASIO_TS_EXECUTOR_HPP
#define ASIO_TS_EXECUTOR_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include "xviz/third_party/asio/handler_type.hpp"
#include "xviz/third_party/asio/async_result.hpp"
#include "xviz/third_party/asio/associated_allocator.hpp"
#include "xviz/third_party/asio/execution_context.hpp"
#include "xviz/third_party/asio/is_executor.hpp"
#include "xviz/third_party/asio/associated_executor.hpp"
#include "xviz/third_party/asio/bind_executor.hpp"
#include "xviz/third_party/asio/executor_work_guard.hpp"
#include "xviz/third_party/asio/system_executor.hpp"
#include "xviz/third_party/asio/executor.hpp"
#include "xviz/third_party/asio/dispatch.hpp"
#include "xviz/third_party/asio/post.hpp"
#include "xviz/third_party/asio/defer.hpp"
#include "xviz/third_party/asio/strand.hpp"
#include "xviz/third_party/asio/packaged_task.hpp"
#include "xviz/third_party/asio/use_future.hpp"

#endif // ASIO_TS_EXECUTOR_HPP
