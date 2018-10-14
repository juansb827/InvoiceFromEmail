const ObjectPool = require('./ObjectPool');

const pool = new ObjectPool(1);
pool.create = (() => {
    console.log("Requested an instance");
    return new Promise((resolve) => {
        
        setTimeout( ()=>{
            resolve("4");
        } , 200);
    });
});

console.log("Pool max capacity" + pool.maxCapacity);
console.log("Pool size" + pool.size);

pool.take().then((instance) => {    
    console.log("Got instance1", instance);
    setTimeout(()=>{
        console.log("Releasing1");
        pool.release(instance);
    },1000)
    
    
    
});

pool.take().then((instance) => {
    console.log("Got instance2", instance);    
});




