require("dotenv").config();

const crypto = require("crypto");
const cors = require('cors');
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const authService = require('./services/authentication');

require("./lib/parameterStore").init(
  ["gapi_client_id", "gapi_client_secret", "pg_encrypt_password", 'app_secret'],
  60 * 5
);
const { errorHandler, AppError } = require("errorManagement");
const logger = require("logger");

const app = express();
const routes = require("./routes");

app.use(cors({  
    exposedHeaders: ['Pagination-Count','Pagination-Page', 'Pagination-Limit' ]    
}));

app.use(function requestId(req, res, next) {
  req.transactionId = crypto.randomBytes(16).toString("hex");
  next();
});

morgan.token("id", function(req) {
  return req.transactionId;
});

app.use(
  morgan(
    '--> :id [:date] :remote-addr :remote-user ":method :url HTTP/:http-version"',
    {
      immediate: true
    }
  )
);

app.use(
  morgan(
    "<-- :id [:date] :method :url :status :res[content-length] - :response-time ms",
    {
      immediate: false
    }
  )
);
// support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',(_, res) => {
  res.send({ ok: 'ok'})
})
app.use("/api/auth", routes.authentication);
app.use("/api/emailAccounts", authService.validateRequest, routes.emailAccounts);
app.use("/api/emails", authService.validateRequest, routes.emails);


//catch 404 and forward to error handler  middleware
app.use((_, __, next) => {
  next(
    new AppError(
      "The given url does not match any route",
      404,
      "ResourceNotFound"
    )
  );
});

errorHandler.registerAndHandleAllErrors(app);
module.exports = app;
