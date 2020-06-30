from xviz_avs.builder.base_builder import XVIZBaseBuilder, CATEGORY
from xviz_avs.v2.core_pb2 import VariableState


class XVIZVariableBuilder(XVIZBaseBuilder):
    def __init__(self, metadata, logger=None):
        super().__init__(CATEGORY.VARIABLE, metadata, logger)

        # Stores variable data by stream then id
        # They will then be group when constructing final object
        self._data = {}

        # inflight builder data
        self._id = None
        self._values = None

    def id(self, identifier):
        self._validate_prop_set_once('_id')
        self._id = identifier
        return self

    def values(self, values):
        self._validate_prop_set_once('_values')
        if not isinstance(values, (list, tuple)):
            self._logger.error("Input `values` must be array")

        self._values = values
        return self

    def get_data(self):
        self._flush()
        if not self._data:
            return None

        return self._data

    def _add_variable_entry(self):
        if not self._data_pending():
            return

        stream_entry = None
        if self._stream_id not in self._data:
            stream_entry = VariableState()
            self._data[self._stream_id] = stream_entry
        else:
            stream_entry = self._data[self._stream_id]

        if self._id:
            for entry in stream_entry.variables:
                if entry.base.object_id == self._id:
                    # TODO validate error, which should throw
                    self._logger.error("Input `values` already set for id %s" % self._id)
                    raise Exception('id values already set')

        var_entry = stream_entry.variables.add()
        value = self._values[0]
        if isinstance(value, str):
            var_entry.values.strings.extend(self._values)
        elif isinstance(value, bool):
            var_entry.values.bools.extend(self._values)
        elif isinstance(value, int):
            var_entry.values.int32s.extend(self._values)
        elif isinstance(value, float):
            var_entry.values.doubles.extend(self._values)
        else:
            self._logger.error("The type of input value is not recognized!")

        if self._id:
            var_entry.base.object_id = self._id

    def _data_pending(self):
        return self._values or self._id

    def _validate(self):
        if self._data_pending():
            super()._validate()
            if self._values is None:
                self._logger.warning("Stream %s values are not provided" % self._stream_id)

    def _flush(self):
        self._validate()
        self._add_variable_entry()
        self.reset()

    def reset(self):
        super().reset()
        self._id = None
        self._values = None
