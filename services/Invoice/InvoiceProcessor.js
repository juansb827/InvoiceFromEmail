require("dotenv").config();
// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
// Load credentials and set the region from the JSON file
AWS.config.update({ region: "us-east-2" });
const Consumer = require('sqs-consumer');

const { fork } = require("child_process");

let forked = fork("./services/Invoice/processingQ.js");

// Create an SQS service object
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

const queueTimeout = 1000;
let lastPing = new Date().getTime();

let unsendTasks = [];

forked.on("message", msg => {
  console.log("Ping");
  lastPing = new Date().getTime();
  for (let task of unsendTasks) {
    forked.send(task);
  }
});

forked.once("exit", function(code, signal) {
  console.log(
    "child process exited with " + `code ${code} and signal ${signal}`
  );
});

//registerListeners();

const queueIsAlive = () => {
  const isAlive = new Date().getTime() - lastPing > queueTimeout;
  if (!isAlive) {
    console.log("Recreate");
    forked.kill("SIGINT");
    forked = fork("./services/Invoice/processingQ.js");
    registerListeners();
  }
  return isAlive;
};

const task = {
  fileURI: "Files/face_F0900547176003a6a62782.xml",
  attachment: {
    id: 6,
    emailId: 3
  },
  companyId: 3
};

/*
exports.processInvoice = (fileURI, attachment, companyId) => {
    
    const task = {fileURI, attachment, companyId}    
    if(queueIsAlive()){
        forked.send(task);
    } else{
        unsendTasks.push(task);
    }    
       
} */

//exports.processInvoice(task.fileURI, task.attachment, task.companyId);

var params = {
  DelaySeconds: 10,
  MessageAttributes: {
    Title: {
      DataType: "String",
      StringValue: "The Whistler"
    },
    Author: {
      DataType: "String",
      StringValue: "John Grisham"
    },
    WeeksOn: {
      DataType: "Number",
      StringValue: "6"
    }
  },
  MessageBody:
    "Information about current NY Times fiction bestseller for week of 12/11/2016.",
  QueueUrl: process.env.SQS_INVOICE_QUEUE_URL
};

const processInvoice = () => {
  sqs.sendMessage(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });
};

setTimeout(processInvoice, 4000);
/*
setInterval(() =>{
    processInvoice();
}, 1000) */

module.exports = {
  processInvoice
};

const app = Consumer.create({
    queueUrl: process.env.SQS_INVOICE_QUEUE_URL,
    handleMessage: (message, done) => {
        console.log('Handled message');
      setTimeout(done, 10);
      
    }
  });
  
  app.on('error', (err) => {
    console.log(err.message);
  });
  
  app.start();