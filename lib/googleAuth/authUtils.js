const { google } = require("googleapis");

const SCOPES = ["https://mail.google.com/."];

module.exports = {
  createoAuth2Client,
  generateAuthUrl,
  getToken
};

function createoAuth2Client(clientId, clientSecret, redirectUrl) {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
}

function generateAuthUrl(oAuth2Client) {
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
}

function getToken(oAuth2Client, code) {
  return new Promise((resolve, reject) => {
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        return reject(err);
      }
      resolve(token);
    });
  });
}
