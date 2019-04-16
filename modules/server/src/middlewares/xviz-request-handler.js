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
/* global console, setTimeout, clearTimeout */
/* eslint-disable no-console, camelcase */
// TODO: remove this and use a shared library (possibly probe.gl?)
const process = require('process');
const startTime = process.hrtime();
const NS_PER_SEC = 1e9;

// Return time in milliseconds since
// argument or startTime of process.
function deltaTimeMs(startT) {
  const diff = process.hrtime(startT || startTime);
  return ((diff[0] * NS_PER_SEC + diff[1]) / 1e6).toFixed(3);
}

const DEFAULT_OPTIONS = {
  delay: 50 // time in milliseconds
};

// TODO: move to @xviz/io
function ErrorMsg(message) {
  return {type: 'xviz/error', data: {message}};
}

function TransformLogDoneMsg(msg) {
  return {type: 'xviz/transform_log_done', data: msg};
}

function backfillWithDefault(obj, defaultObj) {
  Object.getOwnPropertyNames(defaultObj).forEach(key => {
    if (!obj.key) {
      obj.key = defaultObj.key;
    }
  });

  return obj;
}

const startMsgDefault = {
  // version
  // profile
  message_format: 'binary',
  session_type: 'log'
  // log {}
};

// Server middleware that handles the logic of responding
// to a request with data from a provider, processing
// the data through the supplied middleware
export class XVIZRequestHandler {
  constructor(context, socket, provider, middleware, options = {}) {
    this.context = context;
    this.socket = socket;
    this.provider = provider;
    this.middleware = middleware;

    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    this.interval = null;

    this.t_start_time = 0;
  }

  onStart(req, msg) {
    if (!req.version || !/^2\.*/.test(req.version)) {
      console.log('xviz onstart bad version');
      const message = `Error: Version '${req.version}' is unsupported`;
      this.middleware.onError(req, ErrorMsg(message));
    } else {
      console.log('xviz onstart good version');
      this.context.start = backfillWithDefault(req, startMsgDefault);

      // Errors
      // ? some of these are dependent on the provider/session
      //   can only be reported once transform log is specified
      //
      // version unsupported
      // profile unknown
      // format unsupported
      // session_type unknown
      // log not found

      // send metadata
      const data = this.provider.xvizMetadata();
      this.middleware.onMetadata(req, {data});
    }
  }

  onTransformLog(req, msg) {
    if (!req.id) {
      const message = `Error: Missing 'id' from transform_log request`;
      this.middleware.onError(req, ErrorMsg(message));
    } else {
      this.context.transformLog = req;
      // id
      // start_timestamp
      // end_timestamp
      // desired_streams []

      // clamped timestamp
      // time range not valid

      if (this.interval === null) {
        const frameIterator = this.provider.getFrameIterator(
          req.start_timestamps,
          req.end_timestamps
        );
        // TODO: what if out of range, or default
        // I say default is defined by provider
        // but we should have guidance
        this.context.frameRequest = {
          request: req,
          id: req.id,
          iterator: frameIterator
        };

        // send state_updates || error
        this.t_start_time = process.hrtime();
        if (this.options.delay < 1) {
          this._sendAllStateUpdates(this.context.frameRequest);
        } else {
          this._sendStateUpdate(this.context.frameRequest);
        }
      }
    }
  }

  async _sendStateUpdate(frameReq) {
    const {request, id, iterator} = frameReq;

    const frame_sent_start_time = process.hrtime();

    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }

    if (iterator.valid()) {
      const loadtime = process.hrtime();
      const data = await this.provider.xvizFrame(iterator);
      const dataload = deltaTimeMs(loadtime);
      console.log(`--- loadtime ${dataload}`);

      const sendtime = process.hrtime();
      this.middleware.onStateUpdate(request, {data});
      const datasend = deltaTimeMs(sendtime);
      console.log(`--- sendtime ${datasend}`);

      this.interval = setTimeout(
        () => this._sendStateUpdate(this.context.frameRequest),
        this.options.delay
      );

      const frame_sent_end_time = process.hrtime();
      this.logMsgSent(frame_sent_start_time, frame_sent_end_time, iterator.value());
    } else {
      // TODO(twojtasz): need A XVIZData.TransformLogDone(msg);, because XVIZData is the expected pass
      // Could have XVIZData constructor that takes format + object and prepopulates the message?
      this.middleware.onTransformLogDone(request, TransformLogDoneMsg({id}));

      this.context.frameRequest = null;
    }
  }

  async _sendAllStateUpdates(frameReq) {
    const {id, iterator} = frameReq;
    while (iterator.valid()) {
      const frame_sent_start_time = process.hrtime();

      const data = await this.provider.xvizFrame(iterator);
      this.middleware.onStateUpdate({}, {data});

      const frame_sent_end_time = process.hrtime();

      this.logMsgSent(frame_sent_start_time, frame_sent_end_time, iterator.value());
    }

    this.middleware.onTransformLogDone({}, TransformLogDoneMsg({id}));
    this.context.frameRequest = null;
  }

  logMsgSent(start_time, end_time, index) {
    const t_from_start_ms = deltaTimeMs(this.t_start_time);
    const t_msg_start_time_ms = deltaTimeMs(start_time);
    const t_msg_end_time_ms = deltaTimeMs(end_time);
    console.log(
      `[< STATE_UPDATE] ${index}): ${t_msg_start_time_ms}ms ${t_msg_end_time_ms}ms start: ${t_from_start_ms}ms`
    );
  }
}
