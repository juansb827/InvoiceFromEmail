const { query } = require("express-validator/check");
const { schemaValidator } = require("expressMiddlewares");
const router = require("express").Router();
const emailService = require("./../services/mails");
const moment = require('moment');
const { AppError } = require("errorManagement");

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
const MAX_DATE_DIFF = 30;
router.get(
  "/search",
  schemaValidator([
    query("sender").optional({nullable: true, checkFalsy: true}).isEmail(),
    query("startingDate").isISO8601(),
    query("endingDate").isISO8601(),
    query("emailAccountId").isNumeric()    
  ]),
  async (req, res, next) => {
    try {
      const emailAccountId = req.query.emailAccountId;
      const startingDate = moment.utc(req.query.startingDate).startOf('day');
      const endingDate = moment.utc(req.query.endingDate).startOf('day');
      endingDate.add(1, 'days');
      const diff = endingDate.diff(startingDate.startOf('day'), 'days')
      if ((diff -1) > MAX_DATE_DIFF  ) {
        throw new AppError(`Las diferencia entre las fechas no puede ser mayor a ${MAX_DATE_DIFF} dias`, 400, "InvalidInput")
      }
      const sender = req.query.sender;

      const ids = await emailService.searchEmails(
        emailAccountId,
        req.userData.id,
        req.userData.companyId,
        {
          startingDate,
          endingDate,
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
