const app = require('../app');
const http = require('http');

/**
 * Get port from environment and store in Express.
 */

const port = process.env.PORT || '4000';

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});