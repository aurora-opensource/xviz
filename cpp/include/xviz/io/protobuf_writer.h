/*
 * File: protobuf_writer.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * Github: https://github.com/wx9698
 * File Created: Tuesday, 4th August 2020 9:27:55 pm
 */

#ifndef XVIZ_IO_PROTOBUF_WRITER_H_
#define XVIZ_IO_PROTOBUF_WRITER_H_

#include <string>
#include "xviz/message.h"

namespace xviz {

::std::string WriteToProtobuf(const XVIZMessage& message,
                              bool is_update = true);

}  // namespace xviz

#endif
