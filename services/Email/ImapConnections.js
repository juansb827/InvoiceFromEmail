const logger = require('../../utils/logger');
const ObjectPool = require('../../utils/ObjectPool');
const ImapHelper = require('./ImapHelper');

const MAXIMUM_GLOBAL_CONNECTIONS = 10; //
const sampleMailConf = {
    user: 'juansb827@gmail.com',
    password: process.env.PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    maxConnections: 5
};


module.exports = class ImapConnections{

    
    constructor(){
        this.potentialConnections = 0;
        this.connectionPools = {};
    }

    addNewPool(poolId, poolConf) {        
        
        const pool = new ObjectPool(poolConf.maxConnections);     
        
        pool.create = async () => { 
            const conn = await ImapHelper.getConnection(poolConf);
            conn.poolId = poolId; 
            await conn.openBoxAsync('INBOX', true);
            return conn; 
        }

        if (this.potentialConnections + poolConf.maxConnections > MAXIMUM_GLOBAL_CONNECTIONS ){            
            throw new Error(
                `Cannot create a Pool with maxConnections=${poolConf.maxConnections}, 
                 potentialConnections=${this.potentialConnections} and MAX=${MAXIMUM_GLOBAL_CONNECTIONS}`);
        }
        
        this.potentialConnections+= poolConf.maxConnections;
        this.connectionPools[poolId] = pool;        
    }

    async removePool(poolId){
        throw new Error("Unimplemented");
        //TODO implementMethods :
            //await this.connectionPools[poolId].destroyAll();
        delete this.connectionPools[poolId]
    }

    async getConnection(poolId) {        
        poolId = 'juansb827@gmail.com';
        let pool = this.connectionPools[poolId];        
        if (!pool){
            this.addNewPool(poolId, sampleMailConf);
            pool = this.connectionPools[poolId]
        }
        const conn = pool.take();
        return conn;
    }

    async releaseConnection(connection) {
        if(!connection){
            throw new Error('Connection cannot be null');
        }
        const poolId = connection.poolId;
        const pool = this.connectionPools[poolId];
        return pool.release(connection);
    }

}