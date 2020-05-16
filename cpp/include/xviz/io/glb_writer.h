/*
 * File: glb_writer.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 20th January 2020 4:15:31 pm
 */


#ifndef XVIZ_IO_GLB_WRITER_H_
#define XVIZ_IO_GLB_WRITER_H_

#include "xviz/utils/gltf.h"
#include "xviz/utils/base64.h"
#include "xviz/message.h"

#include <memory>
#include <vector>
#include <string>
#include <sstream>
#include <iostream>

namespace xviz {

// class GLTFBuilder {
// public:
//   GLTFBuilder() = delete;
//   GLTFBuilder(xviz::XVIZMessage& message);
//   std::vector<uint8_t> GetData();
//   // std::string GetBinary();
//   // fx::gltf::Document GetDocument();
// };

class XVIZGLBWriter {
public:
  XVIZGLBWriter() = default;
  XVIZGLBWriter(const std::shared_ptr<std::string>& sink);

  // void WriteMessage(xviz::XVIZMessage& message);
  // void WriteMessage(xviz::XVIZMessage&& message);
  void WriteMessage(std::string& sink, xviz::XVIZMessage& message);
  void WriteMessage(std::string& sink, xviz::XVIZMessage&& message);
  void WriteMessage(const std::string& file_sink, xviz::XVIZMessage& message);

private:
  std::shared_ptr<std::string> sink_{nullptr};
};
  
} // namespace xviz


#endif