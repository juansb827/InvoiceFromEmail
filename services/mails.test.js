const emailService = require('./mails')
const emailErrors = require("./Email/ImapHelper/Errors");
const logger = require("../utils/logger");

require("dotenv").config();
const AWS = require("aws-sdk");
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
AWS.config.update({ region: AWS_DEFAULT_REGION });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
//Invoice Processing Q
const SQS_INVOICE_QUEUE_URL = process.env.SQS_INVOICE_QUEUE_URL;

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
//   .then(() => EmailWorker.startEmailWorker("juansb827@gmail.com"))
  
//EmailWorker.startEmailWorker("juansb827@gmail.com")
/*
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
*/

  

 function testProcessinQ( ) {
 
  const payload = {
    fileLocation: {
      bucketName: "invoice-processor",
      fileKey: "3/face_F0900547176003a6a6278.xml"
    },
    companyId: 3,
    attachment: { id: 98, emailId: 120 }
  }; 

  var params = {
    DelaySeconds: 0,
    MessageAttributes: {     
    },
    MessageBody: JSON.stringify(payload), 
    QueueUrl: SQS_INVOICE_QUEUE_URL
  };

  sqs.sendMessage(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });
}
/*
for(var i=0; i< 10; i++) {
  setTimeout(testProcessinQ, 50);
  
} */
