const Sequelize = require('sequelize');

var conStr = process.env.DB_CONNECTION_URL;
const sequelize = new Sequelize(conStr,{
  dialectOptions: {
    ssl: true
  }
});

const models = {
  InvoiceItem: sequelize.import('./InvoiceItem'),
  Invoice: sequelize.import('./Invoice'),
  Mail: sequelize.import('./Mail'),  
  User: sequelize.import('./User'),
  Company: sequelize.import('./Company') 
};

Object.keys(models).forEach((modelName) => {
  if ('associate' in models[modelName]) {
    models[modelName].associate(models);
  }
});

models.connection = sequelize;
models.Sequelize = Sequelize;

module.exports = models;