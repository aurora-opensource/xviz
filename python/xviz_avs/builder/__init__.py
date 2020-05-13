"""
This module contains classes to build messages for the XVIZ protocol.

# Reference
[@xviz/builder](https://github.com/uber/xviz/blob/master/modules/builder/README.md)
"""

from .base_builder import XVIZBaseBuilder,\
    ANNOTATION_TYPES,\
    CATEGORY,\
    COORDINATE_TYPES,\
    SCALAR_TYPE,\
    PRIMITIVE_TYPES,\
    UIPRIMITIVE_TYPES
from .xviz_builder import XVIZBuilder

from .metadata import XVIZMetadataBuilder
from .pose import XVIZPoseBuilder
from .primitive import XVIZPrimitiveBuilder
from .time_series import XVIZTimeSeriesBuilder
from .ui_primitive import XVIZUIPrimitiveBuilder
from .variable import XVIZVariableBuilder
from .link import XVIZLinkBuilder
