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
const appUtils = require('../../lib/appUtils');
const { Op } = Sequelize;

module.exports = async (invoiceXML, attachment, companyId) => {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  let invoice = null;
  try {    
    invoice = await invoices.extractData(invoiceXML);
  } catch (e) {
    await Attachment.update(
      {
        processingState: "ERROR",
        errorCause: e.message
      },
      {
        where: { id: attachment.id }
      }
    );    
    //TODO: error managment when its file upload
  }

  if (invoice) {
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
  }
  if (!attachment) {
    return;
  }

  const attachmentList = await Attachment.findAll({
    where: {
      /*
      [Op.and]: [
        { processingState: { [Op.ne]: "ERROR" }},
        { processingState: { [Op.ne]: "ERROR" }},
        { processingState: { [Op.ne]: "SKIPPED" }},
        { processingState: { [Op.ne]: null } }
      ],*/
      emailId: attachment.emailId
    }
  });

  const newEmailState = appUtils.checkIfStateIfDoneOrError(attachmentList);
  if (newEmailState) {
    await Email.update(
      {
        processingState: newEmailState
      },
      {
        where: { id: attachment.emailId }
      }
    );
  }
};

