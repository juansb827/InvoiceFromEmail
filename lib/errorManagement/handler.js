"use strict";

const util = require("util");
const logger = require("logger");
//const operationalErrorDecider = require("./operationalErrorDecider");

module.exports = new errorHandler();

function errorHandler() {

  this.registerAndHandleAllErrors = function(app) {
    logger.debug(`Error handler now registers to handle all errors`);

    app.use((err, req, res, next) => {
      logger.info(`Exception was caught by express middleware`);

      if (!req.transactionId) {
        throw new Error('transactionId is missing in request objects');
      }

      this.logAndNotifyAboutError(err, req.transactionId);
      res.status(err.httpCode || 500).json(this.getFormatedError(err));
      //since this error comes from an http request, we keep the process alive by taking a risky call that the error is probably operational
      next();
    });
    
    process.on("uncaughtException", error => {
      logger.info(
        `Uncaught exception was caught with the following error ${
          error.name
        }: ${error.message}`
      );
      this.logAndNotifyAboutError(error);
      this.crashIfNotOperational(error);
    });

    process.on("unhandledRejection", (reason, p) => {
      logger.info(
        `Unhandled rejection was caught for the following promise ${util.inspect(
          p
        )}`
      );
      this.logAndNotifyAboutError(reason);
      this.crashIfNotOperational(reason);
    });
  };

  this.crashIfNotOperational = function(error) {
    if (!error.isOperational) {
      logger.info(
        `Error handler concluded that this error is not trusted thus exiting`
      );
      //process.exit(1);
    }
  };

  this.logAndNotifyAboutError = function(error, trnId) {
    if (!error.isOperational) {
      const msg = ` A non-trusted (not operational) error was detect, this will likely to kill the process - please analyze this issue and act thoughtfully`;
      logger.info(trnId ? `TransactionId:'${trnId}' ${msg}`: msg);      
    }

    const msg = `Error handler is reporting a new error: 
      ${error.isOperational ? error : error.stack }`;
    logger.error(trnId ? `TransactionId:'${trnId}' ${msg}`: msg);
      


  };

  this.getFormatedError = function(error) {
    return { 
      error: {
        name: error.name,
        message: error.message 
      }       
    }; 
  };

}
