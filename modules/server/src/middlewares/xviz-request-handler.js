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

// TODO: define logger
// error
// warn
// info
// debug

// Server middleware that handles the logic of responding
// to a request with data from a provider, processing
// the data through the supplied middleware
export class XVIZRequestHandler {
  constructor(context, socket, provider, middleware, options = {}) {
    this.context = context;
    // TODO: this socket is not needed we go through the middleware
    this.socket = socket;
    this.provider = provider;
    this.middleware = middleware;

    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    this.t_start_time = 0;

    this._setupContext();
  }

  _setupContext() {
    // TODO: make a context specific 'configuration' methods
    // this.context.set('providerSettings', this.provider.settings());

    const metadata = this.provider.xvizMetadata().message;
    if (metadata.data.log_info) {
      const {start_time, end_time} = metadata.data.log_info;
      if (start_time) {
        // TODO: make a context specific source methods
        this.context.set('start_time', start_time);
      }

      if (end_time) {
        this.context.set('end_time', start_time);
      }
    }
  }

  onStart(req, msg) {
    // TODO; validation
    const error = null;
    if (error) {
      this.middleware.onError(req, ErrorMsg(error));
    } else {
      // fill in profile, format, session_type
      // make context specific configuration fields
      if (msg.message_format) {
        this.context.set('message_format', msg.message_format);
      } else {
        this.context.set('message_format', 'binary');
      }

      if (msg.profile) {
        this.context.set('profile', msg.profile);
      } else {
        this.context.set('profile', 'default');
      }

      if (msg.session_type) {
        this.context.set('session_type', msg.session_type);
      } else {
        this.context.set('session_type', 'log');
      }
    }

    // send metadata
    const data = this.provider.xvizMetadata();
    this.middleware.onMetadata(req, {data});
  }

  onTransformLog(req, msg) {
    // TODO: validation
    const error = null;
    if (error) {
      this.middleware.onError(req, ErrorMsg(error));
    } else {
      //  store id, start_timestamp, end_timestamp, desired_streams

      const transform = this.context.transform(req.id);
      if (!transform) {
        // track transform request
        const tformState = {
          request: req,
          iterator: null,
          interval: null,
          delay: this.options.delay
        };
        this.context.startTransform(req.id, tformState);

        tformState.iterator = this.provider.getFrameIterator(
          req.start_timestamps,
          req.end_timestamps
        );

        // send state_updates || error
        this.t_start_time = process.hrtime();
        if (tformState.delay < 1) {
          this._sendAllStateUpdates(tformState);
        } else {
          this._sendStateUpdate(tformState);
        }
      }
    }
  }

  onTransformPointInTime(req, msg) {
    this.middleware.onError(req, ErrorMsg('Error: transform_point_in_time is not supported.'));
  }

  onReconfigure(req, data) {
    this.middleware.onError(req, ErrorMsg('Error: reconfigure is not supported.'));
  }

  async _sendStateUpdate(id, transformState) {
    const {delay, request, iterator} = transformState;
    let {interval} = transformState;

    const frame_sent_start_time = process.hrtime();

    if (interval) {
      clearTimeout(interval);
      interval = null;
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

      interval = setTimeout(() => this._sendStateUpdate(id, transformState), delay);

      const frame_sent_end_time = process.hrtime();
      this.logMsgSent(frame_sent_start_time, frame_sent_end_time, iterator.value());
    } else {
      // TODO(twojtasz): need A XVIZData.TransformLogDone(msg);, because XVIZData is the expected pass
      // Could have XVIZData constructor that takes format + object and prepopulates the message?
      this.middleware.onTransformLogDone(request, TransformLogDoneMsg({id}));
      this.context.endTransform(id);
    }
  }

  async _sendAllStateUpdates(id, transformState) {
    const {iterator, request} = transformState;
    while (iterator.valid()) {
      const frame_sent_start_time = process.hrtime();

      const data = await this.provider.xvizFrame(iterator);
      this.middleware.onStateUpdate(request, {data});

      const frame_sent_end_time = process.hrtime();

      this.logMsgSent(frame_sent_start_time, frame_sent_end_time, iterator.value());
    }

    this.middleware.onTransformLogDone(request, TransformLogDoneMsg({id}));
    this.context.endTransform(id);
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
