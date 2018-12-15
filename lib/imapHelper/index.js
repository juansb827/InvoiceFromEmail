'use strict';

module.exports = require('./imapHelper');
module.exports.providers = require('./constants').providers;
module.exports.authMethods = require('./constants').authMethods;
module.exports.getConfiguration = require('./getConfiguration');
module.exports.errors = require('./Errors');