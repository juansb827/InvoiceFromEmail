require('dotenv').config()
module.exports = {
  "development": {
    "url": process.env.DB_CONNECTION_URL,
    "dialect": "postgres",
    "ssl": true  ,
    // pool configuration used to pool database connections
    "pool": {
    "max": process.env.DB_MAX_CONNECTIONS,
    "idle": process.env.DB_IDLE_TIMEOUT,
    "acquire": process.env.DB_ACQUIRE_TIMEOUT,
  },
    dialectOptions: {
      ssl: true
    }  
  }
}
