module.exports = class ObjectPool {

    constructor(maxCapacity ) {
        this.pool = []
        this.maxCapacity = maxCapacity;
        this.size = 0;        
        //Waiting for a object t
        this.waitingQ = [];
        this.create = null; //Function that returns a new instance of type T
    }

    /*
    set create(create){
        this.create = create;
        //Promise.resolve(create);
    }
    */
    

    async take() {

        if (this.pool.length !== 0) {
            return this.pool.splice(-1, 1)[0];
        }

        if (this.size < this.maxCapacity) {            
            if (!this.create){
                throw new Error("create property is not set");
            }
            // we have to incresase this counter before calling the async object create()
            // otherwise other calls take() waiting in the eventloop  - will receive a wrong this.size
            this.size++; 
            let instance = null;
            try{
                instance = await this.create();
            }catch(err){
                this.size--;
                throw err;
            }
            
            return instance;
        }

        return new Promise((resolve, reject) => {
            this.waitingQ.push((object) => {
                resolve(object);
            });
        });
    }

    async release(object) {
        if (!object){
            throw new Error('Cannot release a null object, ', object);
            //TODO: also check if object was instantiated by this ObjectPool
        }
        return new Promise((resolve, reject) => {
            process.nextTick(() => {    
                //If there is a consumer waiting for the resource, pass the object to it
                //otherwise  put the resource back in the pool
                if (this.waitingQ.length > 0) {
                    //TODO: use a better queue implementation, to get constant-time dequeueing
                    const task = this.waitingQ.shift();
                    task(object);
    
                }else{
                    this.pool.push(object);
                }
                resolve();           
            });
        })
        
    }

}