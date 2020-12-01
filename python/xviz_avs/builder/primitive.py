from collections import defaultdict
from typing import List, Tuple, Union

import numpy as np
from PIL import Image as pImage

from xviz_avs.builder.base_builder import (CATEGORY, PRIMITIVE_STYLE_MAP,
                                           PRIMITIVE_TYPES, XVIZBaseBuilder,
                                           build_object_style)
from xviz_avs.v2.core_pb2 import PrimitiveState
from xviz_avs.v2.primitives_pb2 import (Circle, Image, Point, Polygon,
                                        Polyline, PrimitiveBase, Stadium, Text)


class XVIZPrimitiveBuilder(XVIZBaseBuilder):
    """
    Method chaining is supported by this builder.

    # Reference
    [@xviz/builder/xviz-primitive-builder]/(https://github.com/uber/xviz/blob/master/modules/builder/src/builders/xviz-primitive-builder.js)
    """
    def __init__(self, metadata):
        super().__init__(CATEGORY.PRIMITIVE, metadata)

        self._primitives = defaultdict(PrimitiveState)
        self._buffers = defaultdict(list) # direct storage of large float array, stream_id -> list of buffers in numpy
        self.reset()

    def image(self, data: pImage.Image) -> 'XVIZPrimitiveBuilder':
        '''
        Add image data. Internal representation is handled by pillow image
        '''
        if self._type:
            self._flush()

        self._validate_prop_set_once("_image")
        self._type = PRIMITIVE_TYPES.IMAGE

        if isinstance(data, pImage.Image):
            self._image = Image(width_px=data.width, height_px=data.height)
            self._image_buffer = data
        else:
            self._logger.error("An image data must be a pillow Image")

        return self

    def polygon(self, vertices: Union[np.ndarray, list]) -> 'XVIZPrimitiveBuilder':
        if self._type:
            self._flush()

        self._validate_prop_set_once("_vertices")
        self._vertices = np.asarray(vertices, dtype='f4').flatten().tolist()
        self._type = PRIMITIVE_TYPES.POLYGON

        return self

    def polyline(self, vertices: Union[np.ndarray, list]) -> 'XVIZPrimitiveBuilder':
        if self._type:
            self._flush()

        self._validate_prop_set_once("_vertices")
        self._vertices = np.asarray(vertices, dtype='f4').flatten().tolist()
        self._type = PRIMITIVE_TYPES.POLYLINE

        return self

    def points(self, vertices: Union[np.ndarray, list]) -> 'XVIZPrimitiveBuilder':
        if self._type:
            self._flush()

        self._validate_prop_set_once("_vertices_buffer")
        self._vertices_buffer = np.asarray(vertices, dtype='f4').flatten()
        self._type = PRIMITIVE_TYPES.POINT

        return self

    def circle(self, position: Union[np.ndarray, list], radius: float) -> 'XVIZPrimitiveBuilder':
        if self._type:
            self._flush()

        self._validate_prop_set_once("_radius")
        self.position(position)

        self._radius = radius
        self._type = PRIMITIVE_TYPES.CIRCLE

        return self

    def stadium(self, start: Union[np.ndarray, list], end: Union[np.ndarray, list], radius: float) -> 'XVIZPrimitiveBuilder':
        if self._type:
            self._flush()

        self._validate_prop_set_once("_radius")

        start = np.asarray(start, dtype="f4").tolist()
        if len(start) != 3:
            self._logger.error("The start position must be of the form [x, y, z] where %s was provided", str(start))
        end = np.asarray(end, dtype="f4").tolist()
        if len(end) != 3:
            self._logger.error("The end position must be of the form [x, y, z] where %s was provided", str(end))

        self._vertices = [start, end]
        self._radius = radius
        self._type = PRIMITIVE_TYPES.STADIUM

        return self

    def text(self, message: str) -> 'XVIZPrimitiveBuilder':
        if self._type:
            self._flush()

        self._validate_prop_set_once('_text')

        self._text = message
        self._type = PRIMITIVE_TYPES.TEXT

        return self

    def position(self, point: Union[np.ndarray, list]) -> 'XVIZPrimitiveBuilder':
        self._validate_prop_set_once("_vertices")

        point = np.asarray(point, dtype="f4").tolist()
        if len(point) != 3:
            self._logger.error("A position must be of the form [x, y, z] where {} was provided".format(point))

        self._vertices = [point]
        return self

    def colors(self, color_array: Union[np.ndarray, list]) -> 'XVIZPrimitiveBuilder':
        self._validate_prop_set_once('_colors')
        self._colors = np.asarray(color_array, dtype='u1').flatten() # convert to bytes here

        return self

    def style(self, style: dict) -> 'XVIZPrimitiveBuilder':
        self._validate_prerequisite()
        self._validate_prop_set_once('_style')
        self._style = style

        return self

    def id(self, identifier: str) -> 'XVIZPrimitiveBuilder':
        self._validate_prerequisite()
        self._validate_prop_set_once('_id')
        self._id = identifier

        return self

    def classes(self, class_list: List[str]) -> 'XVIZPrimitiveBuilder':
        self._validate_prerequisite()
        self._validate_prop_set_once('_classes')

        self._classes = class_list
        return self

    def _validate(self):
        super()._validate()

        if self._type == PRIMITIVE_TYPES.IMAGE:
            if self._image is None or self._image_buffer is None:
                self._logger.warning("Stream %s image data are not provided.", self._stream_id)
        else:
            if self._vertices is None and self._vertices_buffer is None:
                self._logger.warning("Stream %s primitives vertices are not provided.", self._stream_id)

    def _flush(self):
        self._validate()
        self._flush_primitives()

    def get_data(self) -> Tuple[dict, dict]:
        if self._type:
            self._flush()

        return self._primitives, self._buffers

    def _validate_prerequisite(self):
        if not self._type:
            self._logger.error("Start from a primitive first, e.g polygon(), image(), etc.")

    def _flush_primitives(self):
        stream = self._primitives[self._stream_id]

        array_field_name = PRIMITIVE_TYPES.Name(self._type).lower() + 's'
        array = getattr(stream, array_field_name)

        obj = self._format_primitive(len(array))
        array.append(obj)

        self.reset()

    def _format_primitive(self, stream_pos: int):
        # Embed primitive data
        if self._type == PRIMITIVE_TYPES.POLYGON:
            obj = Polygon(vertices=self._vertices)
        elif self._type == PRIMITIVE_TYPES.POLYLINE:
            obj = Polyline(vertices=self._vertices)
        elif self._type == PRIMITIVE_TYPES.POINT:
            obj = Point()
            assert len(self._buffers[self._stream_id]) == stream_pos
            self._buffers[self._stream_id].append(self._vertices_buffer)
            if self._colors is not None:
                obj.colors = self._colors.tobytes()
        elif self._type == PRIMITIVE_TYPES.TEXT:
            obj = Text(position=self._vertices[0], text=self._text)
        elif self._type == PRIMITIVE_TYPES.CIRCLE:
            obj = Circle(center=self._vertices[0], radius=self._radius)
        elif self._type == PRIMITIVE_TYPES.STADIUM:
            obj = Stadium(start=self._vertices[0], end=self._vertices[1], radius=self._radius)
        elif self._type == PRIMITIVE_TYPES.IMAGE:
            if self._vertices:
                self._image.position = self._vertices[0]
            obj = self._image
            self._buffers[self._stream_id].append(self._image_buffer)

        # Embed base data
        have_base = False
        base = PrimitiveBase()

        if self._id:
            have_base = True
            base.object_id = self._id
        if self._style:
            have_base = True
            base.style.MergeFrom(build_object_style(self._style))
        if self._classes:
            have_base = True
            base.classes.extend(self._classes)

        if have_base:
            obj.base.MergeFrom(base)

        return obj

    def _validate_style(self):
        properties = self._style.keys()
        valid_props = PRIMITIVE_STYLE_MAP.get(self._type)
        if valid_props:
            invalid_props = [prop for prop in properties if prop not in valid_props]
            if len(invalid_props) > 0:
                self._logger.warning("Invalid style properties %s for stream %s",
                                     ', '.join(invalid_props), self.stream_id)

    def reset(self):
        super().reset()
        self._type = None

        self._image = None
        self._vertices = None
        self._radius = None
        self._text = None
        self._colors = None

        self._id = None
        self._style = None
        self._classes = None

        self._vertices_buffer = None
        self._image_buffer = None
