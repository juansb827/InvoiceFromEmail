const logger = require("../../utils/logger");
const { startEmailWorker } = require("./EmailWorker");
const ImapHelper = require("./ImapHelper/ImapHelper");
const emailAccountService = require("./../emailAccount");
let createClient = require("./../../cache/redis");
let redis = null;

const LOCK_DURATION = 20;


/**
 * There can only be a worker of the same email account at a given moment
 * because the max # of connections to an email account is very low */
module.exports.attempToStartWorker = async (
  emailAccountId,
  userId,
  secretKey
) => {
  getRedisConnection();
  if (!(await canStart(emailAccountId))) {
    logger.info("Worker already running for :" + emailAccountId);
    return;
  }

  const renewInterval = setInterval(async () => {
    logger.info(`Readquiring lock for '${emailAccountId}'`);
    await renewLock(emailAccountId);
  }, 15000);

  try {
    const accountInfo = await emailAccountService.getDecryptedCredentials(
      15,
      1,
      "TEST_SECRET_KEY"
    );

    logger.info(
      `Started worker for account : ${accountInfo.id}:${accountInfo.address} `
    );

    const connection = await ImapHelper.getConnection({
      user: accountInfo.address,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      xoauth2: accountInfo.tokenInfo.xoauth2_token
    });
    await connection.openBoxAsync("INBOX", true);
    await startEmailWorker(accountInfo.address, connection);
    logger.info(
      `Ended worker for account: ${accountInfo.id}:${accountInfo.address} `
    );
    await connection.end();
  } catch (err) {
    throw err;
  } finally {
    clearInterval(renewInterval);
    logger.info(`Releasing lock for '${emailAccountId}'`);
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

async function canStart(emailAccount) {
  if (!emailAccount) {
    throw new Error("Email account can not be null");
  }
  // emailWorkers:juansb827@gmail.com
  let canStart = await redis.setAsync(
    `emailWorkers:${emailAccount}`,
    425235,
    "NX",
    "EX",
    LOCK_DURATION
  );
  console.log("canStart", canStart);
  return canStart;
}

async function renewLock(emailAccount) {
  return await redis.setAsync(
    `emailWorkers:${emailAccount}`,
    "lol",
    "XX",
    "EX",
    LOCK_DURATION
  );
}

async function releaseLock(emailAccount) {
  return await redis.delAsync(`emailWorkers:${emailAccount}`);
}
