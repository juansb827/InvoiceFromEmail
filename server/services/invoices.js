const utils = require("./utils");
const { Invoice } = require("../db/models/index");
const { InvoiceItem } = require("../db/models/index");

module.exports = {
  getInvoicesByCompany,
  getInvoiceItems
};

async function getInvoicesByCompany(companyId, options) {
  const data = await Invoice.findAndCountAll({
    where: { companyId },
    ...utils.getPaginationValues(options),
    order: [["id", "DESC"]]
  });
  return {
    data: data.rows,
    count: data.count
  };
}

async function getInvoiceItems(invoiceId, companyId, options) {
  const invoice = await Invoice.findOne({
    where: {
      id: invoiceId,
      companyId
    }
  });

  if (!invoice) {
    return {
      data: [],
      count: 0
    };
  }

  const data = await InvoiceItem.findAndCountAll({
    where: {      invoiceId},
    ...utils.getPaginationValues(options),        
    order: [["id", "DESC"]]    
  });

  return {
    data: data.rows,
    count: data.count
  };
}
