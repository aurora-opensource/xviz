/* global TextDecoder */

let TextDecoderClass;
if (typeof TextDecoder === 'undefined') {
  TextDecoderClass = require('text-encoding').TextDecoder;
} else {
  TextDecoderClass = TextDecoder;
}

export default TextDecoderClass;
