import { fetchHead } from '../utils/fetchPage.js';

async function check(url) {
  try {
    const response = await fetchHead(url);
    const headers = response.headers;

    const corsHeaders = {
      'access-control-allow-origin': headers['access-control-allow-origin'],
      'access-control-allow-methods': headers['access-control-allow-methods'],
      'access-control-allow-headers': headers['access-control-allow-headers'],
      'access-control-allow-credentials':
        headers['access-control-allow-credentials'],
    };

    const allowOrigin = corsHeaders['access-control-allow-origin'];
    const misconfigured =
      allowOrigin === '*' ||
      (allowOrigin && allowOrigin !== url && !allowOrigin.includes('null'));

    return {
      corsEnabled: !!allowOrigin,
      misconfigured,
      headers: corsHeaders,
    };
  } catch (error) {
    throw new Error(`CORS check failed: ${error.message}`);
  }
}

export { check };
