const axios = require('axios');

const methods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

async function check(url) {
  const allowed = [];

  for (const method of methods) {
    try {
      await axios({
        method,
        url,
        timeout: 5000,
        validateStatus: (status) => status < 500, // Allow 4xx but not 5xx
      });
      allowed.push(method);
    } catch (error) {
      // If 405 Method Not Allowed, it's not allowed
      if (error.response?.status === 405) {
        continue;
      }
      // Other errors, perhaps network, skip
    }
  }

  return { allowed };
}

module.exports = { check };
