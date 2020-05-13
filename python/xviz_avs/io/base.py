
from easydict import EasyDict as edict
import json

from xviz_avs.io.sources import BaseSource
from xviz_avs.message import AllDataType, XVIZMessage, Metadata

class XVIZBaseWriter:
    def __init__(self, source: BaseSource):
        '''
        :param sink: object of type in xviz.io.sources
        '''
        if source is None:
            raise ValueError("Data source must be specified!")
        self._source = source
        self._message_timings = dict(messages={})
        self._wrote_message_index = False
        self._counter = 2

    def _get_sequential_name(self, message: XVIZMessage, index=None):
        raw_data = message.data
        if isinstance(raw_data, Metadata):
            self._save_timestamp(raw_data)
            fname = "1-frame"
        else:
            if not index:
                index = self._counter
                self._counter += 1

            self._save_timestamp(raw_data, index)
            fname = "%d-frame" % index
        return fname

    def _write_message_index(self):
        self._check_valid()
        
        times = sorted(self._message_timings.keys())
        timing = [self._message_timings[t] for t in times]

        self._message_timings['timing'] = timing
        self._source.write(json.dumps(self._message_timings, separators=(',', ':'))\
            .encode('ascii'), '0-frame.json')

    def close(self):
        '''
        Write timestamp list into the sink and then close the source.
        '''
        if self._source:
            self._write_message_index()
            self._source.close()
            self._source = None

    def _check_valid(self):
        if not self._source:
            raise ValueError("The writer has been closed!")

    def _save_timestamp(self, xviz_data: AllDataType, index: int = None):
        if index: # normal data
            if not xviz_data.updates:
                raise ValueError("Cannot find timestamp")

            times = [update.timestamp for update in xviz_data.updates]
            tmin, tmax = min(times), max(times)

            self._message_timings['messages'][index] = (tmin, tmax, index, "%d-frame" % index)
        else: # metadata
            if xviz_data.HasField('log_info'):
                self._message_timings['start_time'] = xviz_data.log_info.start_time
                self._message_timings['end_time'] = xviz_data.log_info.end_time

class XVIZBaseReader:
    def __init__(self, source):
        raise NotImplementedError()
