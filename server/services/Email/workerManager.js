const logger = require("../../utils/logger");
const { startEmailWorker } = require("./EmailWorker");
const imapHelper = require("../../lib/imapHelper");
const emailAccountService = require("./../emailAccount");
let createClient = require("./../../cache/redis");
const appUtils = require('../../lib/appUtils');
let redis = null;

const LOCK_DURATION = 20;
const SQS_PENDING_EMAIL_QUEUE_URL = process.env.SQS_PENDING_EMAIL_QUEUE_URL;

/**
 * There can only be a worker of the same email account at a given moment
 * because the max # of connections to an email account is very low */
module.exports.attempToStartWorker = async (
  emailAddress,
  emailAccountId,
  userId,
  secretKey
) => {

  
  getRedisConnection();
  logger.info(`Adquiring lock for '${emailAccountId}:${emailAddress}'`);
  if (!(await canStart(emailAccountId))) {
    logger.info(`Cannot lock, worker already running for: '${emailAccountId}:${emailAddress}'`);
    return;
  }

  const renewInterval = setInterval(async () => {
    logger.info(`Readquiring lock for '${emailAccountId}:${emailAddress}'`);
    const couldRenew = await renewLock(emailAccountId);
    if (!couldRenew) {
      throw new Error(`Could not readquire lock for '${emailAccountId}:${emailAddress}`);
    }
  }, 15000);

  try {
    const accountInfo = await emailAccountService.getDecryptedCredentials(
      emailAccountId,
      userId,
      secretKey
    );

   

    const connectionConf = 
      imapHelper.getConfiguration(accountInfo.address, 
        accountInfo.provider, accountInfo.authType, accountInfo.tokenInfo.access_token );
        
    const connection = await imapHelper.getConnection(connectionConf);

    await connection.openBoxAsync("INBOX", true);
    logger.info(
      `Started worker for account : '${emailAccountId}:${emailAddress}' `
    );
    //Worker is limited to process only upto 100 emails per run
    const pendingEmails = await startEmailWorker(accountInfo.address, connection);
    
    logger.info(
      `Ended worker for account: '${emailAccountId}:${emailAddress}', pendingEmails:${pendingEmails}`
    );

    clearInterval(renewInterval);
    logger.info(`Releasing lock for '${emailAccountId}:${emailAddress}'`);
    await releaseLock(emailAccountId);
    logger.info(`Released lock for '${emailAccountId}:${emailAddress}'`);
    
    if (pendingEmails) {
      logger.info(`Pending Emails, scheduling another run`);
      await appUtils.putOnPendingEmailQ(accountInfo.address, userId, emailAccountId, SQS_PENDING_EMAIL_QUEUE_URL)    
    }
    
    await connection.end();
  } catch (err) {
    clearInterval(renewInterval);
    logger.info(`Releasing lock for '${emailAccountId}:${emailAddress}'`);
    await releaseLock(emailAccountId);
    logger.info(`Released lock for '${emailAccountId}:${emailAddress}'`);
    throw err;
  } 
    
  
};

function getRedisConnection() {
  if (!redis) {
    redis = createClient();
    redis.once("end", function(err) {
      console.log("Redis Connection closed");
      redis = null;
    });
  }
}

async function canStart(lockId) {
  if (!lockId) {
    throw new Error("Email account can not be null");
  }
  // emailWorkers:juansb827@gmail.com
  let canStart = await redis.setAsync(
    `emailWorkers:${lockId}`,
    'email worker lock',
    "NX",
    "EX",
    LOCK_DURATION
  );  
  return canStart;
}

async function renewLock(lockId) {
  return await redis.setAsync(
    `emailWorkers:${lockId}`,
    'email worker lock',
    "XX",
    "EX",
    LOCK_DURATION
  );
}

async function releaseLock(lockId) {
  return await redis.delAsync(`emailWorkers:${lockId}`);
}
