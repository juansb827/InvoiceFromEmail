const bluebird = require("bluebird");
const redis = require("redis");

bluebird.promisifyAll(redis);


module.exports = (() => {
  
    client = redis.createClient({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,  
      password: process.env.REDIS_PASSWORD || null, 
      connect_timeout: 2000,    
      retry_strategy: retry_strategy
    });
   
  
  return client;
});


/** Taken from npm redis docs */
function retry_strategy(options) {
  console.log('Redis retrying...');    
  if (options.error && options.error.code === "ECONNREFUSED") {
    // End reconnecting on a specific error and flush all commands with
    // a individual error
    return new Error("The server refused the connection");
  }  
  if (options.total_retry_time > 1000 * 10 ) {
    // End reconnecting after a specific timeout and flush all commands
    // with a individual error
    return new Error("Retry time exhausted");
  }
  if (options.attempt > 0) {
    // End reconnecting with built in error
    return new Error("Retry attemps exhausted");
  }
  // reconnect after
  return Math.min(options.attempt * 100, 3000);
}
