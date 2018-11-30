"use strict";
require("dotenv").config({ path: "./serverless.env" });
const invoiceProcessor = require("./Invoice/InvoiceProcessor");

module.exports.hello = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;  
  let data;
  try {
    data = await invoiceProcessor.processInvoice('face_F0900547176003a6a6278.xml', null, '3');    
  } catch (err) {
    console.log(err);
    return err;
  }
  return data;
};
