const logger = require("../../utils/logger");
const { startEmailWorker } = require("./EmailWorker");
const imapHelper = require("../../lib/imapHelper");
const emailAccountService = require("./../emailAccount");
let createClient = require("./../../cache/redis");
let redis = null;

const LOCK_DURATION = 20;


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

  if (!(await canStart(emailAccountId))) {
    logger.info(`Worker already running for: '${emailAccountId}:${emailAddress}'`);
    return;
  }

  const renewInterval = setInterval(async () => {
    logger.info(`Readquiring lock for '${emailAccountId}:${emailAddress}'`);
    await renewLock(emailAccountId);
  }, 15000);

  try {
    const accountInfo = await emailAccountService.getDecryptedCredentials(
      emailAccountId,
      userId,
      secretKey
    );

    logger.info(
      `Started worker for account : '${emailAccountId}:${emailAddress}' `
    );

    const connection = await imapHelper.getConnection({
      user: accountInfo.address,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      xoauth2: accountInfo.tokenInfo.access_token
    });

    await connection.openBoxAsync("INBOX", true);
    await startEmailWorker(accountInfo.address, connection);
    logger.info(
      `Ended worker for account: '${emailAccountId}:${emailAddress}'`
    );
    await connection.end();
  } catch (err) {
    throw err;
  } finally {
    clearInterval(renewInterval);
    logger.info(`Releasing lock for '${emailAccountId}:${emailAddress}'`);
    await releaseLock(emailAccountId);
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
  console.log("canStart", canStart);
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
