const Sequelize = require('sequelize');
const env       = process.env.NODE_ENV || 'development';
const config = require('./../../config/db_config')[env];

const sequelize = new Sequelize(config.url, config);

const models = {
  InvoiceItem: sequelize.import('./InvoiceItem'),
  Invoice: sequelize.import('./Invoice'),
  Email: sequelize.import('./Email'),  
  User: sequelize.import('./User'),
  Company: sequelize.import('./Company'),
  Attachment: sequelize.import('./Attachment')  
};

Object.keys(models).forEach((modelName) => {
  if ('associate' in models[modelName]) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;