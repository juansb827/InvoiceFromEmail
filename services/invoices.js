require("dotenv").config();

const fs = require("fs"),
  select = require("xpath.js"),
  DOMParser = require("xmldom").DOMParser;

const {
  Invoice,
  InvoiceItem,
  Email,
  Attachment,
  sequelize,
  Sequelize
} = require("../db/models/");
const { Op } = Sequelize;
const { queue } = require("async");

const q = queue((task, callback) => {
  processInvoice(task.fileURI, task.attachment)
    .then(callback)
    .catch(err => {
      console.error("Error processing the invoice", err);
      callback();
    });
}, 2);

const headerFields = [
  {
    fieldName: "code",
    description: "DOC_FACTURA",
    xpath: "//fe:Invoice/cbc:ID"
  },
  {
    fieldName: "uuid",
    description: "Cufe",
    xpath: "//fe:Invoice/cbc:UUID"
  },
  {
    fieldName: "issuer_name",
    description: "EMP_NOMBRE",
    xpath: "//fe:AccountingSupplierParty/fe:Party/cac:PartyName/cbc:Name"
  },
  {
    fieldName: "EMP_DEPARTAMENTO",
    xpath:
      "//fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cbc:Department"
  },
  {
    fieldName: "EMP_SECTOR",
    xpath:
      "//fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cbc:CitySubdivisionName"
  },
  {
    fieldName: "EMP_CIUDAD",
    xpath:
      "//fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cbc:CityName"
  },
  {
    fieldName: "EMP_ZONAPOSTAL",
    xpath:
      "//fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cbc:PostalZone"
  },
  {
    fieldName: "EMP_DIRECCION1",
    xpath:
      "//fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cac:AddressLine/cbc:Line"
  },
  {
    fieldName: "EMP_CODIGO_PAIS",
    xpath:
      "//fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cac:Country/cbc:IdentificationCode"
  }
];

const itemFields = [
  {
    fieldName: "code",
    description: "PRODUCTO",
    xpath: "cbc:ID"
  },
  {
    fieldName: "quantity",
    description: "CANTIDAD",
    xpath: "cbc:InvoicedQuantity"
  },
  {
    fieldName: "price",
    description: "PRECIO",
    xpath: "cbc:LineExtensionAmount"
  },
  {
    fieldName: "description",
    description: "DESCRIPCION",
    xpath: "fe:Item/cbc:Description"
  },
  {
    fieldName: "subtotal",
    description: "SUBTOTAL",
    xpath: "fe:Price/cbc:PriceAmount"
  }
];

processInvoice("Files/face_F0900547176003a6a6278.xml", {
  id: 44,
  emailId: 13
}).then(invoice => {
  console.log(invoice);
});

/**
 *
 * @param attachment - optional, if present, it means the invoice came from an email
 *
 * */
async function processInvoice(fileLocation, attachment) {
  const invoiceStr = await new Promise((resolve, reject) => {
    fs.readFile(fileLocation, "utf8", function(err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });

  const invoiceDom = new DOMParser().parseFromString(invoiceStr);
  const invoice = getInvoiceData(invoiceDom);

  await sequelize.transaction(async t => {
    const savedInvoice = await Invoice.build(invoice.header).save({
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
        { 'processingState': { [Op.ne]: 'DONE'} }, 
        { 'processingState': { [Op.ne]  : null} } 
      ],
      emailId: attachment.emailId
    }
  });

  if (count === 0) { //Email has no pending attachments left
    Email.update({
      processingState : 'DONE'
    },{
      where: { id: attachment.emailId }
    })
  }


}

function getInvoiceData(doc) {
  return {
    header: extractNodeFields(doc, headerFields),
    items: select(doc, "//fe:InvoiceLine").map(itemNode =>
      extractNodeFields(itemNode, itemFields)
    )
  };
}

function extractNodeFields(node, fields) {
  const ans = {};
  fields.forEach(({ fieldName, xpath }) => {
    const child = select(node, xpath)[0];

    if (!child) {
      throw new Error(
        "Field not found NAME:" + fieldName + "   XPATH: " + xpath
      );
    }

    ans[fieldName] = child.textContent;
  });
  return ans;
}
