const router = require("express").Router();
const emailAccount = require("./../services/emailAccount");
const { query } = require("express-validator/check");
const { schemaValidator } = require("expressMiddlewares");

router.get(
  "/authUrl",
  schemaValidator(
  [query("emailAddress").trim().isEmail(), 
   query("provider").trim().exists({ checkNull: true, checkFalsy: true })]),
  async (req, res, next) => {
    try {
      const { emailAddress, provider } = req.query;

      const authUrl = await emailAccount.generateAuthUrl(
        emailAddress,
        provider
      );
      res.status(200).send({
        redirectUrl: authUrl
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/", async (req, res, next) => {
  try {
    const contextObject = {
      accountData: req.body
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

router.get("/", async (req, res, next) => {
  try {
    const userId = req.userData.id;
    const { page_number, page_size } = req.query;

    const paginated = await emailAccount.getByUserId(userId, {
      pageNumber: page_number,
      pageSize: page_size
    });

    res.set({
      "Pagination-Count": paginated.count
    });

    res.send(paginated.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
