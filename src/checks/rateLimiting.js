import axios from 'axios';

async function check(url) {
  const requests = 10; // Number of requests to make
  const delay = 100; // Delay between requests in ms
  const responses = [];
  const issues = [];

  try {
    for (let i = 0; i < requests; i++) {
      try {
        const response = await axios.get(url, {
          timeout: 5000,
          headers: {
            'User-Agent': 'SentinelScan/1.0 RateLimitTest',
          },
        });
        responses.push({
          status: response.status,
          headers: response.headers,
        });

        // Small delay between requests
        if (i < requests - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        responses.push({
          status: error.response?.status || 'Error',
          error: error.message,
        });
      }
    }

    // Analyze responses
    const statusCodes = responses.map((r) => r.status);
    const uniqueStatuses = [...new Set(statusCodes)];

    // Check for rate limiting indicators
    const rateLimitedResponses = responses.filter(
      (r) =>
        r.status === 429 || r.status === 503 || r.error?.includes('rate limit')
    );

    const blockedResponses = responses.filter(
      (r) => r.status === 403 || r.status === 401
    );

    // Check for consistent response times (might indicate throttling)
    const responseTimes = responses.map((r) => r.responseTime || 0);
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const hasThrottling = responseTimes.some(
      (time) => time > avgResponseTime * 2
    );

    if (rateLimitedResponses.length === 0 && blockedResponses.length === 0) {
      issues.push(
        'No rate limiting detected - server may be vulnerable to brute force attacks'
      );
    }

    if (hasThrottling) {
      issues.push(
        'Response time throttling detected - possible rate limiting implementation'
      );
    }

    return {
      requestsMade: requests,
      rateLimited: rateLimitedResponses.length,
      blocked: blockedResponses.length,
      throttlingDetected: hasThrottling,
      issues,
      vulnerable: issues.some((issue) => issue.includes('vulnerable')),
      statusCodes: uniqueStatuses,
    };
  } catch (error) {
    throw new Error(`Rate Limiting check failed: ${error.message}`);
  }
}

export { check };
