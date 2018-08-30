import Color from 'color';

/* Utils for type check */
function getColor(value) {
  if (typeof value === 'string') {
    try {
      const color = Color.rgb(value).array();
      if (Number.isFinite(color[3])) {
        color[3] *= 255;
      }
      return color;
    } catch (error) {
      return null;
    }
  }
  if (Array.isArray(value) && Number.isFinite(value[0])) {
    return value;
  }
  return null;
}

function getNumber(value) {
  switch (typeof value) {
    case 'string':
      value = Number(value);
      return isNaN(value) ? null : value;

    case 'number':
      return value;

    default:
      return null;
  }
}

function getBool(value) {
  switch (typeof value) {
    case 'boolean':
      return value;

    case 'string':
      return value.toLowerCase() !== 'false';

    case 'number':
      return Boolean(value);

    default:
      return null;
  }
}

const IDENTITY = x => x;
const PROPERTY_FORMATTERS = {
  opacity: getNumber,

  stroked: getBool,
  filled: getBool,
  extruded: getBool,
  wireframe: getBool,
  height: getNumber,

  strokeColor: getColor,
  fillColor: getColor,

  fontSize: getNumber,
  angle: getNumber,

  radius: getNumber,
  radiusMinPixels: getNumber,
  radiusMaxPixels: getNumber,

  strokeWidth: getNumber,
  strokeWidthMinPixels: getNumber,
  strokeWidthMaxPixels: getNumber
};

const DEFAULT_STYLES = {
  opacity: 1,

  stroked: true,
  filled: true,
  extruded: false,
  wireframe: false,
  height: 0,

  strokeColor: [255, 255, 255],
  fillColor: [255, 255, 255],

  fontSize: 12,
  angle: 0,

  radius: 1,
  radiusMinPixels: 0,
  radiusMaxPixels: Number.MAX_SAFE_INTEGER,

  strokeWidth: 1,
  strokeWidthMinPixels: 0,
  strokeWidthMaxPixels: Number.MAX_SAFE_INTEGER
};

export default class XvizStyleProperty {
  static getDefault(key) {
    return DEFAULT_STYLES[key];
  }

  constructor(key, value) {
    this.key = key;

    const formatter = PROPERTY_FORMATTERS[key] || IDENTITY;
    this._value = formatter(value);

    if (this._value === null && Array.isArray(value)) {
      if (value.length > 1) {
        this._value = value.map(formatter);
        this._valueCount = value.length;
      } else {
        this._value = formatter(value[0]);
      }
    }
    if (this._value === null) {
      throw new Error(`illegal ${key} value: ${value}`);
    }
  }

  getValue(context) {
    if (this._valueCount) {
      const index = (context.index || 0) % this._valueCount;
      return this._value[index];
    }
    return this._value;
  }
}
