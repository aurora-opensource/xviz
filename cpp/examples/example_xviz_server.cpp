/*
 * File: example_xviz_server.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Monday, 17th February 2020 3:16:09 pm
 */

#include "xviz/server/xviz_server.h"
#include "xviz/server/xviz_handler.h"
#include "xviz/server/xviz_session.h"

#include <iostream>
#include <fstream>
#include "xviz/proto/primitives.pb.h"
#include "xviz/builder/pose.h"
#include "xviz/builder/xviz_builder.h"
#include "xviz/builder/metadata.h"

#include "xviz/builder/declarative_ui/video_builder.h"
#include "xviz/builder/declarative_ui/metric_builder.h"
#include "xviz/builder/declarative_ui/table_builder.h"
#include "xviz/builder/declarative_ui/container_builder.h"
#include "xviz/io/glb_writer.h"

using namespace xviz;

std::unordered_map<std::string, XVIZUIBuilder> GetUIBuilders() {

  std::unordered_map<std::string, XVIZUIBuilder> ui_builders;

  ui_builders["Camera"] = XVIZUIBuilder();
  ui_builders["Metrics"] = XVIZUIBuilder();
  ui_builders["Tables"] = XVIZUIBuilder();

  std::vector<std::string> cameras = {"/camera/images0"};
  std::vector<std::string> streams = {"/vehicle/acceleration"};
  std::vector<std::string> dep_vars = {"ddd", "aaa"};
  XVIZVideoBuilder camera_builder(cameras);

  std::shared_ptr<XVIZBaseUIBuilder> container_builder = std::make_shared<XVIZContainerBuilder>("metrics", LayoutType::VERTICAL);
  container_builder->Child<XVIZMetricBuilder>(streams, "acceleration", "acceleration");

  auto table_builder1 = std::make_shared<XVIZTableBuilder>("table1", "table1", "/table/1", false);
  std::shared_ptr<XVIZBaseUIBuilder> container_builder2 = std::make_shared<XVIZContainerBuilder>("tables", LayoutType::VERTICAL);
  container_builder2->Child(table_builder1);
  container_builder2->Child<XVIZTableBuilder>("table2", "table2", "/table/2", true);

  ui_builders["Camera"].Child(std::move(camera_builder));
  ui_builders["Metrics"].Child(container_builder);
  ui_builders["Tables"].Child(container_builder2);
  return ui_builders;
}

class Scenario {
public:
  Scenario(const std::string& png_file_name) {
    for (int i = 0; i < 10; i++) {
      points_.push_back(0);
      points_.push_back(0);
      points_.push_back(i);
      colors_.push_back(255u);
      colors_.push_back(0u);
      colors_.push_back(0u);
      colors_.push_back(255u);
    }
    if (png_file_name.empty()) {
      XVIZ_LOG_INFO("No png is shown");
      return;
    }
    std::ifstream in(png_file_name, std::ios::binary);
    if (!in.is_open()) {
      XVIZ_LOG_INFO("No png is shown");
      return;
    }
    while (in) {
      char c;
      in.get(c);
      if (in) {
        image.push_back(c);
      }
    }
    XVIZ_LOG_INFO("Image length: %ld", image.size());
  }

  std::shared_ptr<XVIZMetadataBuilder> GetMetaBuilder() {
    std::string s = "{\"fill_color\": \"#fff\"}"; 
    std::string s1 = "{\"fill_color\": \"#0ff\"}"; //, \"point_color_mode\": \"ELEVATION\"}"; 
    auto metadata_builder = std::make_shared<XVIZMetadataBuilder>();
    metadata_builder->Stream("/vehicle_pose").Category(Category::StreamMetadata_Category_POSE)
      .Stream("/object/shape").Category(Category::StreamMetadata_Category_PRIMITIVE).Type(Primitive::StreamMetadata_PrimitiveType_POINT)
        .StreamStyle(s)
      .Stream("/object/circles").Category(Category::StreamMetadata_Category_PRIMITIVE).Type(Primitive::StreamMetadata_PrimitiveType_CIRCLE)
        .StyleClass("circle", s1)
      .Stream("/camera/images0").Category(Category::StreamMetadata_Category_PRIMITIVE).Type(Primitive::StreamMetadata_PrimitiveType_IMAGE)
      .Stream("/table/1").Category(Category::StreamMetadata_Category_UI_PRIMITIVE)
      .Stream("/table/2").Category(Category::StreamMetadata_Category_UI_PRIMITIVE)
      .Stream("/vehicle/acceleration")
        .Category(Category::StreamMetadata_Category_TIME_SERIES)
        .Unit("m/s^2")
        .Type(ScalarType::StreamMetadata_ScalarType_FLOAT)
      .UI(std::move(GetUIBuilders()));
    metadata_ptr_ = metadata_builder;
    return metadata_builder;
  }

  std::string GetUpdate() {
    points_.push_back(0);
    points_.push_back(0);
    points_.push_back(cnt);
    colors_.push_back(255u);
    colors_.push_back(255u);
    colors_.push_back(255u);
    colors_.push_back(255u);

    XVIZBuilder builder(metadata_ptr_->GetData());
    builder.Pose("/vehicle_pose")
      .Timestamp(cnt)
      .MapOrigin(0.00, 0.00, 0.000)
      .Orientation(0, 0, 0);
    builder.Primitive("/object/circles")
      .Circle({1, 2, 3}, 20.0)
      .Classes({"circle"});
    builder.Primitive("/object/shape")
      .Points(points_)
      .Colors(colors_);
    if (!image.empty()) {
      builder.Primitive("/camera/images0")
        .Image(image);
    }
    builder.TimeSeries("/vehicle/acceleration")
      .Timestamp(cnt)
      .Value(cnt % 10)
      .Id("acceleration");

    builder.UIPrimitive("/table/1")
      .Column("Number", TreeTableColumn::INT32, "m/s")
      .Column("Test", TreeTableColumn::STRING)
      .Row(0)
        .Children(1, {"1", "test"})
        .Children(2, {"1", "test"})
        .Children(3, {"1", "test"})
        .Children(4, {"1", "test"})
        .Children(5, {"1", "test"})
        .Children(6, {"1", "test"})
        .Children(7, {"1", "test"})
        .Children(8, {"2", "ggg"});
    
    builder.UIPrimitive("/table/2")
      .Column("Number", TreeTableColumn::INT32, "m/s")
      .Row(0, {"1"})
      .Row(1, {"2"});

    cnt++;
    XVIZGLBWriter writer;
    std::string str;
    writer.WriteMessage(str, builder.GetMessage());
    return str;
    // return builder.GetMessage().ToObjectString();
  }

private:
  std::shared_ptr<xviz::XVIZMetadataBuilder> metadata_ptr_{};
  int cnt = 11;
  std::vector<double> points_{};
  std::vector<uint8_t> colors_{};
  std::string image;
};


class LiveSession : public XVIZBaseSession {
public:
  LiveSession(std::shared_ptr<websocketpp::connection<websocketpp::config::asio>> conn_ptr,
    const Scenario& sce) : XVIZBaseSession(conn_ptr), sce_(sce) {}

  void MessageHandler(websocketpp::connection_hdl hdl, std::shared_ptr<websocketpp::config::core::message_type> msg) {
    XVIZ_LOG_INFO("%s", msg->get_payload().c_str());
  }

  void OnConnect() override {
    XVIZ_LOG_INFO("Frontend connected");
    conn_ptr_->send(sce_.GetMetaBuilder()->GetMessage().ToObjectString());
    conn_ptr_->set_message_handler(std::bind(
      &LiveSession::MessageHandler, this, std::placeholders::_1, std::placeholders::_2)
    );
  }
  
  void Main() override {
    while (true) {
      std::this_thread::sleep_for(std::chrono::seconds(1));
      auto err_code = conn_ptr_->send(sce_.GetUpdate(), websocketpp::frame::opcode::BINARY);
      if (err_code) {
        throw websocketpp::exception("loss connection");
      }
    }
  }

  void OnDisconnect() override {
    XVIZ_LOG_INFO("Frontend disconnected");
  }

private:
  Scenario sce_{""};
};

class LiveHandler : public XVIZBaseHandler {
public:
  LiveHandler(const Scenario& sce) : sce_(sce), XVIZBaseHandler() {}
  std::shared_ptr<XVIZBaseSession> GetSession(const std::unordered_map<std::string, std::string>& params,
    std::shared_ptr<websocketpp::connection<websocketpp::config::asio>> conn_ptr) override {
    return std::make_shared<LiveSession>(conn_ptr, sce_);
  }
private:
  Scenario sce_;
};

int main(int argc, char** argv) {
  std::string png_file_name;
  if (argc >= 2) {
    png_file_name = argv[1];
  }
  std::vector<std::shared_ptr<xviz::XVIZBaseHandler>> handlers;
  handlers.push_back(std::make_shared<LiveHandler>(Scenario(png_file_name)));
  xviz::XVIZServer server(handlers);
  server.Serve();
}