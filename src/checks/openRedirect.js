const axios = require('axios');

async function check(url) {
  const evilUrl = 'http://evil.com';
  const testUrl = `${url}${
    url.includes('?') ? '&' : '?'
  }url=${encodeURIComponent(evilUrl)}`;

  try {
    const response = await axios.get(testUrl, {
      timeout: 5000,
      maxRedirects: 0,
      validateStatus: (status) =>
        status < 400 || status === 302 || status === 301,
    });

    const location = response.headers.location;
    const vulnerable = location ? location.includes(evilUrl) : false;

    return {
      vulnerable,
      testedUrl: testUrl,
      redirectLocation: location,
    };
  } catch (error) {
    if (error.response?.status === 302 || error.response?.status === 301) {
      const location = error.response.headers.location;
      const vulnerable = location ? location.includes(evilUrl) : false;
      return {
        vulnerable,
        testedUrl: testUrl,
        redirectLocation: location,
      };
    }
    // For other errors, not vulnerable
    return {
      vulnerable: false,
      testedUrl: testUrl,
      error: error.message,
    };
  }
}

module.exports = { check };
