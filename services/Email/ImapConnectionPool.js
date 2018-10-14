const MAXIMUM_GLOBAL_CONNECTIONS = 10; //
const sampleMailConf = {
    user: 'juansb827@gmail.com',
    password: process.env.PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    maxConnections: 5
};

module.exports = class ImapConnectionPool{

    
    connectionPools = {
        'juansb827@gmail.com': {pool:[], size: 0, maxSize: 3 }
    }

    async getConnection(accountId) {
        const poolInfo = this.connectionPools["juansb827@gmail.com"];
        const pool = poolInfo.pool;

        //Takes out a connection from the pool
        if ( poolInfo.pool.length !== 0){            
            return pool.slice(-1, 1)[0]; //removes last item from the pool;            
        }

        if 



        const conf = sampleMailConf;

        const connection = await EmailHelper.getConnection(sampleMailConf);
    
       
        await anotherCon.openBoxAsync('INBOX', true);
    

    }

}