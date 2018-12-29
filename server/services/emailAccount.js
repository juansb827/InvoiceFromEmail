"use strict";
const xoauth2 = require("xoauth2");
const { sequelize, Sequelize } = require("../db/models");
const Op = Sequelize.Op;
const googleAuth = require("googleAuth");
const { AppError } = require("errorManagement");

const { EmailAccount } = require("../db/models");

const emailUtils = require('../lib/emailAccountUtils');
const parameterStore = require("../lib/parameterStore");
module.exports = {
  createEmailAccount,
  getDecryptedCredentials,
  testConnectionAndCreate,
  generateAuthUrl
};

async function createEmailAccount(
  userId,
  address,
  provider,
  authMethod,
  secretKey,
  password,
  tokenInfo
) {
  switch (authMethod) {
    case "PASSWORD":
      if (!password) {
        throw new Error(
          "Password is mandatory when PASSWORD authMethod is used"
        );
      }
      break;
    case "XOAUTH2":
      if (!tokenInfo) {
        throw new Error(
          "TokenInfo is mandatory when PASSWORD auth method is used"
        );
      }
      if (
        !tokenInfo.access_token ||
        !tokenInfo.refresh_token ||
        !tokenInfo.expiry_date
      ) {
        throw new Error("Invalid Token Structure");
      }
      break;
  }

  const newAccount = await EmailAccount.create({
    address,
    provider,
    authMethod,
    password: sequelize.fn("PGP_SYM_ENCRYPT", password, secretKey),
    tokenInfo: sequelize.fn(
      "PGP_SYM_ENCRYPT",
      JSON.stringify(tokenInfo),
      secretKey
    ),
    userId
  });
  return newAccount.get({ simple: true });
}

async function getDecryptedCredentials(id, userId, secretKey) {
  const accountSettings = await EmailAccount.findOne({
    attributes: {
      include: [
        [
          sequelize.fn(
            "PGP_SYM_DECRYPT",
            sequelize.cast(sequelize.col("password"), "bytea"),
            secretKey
          ),
          "password"
        ],
        [
          sequelize.fn(
            "PGP_SYM_DECRYPT",
            sequelize.cast(sequelize.col("tokenInfo"), "bytea"),
            secretKey
          ),
          "tokenInfo"
        ]
      ]
    },
    where: { id, userId }
  });
  if (!accountSettings) {
    throw new Error(`No account settings for id:${id}, userId:${userId}`);
  }
  if (accountSettings.authMethod === "XOAUTH2") {
    const currentTokenInfo = JSON.parse(accountSettings.tokenInfo);

    const newToken = await updateExpiredToken(
      accountSettings.address,
      currentTokenInfo
    );

    if (currentTokenInfo.expiry_date !== newToken.expiry_date) {
      currentTokenInfo.access_token = newToken.access_token;
      currentTokenInfo.expiry_date = newToken.expiry_date;
      accountSettings.tokenInfo = sequelize.fn(
        "PGP_SYM_ENCRYPT",
        JSON.stringify(currentTokenInfo),
        secretKey
      );
      await accountSettings.save();

      console.log("Token expired, requested a new one");
    } else {
      console.log("Token still valid, Using existing token");
    }
    accountSettings.tokenInfo = currentTokenInfo;
  }
  return accountSettings.get({ simple: true });
}

/**
 * Checks
 */
async function testConnectionAndCreate(ctx) {
  
  const {
    userId,
    address,
    provider,
    authType,
    password,
    verificationCode
  } = ctx.accountData;

  const confParameters = await parameterStore.getParameters();
  
  const token = 
    await emailUtils.testAccountConnection(address, provider, authType, password, verificationCode); 

  const newAccount = await createEmailAccount(
    userId,
    address,
    provider,
    authType,
    confParameters.pg_encrypt_password,
    password,
    token
  );

  delete newAccount.password;
  delete newAccount.tokenInfo;
  return newAccount;
}
/**
 *  If tokenInfo.xoauth2_token is expired, fetches a new token and saves it into the db.
 */
async function updateExpiredToken(user, tokenInfo) {
  const confParameters = await parameterStore.getParameters();
  
  const expired = tokenInfo.expiry_date <= Date.now();
  if (!expired) return tokenInfo;

  const xoauth2gen = xoauth2.createXOAuth2Generator({
    user: user,
    clientId: confParameters.gapi_client_id,
    clientSecret: confParameters.gapi_client_secret,
    refreshToken: tokenInfo.refresh_token
  });

  const new_xoauth2 = await new Promise((resolve, reject) => {
    xoauth2gen.getToken((err, token) => {
      if (err) {
        return reject(err);
      }
      resolve(token);
    });
  });

  return {
    access_token: new_xoauth2,
    expiry_date: xoauth2gen.timeout
  };
}

async function generateAuthUrl(emailAddress, provider) {
  /*
  const queryParams = new URLSearchParams({
    emailAddress,
    provider
  }); */

  //endoint where google servers will send the verication code
  //redirectURL = `${process.env.API_ENDPOINT}${req.baseUrl}/registerAccount?${queryParams.toString()}`
  switch (provider) {
    case "GMAIL": {
      const confParameters = await parameterStore.getParameters();

      const client = googleAuth.createoAuth2Client(
        confParameters.gapi_client_id,
        confParameters.gapi_client_secret,
        "urn:ietf:wg:oauth:2.0:oob"
      );
      return googleAuth.generateAuthUrl(client);
    }
    default:
      throw new AppError("Unsupported email provider", 400, "InvalidInput");
  }
}
