/* global TextDecoder */
import {setXvizConfig} from '../config/xviz-config';
import {parseXvizV1} from '../parsers/parse-xviz-v1';

export default config => self => {
  setXvizConfig(config);

  self.onmessage = e => {
    const dataView = new DataView(e.data);
    const decoder = new TextDecoder('utf-8');
    const decodedString = decoder.decode(dataView);

    try {
      let data = JSON.parse(decodedString);
      data = parseXvizV1(data);

      const transfers = [];

      data = data.map(({pointCloud, time}) => {
        if (pointCloud) {
          transfers.push(
            pointCloud.ids.buffer,
            pointCloud.colors.buffer,
            pointCloud.normals.buffer,
            pointCloud.positions.buffer
          );
        }
        return {pointCloud, time};
      });

      // https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
      self.postMessage(
        // aMessage
        data,
        // transferList, calls out which elements inside the data structure of the
        // first argument to not copy
        transfers
      );

      // Terminate
      self.close();
    } catch (error) {
      throw new Error(error);
    }
  };
};
