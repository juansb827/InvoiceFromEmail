const { EventEmitter } = require('events');
//const process = require('process');
 function test() {
    return new Promise((resolve, reject) => {
       console.log("43");
       resolve(44);
    })

}

console.log("1");
test()
.then((res) => {
    console.log(res);
    
    
    return 4
})
.then((another)=>{
    console.log('another', another);
}).catch(err => {
    console.log("Caught here", err);
});
console.log(2);
