from io import BytesIO
from .base import XVIZBaseWriter

from xviz_avs.message import XVIZEnvelope, XVIZMessage, Metadata

class XVIZProtobufWriter(XVIZBaseWriter):
    def __init__(self, sink, wrap_envelope=True):
        super().__init__(sink)
        self._wrap_envelop = wrap_envelope
        self._counter = 2

    def write_message(self, message: XVIZMessage, index: int = None):
        self._check_valid()
        if self._wrap_envelop:
            obj = XVIZEnvelope(message).data
        else:
            obj = message.data

        data = BytesIO()
        # write PBE1 header
        data.write(b'\x50\x42\x45\x31')
        data.write(obj.SerializeToString())

        fname = self._get_sequential_name(message, index) + '.pbe'
        self._source.write(data.getvalue(), fname)
