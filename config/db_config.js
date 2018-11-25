require('dotenv').config()

module.exports = {
  "development": {
    "url": process.env.DB_CONNECTION_URL,
    "dialect": "postgres",
    "ssl": true  ,
    // pool configuration used to pool database connections
    "pool": {
    "max": 5,
    "idle": 30000,
    "acquire": 10000,
  },
    dialectOptions: {
      ssl: true
    }  
  }
}
