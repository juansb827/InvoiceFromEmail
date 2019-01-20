const Invoices = require('./invoices');
const fs = require('fs');
 
async function lel() {
  const invoiceStr = await new Promise((resolve, reject) => {
    fs.readFile('Files/face_F0900547176003a6a62782.xml', "utf8", function(err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  }); 
  const ans = Invoices.extractData(invoiceStr);
}  
lel();

