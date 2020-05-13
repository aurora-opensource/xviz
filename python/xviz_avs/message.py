import base64
from typing import Union, Dict, List

from xviz_avs.v2.core_pb2 import StreamSet
from xviz_avs.v2.session_pb2 import StateUpdate, Metadata
from xviz_avs.v2.options_pb2 import xviz_json_schema
from xviz_avs.v2.envelope_pb2 import Envelope
from google.protobuf.json_format import MessageToDict

def _unravel_list(list_: list, width: int) -> List[list]: # XXX: This is actually not used
    if len(list_) % width != 0:
        raise ValueError("The shape of the list is incorrect!")

    new_list = []
    for i in range(len(list_) // width):
        new_list.append(list_[i*width:(i+1)*width])
    return new_list

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
    def __init__(self, data: StreamSet = None):
        if data and not isinstance(data, StreamSet):
            raise ValueError("The data input must be structured (using StreamSet class)")
        self._data = data

    def to_object(self, unravel: bool = True) -> Dict:
        '''
        Serialize this data to primitive objects (with dict and list). Flattened arrays will
        be restored in this process.
        '''
        dataobj = MessageToDict(self._data, preserving_proto_field_name=True)
        if not unravel:
            return dataobj

        if 'primitives' in dataobj:
            for pdata in dataobj['primitives'].values():
                # process colors
                if 'points' in pdata:
                    for pldata in pdata['points']:
                        if 'colors' in pldata:
                            pldata['colors'] = list(base64.b64decode(pldata['colors']))

                # process styles
                for pcats in pdata.values():
                    for pldata in pcats:
                        if 'base' in pldata and 'style' in pldata['base']:
                            _unravel_style_object(pldata['base']['style'])
                    
        return dataobj

    @property
    def data(self) -> StreamSet:
        return self._data

AllDataType = Union[StateUpdate, Metadata]

class XVIZMessage:
    def __init__(self,
        update: StateUpdate = None,
        metadata: Metadata = None
    ):
        self._data = None

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

    @property
    def data(self) -> AllDataType:
        return self._data

    def to_object(self, unravel: bool = True) -> Dict:
        if not unravel:
            return MessageToDict(self._data, preserving_proto_field_name=True)

        if isinstance(self._data, StateUpdate):
            return {
                'update_type': StateUpdate.UpdateType.Name(self._data.update_type),
                'updates': [XVIZFrame(frame).to_object() for frame in self._data.updates]
            }
        elif isinstance(self._data, Metadata):
            dataobj = MessageToDict(self._data, preserving_proto_field_name=True)

            # process styles
            if 'streams' in dataobj:
                for sdata in dataobj['streams'].values():
                    if 'stream_style' in sdata:
                        _unravel_style_object(sdata['stream_style'])

            return dataobj

class XVIZEnvelope:
    def __init__(self, data: Union[XVIZMessage, AllDataType]):
        if isinstance(data, XVIZMessage):
            type_str = data.get_schema()
            data = data.data
        else:
            type_str = XVIZMessage(data).get_schema()

        self._type = type(data)
        self._data = Envelope(type=type_str.replace("session", "xviz"))
        self._data.data.Pack(data)

    @property
    def data(self) -> Envelope:
        return self._data

    def to_object(self, unravel: bool = True) -> Dict:
        if not unravel:
            return MessageToDict(self._data, preserving_proto_field_name=True)

        return {
            "type": self._data.type,
            "data": self.to_message().to_object(unravel=unravel)
        }

    def to_message(self) -> XVIZMessage:
        if self._data.type == "xviz/metadata":
            udata = Metadata()
            self._data.data.Unpack(udata)
            return XVIZMessage(metadata=udata)
        elif self._data.type == "xviz/state_update":
            udata = StateUpdate()
            self._data.data.Unpack(udata)
            return XVIZMessage(update=udata)
        else:
            raise ValueError("Unrecognized envelope data")
