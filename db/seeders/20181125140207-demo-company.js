'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
   
      return queryInterface.bulkInsert('Companies', [
        { name: 'Company1', createdAt: new Date(), updatedAt: new Date()},
        { name: 'Company2', createdAt: new Date(), updatedAt: new Date()},
        { name: 'Company3', createdAt: new Date(), updatedAt: new Date()},
        { name: 'Company4', createdAt: new Date(), updatedAt: new Date()},
        { name: 'Company5', createdAt: new Date(), updatedAt: new Date()}
      ], {});
    
  },

  down: (queryInterface, Sequelize) => {    
      
      return queryInterface.bulkDelete('Companies', null, {});
    
  }
};
