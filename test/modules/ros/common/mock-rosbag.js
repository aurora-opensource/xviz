export class MockRosbag {
  constructor(data) {
    this.data = data;

    /*
     * start_time
     * end_time
     * messages: [
     *  {
     *    topic: string
     *    message: object
     *    timestamp: {sec: nsec:}
     *    data: buffer || arraybuffer
     *  }
     * ]
     *
     */
  }

  get startTime() {
    return this.data.start_time;
  }

  get endTime() {
    return this.data.end_time;
  }

  get connections() {
    return this.data.connections;
  }

  _timeInRange(ts, start, end) {
    const startGood = !start || ts.sec >= start.sec;
    const endGood = !end || ts.sec <= end.sec;

    return startGood && endGood;
  }

  async readMessages(config, msgCallback) {
    const {topics, startTime, endTime} = config;

    this.data.messages.forEach(msg => {
      const inRange = this._timeInRange(msg.timestamp, startTime, endTime);
      if (inRange && (!topics || topics.includes(msg.topic))) {
        msgCallback(msg);
      }
    });
  }
}
