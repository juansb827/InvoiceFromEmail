const router = require("express").Router();
const authService = require('../services/authentication');

module.exports = router;

router.post("/register", async (req, res, next) => {

    try {
        const registerInfo = await authService.registerUser(req.body);      
        res.send(registerInfo);
    } catch (err) {
        next(err);
    }   

});

router.get('/login', async (req, res, next) => {

  try {

    const userInfo = await authService.authenticateUser(req.body);
    res.send(userInfo);

  } catch (err) {
    next(err);
  }

});
