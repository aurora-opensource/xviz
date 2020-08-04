/*
 * File: main.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 7th December 2019 1:35:32 pm
 */

#include <iostream>
#include "xviz/builder/metadata.h"
#include "xviz/builder/pose.h"
#include "xviz/builder/xviz_builder.h"
#include "xviz/v2/primitives.pb.h"

#include "xviz/builder/declarative_ui/container_builder.h"
#include "xviz/builder/declarative_ui/metric_builder.h"
#include "xviz/builder/declarative_ui/video_builder.h"

#include <memory>

using namespace xviz;

XVIZUIBuilder GetUIBuilder() {
  XVIZUIBuilder ui_builder;

  XVIZPanelBuilder panel("Camera");
  std::vector<std::string> cameras = {"/camera/images0"};
  panel.Child<XVIZVideoBuilder>(cameras);
  ui_builder.Child(panel);

  std::vector<std::string> streams = {"/vehicle/acceleration"};
  XVIZContainerBuilder container("Metrics", "VERTICAL");
  container.Child<XVIZMetricBuilder>(streams, "123", "123");
  container.Child<XVIZMetricBuilder>(streams, "123", "123");
  container.Child<XVIZMetricBuilder>(streams, "123", "123");
  ui_builder.Child(container);

  return ui_builder;
  // std::unordered_map<std::string, XVIZUIBuilder> ui_builders;

  // ui_builders["Camera"] = XVIZUIBuilder();
  // ui_builders["Metrics"] = XVIZUIBuilder();
  // ui_builders["Plot"] = XVIZUIBuilder();
  // ui_builders["Table"] = XVIZUIBuilder();

  // std::vector<std::string> streams = {"/object/ts"};
  // std::vector<std::string> dep_vars = {"ddd", "aaa"};
  // XVIZVideoBuilder camera_builder(cameras);
  // XVIZPlotBuilder plot_builder("title", "des", "indep_var",
  // std::move(dep_vars)); XVIZTableBuilder table_builder("title", "des",
  // "/some_stream/table", true);

  // std::shared_ptr<XVIZBaseUIBuilder> metric_builder1 =
  // std::make_shared<XVIZMetricBuilder>(streams, "123", "123");
  // std::shared_ptr<XVIZBaseUIBuilder> metric_builder2 =
  // std::make_shared<XVIZMetricBuilder>(streams, "123", "123");
  // std::shared_ptr<XVIZBaseUIBuilder> metric_builder3 =
  // std::make_shared<XVIZMetricBuilder>(streams, "123", "123");

  // std::shared_ptr<XVIZBaseUIBuilder> container_builder =
  // std::make_shared<XVIZContainerBuilder>("metrics", LayoutType::VERTICAL);
  // container_builder->Child(metric_builder1);
  // container_builder->Child(metric_builder2);
  // container_builder->Child<XVIZMetricBuilder>(streams, "123", "123");
  // ui_builders["Camera"].Child(std::move(camera_builder));
  // ui_builders["Metrics"].Child(container_builder);
  // ui_builders["Plot"].Child(plot_builder);
  // ui_builders["Table"].Child(table_builder);
  // return ui_builders;
}

int main() {
  // Circle circle;
  // circle.add_center(0);
  // auto builder = std::make_shared<XVIZBuilder>(std::make_shared<Metadata>());
  std::string s = "{\"fill_color\": \"#f00\"}";
  std::string s1 = "{\"fill_color\": \"#f00\"}";  //, \"point_color_mode\":
                                                  //\"DISTANCE_TO_VEHICLE\"}";
  // std::vector<unsigned char> colors = {(unsigned char)255, 0 ,0};
  // auto ss = base64_encode(colors.data(), colors.size());

  //   std::string s = "{\"fill_color\":\"" + ss + "\"}";
  //   std::cout << s << std::endl;
  //   // std::string s1 = "{\"fill_color\": [255, 0, 0]}"; //,
  //   \"point_color_mode\": \"ELEVATION\"}"; auto s1 = s;

  auto metadata_builder = std::make_shared<XVIZMetadataBuilder>();
  metadata_builder->Stream("/vehicle_pose")
      .Category(Category::StreamMetadata_Category_POSE)
      .Stream("/object/shape")
      .Category(Category::StreamMetadata_Category_PRIMITIVE)
      .Type(Primitive::StreamMetadata_PrimitiveType_POLYGON)
      .Coordinate(
          CoordinateType::
              StreamMetadata_CoordinateType_VEHICLE_RELATIVE)  //.Unit("123").Source("123")
      .StreamStyle(s1)
      .Stream("/object/shape2")
      .Category(Category::StreamMetadata_Category_PRIMITIVE)
      .Type(Primitive::StreamMetadata_PrimitiveType_POLYGON)
      .StyleClass("circle", s1)
      .Stream("/object/circles")
      .Category(Category::StreamMetadata_Category_PRIMITIVE)
      .Type(Primitive::StreamMetadata_PrimitiveType_CIRCLE)
      .Stream("/camera/images0")
      .Category(Category::StreamMetadata_Category_PRIMITIVE)
      .Type(Primitive::StreamMetadata_PrimitiveType_IMAGE)
      .Stream("/object/text")
      .Category(Category::StreamMetadata_Category_PRIMITIVE)
      .Type(Primitive::StreamMetadata_PrimitiveType_TEXT)
      .Stream("/object/stadium")
      .Category(Category::StreamMetadata_Category_PRIMITIVE)
      .Type(Primitive::StreamMetadata_PrimitiveType_STADIUM)
      .Stream("/object/ts")
      .Category(Category::StreamMetadata_Category_TIME_SERIES)
      .Type(xviz::StreamMetadata::STRING)
      .Stream("/object/uptest")
      .Category(Category::StreamMetadata_Category_UI_PRIMITIVE)
      .UI(GetUIBuilder());
  metadata_builder->StartTime(1000).EndTime(1010);

  XVIZBuilder builder(metadata_builder->GetData());
  // XVIZBuilder builder(std::make_shared<Metadata>());
  // auto builder = std::make_shared<XVIZPoseBuilder>(Metadata());
  builder.Pose("/vehicle_pose")
      .Timestamp(1000)
      .MapOrigin(0.00, 0.00, 0.000)
      .Orientation(0, 0, 0);
  // ->Stream("234")
  // ->Timestamp(123123123)
  // ->Position(1, 2, 3);
  // builder->Pose("123")
  //   ->Orientation(1, 2, 3)
  //   ->Position(3, 4, 5)
  //   ->Timestamp(222);

  builder.Primitive("/object/shape")
      .Polygon({10, 14, 0, 7, 10, 0, 13, 6, 0})
      .Polygon({-2, 20, 0, 5, 14, 0, 8, 17, 0, 1, 23, 0})
      .Style(s);
  //     ->Style(s)
  //     ->Polygon({2, 3, 4})
  //     ->Style(s1)
  //     ->Points({1, 2, 3, 3, 3, 3})
  //     ->Style(s1)
  //     ->Polyline({4, 4, 4})
  //     ->Style(s);
  // builder.Primitive("/peds")
  //     .Polygon({2, 2, 2})
  //     .Style(nlohmann::json::parse(s1));

  builder.Primitive("/object/shape2").Points({1, 2, 3}).Colors({0, 1, 2, 3});

  builder.Primitive("/object/circles").Circle({1, 2, 3}, 1.0).Style(s);

  builder.Primitive("/object/text").Text("hello world").Position({1, 2, 3});

  builder.Primitive("/object/stadium").Stadium({0, 0, 0}, {1, 1, 1}, 10);

  builder.Primitive("/camera/images0").Image("123231");

  builder.TimeSeries("/object/ts").Id("123").Timestamp(123).Value("123");

  builder.UIPrimitive("/object/uptest")
      .Column("title", xviz::TreeTableColumn::INT32)
      .Row(1, {"123"});

  auto metadata_res = metadata_builder->GetMessage();
  auto res = builder.GetMessage();
  // for (const auto& pa : *res) {
  //   std::cout << pa.first << std::endl;
  //   std::cout << pa.second.SerializeAsString() << std::endl;
  // }
  auto obj = res.ToObject();
  // auto obj_metadata = metadata_res.ToObject();
  std::cout << metadata_res.ToObject() << std::endl;
  // std::cout << obj << std::endl;
  // std::cout << obj.is_string() << std::endl;
  // for (auto itr = obj.begin(); itr != obj.end(); itr++) {
  //   std::cout << itr.key() << "   " << itr.value() << std::endl;
  // }

  // XVIZGLBWriter writer;
  // std::string mes;
  // writer.WriteMessage(mes, res);
  // std::cout << mes << std::endl;

  return 0;
}