require('dotenv').config()

const models = require('./db/models/index');







models.connection.sync().then(() => {
    "DB synchronized";
}); 

/*
models.connection.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
  */