'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.addColumn('Users', 'companyId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Companies', // target Table
        key: 'id', //
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    return queryInterface.addColumn('Emails', 'companyId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Companies', // target Table
        key: 'id', //
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });


  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Users', // name of Source model
      'companyId' // key we want to remove
    );
  }
};
