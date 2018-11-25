const Invoices = require('./invoices');

Invoices.processInvoice("Files/face_F0900547176003a6a62782.xml", 3, {
    id: 12,
    emailId: 3  
  }).then(invoice => {
    console.log(invoice);
  }).catch(err => {
      console.log('err', err);
  });