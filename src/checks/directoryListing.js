const axios = require('axios');

async function check(url) {
  const directories = ['/admin/', '/backup/', '/config/', '/uploads/'];
  const vulnerableDirs = [];

  for (const dir of directories) {
    try {
      const testUrl = `${url.replace(/\/$/, '')}${dir}`;
      const response = await axios.get(testUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });

      // Check if response contains directory listing indicators
      const content = response.data.toLowerCase();
      const isListing =
        content.includes('<title>index of') ||
        content.includes('directory listing') ||
        (content.includes('<a href=') &&
          content.includes('..') &&
          content.includes('parent directory'));

      if (response.status === 200 && isListing) {
        vulnerableDirs.push(dir);
      }
    } catch (error) {
      // Directory not found or error, skip
    }
  }

  return {
    vulnerable: vulnerableDirs.length > 0,
    directories: vulnerableDirs,
  };
}

module.exports = { check };
