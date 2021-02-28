const querystring = require('querystring');
const { StringDecoder } = require('string_decoder');
const { PayloadTooLarge } = require('./create-error.js');

async function parseBody (rL, req) {
  const { maxPayloadSize } = rL._opt;
  const contentType = req.getHeader('content-type');

  return await new Promise(function (resolve, reject) {
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', handleData);
    req.on('end', handleEnd);

    function handleData (chunk) {
      buffer += decoder.write(chunk);
      verifyPayload();
    }

    function handleEnd () {
      buffer += decoder.end();

      if (contentType === 'application/x-www-form-urlencoded') {
        resolve(querystring.parse(buffer));
      } else if (contentType === 'application/json') {
        resolve(JSON.parse(buffer));
      } else {
        resolve(buffer);
      }
    }

    function abort (error) {
      req.off('data', handleData);
      req.off('end', handleEnd);
      reject(error);
    }

    function verifyPayload () {
      if (maxPayloadSize !== null && buffer.length > maxPayloadSize) {
        abort(PayloadTooLarge());
      }
    }
  });
}

module.exports = parseBody;
