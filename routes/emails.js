const router = require("express").Router();
const emailService = require("./../services/mails");

router.get("/", async (req, res, next) => {

    throw new Error('NEW ERROR');
   // const { accountId } = req.query;
    //const companyId;
  
  
  });

module.exports = router;  
  