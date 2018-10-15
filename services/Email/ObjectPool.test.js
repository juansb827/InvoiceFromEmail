const ObjectPool = require('./ObjectPool');

const pool = new ObjectPool(3);
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

for(let i=0; i<10; i++){
    pool.take().then((instance) => {    
        console.log("Got instance "+i, instance);
        setTimeout(()=>{
            console.log("Releasing "+i);
            pool.release(instance);
        },1000) ;    
        
    });    
}





