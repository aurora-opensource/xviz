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
/* global setTimeout, clearTimeout */
/* eslint-disable camelcase, no-unused-expressions */
import {Stats} from 'probe.gl';

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

// Server middleware that handles the logic of responding
// to a request with data from a provider, processing
// the data through the supplied middleware
export class XVIZRequestHandler {
  constructor(context, provider, middleware, options = {}) {
    this.context = context;
    this.provider = provider;
    this.middleware = middleware;

    this.metrics = new Stats({id: 'xviz-request-handler'});
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    this._setupContext();
  }

  _setupContext() {
    // TODO: make a context specific 'configuration' methods
    // this.context.set('providerSettings', this.provider.settings());

    const metadata = this.provider.xvizMetadata().message();
    if (metadata && metadata.data && metadata.data.log_info) {
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

  _setupTransformMetrics() {
    return {
      totalTimer: this.metrics.get(`total`),
      loadTimer: this.metrics.get(`load`),
      sendTimer: this.metrics.get(`send`)
    };
  }

  onTransformLog(req, msg) {
    // TODO: validation
    const error = null;
    if (error) {
      this.middleware.onError(req, ErrorMsg(error));
    } else {
      //  store id, start_timestamp, end_timestamp, desired_streams
      const id = req.id;
      const transform = this.context.transform(id);
      if (!transform) {
        // track transform request
        const tformState = {
          request: req,
          iterator: null,
          interval: null,
          delay: this.options.delay,
          ...this._setupTransformMetrics()
        };
        this.context.startTransform(id, tformState);

        tformState.iterator = this.provider.getFrameIterator(
          req.start_timestamps,
          req.end_timestamps
        );

        // send state_updates || error
        if (tformState.delay < 1) {
          this._sendAllStateUpdates(id, tformState);
        } else {
          this._sendStateUpdate(id, tformState);
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
    const {delay, request, interval, iterator} = transformState;
    const {loadTimer, sendTimer, totalTimer} = transformState;

    if (!interval) {
      // The interval is only falsy if it is the very first call
      totalTimer && totalTimer.timeStart();
    }

    if (interval) {
      clearTimeout(interval);
      transformState.interval = null;
    }

    if (iterator.valid()) {
      loadTimer && loadTimer.timeStart();
      const data = await this.provider.xvizFrame(iterator);
      loadTimer && loadTimer.timeEnd();

      sendTimer && sendTimer.timeStart();
      this.middleware.onStateUpdate(request, {data});
      sendTimer && sendTimer.timeEnd();

      transformState.interval = setTimeout(() => this._sendStateUpdate(id, transformState), delay);

      this.logMsgSent(id, iterator.value(), loadTimer, sendTimer);
    } else {
      // TODO(twojtasz): need A XVIZData.TransformLogDone(msg);, because XVIZData is the expected pass
      // Could have XVIZData constructor that takes format + object and prepopulates the message?
      this.middleware.onTransformLogDone(request, TransformLogDoneMsg({id}));
      totalTimer && totalTimer.timeEnd();
      this.logDone(id, loadTimer, sendTimer, totalTimer);
      this.context.endTransform(id);
      this.metrics.reset();
    }
  }

  async _sendAllStateUpdates(id, transformState) {
    const {iterator, request} = transformState;
    const {loadTimer, sendTimer, totalTimer} = transformState;

    totalTimer && totalTimer.timeStart();
    while (iterator.valid()) {
      loadTimer && loadTimer.timeStart();
      const data = await this.provider.xvizFrame(iterator);
      loadTimer && loadTimer.timeEnd();

      sendTimer && sendTimer.timeStart();
      this.middleware.onStateUpdate(request, {data});
      sendTimer && sendTimer.timeEnd();

      this.logMsgSent(id, iterator.value(), loadTimer, sendTimer);
    }

    this.middleware.onTransformLogDone(request, TransformLogDoneMsg({id}));
    totalTimer && totalTimer.timeEnd();
    this.logDone(id, loadTimer, sendTimer, totalTimer);
    this.context.endTransform(id);
    this.metrics.reset();
  }

  logMsgSent(id, index, loadTimer, sendTimer) {
    const {logger} = this.options;
    if (logger && logger.verbose) {
      let msg = `id: ${id} [< STATE_UPDATE] frame: ${index}`;
      if (loadTimer) {
        msg += ` ${loadTimer.name}:${loadTimer.lastTiming.toFixed(3)}ms`;
      }
      if (sendTimer) {
        msg += ` ${sendTimer.name}:${sendTimer.lastTiming.toFixed(3)}ms`;
      }

      logger.verbose(msg);
    }
  }

  logDone(id, load, send, total) {
    const {logger} = this.options;
    if (logger && logger.info) {
      const msg = `id: ${id} [< DONE]`;
      if (load) {
        logger.info(
          `${msg} ${load.name} Avg:${load.getAverageTime().toFixed(3)}ms Total:${load.time.toFixed(
            3
          )}ms Hz:${load.getHz().toFixed(3)}/sec Count:${load.count}`
        );
      }
      if (send) {
        logger.info(
          `${msg} ${send.name} Avg:${send.getAverageTime().toFixed(3)}ms Total:${send.time.toFixed(
            3
          )}ms Hz:${send.getHz().toFixed(3)}/sec Count:${send.count}`
        );
      }
      if (total) {
        logger.info(`${msg} ${total.name} ${total.lastTiming.toFixed(3)}ms`);
      }
    }
  }
}
