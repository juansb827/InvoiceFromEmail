require('dotenv').config();
require('./lib/parameterStore').init(['gapi_client_id',
'gapi_client_secret',
'pg_encrypt_password']), 60 * 5;
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const routes = require("./routes");

app.use(bodyParser.json());
app.use("/api/emailAccounts", routes.emailAccounts);
//app.use("/api/forms", );

app.use(function(err, req, res, next) {
  console.error('Error handler', err.code ? err.message: err.stack);
  if (!err.statusCode) err.statusCode = 500; // Sets a generic server error status code if none is part of the err
  res.status(err.statusCode).send({
      error: {
          message: err.message
      }
  }); 
});

module.exports = app;
