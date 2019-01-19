/* global console, Buffer, setTimeout */
/* eslint-disable no-process-exit, no-console, camelcase */
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');
const process = require('process');

const {deltaTimeMs, extractZipFromFile} = require('./serve');
const {parseBinaryXVIZ} = require('@xviz/parser');
const {encodeBinaryXVIZ} = require('@xviz/builder');

const {loadScenario} = require('./scenarios');

// TODO: auxillary timestamp tracking & images are not handled

const FRAME_DATA_SUFFIX = '-frame.glb';
const FRAME_DATA_JSON_SUFFIX = '-frame.json';

// Misc utils

function isJsonObject(data) {
  return data[0] === '{'.charCodeAt(0);
}

// return bytearray or undefined
function readFile(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);

    // If looks like JSON Object, convert to string
    if (isJsonObject(data)) {
      return data.toString();
    }

    // Binary data
    return data;
  }

  return undefined;
}

// Frame Data Utillities
const TIMING_INDEX = 0;
const START_INDEX = 1;

// Return an array with the max timestamp for each frame file
//
// Input index file structure
// {
//   startTime, endTime, timing:[ [update_min_timestamp, update_max_timestamp], ...]
// }
function loadTimingIndex(data_directory) {
  console.log('Checking for index file');
  const timingName = getFrameName(TIMING_INDEX).find(filename => {
    const filepath = path.join(data_directory, filename);
    return fs.existsSync(filepath);
  });

  if (timingName) {
    const filepath = path.join(data_directory, timingName);
    const timingBuffer = getFrameData({path: filepath});
    const timingData = JSON.parse(timingBuffer);

    if (timingData && timingData.timing) {
      // return just the max timestamp for each frame
      return timingData.timing.map(x => x[1]);
    }

    console.log('Timing index file is missing the "timing" entry');
  }

  return [];
}

// Check for data files or tar.gz and extract as necessary
function setupFrameData(data_directory) {
  const frameNames = getFrameName(START_INDEX);

  const hasData = frameNames.some(name => {
    console.log('Checking for files: ', path.join(data_directory, name));
    return fs.existsSync(path.join(data_directory, name));
  });

  if (!hasData) {
    console.log('Checking for archive');
    const results = extractZipFromFile(path.join(data_directory, 'frames.tar.gz'));
    if (results.status !== 0) {
      console.log(`Uncompression of data failed.
        CODE: ${results.status}
        STDOUT: ${results.stdout}
        STDERR: ${results.STDERR}`);
    }
  }
}

// Support various formatted frame names
function getFrameName(index) {
  return [`${index}${FRAME_DATA_SUFFIX}`, `${index}${FRAME_DATA_JSON_SUFFIX}`];
}

function getFrameMetadata(index, data_directory) {
  const frameName = getFrameName(index).find(filename => {
    const filepath = path.join(data_directory, filename);
    return fs.existsSync(filepath);
  });

  return (
    frameName && {
      path: path.join(data_directory, frameName)
    }
  );
}

// Return frame data from source
function getFrameData({path: filepath}) {
  // Find the first valid name
  return readFile(filepath);
}

// Read all frame data ('*-frame.glb' files) from the `data_directory`.
// return {metadata, frames}
function loadFrames(data_directory) {
  const frames = [];

  // unzip archive if necessary
  setupFrameData(data_directory);

  for (let i = START_INDEX; i <= 99999; i++) {
    const metadata = getFrameMetadata(i, data_directory);
    if (metadata) {
      frames.push(metadata);
    } else {
      break;
    }
  }

  return {metadata: frames[0], frames: frames.slice(1)};
}

// Load frame timestamps by opening every frame to extract
function loadFrameTimings(frames) {
  let lastTime = 0;
  const timings = frames.map(frame => {
    const data = getFrameData(frame);
    let jsonFrame = null;
    if (data instanceof Buffer) {
      jsonFrame = parseBinaryXVIZ(
        data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      );
    } else if (typeof data === 'string') {
      jsonFrame = JSON.parse(data);
    }

    const ts = getTimestamp(jsonFrame);
    if (Number.isFinite(ts)) {
      lastTime = ts;
    }

    return lastTime;
  });

  // Remove metadata timing
  return timings;
}

// Determine the actual index into frames when looping over data repeatedly
// Happens when frame_limit > framesLength
function getFrameIndex(index, framesLength) {
  if (index >= framesLength) {
    // do not include count metadata
    const xviz_count = framesLength - 1;

    let real_index = index % xviz_count;
    if (real_index === 0) {
      real_index = xviz_count;
    }

    return real_index;
  }

  return index;
}

// Data Handling

function getTimestampV1(xviz_data) {
  const {start_time, vehicle_pose, state_updates} = xviz_data;

  if (!start_time && !vehicle_pose) {
    // Not XVIZ v1
    return null;
  }

  let timestamp;
  if (start_time) {
    timestamp = start_time;
  } else if (vehicle_pose) {
    timestamp = vehicle_pose.time;
  } else if (state_updates) {
    timestamp = state_updates.reduce((t, stateUpdate) => {
      return Math.max(t, stateUpdate.timestamp);
    }, 0);
  }

  return timestamp;
}

function getTimestampV2(xviz_data) {
  let timestamp;

  // Handled timestamp from metadata
  const {log_info} = xviz_data;
  if (log_info) {
    if (log_info.start_time) {
      timestamp = log_info.start_time;
    }
  } else {
    // Handled timestamp from XVIZ update message
    let {updates} = xviz_data;

    // If not a direct XVIZ message, check for the envelope
    if (!updates && xviz_data.data && xviz_data.data.updates) {
      updates = xviz_data.data.updates;
    } else {
      throw new Error('Unable to find "updates" field to extract timestamp from XVIZ data.');
    }

    let vehicle_pose = null;
    if (updates && updates[0] && updates[0].poses) {
      vehicle_pose = updates[0].poses['/vehicle_pose'];
    }

    if (vehicle_pose) {
      timestamp = vehicle_pose.timestamp;
    } else if (updates) {
      timestamp = updates.reduce((t, stateUpdate) => {
        return Math.max(t, stateUpdate.timestamp);
      }, 0);
    }
  }

  return timestamp;
}

// Return either the vehicle_pose timestamp, or max
// of timestamps in state_updates/updates.
function getTimestamp(xviz_data) {
  let result = getTimestampV1(xviz_data);
  if (!result) {
    result = getTimestampV2(xviz_data);
  }

  return result;
}

// Global counter to help debug
let _connectionCounter = 1;

function connectionId() {
  const id = _connectionCounter;
  _connectionCounter++;

  return id;
}

// Connection State
class ConnectionContext {
  constructor(settings, metadata, frames, frameTiming, loadFrameData) {
    this.metadata = metadata;

    this._loadFrameData = loadFrameData;

    this.connectionId = connectionId();

    // Remove metadata so we only deal with data frames
    this.frames = frames;
    this.frames_timing = frameTiming;
    this.frame_time_offset = null;

    this.settings = settings;
    this.t_start_time = null;

    // Only send metadata once
    this.sentMetadata = false;

    // Used to manage changing an inflight request
    this.replaceFrameRequest = null;
    this.inflight = false;

    // Cache json version of frames for faster re-writes
    // during looping.
    this.json_frames = [];
    this.is_frame_binary = [];
    this.frame_update_times = [];

    if (this.settings.loop) {
      this.unpackFrames();
    }

    this.onConnection.bind(this);
    this.onClose.bind(this);
    this.onMessage.bind(this);
    this.sendFrame.bind(this);

    console.log('Waiting for connection');
  }

  unpackFrames() {
    console.log(`Unpacking ${this.frames.length} frames into memory`);
    console.log('WARNING: for long logs you might not have enough memory');
    for (let i = 0; i < this.frames.length; ++i) {
      const frame = this._loadFrameData(this.frames[i]);

      const update_times = [];

      let jsonFrame;
      let isBinary = false;

      if (frame instanceof Buffer) {
        jsonFrame = parseBinaryXVIZ(
          frame.buffer.slice(frame.byteOffset, frame.byteOffset + frame.byteLength)
        );
        isBinary = true;
      } else if (typeof frame === 'string') {
        jsonFrame = JSON.parse(frame);
      } else {
        throw new Error('Unknown frame type');
      }

      if (jsonFrame.data.updates) {
        const updates = jsonFrame.data.updates;
        for (let y = 0; y < updates.length; y++) {
          update_times.push(updates[y].timestamp);
        }
      }

      this.json_frames.push(jsonFrame);
      this.is_frame_binary.push(isBinary);
      this.frame_update_times.push(update_times);
    }
  }

  onConnection(ws) {
    this.log('> Connection from Client.');

    this.t_start_time = process.hrtime();
    this.ws = ws;

    // Respond to control messages from the browser
    ws.on('message', msg => this.onMessage(msg));

    // On connection send metadata
    this.sendMetadataResp();

    // 'live' mode will not get the 'xviz/transform_log' message
    // so start sending immediately
    if (this.settings.live) {
      this.sendPlayResp({});
    }
  }

  onClose(event) {
    this.log(`> Connection Closed. Code: ${event.code} Reason: ${event.reason}`);
  }

  onMessage(message) {
    const msg = JSON.parse(message);

    this.log(`> Message ${msg.type} from Client`);

    switch (msg.type) {
      case 'xviz/start':
        // TODO: support choosing log here
        break;
      case 'xviz/transform_log': {
        this.log(`| start: ${msg.data.start_timestamp} end: ${msg.data.end_timestamp}`);
        this.sendPlayResp(msg.data);
        break;
      }
      default:
        this.log(`|  Unknown message ${msg}`);
    }
  }

  /* Setup frameRequest to control subset of frames to send
   *
   * @returns frameRequest object or null
   */
  setupFrameRequest({start_timestamp, end_timestamp}) {
    const {frames, frames_timing} = this;
    const {frame_limit, duration} = this.settings;

    //  log time bounds
    const log_time_start = frames_timing[0];
    const log_time_end = frames_timing[frames_timing.length - 1];

    // default values
    let timestampStart = start_timestamp;

    if (!timestampStart) {
      timestampStart = frames_timing[0];
    }

    let timestampEnd = end_timestamp;
    if (!timestampEnd) {
      timestampEnd = timestampStart + duration;
    }
    console.log(`time ${timestampStart} ${timestampEnd} ${duration}`);
    // bounds checking
    if (timestampStart > log_time_end || timestampEnd < log_time_start) {
      return null;
    }

    let start = frames_timing.findIndex(ts => ts >= timestampStart);
    if (start === -1) {
      start = 1;
    }

    let end = frames_timing.findIndex(ts => ts >= timestampEnd);
    console.log(`found ${end}`);
    if (end === -1) {
      end = frames.length;
    }

    if (end > frame_limit) {
      end = frame_limit;
    }
    console.log(`End ${end} limit:  ${frame_limit}`);

    return {
      start,
      end,
      index: start
    };
  }

  sendMetadataResp(clientMessage) {
    if (!this.sentMetadata) {
      this.sentMetadata = true;
      this.sendMetadata();
    }
  }

  sendPlayResp(clientMessage) {
    const frameRequest = this.setupFrameRequest(clientMessage);
    console.log(frameRequest);
    if (frameRequest) {
      if (this.inflight) {
        this.replaceFrameRequest = frameRequest;
      } else {
        this.inflight = true;
        this.sendNextFrame(frameRequest);
      }
    }
  }

  sendMetadata() {
    const frame = this._loadFrameData(this.metadata);
    const isBuffer = frame instanceof Buffer;

    const frame_send_time = process.hrtime();

    // Send data
    if (isBuffer) {
      this.ws.send(frame);
    } else {
      this.ws.send(frame, {compress: true});
    }

    this.logMsgSent(frame_send_time, 1, 1, 'metadata');
  }

  // Setup interval for sending frame data
  sendNextFrame(frameRequest) {
    if (this.replaceFrameRequest) {
      frameRequest = this.replaceFrameRequest;
      this.log(`| Replacing inflight request.`);
      // TODO(jlsee): this should be a real message type, that
      // contains the request which as canceled
      this.sendEnveloped('cancelled', {});
      this.replaceFrameRequest = null;
    }

    frameRequest.sendInterval = setTimeout(
      () => this.sendFrame(frameRequest),
      this.settings.send_interval
    );
  }

  // Send an individual frame of data
  sendFrame(frameRequest) {
    const ii = frameRequest.index;
    const last_index = frameRequest.end;

    const {skip_images} = this.settings;
    const frame_send_time = process.hrtime();

    // get frame info
    const frame_index = getFrameIndex(ii, this.frames.length);
    const frame = this._loadFrameData(this.frames[frame_index]);

    // TODO images are not supported here, but glb data is
    // old image had a binary header
    const isBuffer = frame instanceof Buffer;
    let skipSending = isBuffer && skip_images;

    // End case
    if (ii >= last_index) {
      if (this.settings.loop) {
        // In loop mode determine how much data we just play then update
        // our offset.
        frameRequest.index = this.loopPlayback(frame_index, frameRequest.start) - 1;

        // We are past the limit don't send this frame
        skipSending = true;
      } else {
        // When last_index reached send 'transform_log_done' message
        if (!this.settings.live) {
          this.sendEnveloped('transform_log_done', {}, {}, () => {
            this.logMsgSent(frame_send_time, -1, frame_index, 'json');
          });
        }

        this.inflight = false;

        return;
      }
    }

    // Advance frame
    frameRequest.index += 1;

    // NOTE: currently if we are skipping images we don't find the
    //       next non-image frame, we just let it cycle so sending can be
    //       delayed as a result. (ie. won't always send data at specified delay).
    //
    // Are we sending this frame?
    if (skipSending) {
      this.sendNextFrame(frameRequest);
    } else {
      const next_ts = this.frames_timing[frame_index];

      const updatedFrame = this.adjustFrameTime(frame, frame_index);

      // Send data
      if (isBuffer) {
        this.ws.send(updatedFrame, {}, () => {
          this.logMsgSent(frame_send_time, ii, frame_index, 'binary', next_ts);
          this.sendNextFrame(frameRequest);
        });
      } else {
        // this.ws.send(updatedFrame, {compress: true}, () => {
        //   this.logMsgSent(frame_send_time, ii, frame_index, 'json', next_ts);
        //   this.sendNextFrame(frameRequest);
        // });
      }
    }
  }

  loopPlayback(frame_index, start_index) {
    const duration = this.frames_timing[frame_index - 1] - this.frames_timing[start_index];

    if (this.frame_time_offset === null) {
      this.frame_time_offset = 0;
    }
    this.frame_time_offset = this.frame_time_offset + duration;

    return start_index;
  }
  adjustFrameTime(frame, frame_index) {
    if (this.frame_time_offset) {
      // Determine if binary and unpack
      const jsonFrame = this.json_frames[frame_index];
      const updateTimes = this.frame_update_times[frame_index];
      // console.log(this.frame_time_offset);

      // Update the snapshot times
      for (let i = 0; i < jsonFrame.data.updates.length; ++i) {
        const update = jsonFrame.data.updates[i];
        update.timestamp = updateTimes[i] + this.frame_time_offset;
      }

      // Repack based on binary-ness
      if (this.is_frame_binary[frame_index]) {
        frame = encodeBinaryXVIZ(jsonFrame, {});
      } else {
        frame = JSON.stringify(jsonFrame);
      }
    }

    return frame;
  }

  sendEnveloped(type, msg, options, callback) {
    const envelope = {
      type: `xviz/${type}`,
      data: msg
    };
    const data = JSON.stringify(envelope);
    this.ws.send(data, options, callback);
  }

  log(msg) {
    const prefix = `[id:${this.connectionId}]`;
    console.log(`${prefix} ${msg}`);
  }

  logMsgSent(send_time, index, real_index, tag, ts = 0) {
    const t_from_start_ms = deltaTimeMs(this.t_start_time);
    const t_msg_send_time_ms = deltaTimeMs(send_time);
    this.log(
      ` < Frame(${tag}) ts:${ts} ${index}:${real_index} in self: ${t_msg_send_time_ms}ms start: ${t_from_start_ms}ms`
    );
  }
}

// Comms handling

function setupWebSocketHandling(wss, settings, metadata, frames, frameTiming, loadFrameData) {
  // Setups initial connection state
  wss.on('connection', ws => {
    const context = new ConnectionContext(settings, metadata, frames, frameTiming, loadFrameData);
    context.onConnection(ws);
  });
}

// Main

module.exports = function main(args) {
  const runScenario = args.scenario.length > 0;

  if (runScenario) {
    console.log(`Loading frames for scenario ${args.scenario}`);
  } else {
    console.log(`Loading frames from ${args.data_directory}`);
  }

  const frames = runScenario
    ? loadScenario(args.scenario, args.live, args.duration)
    : loadFrames(args.data_directory);

  if (frames.frames.length === 0) {
    console.error('No frames where loaded, exiting.');
    process.exit(1);
  }

  // Try to load from and timing index
  let frameTiming = runScenario ? frames.timing : loadTimingIndex(args.data_directory);
  const frameTimingValue = frameTiming.length === frames.frames.length;

  if (!frameTiming || !frameTimingValue) {
    if (!frameTimingValue) {
      console.log(
        '-- Warning: The number of entries in the 0-frame.json do not match the number of frame files found. Loading timestamps from frames directly.'
      );
    }

    frameTiming = loadFrameTimings(frames.frames);
  }

  console.log(`Loaded ${frames.frames.length} frames`);

  const settings = {
    live: args.live,
    duration: args.duration,
    send_interval: args.delay,
    skip_images: args.skip_images,
    frame_limit: args.frame_limit || frames.length,
    loop: args.loop
  };

  const wss = new WebSocket.Server({port: args.port});
  setupWebSocketHandling(
    wss,
    settings,
    frames.metadata,
    frames.frames,
    frameTiming,
    runScenario ? x => x : getFrameData
  );
};
