import axios from 'axios';

async function fetchPage(url, options = {}) {
  const config = {
    timeout: 10000, // 10 seconds
    headers: {
      'User-Agent': 'WebSecurityScanner/1.0',
    },
    ...options,
  };

  try {
    const response = await axios.get(url, config);
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }
}

async function fetchHead(url, options = {}) {
  const config = {
    timeout: 5000,
    headers: {
      'User-Agent': 'WebSecurityScanner/1.0',
    },
    ...options,
  };

  try {
    const response = await axios.head(url, config);
    return response;
  } catch (error) {
    throw new Error(`Failed to fetch HEAD ${url}: ${error.message}`);
  }
}

export { fetchPage, fetchHead };
