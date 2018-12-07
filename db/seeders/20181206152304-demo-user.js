'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
   
      return queryInterface.bulkInsert('Users', [
        { id: '1', email: 'email@example.com', createdAt: new Date(), updatedAt: new Date()},
        { id: '2', email: 'email2@example.com', createdAt: new Date(), updatedAt: new Date()}        
      ], {});
    
  },

  down: (queryInterface, Sequelize) => {    
      
      return queryInterface.bulkDelete('Users', null, {});
    
  }
};
