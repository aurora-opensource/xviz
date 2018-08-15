/* global setTimeout */
export default self => {
  self.onmessage = event => {
    setTimeout(() => self.postMessage(event.data), 50);
  };
};
