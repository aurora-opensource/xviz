import base64
from PIL import Image as pImage
from io import BytesIO
from typing import Dict, List, Union

from google.protobuf.json_format import MessageToDict

from xviz_avs.v2.core_pb2 import StreamSet
from xviz_avs.v2.envelope_pb2 import Envelope
from xviz_avs.v2.options_pb2 import xviz_json_schema
from xviz_avs.v2.session_pb2 import Metadata, StateUpdate


def _unravel_style_object(style: dict):
    # TODO: support `#FFFFFFFF` style packing
    if 'fill_color' in style:
        style['fill_color'] = list(base64.b64decode(style['fill_color']))
    if 'stroke_color' in style:
        style['stroke_color'] = list(base64.b64decode(style['stroke_color']))

class XVIZFrame:
    '''
    This class is basically a wrapper around protobuf message `StreamSet`. It represent a frame of update.
    '''
    def __init__(self, data: StreamSet = None, buffers: dict = {}):
        if data and not isinstance(data, StreamSet):
            raise ValueError("The data input must be structured (using StreamSet class)")
        self._data = data or StreamSet()
        self._buffers = buffers

    def _pack_image(self, image: pImage.Image):
        '''
        Pack image data into bytes
        '''
        data = BytesIO()
        image.save(data, format="PNG") # compress to PNG format by default
        return data.getvalue()

    def to_object(self, unravel: str = 'full') -> Dict:
        '''
        Serialize this data to primitive objects (with dict and list). Flattened arrays will
        be restored in this process.
        
        :param unravel: convert packed binary data to readable objects
            none: do not unravel
            partial: only unravel small binary data
            full: unravel all binary data
        '''
        assert unravel in ['none', 'partial', 'full']
        dataobj = MessageToDict(self._data, preserving_proto_field_name=True)

        if unravel is 'none':
            return dataobj

        if 'primitives' in dataobj:
            for stream_id, pdata in dataobj['primitives'].items():
                # process point array and colors
                if 'points' in pdata:
                    for pldata, buffer in zip(pdata['points'], self._buffers[stream_id]):
                        pldata['points'] = buffer.tolist() if unravel is 'full' else buffer
                        if 'colors' in pldata:
                            pldata['colors'] = list(base64.b64decode(pldata['colors']))

                # process images
                if 'images' in pdata:
                    for pldata, buffer in zip(pdata['images'], self._buffers[stream_id]):
                        pldata['data'] = self._pack_image(buffer) if unravel is 'full' else buffer

                # process styles
                for pcats in pdata.values():
                    for pldata in pcats:
                        if isinstance(pldata, dict) and 'base' in pldata and 'style' in pldata['base']:
                            _unravel_style_object(pldata['base']['style'])

        if 'future_instances' in dataobj:
            for stream_id, pdata in dataobj['future_instances'].items():
                for fts, fdata in zip(pdata['timestamps'], pdata['primitives']):
                    # process point array and colors
                    if 'points' in fdata:
                        for pldata, buffer in zip(fdata['points'], self._buffers[(stream_id, fts)]):
                            pldata['points'] = buffer.tolist() if unravel is 'full' else buffer
                            if 'colors' in pldata:
                                pldata['colors'] = list(base64.b64decode(pldata['colors']))

                    # process images
                    if 'images' in pdata:
                        for pldata, buffer in zip(pdata['images'], self._buffers[(stream_id, fts)]):
                            pldata['data'] = self._pack_image(buffer) if unravel is 'full' else buffer

                    # process styles
                    for pcats in fdata.values():
                        for pldata in pcats:
                            if isinstance(pldata, dict) and 'base' in pldata and 'style' in pldata['base']:
                                _unravel_style_object(pldata['base']['style'])
   
        return dataobj

    def to_proto(self) -> StreamSet:
        # apply buffer to proper location, this could take some time
        data = StreamSet()
        data.CopyFrom(self._data)

        # flush primitives data
        for stream_id, pdata in data.primitives.items():
            if len(pdata.points) > 0:
                for ptdata, ptbuffer in zip(pdata.points, self._buffers[stream_id]):
                    ptdata.points = ptbuffer.tolist()
            if len(pdata.images) > 0:
                for ptdata, ptbuffer in zip(pdata.images, self._buffers[stream_id]):
                    ptdata.data = self._pack_image(ptbuffer)

        # flush future primitives data
        for stream_id, pdata in data.future_instances.items():
            for fts, fdata in zip(pdata.timestamps, pdata.primitives):
                if len(fdata.points) > 0:
                    for ptdata, ptbuffer in zip(fdata.points, self._buffers[(stream_id, fts)]):
                        ptdata.points = ptbuffer.tolist()
                if len(fdata.images) > 0:
                    for ptdata, ptbuffer in zip(fdata.images, self._buffers[(stream_id, fts)]):
                        ptdata.data = self._pack_image(ptbuffer)

        return data

AllDataType = Union[StateUpdate, Metadata]

class XVIZMessage:
    def __init__(self,
        update: StateUpdate = None,
        metadata: Metadata = None,
        buffers: dict = {}
    ):
        self._data = None
        self._buffers = buffers

        if update:
            if not isinstance(update, StateUpdate):
                raise ValueError("The state update input must be structured (using StateUpdate class)")
            if self._data:
                raise ValueError("Message data has already been set!")
            self._data = update

        if metadata:
            if not isinstance(metadata, Metadata):
                raise ValueError("The metadata input must be structured (using Metadata class)")
            if self._data:
                raise ValueError("Message data has already been set!")
            self._data = metadata

    def get_schema(self) -> str:
        return type(self._data).DESCRIPTOR.GetOptions().Extensions[xviz_json_schema]

    def to_proto(self) -> AllDataType:
        # apply buffer to state update message
        if isinstance(self._data, StateUpdate):
            data = StateUpdate()
            data.update_type = self._data.update_type
            for frame, buffer in zip(self._data.updates, self._buffers):
                data.updates.append(XVIZFrame(frame, buffer).to_proto())
            return data
        else:
            return self._data

    def to_object(self, unravel: str = 'full') -> Dict:
        assert unravel in ['none', 'partial', 'full']

        if unravel is 'none':
            return MessageToDict(self._data, preserving_proto_field_name=True)

        if isinstance(self._data, StateUpdate):
            return {
                'update_type': StateUpdate.UpdateType.Name(self._data.update_type),
                'updates': [XVIZFrame(frame, buffer).to_object(unravel=unravel)
                            for frame, buffer in zip(self._data.updates, self._buffers)]
            }
        elif isinstance(self._data, Metadata):
            dataobj = MessageToDict(self._data, preserving_proto_field_name=True)

            # process styles
            if 'streams' in dataobj:
                for sdata in dataobj['streams'].values():
                    if 'stream_style' in sdata:
                        _unravel_style_object(sdata['stream_style'])
                    if 'style_classes' in sdata:
                        for style_class in sdata['style_classes']:
                            _unravel_style_object(style_class['style'])

            return dataobj

class XVIZEnvelope:
    def __init__(self, data: Union[XVIZMessage, AllDataType]):
        if isinstance(data, XVIZMessage):
            type_str = data.get_schema()
            buffers = data._buffers
            data = data._data
        else:
            type_str = XVIZMessage(data).get_schema()
            buffers = {}

        self._type = type(data)
        self._data = Envelope(type=type_str.replace("session", "xviz"))
        self._raw = data # lazy packing of data to avoid performance issue
        self._raw_buffers = buffers

    def to_proto(self) -> Envelope:
        data = Envelope()
        data.CopyFrom(self._data)
        data.data.Pack(self.to_message().to_proto())
        return data

    def to_object(self, unravel: str = 'full') -> Dict:
        if unravel is 'none':
            return MessageToDict(self.to_proto(), preserving_proto_field_name=True)

        return {
            "type": self._data.type,
            "data": self.to_message().to_object(unravel=unravel)
        }

    def to_message(self) -> XVIZMessage:
        if self._data.type == "xviz/metadata":
            return XVIZMessage(metadata=self._raw, buffers=self._raw_buffers)
        elif self._data.type == "xviz/state_update":
            return XVIZMessage(update=self._raw, buffers=self._raw_buffers)
        else:
            raise ValueError("Unrecognized envelope data")
