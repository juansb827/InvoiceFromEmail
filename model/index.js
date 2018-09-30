const Sequelize = require('sequelize');

const sequelize = new Sequelize('postgres://shomaljrmgmoqe:d08708ee331d5068022e5a1adf797c2ed5873bd102cd83780f92debbcfc716b7@ec2-54-163-229-212.compute-1.amazonaws.com:5432/dch3poe959oooc',{
  dialectOptions: {
    ssl: true
  }
});

const models = {
  User: sequelize.import('./user'),
  Channel: sequelize.import('./channel'),
  Message: sequelize.import('./message'),
  Team: sequelize.import('./team'),
};

Object.keys(models).forEach((modelName) => {
  if ('associate' in models[modelName]) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export default models;