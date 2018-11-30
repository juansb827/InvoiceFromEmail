

const fs = require("fs"),
  select = require("xpath.js"),
  DOMParser = require("xmldom").DOMParser;



/**
 *
 * @param attachment - optional, if present, it means the invoice came from an email
 *
 * */



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



exports.extractData = async (invoiceXMLStr) => {
  /*
  
  const invoiceStr = await new Promise((resolve, reject) => {
    fs.readFile(fileLocation, "utf8", function(err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  }); */

  const invoiceDom = new DOMParser().parseFromString(invoiceXMLStr);
  const invoice = getInvoiceData(invoiceDom);
  return invoice;

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
