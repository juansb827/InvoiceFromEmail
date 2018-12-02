"use strict";
require("dotenv").config({ path: "./serverless.env" });
const invoiceProcessor = require("./Invoice/InvoiceProcessor");
const AWS = require("aws-sdk");
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
AWS.config.update({ region: AWS_DEFAULT_REGION });
const s3 = new AWS.S3();

/* EXAMPLE OF MESSAGE

const parsedBody =  {
  fileLocation: {
    bucketName: "invoice-processor",
    fileKey: "3/face_F0900547176003a6a6278.xml"
  },
  companyId: 3,
  attachment: { id: 98, emailId: 120 }
} ;
*/

module.exports.processInvoice = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "SQS event processed.",
      input: event
    })
  };

  console.log("Batch Size", event.Records.length);

  try {
    for (let record of event.Records) {
      const parsedBody = JSON.parse(record.body);

      const invoiceXML = await new Promise((resolve, reject) => {
        let options = {
          Bucket: parsedBody.fileLocation.bucketName,
          Key: parsedBody.fileLocation.fileKey
        };
        s3.getObject(options, (err, data) => {
          if (err) reject(err);
          resolve(data.Body.toString());
        });
      });

      await invoiceProcessor.processInvoice(
        invoiceXML,
        parsedBody.attachment,
        parsedBody.companyId
      );
    }
  } catch (err) {
    console.error(err);
    return err;
  }

  return response;
};


