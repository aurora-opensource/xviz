import {parseXvizV1} from './parse-xviz-v1';

function noop() {}

/**
 * Extract primitives and variables from an XVIZ stream
 *
 * @param {Array} data - datums with shape {primitives, variables}
 * @param {Object} opts - callbacks for event notification
 * @return {Array} - parsed data with shape {time, features, lookAheads, variables, labels}
 */
export function parseEtlStream(data, opts = {}) {
  // Callbacks to enable instrumentation
  const {onData = noop, onDone = noop} = opts;
  const context = onData(opts) || opts.context;

  const stream = parseXvizV1(data, opts.convertPrimitive);

  onDone({...opts, context});
  return stream;
}
