require('dotenv').config()

module.exports = {
  "development": {
    "url": process.env.DB_CONNECTION_URL,
    "dialect": "postgres",
    "ssl": true  ,
    dialectOptions: {
      ssl: true
    }  
  }
}
