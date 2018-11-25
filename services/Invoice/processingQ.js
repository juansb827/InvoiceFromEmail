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
const { queue } = require("async");

const q = queue(async task => {

  return;
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
}, 10);

// add some items to the queue

let counter = 0;
process.on("message", task => {


  console.log("New Invoice To Process : " + counter);
  counter++;
  
  q.push(task, function(err) {
    console.log("Finished processing Invoice");
    if (err) {
      console.err(err);
    }
  });
});
process.send(true);
/*
var interval = setInterval(() => {
  process.send(true);
}, 1000); */
