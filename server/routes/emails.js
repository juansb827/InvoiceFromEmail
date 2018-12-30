const { query } = require("express-validator/check");
const { schemaValidator } = require("expressMiddlewares");
const router = require("express").Router();
const emailService = require("./../services/mails");

router.get("/", async (req, res, next) => {
  try {    
    const companyId = req.userData.companyId;
    const { page_number, page_size } = req.query;
    const paginated = await emailService.getEmailsByCompany(companyId, {
      pageNumber: page_number,
      pageSize: page_size
    });
    res.set({
      'Pagination-Count': paginated.count
    })
    res.send(paginated.data);
  } catch (err) {
    next(err);
  }  
});

router.get(
  "/search",
  schemaValidator([
    query("sender").isEmail(),
    query("startingDate").isISO8601()
  ]),
  async (req, res, next) => {
    try {
      const emailAccountId = req.query.emailAccountId;
      const startingDate = new Date(req.query.startingDate);
      const sender = req.query.sender;

      const ids = await emailService.searchEmails(
        emailAccountId,
        req.userData.id,
        req.userData.companyId,
        {
          startingDate,
          sender: sender
        }
      );

      res.send({
        foundEmails: ids.length
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
