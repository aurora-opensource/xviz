from xviz_avs.builder.base_builder import XVIZBaseBuilder, CATEGORY
from xviz_avs.v2.core_pb2 import TimeSeriesState

class XVIZTimeSeriesBuilder(XVIZBaseBuilder):
    def __init__(self, metadata, logger=None):
        super().__init__(CATEGORY.TIME_SERIES, metadata, logger)

        # Stores time_series data by timestamp then id
        # They will then be group when constructing final object
        self._data = {}
        self._reset()

    def id(self, identifier):
        self._validate_prop_set_once('_id')
        self._id = identifier
        return self

    def value(self, value):
        self._validate_prop_set_once('_value')

        if isinstance(value, list):
            self._logger.error("Input `value` must be single value")

        self._value = value
        return self

    def timestamp(self, timestamp):
        self._validate_prop_set_once('_timestamp')

        if isinstance(timestamp, list):
            self._logger.error("Input `value` must be single value")

        self._timestamp = timestamp
        return self

    def get_data(self):
        self._flush()
        if not self._data:
            return None

        time_series_data = []
        for timestamp, ids in self._data.items():
            for id_, fields in ids.items():
                for tsdata in fields.values():
                    entry = TimeSeriesState(
                        timestamp=timestamp,
                        streams=tsdata['streams'],
                        values=tsdata['values'],
                        object_id=id_
                    )

                    time_series_data.append(entry)

        return time_series_data

    def _add_timestamp_entry(self):
        # this._data structure
        # timestamp: {
        #   id: {
        #     fieldName: {
        #       streams: []
        #       values: []
        #     }
        #   }
        # }
        if not self._data_pending():
            return

        if isinstance(self._value, str):
            field_name = "strings"
        elif isinstance(self._value, bool):
            field_name = "bools"
        elif isinstance(self._value, int):
            field_name = "int32s"
        elif isinstance(self._value, float):
            field_name = "doubles"
        else:
            self._logger.error("The type of input value is not recognized!")
        
        ts_entry = self._data.get(self._timestamp)
        if ts_entry:
            id_entry = ts_entry.get(self._id)
            if id_entry:
                field_entry = id_entry.get(field_name)
                if field_entry:
                    field_entry['streams'].append(self._stream_id)
                    field_entry['values'][field_name].append(self._value)
                else:
                    id_entry[field_name] = self._get_field_entry(field_name)
            else:
                ts_entry[self._id] = self._get_id_entry(field_name)
        else:
            ts_entry = {self._id: self._get_id_entry(field_name)}
            self._data[self._timestamp] = ts_entry

    def _get_id_entry(self, field_name):
        return {field_name: self._get_field_entry(field_name)}

    def _get_field_entry(self, field_name):
        return dict(streams=[self._stream_id], values={field_name: [self._value]})

    def _data_pending(self):
        return self._value or self._timestamp or self._id

    def _validate(self):
        if self._data_pending():
            super()._validate()

            self._validate_has_prop("_value")
            self._validate_has_prop("_timestamp")

    def _flush(self):
        self._validate()
        self._add_timestamp_entry()
        self._reset()

    def _reset(self):
        self._id = None
        self._value = None
        self._timestamp = None
