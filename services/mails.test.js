const emailService = require('./mails')
const emailErrors = require("./Email/ImapHelper/Errors");
const logger = require("../utils/logger");
//TODO: move to express
const next = function(err, req, res, next) {
  /* We log the error internaly */

  err.statusCode = err.statusCode || 500;
  err.clientMessage = err.clientMessage || "Internal Error";

  if (err.statusCode != 500) {
    message = err.clientMessage || message;
  }
  err.requestId = "433434";
  logger.error(err);
  //res.status(err.statusCode).json({ "message": err.clientMessage });
};

//TODO: move to a route
emailService.searchEmails( "juansb827@gmail.com",
    {
    startingDate: "September 20, 2018",
    sender: "focuscontable@gmail.com"
})
  .then(() => emailService.startEmailWorker("juansb827@gmail.com"))
  //startEmailWorker()
  //startWorkers()
  .then(mailIds => {
    console.log("Finished:##", mailIds);
  })
  .catch(error => {
    if (error.originalError instanceof emailErrors.AuthenticationError) {
      error.statusCode = 400;
      error.clientMessage =
        "Autentication Error, please check email user and password";
    } else if (error.originalError instanceof emailErrors.ConnectionError) {
      error.statusCode = 400;
      error.clientMessage =
        "Could not connect with Email Server, please check email configuration";
    }
    next(error);
  });
