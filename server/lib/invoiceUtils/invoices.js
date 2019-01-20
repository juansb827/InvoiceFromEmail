

const fs = require("fs"),
  select = require("xpath.js"),
  { DOMParser, XMLSerializer } = require("xmldom"),
  parser = require('xml2json')

/**
 *
 * @param attachment - optional, if present, it means the invoice came from an email
 *
 * */


const docConfigurations = {
  'COMMON' : {
    headerFields: [
      {
        
        fieldName: "code",
        description: "DOC_FACTURA",
        xpath: "cbc:ID"
      },
      {
        fieldName: "uuid",
        description: "Cufe",
        xpath: "cbc:UUID"
      },
      {
        fieldName: "issuer_name",
        description: "EMP_NOMBRE",
        xpath: "fe:AccountingSupplierParty/fe:Party/cac:PartyName/cbc:Name"
      },
      {
        fieldName: "EMP_DEPARTAMENTO",
        xpath:
          "fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cbc:Department"
      },
      {
        fieldName: "EMP_SECTOR",
        xpath:
          "fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cbc:CitySubdivisionName"
      },
      {
        fieldName: "EMP_CIUDAD",
        xpath:
          "fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cbc:CityName"
      },
      {
        fieldName: "EMP_ZONAPOSTAL",
        xpath:
          "fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cbc:PostalZone"
      },
      {
        fieldName: "EMP_DIRECCION1",
        xpath:
          "fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cac:AddressLine/cbc:Line"
      },
      {
        fieldName: "EMP_CODIGO_PAIS",
        xpath:
          "fe:AccountingSupplierParty/fe:Party/fe:PhysicalLocation/fe:Address/cac:Country/cbc:IdentificationCode"
      }
    ],
    itemFields: [
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
      }, {
        fieldName: 'allowanceCharge',
        xpath: "cac:AllowanceCharge",
        type: 'OBJECT'        
      }
    ]
  },
  'INVOICE': {
    rootName: 'fe:Invoice',
    lineName: 'fe:InvoiceLine',
    headerFields: [
      {
        fieldName: "taxTotal",
        description: "TAX_TOTAL",
        xpath: "fe:TaxTotal",
        type: "LIST"
      }
    ],
    itemFields: []       
  }  
}

const DOCUMENT_TYPES = {
  "INVOICE": "INVOICE",
  "CREDIT_NOTE": "CREDIT_NOTE",
  "DEBIT_NOTE": "DEBIT_NOTE"
}

const DOCUMENT_ROOTS = {
  
  "CREDIT_NOTE": "fe:CreditNote",
  "DEBIT_NOTE": "fe:DebitNote"
}






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

  const docType = getDocType(doc);
  const docConf = docConfigurations[docType];
  const docRoot = docConf.rootName;
  const itemsPath = `//${docRoot}/${docConf.lineName}`;
  const rootNode = select(doc, '/*')[0]
  const header = extractNodeFields(rootNode, docConfigurations.COMMON.headerFields, {
    root: docRoot
  });

  extractNodeFields(doc, docConf.headerFields, {
    root: docRoot,
    targetObject: header
  });  

  const items = select(doc, itemsPath).map(itemNode =>
    extractNodeFields(itemNode, docConfigurations.COMMON.itemFields)
  )

  return {  
    type: docType,
    header,
    items
  };
}

function extractNodeFields(node, fields, options = {}) {
  const serializer = new XMLSerializer()
  
  const ans = options.targetObject || {};
  fields.forEach(fieldConf => {
    const { fieldName, xpath } = fieldConf;
    const matches = select(node, xpath);  
    let value = null;
    if (matches.length === 0 && !fieldConf.optional) {
      throw new Error(
        "Field not found NAME:" + fieldName + "   XPATH: " + xpath
      );
    }

    if (!fieldConf.type || fieldConf.type === 'TEXT') {
      value = matches[0].textContent;    
    } else if (fieldConf.type === 'LIST') {
      value = matches.map(node => {
        const  xmlStr = serializer.serializeToString(node);
        return parser.toJson(xmlStr);        
      });           
    } else if (fieldConf.type === 'OBJECT') {
      const  xmlStr = serializer.serializeToString(matches[0]);
      value = parser.toJson(xmlStr);        
    } 

    ans[fieldName] = value;

   
  });
  return ans;
}

function getFieldValue(parent, fieldConf ){
  
  
   /*
    serializer = new XMLSerializer()
    const str = serializer.serializeToString(child);
    console.log(parser.toJson(str));
    console.log(str);*/


    if (!child) {
      
    }

    
}
/**
 * @description determines the type of the document
 * @param docRoot XMLDOM
 * @returns DOCUMENT_TYPES or null if the document doesn't match any type
 */
function getDocType(docRoot) {
  const rootNode = select(docRoot, '/*')[0];
  const rootName = rootNode && rootNode.nodeName 
  if (!rootName) return null;
  for (let key in docConfigurations) {
    if (key === 'COMMON') continue;
    if (docConfigurations[key].rootName === rootName) {
      return key;
    }
  }
  return null;  
}

