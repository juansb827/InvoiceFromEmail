const invoices = require("../../lib/invoiceUtils/invoices");
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




module.exports = async (invoiceXML, attachment, companyId) => {
  
 
  
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
