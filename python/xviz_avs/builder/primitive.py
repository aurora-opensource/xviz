
import numpy as np
from easydict import EasyDict as edict

from xviz_avs.builder.base_builder import XVIZBaseBuilder, build_object_style, CATEGORY, PRIMITIVE_TYPES, PRIMITIVE_STYLE_MAP
from xviz_avs.v2.core_pb2 import PrimitiveState
from xviz_avs.v2.primitives_pb2 import PrimitiveBase, Circle, Image, Point, Polygon, Polyline, Stadium, Text

class XVIZPrimitiveBuilder(XVIZBaseBuilder):
    """
    Method chaining is supported by this builder.
    
    # Reference
    [@xviz/builder/xviz-primitive-builder]/(https://github.com/uber/xviz/blob/master/modules/builder/src/builders/xviz-primitive-builder.js)
    """
    def __init__(self, metadata, logger=None):
        super().__init__(CATEGORY.PRIMITIVE, metadata, logger)

        self._primitives = {}
        self.reset()

    def image(self, data):
        '''
        Add image data
        '''
        if self._type:
            self._flush()

        if not isinstance(data, np.ndarray) or not isinstance(data, str):
            # TODO: support PILLOW and other image types
            # should save raw data and preserve mimetype?
            self._logger.error("An image data must be a string or numpy array")
        self._validate_prop_set_once("_image")
        self._type = PRIMITIVE_TYPES.IMAGE
        self._image = Image(data=data)

        return self

    def dimensions(self, width_pixel=None, height_pixel=None):
        '''
        Add dimension specs for image data
        '''
        if not self._image:
            self._logger.error("An image needs to be set first")

        self._image.width_px = width_pixel
        self._image.height_px = height_pixel

        return self

    def polygon(self, vertices):
        if self._type:
            self._flush()

        self._validate_prop_set_once("_vertices")
        self._vertices = vertices
        self._type = PRIMITIVE_TYPES.POLYGON

        return self

    def polyline(self, vertices):
        if self._type:
            self._flush()

        self._validate_prop_set_once("_vertices")
        self._vertices = vertices
        self._type = PRIMITIVE_TYPES.POLYLINE

        return self

    def points(self, vertices):
        if self._type:
            self._flush()

        self._validate_prop_set_once("_vertices")
        self._vertices = vertices
        self._type = PRIMITIVE_TYPES.POINT

        return self

    def circle(self, position, radius):
        if self._type:
            self._flush()

        self._validate_prop_set_once("_radius")
        self.position(position)

        self._radius = radius
        self._type = PRIMITIVE_TYPES.CIRCLE

        return self

    def stadium(self, start, end, radius):
        if self._type:
            self._flush()

        self._validate_prop_set_once("_radius")

        if len(start) != 3:
            self._logger.error("The start position must be of the form [x, y, z] where {} was provided".format(start))
        if len(end) != 3:
            self._logger.error("The end position must be of the form [x, y, z] where {} was provided".format(end))
        
        
        self._vertices = [start, end]
        self._radius = radius
        self._type = PRIMITIVE_TYPES.STADIUM

        return self

    def text(self, message):
        # XXX: is not actually defined yet
        if self._type:
            self._flush()

        self._validate_prop_set_once('_text')

        self._text = message
        self._type = PRIMITIVE_TYPES.TEXT

        return self
    
    def position(self, point):
        self._validate_prop_set_once("_vertices")

        if len(point) != 3:
            self._logger.error("A position must be of the form [x, y, z] where {} was provided".format(point))
        
        self._vertices = [point]
        return self

    def colors(self, color_array):
        self._validate_prop_set_once('_colors')
        self._colors = color_array

        return self

    def style(self, style):
        self._validate_prerequisite()
        self._validate_prop_set_once('_style')
        self._style = style

        return self

    def id(self, identifier):
        self._validate_prerequisite()
        self._validate_prop_set_once('_id')
        self._id = identifier

        return self

    def classes(self, class_list):
        self._validate_prerequisite()
        self._validate_prop_set_once('_classes')

        self._classes = class_list
        return self
        
    def _validate(self):
        super()._validate()

        if self._type == PRIMITIVE_TYPES.IMAGE:
            if self._image == None or self._image.data == None:
                self._logger.warning("Stream {} image data are not provided.".format(self._stream_id))
        else:
            if self._vertices == None:
                self._logger.warning("Stream {} primitives vertices are not provided.".format(self._stream_id))

    def _flush(self):
        self._validate()
        self._flush_primitives()

    def get_data(self):
        if self._type:
            self._flush()

        if len(self._primitives) == 0:
            return None

        return self._primitives

    def _validate_prerequisite(self):
        if not self._type:
            self._logger.error("Start from a primitive first, e.g polygon(), image(), etc.")

    def _flush_primitives(self):
        if self._stream_id not in self._primitives.keys():
            self._primitives[self._stream_id] = PrimitiveState()
        stream = self._primitives[self._stream_id]

        array_field_name = PRIMITIVE_TYPES.Name(self._type).lower() + 's'
        array = getattr(stream, array_field_name)

        obj = self._format_primitive()
        array.append(obj)

        self.reset()

    def _format_primitive(self):
        # XXX: Need to flatten arrays, TODO: need more elegant way
        # flatten_vertices = [item for sublist in self._vertices for item in sublist]

        # Embed primitive data
        if self._type == PRIMITIVE_TYPES.POLYGON:
            obj = Polygon(vertices=self._vertices)
        elif self._type == PRIMITIVE_TYPES.POLYLINE:
            obj = Polyline(vertices=self._vertices)
        elif self._type == PRIMITIVE_TYPES.POINT:
            obj = Point(points=self._vertices)
            if self._colors:
                obj.colors = bytes(self._colors)
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
            base.classes = self._classes

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
        self._type = None

        self._image = None
        self._vertices = None
        self._radius = None
        self._text = None
        self._colors = None

        self._id = None
        self._style = None
        self._classes = None
