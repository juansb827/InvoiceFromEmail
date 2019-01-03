const router = require("express").Router();
const invoiceService = require("./../services/invoices");

router.get("/", async (req, res, next) => {
  try {
    const companyId = req.userData.companyId;
    const { page_number, page_size } = req.query;
    const paginated = await invoiceService.getInvoicesByCompany(companyId, {
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

router.get("/:id/items", async (req, res, next) => {
    try {
      const companyId = req.userData.companyId;
      const invoiceId = req.params.id;
      const { page_number, page_size } = req.query;
      const paginated = await invoiceService.getInvoiceItems(
          invoiceId, companyId, {
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
