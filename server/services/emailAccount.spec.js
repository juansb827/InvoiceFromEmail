var chai = require("chai");
var expect = require("chai").expect;
chai.Assertion.includeStack = true;
const { sequelize, Sequelize } = require("../db/models");

const { EmailAccount } = require("../db/models");

describe("EmailAccount Service", function() {
  const secretKey = "secretKEy";
  const accountConf = {
    userId: 1,
    address: "example@gmail.com",
    provider: "GMAIL",
    authType: "XOAUTH2",
    password: "secretPassword",
    tokenInfo: {
      access_token:
        "SAMLE_TOKEN_ya29.",
      refresh_token: "SAMPLE_REFRESH_TOKEN1/kWT1gk9mpBpYrG",
      expiry_date: 1544391967461
    }
  };

  describe('"createEmailAccount"', function() {
    beforeEach(async function () {
      await EmailAccount.destroy({
        where: {
          userId: accountConf.userId,
          address: accountConf.address
        }
      });
    });


   after(async function () {
        await EmailAccount.destroy({
          where: {
            userId: accountConf.userId,
            address: accountConf.email
          }
        });
        sequelize.close();
      });

    it("should insert into db a new emailAccount", async function() {
      await emailAccount.createEmailAccount(
        accountConf.userId,
        accountConf.address,
        accountConf.provider,
        accountConf.authType,
        secretKey,
        accountConf.password,
        accountConf.tokenInfo
      );

      const found = await EmailAccount.findOne({
        where: {
          userId: accountConf.userId,
          address: accountConf.address
        }
      });
      
      expect(found).to.not.be.null;
      expect(found.address).to.be.equals(accountConf.address);
    });

    it("should encrypt the token and password", async function() {
      
        await emailAccount.createEmailAccount(
            accountConf.userId,
            accountConf.address,
            accountConf.provider,
            accountConf.authType,
            secretKey,
            accountConf.password,
            accountConf.tokenInfo
        );

        const found = await EmailAccount.findOne({
            where: {
              userId: accountConf.userId,
              address: accountConf.address
            }
          });
        
        expect(found.password).length.to.be.greaterThan(accountConf.password.length);
        expect(found.tokenInfo).length.to.be.greaterThan(JSON.stringify(accountConf.tokenInfo).length);       
          

    });
  });

  //TODO: getDecryptedCredentials, it should refresh token if is expired
});


const emailAccount = require("./emailAccount");

async function test() {
  /*
   */
  const accountFound = await emailAccount.getDecryptedCredentials(15, 1, "");
  console.log("FOund", accountFound);
  //console.log("FOund", accountFound.get({plain: true}) );
}
//test();
