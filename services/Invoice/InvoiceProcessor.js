require("dotenv").config();

const { processInvoice } = require("./invoices");

const {
  Invoice,
  InvoiceItem,
  Email,
  Attachment,
  sequelize,
  Sequelize
} = require("../../db/models");

const { Op } = Sequelize;
const Consumer = require('sqs-consumer');

const AWS = require("aws-sdk");
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
AWS.config.update({ region: AWS_DEFAULT_REGION });
//const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

//Invoice Processing Q
const SQS_INVOICE_QUEUE_URL = process.env.SQS_INVOICE_QUEUE_URL;


const app = Consumer.create({
    queueUrl: SQS_INVOICE_QUEUE_URL,
    handleMessage: (message, done) => {
      const json = JSON.parse(message.Body);       
      handleTask(json)
        .then(() => { 
          done();
          app.stop();
          sequelize.close();
        })
        .catch(err => {
          console.log(err);
          done(err);
          app.stop();
          sequelize.close();
        })
        
    }
  });
  
  app.on('error', (err) => {
    console.log(err.message);
  });
  
  app.start();

  async function handleTask (task)  {  
    const { fileURI, attachment, companyId } = task;
    if (!companyId) {
      throw new Error('companyId is required');
    }
    
    const invoice = await processInvoice(fileURI, companyId, attachment);
  
    await sequelize.transaction(async t => {

      const invoiceHeader = invoice.header;
      invoiceHeader.companyId = companyId;
  
      if (attachment) {
        invoiceHeader.emailId = attachment.emailId;
      }
  
      const savedInvoice = await Invoice.build(invoiceHeader).save({
        transaction: t
      });
  
      invoice.items.forEach(item => {
        item.invoiceId = savedInvoice.id;
      });
  
      let last = InvoiceItem.bulkCreate(invoice.items, { transaction: t });
  
      if (!attachment) {
        return last;
      }
  
      await last;
  
      return Attachment.update(
        {
          processingState: "DONE"
        },
        {
          transaction: t,
          where: { id: attachment.id }
        }
      );
    });
  
    if (!attachment) {
      return;
    }
  
    const count = await Attachment.count({
      where: {
        [Op.and]: [
          { processingState: { [Op.ne]: "DONE" } },
          { processingState: { [Op.ne]: null } }
        ],
        emailId: attachment.emailId
      }
    });
  
    if (count === 0) {
      //Email has no pending attachments left
      await Email.update(
        {
          processingState: "DONE"
        },
        {
          where: { id: attachment.emailId }
        }
      );
    }
  }