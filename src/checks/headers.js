const { fetchHead } = require('../utils/fetchPage');

async function check(url) {
  try {
    const response = await fetchHead(url);
    const headers = response.headers;

    return {
      csp: !!headers['content-security-policy'],
      hsts: !!headers['strict-transport-security'],
      xFrameOptions: !!headers['x-frame-options'],
      xContentTypeOptions: !!headers['x-content-type-options'],
      referrerPolicy: !!headers['referrer-policy'],
      permissionsPolicy: !!headers['permissions-policy'],
    };
  } catch (error) {
    throw new Error(`Headers check failed: ${error.message}`);
  }
}

module.exports = { check };
