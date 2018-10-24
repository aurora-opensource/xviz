/* eslint-disable camelcase */
import XVIZBaseBuilder from './xviz-base-builder';
import {insertTimestamp} from '../utils';
import {CATEGORY, PRIMITIVE_TYPES} from './constant';

export default class XVIZPrimitiveBuilder extends XVIZBaseBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.primitive
    });

    this.reset();
    // futures: {[streamId]: {...,timestamps: [], primitives: []}}
    this._futures = {};
    // primitives: {[streamId]: []}
    this._primitives = {};
  }

  timestamp(timestamp) {
    if (!this._timestamps) {
      this._timestamps = [];
    }
    this._timestamps.push(timestamp);
    return this;
  }

  image(data) {
    if (this._type) {
      this._flush();
    }

    if (!(data instanceof Uint8Array || typeof data === 'string')) {
      this.validateError('An image data must be a string or Uint8Array.');
    }

    this.validatePropSetOnce('_image');
    this._type = PRIMITIVE_TYPES.image;

    this._image = {
      data
    };

    return this;
  }

  dimensions(widthPixel = null, heightPixel = null) {
    if (!this._image) {
      this.validateError('An image needs to be set first.');
    }

    this._image.width_px = widthPixel;
    this._image.height_px = heightPixel;

    return this;
  }

  polygon(vertices) {
    if (this._type) {
      this._flush();
    }

    this.validatePropSetOnce('_vertices');

    this._vertices = vertices;
    this._type = PRIMITIVE_TYPES.polygon;

    return this;
  }

  polyline(vertices) {
    if (this._type) {
      this._flush();
    }

    this.validatePropSetOnce('_vertices');

    this._vertices = vertices;
    this._type = PRIMITIVE_TYPES.polyline;

    return this;
  }

  points(vertices) {
    if (this._type) {
      this._flush();
    }

    this.validatePropSetOnce('_vertices');

    this._vertices = vertices;
    this._type = PRIMITIVE_TYPES.point;

    return this;
  }

  circle(position, radius) {
    if (this._type) {
      this._flush();
    }

    this.validatePropSetOnce('_radius');

    this.position(position);

    this._radius = radius;
    this._type = PRIMITIVE_TYPES.circle;

    return this;
  }

  stadium(start, end, radius) {
    if (this._type) {
      this._flush();
    }

    this.validatePropSetOnce('_radius');

    if (start.length !== 3) {
      this.validateError(
        `The start position must be of the form [x, y, z] where ${start} was provided`
      );
    }

    if (end.length !== 3) {
      this.validateError(
        `The end position must be of the form [x, y, z] where ${end} was provided`
      );
    }

    this._vertices = [start, end];
    this._radius = radius;
    this._type = PRIMITIVE_TYPES.stadium;

    return this;
  }

  // TODO/Xintong validate `text` primitive
  text(message) {
    if (this._type) {
      this._flush();
    }

    this._text = message;
    this._type = 'text';
    return this;
  }

  position(point) {
    this.validatePropSetOnce('_vertices');

    if (point.length !== 3) {
      this.validateError(`A position must be of the form [x, y, z] where ${point} was provided`);
    }

    this._vertices = [point];
    return this;
  }

  colors(colorArray) {
    this.validatePropSetOnce('_colors');

    this._colors = colorArray;
    return this;
  }

  style(style) {
    this._validatePrerequisite();
    this.validatePropSetOnce('_style');

    this._style = style;

    this._validateStyle();

    return this;
  }

  id(identifier) {
    this._validatePrerequisite();
    this.validatePropSetOnce('_id');

    this._id = identifier;
    return this;
  }

  classes(classList) {
    this._validatePrerequisite();
    this.validatePropSetOnce('_classes');

    this._classes = classList;
    return this;
  }

  _validate() {
    super._validate();

    const isImage = this._type === PRIMITIVE_TYPES.image;
    if (isImage && (!this._image || !this._image.data)) {
      this.validateWarn(`Stream ${this._streamId} image data are not provided.`);
    }
    if (!isImage && !this._vertices) {
      this.validateWarn(`Stream ${this._streamId} primitives vertices are not provided.`);
    }
  }

  _flush() {
    this._validate();

    if (this._isFuture()) {
      this._flushFutures();
      return;
    }

    this._flushPrimitives();
  }

  getData() {
    if (this._type) {
      this._flush();
    }

    const data = {};
    if (Object.keys(this._primitives).length) {
      data.primitives = this._primitives;
    }
    if (Object.keys(this._futures).length) {
      data.futures = this._futures;
    }

    return data;
  }

  _validatePrerequisite() {
    if (!this._type) {
      this.validateError('Start from a primitive first, e.g polygon(), image(), etc.');
    }
  }

  _isFuture() {
    return this._timestamps && this._vertices;
  }

  _flushFutures() {
    if (!this._futures[this._streamId]) {
      this._futures[this._streamId] = {
        timestamps: [],
        primitives: []
      };
    }

    const future = this._futures[this._streamId];
    const primitive = this._formatPrimitive();

    const {timestamps, primitives} = future;

    // insert ts and primitive to the position based on timestamp order
    insertTimestamp(timestamps, primitives, this._timestamps[0], [primitive]);

    this.reset();
  }

  _flushPrimitives() {
    if (!this._primitives[this._streamId]) {
      this._primitives[this._streamId] = {primitives: []};
    }

    const primitive = this._formatPrimitive();
    this._primitives[this._streamId].primitives.push(primitive);

    this.reset();
  }

  /* eslint-disable complexity */
  _formatPrimitive() {
    const obj = {
      type: this._type
    };

    switch (this._type) {
      case 'polygon':
      case 'polyline':
        obj.vertices = this._vertices;
        break;
      case 'point':
        if (this._colors) {
          obj.colors = this._colors;
        }
        obj.points = this._vertices;
        break;
      case 'text':
        obj.position = this._vertices[0];
        obj.text = this._text;
        break;
      case 'circle':
        obj.center = this._vertices[0];
        obj.radius_m = this._radius;
        break;
      case 'stadium':
        obj.start = this._vertices[0];
        obj.end = this._vertices[1];
        obj.radius_m = this._radius;
        break;
      case 'image':
        if (this._vertices) {
          this._image.position = this._vertices[0];
        }
        Object.assign(obj, this._image);
        break;
      default:
    }

    if (this._id) {
      obj.object_id = this._id;
    }

    if (this._style) {
      obj.style = this._style;
    }

    if (this._classes) {
      obj.classes = this._classes;
    }

    return obj;
  }
  /* eslint-enable complexity */

  _validateStyle() {
    this._validator.validateStyle(this);
  }

  reset() {
    this._type = null;
    this._timestamps = null;

    this._image = null;
    this._vertices = null;
    this._radius = null;
    this._text = null;
    this._colors = null;

    this._id = null;
    this._style = null;
    this._classes = null;
  }
}
