const { AppError } = require("errorManagement");
const googleAuth = require("googleAuth");
const imapHelper = require("imapHelper");
const parameterStore = require("../parameterStore");
const xoauth2 = require('xoauth2');

module.exports.testAccountConnection = async (
  address,
  provider,
  authType,
  password,
  verificationCode
) => {

  const confParameters = await parameterStore.getParameters();

  switch (provider) {
    case "GMAIL":
      const providerParams = {
        client_id: confParameters.gapi_client_id,
        client_secret: confParameters.gapi_client_secret,
        verificationCode
      };
      return await testGmail(address, authType, providerParams);
    default:
      throw new Error("Unsupported email provider");
  }
};

async function testGmail(address, authType, providerParams) {
  const client = googleAuth.createoAuth2Client(
    providerParams.client_id,
    providerParams.client_secret,
    "urn:ietf:wg:oauth:2.0:oob"
  );

  let token = null;
  try {
    token = await googleAuth.getToken(client, providerParams.verificationCode);
  } catch (error) {
    let message = error.message;
    if (error.code) {
      message = JSON.stringify(error.response.data);
    }

    throw new AppError(
      "Could not retrieve the token using the given verification code, " +
        message,
      400,
      "InvalidInput"
    );
  }

  var xoauth2gen = xoauth2.createXOAuth2Generator({
    user: address
  });
  const xoauth2Token = xoauth2gen.buildXOAuth2Token(token.access_token);
  token.access_token = xoauth2Token;

  const connectionConf = imapHelper.getConfiguration(
    address,
    "GMAIL",
    authType,
    xoauth2Token
  );
  await testConnection(connectionConf);

  return token;
}

async function testConnection(connectionConf) {
  let connection;
  try {
    connection = await imapHelper.getConnection(connectionConf);
  } catch (error) {
    throw new AppError(
      "Could not connect to the email account " + error.message,
      500,
      "UnknownError"
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
