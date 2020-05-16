/*
 * File: time_series.h
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 4th January 2020 5:06:09 am
 */

#ifndef XVIZ_TIME_SERIES_H_
#define XVIZ_TIME_SERIES_H_

#include "base_builder.h"
#include "xviz/proto/core.pb.h"
#include "xviz/utils/macrologger.h"
#include "xviz/utils/utils.h"

#include <memory>
#include <unordered_map>
#include <string>
#include <variant>

namespace xviz {

class XVIZTimeSeriesBuilder : public XVIZBaseBuilder {
public:
  XVIZTimeSeriesBuilder(const std::shared_ptr<Metadata>& metadata);
  void DeepCopyFrom(const XVIZTimeSeriesBuilder& other);

  XVIZTimeSeriesBuilder& Stream(const std::string& stream_id);

  XVIZTimeSeriesBuilder& Id(const std::string& id);
  XVIZTimeSeriesBuilder& Id(std::string&& id);

  XVIZTimeSeriesBuilder& Value(const std::string& value);
  XVIZTimeSeriesBuilder& Value(std::string&& value);
  XVIZTimeSeriesBuilder& Value(const char* value);
  XVIZTimeSeriesBuilder& Value(bool value);
  XVIZTimeSeriesBuilder& Value(int value);
  XVIZTimeSeriesBuilder& Value(double value);

  XVIZTimeSeriesBuilder& Timestamp(double timestamp);

  std::shared_ptr<std::vector<TimeSeriesState>> GetData();
private:
  void Flush() override;
  void FlushNotReset();
  void Validate();
  void AddTimestampEntry();
  void Reset();
  bool IsDataPending();

  std::pair<std::vector<std::string>, std::unordered_map<std::string, std::vector<std::variant<std::string, bool, int, double>>>> GetFieldEntry(const std::string& field_name);
  std::unordered_map<std::string, std::pair<std::vector<std::string>, std::unordered_map<std::string, std::vector<std::variant<std::string, bool, int, double>>>>> GetIdEntry(const std::string& field_name);

  std::shared_ptr<std::unordered_map<double, std::unordered_map<std::string, std::unordered_map<std::string, std::pair<std::vector<std::string>, std::unordered_map<std::string, std::vector<std::variant<std::string, bool, int, double>>>>>>>> data_{nullptr};
  std::shared_ptr<std::string> id_{nullptr};
  std::shared_ptr<std::variant<std::string, bool, int, double>> value_{nullptr};
  std::shared_ptr<double> timestamp_{nullptr};

  size_t vpos_ = std::variant_npos;
};

} // namespace xviz


#endif