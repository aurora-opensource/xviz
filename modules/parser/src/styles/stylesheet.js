// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import XVIZStyleProperty from './xviz-style-property';

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
        const {selectors, validate} = this._parseSelector(rule.name || '*');
        const properties = this._parseProperties(rule);
        return {selectors, validate, properties};
      });

    this.properties = {};
    rules.forEach(rule => {
      for (const key of Object.keys(rule.properties)) {
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
    // inline style override any generic rules
    const inlineProp =
      state.base &&
      state.base.style &&
      state.base.style.hasOwnProperty(propertyName) &&
      state.base.style[propertyName];
    if (inlineProp !== undefined && inlineProp !== null && inlineProp !== false) {
      return XVIZStyleProperty.formatValue(propertyName, inlineProp);
    }

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
    const value = XVIZStyleProperty.getDefault(propertyName);
    if (typeof value === 'function') {
      return value(this);
    }
    return value;
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
      default: {
        return object => {
          const classes = object && object.base && object.base.classes;
          return object && ((classes && classes.includes(name)) || object[name]);
        };
      }
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

    for (const key of Object.keys(properties.style)) {
      result[key] = new XVIZStyleProperty(key, properties.style[key]);
    }
    return result;
  }
}
