const bluebird = require("bluebird");
const redis = require("redis");

bluebird.promisifyAll(redis);

let client = null;
module.exports = (() => {
  if (!client) {
    client = redis.createClient({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      retry_strategy: retry_strategy
    });
    console.log("Created new Redis Connection");
  }else{
    console.log("Using existing Redis Connection");
  }
  
  return client;
})();


/** Taken from npm redis docs */
function retry_strategy(options) {
  console.log('Redis connecting...');    
  if (false && options.error && options.error.code === "ECONNREFUSED") {
    // End reconnecting on a specific error and flush all commands with
    // a individual error
    return new Error("The server refused the connection");
  }
  if (options.total_retry_time > 1000 * 60 * 60) {
    // End reconnecting after a specific timeout and flush all commands
    // with a individual error
    return new Error("Retry time exhausted");
  }
  if (options.attempt > 10) {
    // End reconnecting with built in error
    return new Error("Retry attemps exhausted");
  }
  // reconnect after
  return Math.min(options.attempt * 100, 3000);
}
