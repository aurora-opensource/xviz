import XvizStyleProperty from './xviz-style-property';

const SELECTOR_REGEX = /\S+/g;
const OPERATOR_REGEX = /([=:~\*\^]+)/;
const NULL_VALIDATOR = () => true;

/* Parser for single stylesheet */
export default class Stylesheet {
  constructor(data = []) {
    const rules = data
      .slice()
      // Newer rules override older ones
      .reverse()
      .map(rule => {
        const {selectors, validate} = this._parseSelector(rule.class || '*');
        const properties = this._parseProperties(rule);
        return {selectors, validate, properties};
      });

    this.properties = {};
    rules.forEach(rule => {
      for (const key in rule.properties) {
        let p = this.properties[key];
        if (!p) {
          p = [];
          this.properties[key] = p;
        }
        p.push(rule);
      }
    });

    this.rules = rules;
  }

  // Public methods

  /**
   * get style by property name for an object
   * @param {String} propertyName - name of the style
   * @param {Object} state - state descriptor of the object, used to match selectors
   * @returns {Number|String|Array} style property value
   */
  getProperty(propertyName, state = {}) {
    const rules = this.properties[propertyName];
    const match = rules && rules.find(rule => rule.validate(state));
    return match ? match.properties[propertyName].getValue(state) : null;
  }

  /**
   * get default style by property name
   * @param {String} propertyName - name of the style
   * @returns {Number|String|Array} style property default value
   */
  getPropertyDefault(propertyName) {
    return XvizStyleProperty.getDefault(propertyName);
  }

  /**
   * get a list of attribute names that a property depends on.
   * @param {String} propertyName - name of the style
   * @returns {Array} - attribute names
   */
  getPropertyDependencies(propertyName) {
    const attributes = {};
    const rules = this.properties[propertyName];

    if (!rules) {
      return [];
    }

    rules.forEach(rule => {
      rule.selectors.forEach(selector => {
        if (selector !== '*') {
          const [name] = selector.split(OPERATOR_REGEX);
          attributes[name] = 1;
        }
      });
    });

    return Object.keys(attributes);
  }

  // Private methods

  // Returns a function that checks if an object matches the given selector expressions
  _getValidator(selector) {
    if (selector === '*') {
      return NULL_VALIDATOR;
    }
    const [name, operator, value] = selector.split(OPERATOR_REGEX);

    switch (operator) {
      case '=':
        return object => object && object[name] === value;
      default:
        return object =>
          object && ((object.classes && object.classes.includes(name)) || object[name]);
    }
  }

  // Parses a selectorString (space-separated selector expressions)
  _parseSelector(selectorString) {
    const selectors = selectorString.match(SELECTOR_REGEX);
    let validate;

    // Special case handling
    // Better perf than Array.every
    if (selectors.length === 0 || selectors.includes('*')) {
      validate = NULL_VALIDATOR;
    } else if (selectors.length === 1) {
      const match = this._getValidator(selectors[0]);
      validate = object => match(object) || match(object.state);
    } else {
      const validators = selectors.map(this._getValidator);
      validate = object => validators.every(match => match(object) || match(object.state));
    }
    return {selectors, validate};
  }

  // Parses property values
  _parseProperties(properties) {
    const result = {};
    for (const key in properties) {
      // class is the selector not a property
      if (key !== 'class') {
        result[key] = new XvizStyleProperty(key, properties[key]);
      }
    }
    return result;
  }
}
