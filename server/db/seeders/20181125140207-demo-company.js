'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
   
      return queryInterface.bulkInsert('Companies', [
        { id: '1', name: 'Company1', createdAt: new Date(), updatedAt: new Date()},
        { id: '2', name: 'Company2', createdAt: new Date(), updatedAt: new Date()},
        { id: '3', name: 'Company3', createdAt: new Date(), updatedAt: new Date()},
        { id: '4', name: 'Company4', createdAt: new Date(), updatedAt: new Date()},
        { id: '5', name: 'Company5', createdAt: new Date(), updatedAt: new Date()}
      ], {});
    
  },

  down: (queryInterface, Sequelize) => {    
      
      return queryInterface.bulkDelete('Companies', null, {});
    
  }
};
