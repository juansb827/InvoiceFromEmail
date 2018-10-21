var Transform = require('stream').Transform;
var inherits = require('util').inherits;
var utf8 = require('utf8');
var quotedPrintable = require('quoted-printable');

module.exports = JSONEncode;
function JSONEncode(options) {
    if (!(this instanceof JSONEncode))
        return new JSONEncode(options);
    if (!options) options = {};
    options.objectMode = true;
    Transform.call(this, options);
}

inherits(JSONEncode, Transform);
JSONEncode.prototype._transform = function _transform(obj, encoding, callback) {    
    try {
        obj =  utf8.decode(quotedPrintable.decode(''+obj));
    } catch (err) {
        return callback(err);
    }
    this.push(obj);
    callback();
};