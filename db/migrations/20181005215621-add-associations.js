'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn('Users', 'companyId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Companies', // target Table
        key: 'id', //
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });


    await queryInterface.addColumn('Emails', 'companyId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Companies', // target Table
        key: 'id', //
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });


    await queryInterface.addColumn('Invoices', 'companyId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Companies', // target Table
        key: 'id', //
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('Invoices', 'emailId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Emails', // target Table
        key: 'id', //
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('InvoiceItems', 'invoiceId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Invoices', // target Table
        key: 'id', //
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });



  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'Users',
      'companyId'
    )

    await queryInterface.removeColumn(
      'Emails',
      'companyId'
    )

    await queryInterface.removeColumn(
      'Invoices',
      'companyId'
    )

    await queryInterface.removeColumn(
      'Invoices',
      'emailId'
    )

    await queryInterface.removeColumn(
      'InvoiceItems',
      'invoiceId'
    )


  }
};
