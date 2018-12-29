var Transform = require("stream").Transform;
var quotedPrintable = require("quoted-printable");

module.exports = class DecodeStream extends Transform {
  constructor() {
    super();
    this.textChunks = [];
 }
  

  _transform(chunk, encoding, callback) {
    try {
        //TODO: check if its possible to avoid buffering everything
        this.textChunks.push(chunk.toString());
    } catch (err) {
      return callback(err);
    }
    this.push();
    callback();
  }

  _flush(callback) {
    this.push(quotedPrintable.decode(this.textChunks.join('')));
    callback();
  }
};
