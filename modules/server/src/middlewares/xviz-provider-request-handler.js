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
import {XVIZEnvelope} from '@xviz/io';

const DEFAULT_OPTIONS = {
  delay: 0 // time in milliseconds
};

// Server middleware that handles the logic of responding
// to a request with data from a provider, processing
// the data through the supplied middleware
export class XVIZProviderRequestHandler {
  constructor(context, provider, middleware, options = {}) {
    this.context = context;
    this.provider = provider;
    this.middleware = middleware;

    this.metrics = new Stats({id: 'xviz-provider-request-handler'});
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

  onStart(msg) {
    // TODO; validation
    const error = null;
    if (error) {
      this.middleware.onError(XVIZEnvelope.Error({message: error}));
    } else {
      // fill in profile, format, session_type
      // make context specific configuration fields
      const message = msg.message();
      if (message.data.message_format) {
        this.context.set('message_format', message.data.message_format);
      } else {
        this.context.set('message_format', 'BINARY');
      }

      if (message.data.profile) {
        this.context.set('profile', message.data.profile);
      } else {
        this.context.set('profile', 'default');
      }

      if (message.data.session_type) {
        this.context.set('session_type', message.data.session_type);
      } else {
        this.context.set('session_type', 'LOG');
      }
    }

    // send metadata
    const metadata = this.provider.xvizMetadata();
    this.middleware.onMetadata(metadata);
  }

  _setupTransformMetrics() {
    return {
      totalTimer: this.metrics.get(`total`),
      loadTimer: this.metrics.get(`load`),
      sendTimer: this.metrics.get(`send`)
    };
  }

  onTransformLog(msg) {
    // TODO: validation
    const error = null;
    if (error) {
      this.middleware.onError(XVIZEnvelope.Error({message: error}));
    } else {
      this._clearActiveTransforms();
      this._startTransform(msg);
    }
  }

  onTransformPointInTime(msg) {
    this.middleware.onError(
      XVIZEnvelope.Error({message: 'Error: transform_point_in_time is not supported.'})
    );
  }

  onReconfigure(msg) {
    this.middleware.onError(XVIZEnvelope.Error({message: 'Error: reconfigure is not supported.'}));
  }

  log(...msg) {
    const {logger} = this.options;
    if (logger && logger.log) {
      logger.log(...msg);
    }
  }

  /* eslint-disable complexity */
  async _sendStateUpdate(id, transformState) {
    const {delay, interval, iterator} = transformState;
    const {loadTimer, sendTimer, totalTimer} = transformState;

    if (!interval) {
      // The interval is only falsy if it is the very first call
      totalTimer && totalTimer.timeStart();
    }

    if (interval) {
      clearTimeout(interval);
      transformState.interval = null;
    }

    // End when finished iteration or transform has been removed.
    if (iterator.valid() && this.context.transform(id)) {
      loadTimer && loadTimer.timeStart();
      const data = await this.provider.xvizMessage(iterator);
      loadTimer && loadTimer.timeEnd();

      if (data) {
        sendTimer && sendTimer.timeStart();
        this.middleware.onStateUpdate(data);
        sendTimer && sendTimer.timeEnd();

        this.logMsgSent(id, iterator.value(), loadTimer, sendTimer);
      }

      transformState.interval = setTimeout(() => this._sendStateUpdate(id, transformState), delay);
    } else {
      this.middleware.onTransformLogDone(XVIZEnvelope.TransformLogDone({id}));
      totalTimer && totalTimer.timeEnd();
      this.logDone(id, loadTimer, sendTimer, totalTimer);
      this.context.endTransform(id);
      this.metrics.reset();
    }
  }
  /* eslint-enable complexity */

  _clearActiveTransforms() {
    const transforms = this.context.transforms();
    // Remove all current inflight transforms from list
    for (const tKey of transforms) {
      this.context.endTransform(tKey);
    }
  }

  _startTransform(msg) {
    //  store id, start_timestamp, end_timestamp, desired_streams
    const message = msg.message();
    const id = message.data.id;

    // setup new transform request
    const tformState = {
      request: message.data,
      iterator: null,
      interval: null,
      delay: this.options.delay,
      ...this._setupTransformMetrics()
    };
    this.context.startTransform(id, tformState);

    tformState.iterator = this.provider.getMessageIterator({
      startTime: message.data.start_timestamp,
      endTime: message.data.end_timestamp
    });

    // send state_updates || error
    if (tformState.delay < 1) {
      this._sendAllStateUpdates(id, tformState);
    } else {
      this._sendStateUpdate(id, tformState);
    }
  }

  async _sendAllStateUpdates(id, transformState) {
    const {iterator} = transformState;
    const {loadTimer, sendTimer, totalTimer} = transformState;

    totalTimer && totalTimer.timeStart();
    // End when finished iteration or transform has been removed.
    while (iterator.valid() && this.context.transform(id)) {
      loadTimer && loadTimer.timeStart();
      const data = await this.provider.xvizMessage(iterator);
      loadTimer && loadTimer.timeEnd();

      if (data) {
        sendTimer && sendTimer.timeStart();
        this.middleware.onStateUpdate(data);
        sendTimer && sendTimer.timeEnd();

        this.logMsgSent(id, iterator.value(), loadTimer, sendTimer);
      }
    }

    this.middleware.onTransformLogDone(XVIZEnvelope.TransformLogDone({id}));
    totalTimer && totalTimer.timeEnd();
    this.logDone(id, loadTimer, sendTimer, totalTimer);
    this.context.endTransform(id);
    this.metrics.reset();
  }

  logMsgSent(id, index, loadTimer, sendTimer) {
    const {logger} = this.options;
    if (logger && logger.verbose) {
      let msg = `id: ${id} [< STATE_UPDATE] message: ${index}`;
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
