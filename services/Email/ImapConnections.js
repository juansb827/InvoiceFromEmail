const logger = require('../../utils/logger');
const ObjectPool = require('../../utils/ObjectPool');
const AppError = require('../../utils/CustomErrors').AppError;
const ImapHelper = require('./ImapHelper/ImapHelper');

const MAXIMUM_GLOBAL_CONNECTIONS = 10; //maximum number of connections across all pools
const sampleMailConf = {
    user: 'juansb827@gmail.com',
    xoauth2: 'dXN',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    maxConnections: 5
};


module.exports =new (class ImapConnections {


    constructor() {
        this.currentConnections = 0;
        this.connectionPools = {};
    }

    addNewPool(poolId, poolConf) {

        const safePoolConf = {// conf without password 
            ...poolConf,
            password: null,
        }

        logger.info('ConnectionPool - Creating new Connection Pool', {
            poolConf: safePoolConf,
        });

        const pool = new ObjectPool(poolConf.maxConnections);

        pool.create =  async () =>  {

            if (this.currentConnections == MAXIMUM_GLOBAL_CONNECTIONS) {
                throw new AppError('ConnectionPool - Max Potential Connections Reached', {
                    currentConnections: this.currentConnections,
                    maxGlobalConnections: MAXIMUM_GLOBAL_CONNECTIONS,
                    poolConf: safePoolConf
                });
            }

            try {
                const conn = await ImapHelper.getConnection(poolConf);
                conn.poolId = poolId;
                await conn.openBoxAsync('INBOX', true);
                this.currentConnections++;
                logger.info('ConnectionPool - Sucessfully Created New Connection', { poolConf: safePoolConf });
                return conn;
            } catch (error) {                               
                throw new AppError('ConnectionPool - Error creating connection', {                    
                    poolConf: safePoolConf
                }, error);                

            }

        }



        this.potentialConnections += poolConf.maxConnections;
        this.connectionPools[poolId] = pool;

        logger.info('ConnectionPool - Created new Pool', { poolConf: safePoolConf });
    }

    async removePool(poolId) {
        throw new Error("Unimplemented");
        //TODO implementMethods :
        //await this.connectionPools[poolId].destroyAll();
        delete this.connectionPools[poolId]
    }

    async getConnection(poolId) {
        console.log('Gett Con');
        poolId = 'juansb827@gmail.com';
        let pool = this.connectionPools[poolId];
        if (!pool) {
            this.addNewPool(poolId, sampleMailConf);
            pool = this.connectionPools[poolId]
        }
        const conn = await pool.take();
        return conn;
    }

    async releaseConnection(connection) {
        console.log('Release Con');
        if (!connection) {
            throw new Error('Connection cannot be null');
        }
        const poolId = connection.poolId;
        const pool = this.connectionPools[poolId];
        return await pool.release(connection);
    }

})();