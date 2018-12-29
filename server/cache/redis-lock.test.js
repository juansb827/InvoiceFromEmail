require("dotenv").config({ path: "./serverless.env" });
const redis = require('./redis')();

redis.on("error", function (err) {
    console.log("Error " + err);
});

redis.on("connect",  async (ev) => {
    console.log("Lock");
    await lock();
});

async function lock() {
    let canAdd = await redis
      .setAsync(`users:cuenta1`, 'lol', 'NX', 'EX', 3);
      console.log('Can add', canAdd);
      canAdd = await redis
      .setAsync(`users:cuenta1`, 'jkl', 'NX', 'EX', 3);
      console.log('Can add', canAdd);
      canAdd = await redis
      .setAsync(`users:cuenta1`, 'jkl', 'XX', 'EX', 9);
      console.log('Can add', canAdd);
      canAdd = await redis.ttl(`users:cuenta1`);
      await redis.ttl(`users:cuenta1`, (err, cb) => {
        console.log('cb value', cb);
      });
      setTimeout(async ()=>{
        canAdd = await redis
      .setAsync(`users:cuenta1`, 'jkl', 'NX', 'EX', 3);  
      console.log('Can add', canAdd);
      }, 3000)
}