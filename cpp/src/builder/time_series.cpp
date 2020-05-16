/*
 * File: time_series.cpp
 * Author: Minjun Xu (mjxu96@gmail.com)
 * File Created: Saturday, 4th January 2020 5:18:49 am
 */

#include "xviz/builder/time_series.h"

using namespace xviz;

using TimeSeriesFieldEntryType = std::pair<std::vector<std::string>, std::unordered_map<std::string, std::vector<std::variant<std::string, bool, int, double>>>>;
using TimeSeriesFieldType = std::unordered_map<std::string, TimeSeriesFieldEntryType>;
using TimeSeriesIdType = std::unordered_map<std::string, TimeSeriesFieldType>;
using TimeSeriesType = std::unordered_map<double, TimeSeriesIdType>;

XVIZTimeSeriesBuilder::XVIZTimeSeriesBuilder(const std::shared_ptr<Metadata>& metadata) : 
  XVIZBaseBuilder(Category::StreamMetadata_Category_TIME_SERIES, metadata) {
  data_ = std::make_shared<TimeSeriesType>();
  Reset();
}

void XVIZTimeSeriesBuilder::DeepCopyFrom(const XVIZTimeSeriesBuilder& other) {
  XVIZBaseBuilder::DeepCopyFrom(other);
  DeepCopyPtr(data_, other.data_);
  DeepCopyPtr(id_, other.id_);
  DeepCopyPtr(value_, other.value_);
  DeepCopyPtr(timestamp_, other.timestamp_);
  vpos_ = other.vpos_;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Stream(const std::string& stream_id) {
  if (stream_id_.size() > 0) {
    Flush();
  }

  stream_id_ = stream_id;
  return *this;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Id(const std::string& id) {
  id_ = std::make_shared<std::string>(id);
  return *this;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Id(std::string&& id) {
  id_ = std::make_shared<std::string>(std::move(id));
  return *this;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Value(const std::string& value) {
  value_ = std::make_shared<std::variant<std::string, bool, int, double>>(value);
  return *this;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Value(std::string&& value) {
  value_ = std::make_shared<std::variant<std::string, bool, int, double>>(std::move(value));
  return *this;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Value(const char* value) {
  value_ = std::make_shared<std::variant<std::string, bool, int, double>>(std::string(value));
  return *this;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Value(bool value) {
  value_ = std::make_shared<std::variant<std::string, bool, int, double>>(value);
  return *this;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Value(int value) {
  value_ = std::make_shared<std::variant<std::string, bool, int, double>>(value);
  return *this;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Value(double value) {
  value_ = std::make_shared<std::variant<std::string, bool, int, double>>(value);
  return *this;
}

XVIZTimeSeriesBuilder& XVIZTimeSeriesBuilder::Timestamp(double timestamp) {
  timestamp_ = std::make_shared<double>(timestamp);
  return *this;
}

std::shared_ptr<std::vector<TimeSeriesState>> XVIZTimeSeriesBuilder::GetData() {
  FlushNotReset();

  auto ts_state = std::make_shared<std::vector<TimeSeriesState>>();

  // if (IsDataPending()) {
  //   AddTimestampEntry();
  //   Reset();
  //   return ts_state;
  // }

  for (const auto& [timestamp, ids] : *data_) {
    for (const auto& [id, fields] : ids) {
      for (const auto& [field_name, entry] : fields) {
        TimeSeriesState ts;
        ts.set_object_id(id);
        ts.set_timestamp(timestamp);
        for (const auto& stream : std::get<0>(entry)) {
          auto new_stream_ptr = ts.add_streams();
          // TODO is it correct?
          *new_stream_ptr = stream;
        }

        auto value_ptr = ts.mutable_values();
        for (auto& [fn, values] : std::get<1>(entry)) {
          for (auto& value : values) {
            auto vpos = value.index();
            switch (vpos) {
              case 0u:
                value_ptr->add_strings(std::get<0u>(value));
                break;
              case 1u:
                value_ptr->add_bools(std::get<1u>(value));
                break;
              case 2u:
                value_ptr->add_int32s(std::get<2u>(value));
                break;
              case 3u:
                value_ptr->add_doubles(std::get<3u>(value));
                break;
              default:
                XVIZ_LOG_ERROR("The type of input value is not reconized");
            }
          }
        }
        ts_state->emplace_back(std::move(ts));
      }
    }
  }

  Reset();

  return ts_state;
}

void XVIZTimeSeriesBuilder::Validate() {
  XVIZBaseBuilder::Validate();
}

void XVIZTimeSeriesBuilder::AddTimestampEntry() {
  // if (!IsDataPending()) {
  //   return;
  // }
  std::string field_name;

  vpos_ = value_->index();

  switch (vpos_) {
    case 0u:
      field_name = "strings";
      break;
    case 1u:
      field_name = "bools";
      break;
    case 2u:
      field_name = "int32s";
      break;
    case 3u:
      field_name = "doubles";
      break;
    default:
      XVIZ_LOG_ERROR("The type of input value is not reconized");
      return;
  }

  if (data_->find(*timestamp_) != data_->end()) {
    TimeSeriesIdType& ts_entry = (*data_)[*timestamp_];
    if (ts_entry.find(*id_) != ts_entry.end()) {
      TimeSeriesFieldType& id_entry = ts_entry[*id_];
      if (id_entry.find(field_name) != id_entry.end()) {
        std::get<0>(id_entry[field_name]).emplace_back(stream_id_);
        std::get<1>(id_entry[field_name])[field_name].emplace_back(*value_);
      } else {
        id_entry[field_name] = GetFieldEntry(field_name);
      }
    } else {
      ts_entry[*id_] = GetIdEntry(field_name);
    }
  } else {
    (*data_)[*timestamp_] = TimeSeriesIdType{
      {*id_, GetIdEntry(field_name)}
    };
  }
}

void XVIZTimeSeriesBuilder::Flush() {
  if (!IsDataPending()) {
    return;
  }
  Validate();
  AddTimestampEntry();
  Reset();
}

void XVIZTimeSeriesBuilder::FlushNotReset() {
  if (!IsDataPending()) {
    return;
  }
  Validate();
  AddTimestampEntry();
}

void XVIZTimeSeriesBuilder::Reset() {
  id_ = nullptr;
  value_ = nullptr;
  timestamp_ = nullptr;
}

bool XVIZTimeSeriesBuilder::IsDataPending() {
  return id_ != nullptr && timestamp_ != nullptr && value_ != nullptr;
}

TimeSeriesFieldEntryType XVIZTimeSeriesBuilder::GetFieldEntry(const std::string& field_name) {
  TimeSeriesFieldEntryType entry;
  std::get<0>(entry).emplace_back(stream_id_);
  std::get<1>(entry)[field_name].emplace_back(*value_);
  return entry;
}

TimeSeriesFieldType XVIZTimeSeriesBuilder::GetIdEntry(const std::string& field_name) {
  return TimeSeriesFieldType{
    {field_name, GetFieldEntry(field_name)}
  };
}