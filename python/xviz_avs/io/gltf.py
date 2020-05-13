"""
This module provides basic io under GLTF format
"""

import logging
import json, array, struct, base64
from typing import Union
from collections import namedtuple
from easydict import EasyDict as edict

from xviz_avs.io.base import XVIZBaseWriter
from xviz_avs.message import XVIZMessage, XVIZEnvelope, StateUpdate

# Constants

bufferView_t = namedtuple("bufferViewItem", ("buffer", "byteOffset", "byteLength"))
accessor_t = namedtuple("accessorItem", ("bufferView", "type", "componentType", "count"))
image_t = namedtuple("imageItem", ("bufferView", "mimetype", "width", "height"))

component_type_d = {
  'b' : 5120,
  'B' : 5121,
  'h' : 5122,
  'H' : 5123,
  'I' : 5125,
  'f' : 5126
}
types_d = ['SCALAR', 'VEC2', 'VEC3', 'VEC4']
XVIZ_GLTF_EXTENSION = 'AVS_xviz'

def pad_to_4bytes(length):
    return (length + 3) & ~3

# Wrappers
class ImageWrapper:
    def __init__(self, image: bytes, width: int = None, height: int = None, mime_type: str = None):
        self.data = image
        self.mime_type = mime_type
        self.width = width
        self.height = height

class GLTFBuilder:
    """
    # Reference
    [GLBBuilder](https://github.com/uber-web/loaders.gl/blob/master/modules/gltf/src/lib/deprecated/glb-builder.js)
    and [GLTFBuilder](https://github.com/uber-web/loaders.gl/blob/master/modules/gltf/src/lib/deprecated/gltf-builder.js)
    from [@loaders.gl/gltf](https://github.com/uber-web/loaders.gl/blob/master/modules/gltf/README.md)
    """
    MAGIC_glTF = 0x46546c67 # glTF in ASCII
    MAGIC_JSON = 0x4e4f534a # JSON in ASCII
    MAGIC_BIN = 0x004e4942 # BIN\0 in ASCII

    def __init__(self):
        self._version = 2
        self._byte_length = 0 # keep track of body size
        self._json = edict(
            asset={
                "version": str(self._version)
            },
            buffers=[],
            bufferViews=[],
            accessors=[],
            image=[],
            meshes=[]
        )
        self._source_buffers = []
        self.log = logging.getLogger("gltf")

    ################ Basic glTF adders ##############

    def add_accessor(self, buffer_view_index: int, size: int, component_type: int, count: int):
        '''
        Adds an accessor to a bufferView

        :param buffer_view_index: The index of the buffer view to access
        :param size: XXX
        :param component_type: XXX
        :param count: XXX
        :return: accessor_index: Index of added buffer in "accessors" list
        '''
        self._json.accessors.append(accessor_t(
            bufferView=buffer_view_index,
            type=types_d[size - 1],
            componentType=component_type,
            count=count
        )._asdict())
        return len(self._json.accessors) - 1

    def add_buffer_view(self, buffer: bytes):
        '''
        Add one untyped source buffer, create a matching glTF `bufferView`,
        and return its index

        :param buffer: bytes
        :return: buffer_view_index: The index of inserted bufferView
        '''
        if not isinstance(buffer, bytes):
            raise ValueError("add_buffer_view should be directly used with bytes")

        self._json.bufferViews.append(bufferView_t(
            buffer=0,
            byteOffset=self._byte_length,
            byteLength=len(buffer)
        )._asdict())

        # Pad array
        pad_len = pad_to_4bytes(len(buffer))
        buffer += b'\x00' * (pad_len - len(buffer))
        self._byte_length += pad_len
        self._source_buffers.append(buffer)

        return len(self._json.bufferViews) - 1

    def add_buffer(self, buffer: array.array):
        '''
        Add a binary buffer. Builds glTF "JSON metadata" and saves buffer reference.
        Buffer will be copied into BIN chunk during "pack".
        Currently encodes buffers as glTF accessors, but this could be optimized.

        :param buffer: flattened array
        :param size: XXX
        :param component_type: XXX
        :param count: XXX
        :return: accessor_index: Index of added buffer in "accessors" list
        '''
        buffer_view_index = self.add_buffer_view(buffer.tobytes())
        return self.add_accessor(buffer_view_index, size=buffer.itemsize,
            component_type=component_type_d[buffer.typecode], count=len(buffer))

    def add_application_data(self, key: str, data):
        '''
        Add an extra application-defined key to the top-level data structure.
        By default packs JSON by extracting binary data and replacing it with JSON pointers

        :param key: Key name of the data
        :param data:
        :param pack_typed_arrays: Pack binaries
        '''
        self._json[key] = data

    def add_extra_data(self, key, data):
        if 'extras' not in self._json.keys():
            self._json.extras = edict()
        self._json.extras[key] = data

    def add_extension(self, ext, data):
        if 'extensions' not in self._json.keys():
            self._json.extensions = edict()
        self._json.extensions[ext] = data
        self.register_used_extension(ext)

    def add_required_extension(self, ext, data, **options):
        self.add_extension(ext, data, **options)
        self.register_required_extension(ext)

    def register_used_extension(self, ext):
        if 'extensionsUsed' not in self._json:
            self._json.extensionsUsed = []
        if ext not in self._json.extensionsUsed:
            self._json.extensionsUsed.append(ext)

    def register_required_extension(self, ext):
        if 'extensionsRequired' not in self._json:
            self._json.extensionsRequired = []
        if ext not in self._json.extensionsRequired:
            self._json.extensionsRequired.append(ext)

    def add_image(self, obj):
        if not isinstance(obj, ImageWrapper):
            raise ValueError("Image should be wrapped with ImageWrapper")

        buffer_view_index = self.add_buffer_view(obj)
        self._json.images.append(image_t(
            bufferView=buffer_view_index,
            mimeType=obj.mime_type,
            width=obj.width,
            height=obj.height
        )._asdict())
        return len(self._json.images) - 1

    ################ Output ############

    def flush(self, file):
        '''
        Encode the full glTF file as a binary GLB file
        
        :param file: file-like object. The stream to write data into.
            It could be a file opened in binary mode or BytesIO object
        '''

        # Prepare data
        self._json.buffers = [{"byteLength": self._byte_length}]
        binary = b''.join(self._source_buffers)
        jsonstr = json.dumps(self._json, separators=(',', ':')).encode('ascii')
        jsonlen = pad_to_4bytes(len(jsonstr))

        assert len(binary) == pad_to_4bytes(len(binary)), "Something wrong in binary padding"
        binlen = len(binary)

        # Write GLB header
        file.write(struct.pack("<I", self.MAGIC_glTF))
        file.write(struct.pack("<I", self._version))
        file.write(struct.pack("<I", 28 + jsonlen + binlen))
        
        # Write Json
        file.write(struct.pack("<I", jsonlen))
        file.write(struct.pack("<I", self.MAGIC_JSON))
        file.write(jsonstr)
        file.write(b"\x00" * (jsonlen - len(jsonstr))) # pad

        # Write Binary
        file.write(struct.pack("<I", binlen))
        file.write(struct.pack("<I", self.MAGIC_BIN))
        file.write(binary)
        file.write(b"\x00" * (binlen - len(binary))) # pad

    ################ glTF Applications ##############

    def pack_binary_json(self, data):
        # Check if string has same syntax as our "JSON pointers", if so "escape it".
        if isinstance(data, str) and data.find("#/") == -1:
            return '#' + data

        # Recursively deal with containers
        if isinstance(data, list):
            return [self.pack_binary_json(obj) for obj in data]
        if isinstance(data, dict):
            return {k:self.pack_binary_json(v) for k, v in data.items()}

        # Pack specific data to binary
        if isinstance(data, ImageWrapper):
            image_index = self.add_image(data.data)
            return "#/images/{}".format(image_index)
        if isinstance(data, array.array):
            buffer_index = self.add_buffer(data)
            return "#/accessors/{}".format(buffer_index)

        # Else return original
        return data
    
    def add_point_cloud(self, obj):
        raise NotImplementedError()

    def add_mesh(self, indices, mode):
        raise NotImplementedError()

    def add_compressed_mesh(self, atrributes, indices, mode):
        raise NotImplementedError()

    def add_compressed_point_cloud(self, attributes):
        raise NotImplementedError()

class XVIZGLBWriter(XVIZBaseWriter):
    def __init__(self, sink, wrap_envelope=True, use_xviz_extension=True):
        # TODO: also support precision limit in GLTF Json
        super().__init__(sink)

        self._use_xviz_extension = use_xviz_extension
        self._wrap_envelop = wrap_envelope
        self._counter = 2

    def write_message(self, message: XVIZMessage, index: int = None):

        self._check_valid()
        if self._wrap_envelop:
            obj = XVIZEnvelope(message).to_object()
        else:
            obj = message.to_object()
        builder = GLTFBuilder()

        fname = self._get_sequential_name(message, index) + '.glb'

        if isinstance(message.data, StateUpdate):
            # Wrap image data and point cloud
            if self._wrap_envelop:
                dataobj = obj['data']['updates']
            else:
                dataobj = obj['updates']
            if 'primitives' in dataobj:
                for pdata in dataobj['primitives'].values():
                    # process point cloud
                    if 'points' in pdata:
                        for pldata in pdata['points']:
                            if 'points' in pldata:
                                pldata['points'] = array.array('f', pldata['points'])

                    # process images
                    if 'images' in pdata:
                        for imdata in pdata['points']:
                            imdata['data'] = ImageWrapper(
                                image=base64.b64decode(imdata['data']),
                                width=imdata['width_px'],
                                height=imdata['height_px'],
                                mime_type='image/png', # FIXME: use Pillow to detect type
                            )

        # Encode GLB into file
        packed_data = builder.pack_binary_json(obj)
        if self._use_xviz_extension:
            builder.add_extension(XVIZ_GLTF_EXTENSION, packed_data)
        else:
            builder.add_application_data('xviz', packed_data)

        with self._source.open(fname) as fout:
            builder.flush(fout)
