import { fetchPage } from '../utils/fetchPage.js';

async function check(url) {
  const payload = '<script>alert("xss")</script>';
  const testUrl = `${url}${
    url.includes('?') ? '&' : '?'
  }test=${encodeURIComponent(payload)}`;

  try {
    const response = await fetchPage(testUrl);
    const reflected = response.data.includes(payload);

    return {
      vulnerable: reflected,
      testedUrl: testUrl,
    };
  } catch (error) {
    throw new Error(`XSS check failed: ${error.message}`);
  }
}

export { check };
