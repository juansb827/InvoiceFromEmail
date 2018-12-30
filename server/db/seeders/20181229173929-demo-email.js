'use strict';
const crypto = require('crypto');
const emails = [];            

for (let i=0; i<1000; i++) {
  const companyId = (i % 5) + 1;   
  const random = crypto.randomBytes(8).toString("hex");
  const mail = { 
    from: `from${random}`,
    subject: `subject${random}`,
    emailAccount: `account${companyId}@mail.com`,
    processingState: 'DONE', companyId, createdAt: new Date(), updatedAt: new Date()}
  emails.push(mail);
}

module.exports = {

  up: (queryInterface, Sequelize) => {
    
      return queryInterface.bulkInsert('Emails', emails, {});
    
  },

  down: (queryInterface, Sequelize) => {    
      
      return queryInterface.bulkDelete('Emails', null, {});
    
  }
};
