"use strict";
require("dotenv").config({ path: "./serverless.env" });

const emailWorker = require('./EmailWorker.js');

const AWS = require("aws-sdk");
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
AWS.config.update({ region: AWS_DEFAULT_REGION });
const s3 = new AWS.S3();

module.exports.processPendingEmails = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "SQS event processed.",
      input: event
    })
  };

  const emailAccount = event.Records[0].body;
  try {
    await emailWorker.attempToStartWorker(emailAccount);   
  }catch(err ) {
    console.error("Error in worker for account: " + emailAccount + " " + err.stack);
    return err;
  }
  
  console.log('Function ends');
  return response;
 
};



