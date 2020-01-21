import logging
from typing import Union
from easydict import EasyDict as edict

from xviz_avs.message import XVIZMessage
from xviz_avs.v2.session_pb2 import Metadata, StreamMetadata
from xviz_avs.v2.style_pb2 import StyleStreamValue

ANNOTATION_TYPES = StreamMetadata.AnnotationType
CATEGORY = StreamMetadata.Category
COORDINATE_TYPES = StreamMetadata.CoordinateType
SCALAR_TYPE = StreamMetadata.ScalarType
PRIMITIVE_TYPES = StreamMetadata.PrimitiveType
UIPRIMITIVE_TYPES = StreamMetadata.UIPrimitiveType

PRIMITIVE_STYLE_MAP = dict([
    (PRIMITIVE_TYPES.CIRCLE, [
        'opacity',
        'stroked',
        'filled',
        'stroke_color',
        'fill_color',
        'radius',
        'radius_min_pixels',
        'radius_max_pixels',
        'stroke_width',
        'stroke_width_min_pixels',
        'stroke_width_max_pixels'
    ]),
    (PRIMITIVE_TYPES.POINT, [
        'opacity',
        'fill_color',
        'radius_pixels',
        # TODO: Following two are not listed in protobuf
        # 'point_color_mode',
        # 'point_color_domain'
    ]),
    (PRIMITIVE_TYPES.POLYGON, [
        'stroke_color',
        'fill_color',
        'stroke_width',
        'stroke_width_min_pixels',
        'stroke_width_max_pixels',
        'height',
        'opacity',
        'stroked',
        'filled',
        'extruded'
    ]),
    (PRIMITIVE_TYPES.TEXT, [
        'opacity',
        'font_family',
        'font_weight',
        'text_size',
        'text_rotation',
        'text_anchor',
        'text_baseline',
        'fill_color'
    ]),
    (PRIMITIVE_TYPES.POLYLINE, [
        'opacity',
        'stroke_color',
        'stroke_width',
        'stroke_width_min_pixels',
        'stroke_width_max_pixels'
    ]),
    (PRIMITIVE_TYPES.STADIUM, [
        'opacity',
        'fill_color',
        'radius',
        'radius_min_pixels',
        'radius_max_pixels'
    ])
])

# Test whether the keys are correct
for fields in PRIMITIVE_STYLE_MAP.values():
    for f in fields:
        assert f in StyleStreamValue.__dict__

class XVIZBaseBuilder:
    """
    # Reference
    [@xviz/builder/xviz-base-builder]/(https://github.com/uber/xviz/blob/master/modules/builder/src/builders/xviz-base-builder.js)
    """
    def __init__(self, category, metadata: Union[Metadata, XVIZMessage], logger=None):
        self._stream_id = None
        self._category = category
        self._metadata = metadata.data if isinstance(metadata, XVIZMessage) else metadata
        self._logger = logger or logging.getLogger("xviz")

    def stream(self, stream_id):
        if self._stream_id:
            self._flush()
        self._stream_id = stream_id
        return self

    @property
    def stream_id(self):
        return self._stream_id
    @property
    def category(self):
        return self._category
    @property
    def metadata(self):
        return self._metadata

    def _flush(self):
        raise NotImplementedError("Derived class should implement this method")
    def reset(self):
        self._category = None

    def _validate_has_prop(self, name):
        if not hasattr(self, name) or not getattr(self, name):
            self._logger.warning("Stream %s: %s is missing", self.stream_id, name)

    def _validate_prop_set_once(self, prop, msg=None):
        if not hasattr(self, prop):
            return
        val = getattr(self, prop)
        if not val:
            return
        if isinstance(val, list) and len(val) == 0:
            return

        self._logger.warning(msg or "Stream {}: {} has been already set."\
            .format(self.stream_id, prop))

    def _validate_match_metadata(self):
        if not self._metadata:
            self._logger.warning("Metadata is missing.")
        elif self._stream_id not in self._metadata.streams:
            self._logger.warning("%s is not defined in metadata.", self._stream_id)
        else:
            metastream = self._metadata.streams[self._stream_id]
            if self._category != metastream.category:
                self._logger.warning(
                    "Stream %s category '%s' does not match metadata definition (%s).",
                    self._stream_id,
                    CATEGORY.Name(self._category),
                    CATEGORY.Name(metastream.category)
                )

    def _validate(self):
        self._validate_has_prop('_stream_id')
        self._validate_has_prop('_category')
        self._validate_match_metadata()

import array
from xviz_avs.v2.style_pb2 import StyleObjectValue, StyleStreamValue

def build_object_style(style):
    '''
    Create StyleObjectValue from dictionary. It basically deal with list of bytes.
    '''
    if 'fill_color' in style.keys():
        style['fill_color'] = bytes(style['fill_color'])
    if 'stroke_color' in style.keys():
        style['stroke_color'] = bytes(style['stroke_color'])
    return StyleObjectValue(**style)

def build_stream_style(style):
    '''
    Create StyleStreamValue from dictionary. It basically deal with list of bytes.
    '''
    if 'fill_color' in style.keys():
        style['fill_color'] = bytes(style['fill_color'])
    if 'stroke_color' in style.keys():
        style['stroke_color'] = bytes(style['stroke_color'])
    return StyleStreamValue(**style)
