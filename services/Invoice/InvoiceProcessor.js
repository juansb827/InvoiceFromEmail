//require("dotenv").config({ path: "./serverless.env" });
const invoices = require("./invoices");
const fs = require("fs");

const {
  Invoice,
  InvoiceItem,
  Email,
  Attachment,
  sequelize,
  Sequelize
} = require("../../db/models");

const { Op } = Sequelize;

const AWS = require("aws-sdk");
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
AWS.config.update({ region: AWS_DEFAULT_REGION });
const s3 = new AWS.S3();


module.exports.processInvoice = async (fileURI, attachment, companyId) => {
  
   const invoiceXML = await new Promise ((resolve, reject) => {
    var options = {
      Bucket: "invoice-processor",
      Key: fileURI
    };
    console.log('PArams', options);
    s3.getObject(options, (err, data) => {
      if (err) reject(err);
      resolve(data.Body.toString());      
    });  
  }); 
  
  
  if (!companyId) {
    throw new Error("companyId is required");
  }

  const invoice = await invoices.extractData(invoiceXML);

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
};

//exports.processInvoice('face_F0900547176003a6a6278.xml', null, '3');
