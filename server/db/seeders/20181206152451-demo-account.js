'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('EmailAccounts', [
      { id: '1', address: 'email@example.com', createdAt: new Date(), updatedAt: new Date()},
      { id: '2', address: 'email2@example.com', createdAt: new Date(), updatedAt: new Date()}        
    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('EmailAccounts', null, {});
  }
};
