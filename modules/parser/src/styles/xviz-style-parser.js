import Stylesheet from './stylesheet';

const EMPTY_STYLESHEET = new Stylesheet();

/* Parser for multiple stylesheets */
export default class XvizStyleParser {
  /**
   * @constructor
   * @param {Object} data - a map from stream name to stylesheet definition
   */
  constructor(data) {
    this.stylesheets = {};
    for (const streamName in data) {
      this.stylesheets[streamName] = new Stylesheet(data[streamName]);
    }
  }

  /**
   * get stylesheet by stream name.
   * @param {String} streamName - name of the stream/stream
   * @returns {Stylesheet}
   */
  getStylesheet(streamName) {
    return this.stylesheets[streamName] || EMPTY_STYLESHEET;
  }
}
