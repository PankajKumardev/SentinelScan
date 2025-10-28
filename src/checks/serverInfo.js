const { fetchHead } = require('../utils/fetchPage');

async function check(url) {
  try {
    const response = await fetchHead(url);
    const server = response.headers['server'];

    return {
      serverHeader: server || 'Not disclosed',
      informationDisclosure: !!server, // Any server header reveals info
    };
  } catch (error) {
    throw new Error(`Server info check failed: ${error.message}`);
  }
}

module.exports = { check };
