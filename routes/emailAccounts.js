const router = require("express").Router();
const emailAccount = require("./../services/emailAccount");
const parameterStore = require("../lib/parameterStore");

router.get("/authUrl", async (req, res, next) => {
  try {
    const { emailAddress, provider } = req.query;

    if (!emailAddress || !provider) {
      throw new AppError(
        'params "emailAddress" and "provider" are missing or invalid',
        400,
        "InvalidInput"
      );
    }
    const authUrl = await emailAccount.generateAuthUrl(emailAddress, provider);
    res.status(200).send({
      redirectURL: authUrl
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const contextObject = {
      accountData: req.body,      
    };    
    contextObject.accountData.userId = req.userData.id;

    const newAccount = await emailAccount.testConnectionAndCreate(
      contextObject
    );
    
    res.status(200).send(newAccount);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
