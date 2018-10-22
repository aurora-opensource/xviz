/* eslint-disable camelcase */
export const CATEGORY = {
  time_series: 'time_series',
  primitive: 'primitive',
  variable: 'variable',
  pose: 'pose'
};

export const VARIABLE_TYPES = {
  float: 'float',
  integer: 'integer',
  string: 'string',
  boolean: 'boolean'
};

export const PRIMITIVE_TYPES = {
  circle: 'circle',
  image: 'image',
  point: 'point',
  polygon: 'polygon',
  polyline: 'polyline',
  stadium: 'stadium',
  text: 'text'
};

export const STYLES = {
  stroke_color: 'stroke_color',
  fill_color: 'fill_color',
  radius: 'radius',
  radius_min_pixels: 'radius_min_pixels',
  radius_max_pixels: 'radius_max_pixels',
  stroke_width: 'stroke_width',
  stroke_width_min_pixels: 'stroke_width_min_pixels',
  stroke_width_max_pixels: 'stroke_width_max_pixels',
  height: 'height',
  opacity: 'opacity',
  stroked: 'stroked',
  filled: 'filled',
  extruded: 'extruded',
  wireframe: 'wireframe',
  size: 'size',
  color: 'color',
  angle: 'angle',
  text_anchor: 'text_anchor',
  alignment_baseline: 'alignment_baseline'
};

export const PRIMITIVE_STYLE_MAP = {
  [PRIMITIVE_TYPES.circle]: [
    STYLES.stroke_color,
    STYLES.fill_color,
    STYLES.radius,
    STYLES.radius_min_pixels,
    STYLES.radius_max_pixels
  ],
  [PRIMITIVE_TYPES.point]: [
    STYLES.fill_color,
    STYLES.radius,
    STYLES.radius_min_pixels,
    STYLES.radius_max_pixels
  ],
  [PRIMITIVE_TYPES.polygon]: [
    STYLES.stroke_color,
    STYLES.fill_color,
    STYLES.stroke_width,
    STYLES.stroke_width_min_pixels,
    STYLES.stroke_width_max_pixels,
    STYLES.height,
    STYLES.opacity,
    STYLES.stroked,
    STYLES.filled,
    STYLES.extruded,
    STYLES.wireframe
  ],
  // TODO need verify from here
  [PRIMITIVE_TYPES.text]: [
    STYLES.size,
    STYLES.angle,
    STYLES.text_anchor,
    STYLES.alignment_baseline,
    STYLES.color
  ],
  [PRIMITIVE_TYPES.polyline]: [
    STYLES.stroke_color,
    STYLES.stroke_width,
    STYLES.stroke_width_min_pixels,
    STYLES.stroke_width_max_pixels
  ],
  [PRIMITIVE_TYPES.stadium]: [
    STYLES.stroke_color,
    STYLES.fill_color,
    STYLES.stroke_width,
    STYLES.stroke_width_min_pixels,
    STYLES.stroke_width_max_pixels
  ]
};

export const PRIMARY_POSE_STREAM = '/vehicle-pose';
