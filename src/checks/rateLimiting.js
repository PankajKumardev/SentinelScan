import axios from 'axios';

async function check(url) {
  const requests = 15; // Increased to 15 requests for better detection
  const delay = 200; // Increased delay to 200ms between requests
  const responses = [];
  const issues = [];

  try {
    for (let i = 0; i < requests; i++) {
      const startTime = Date.now();

      try {
        const response = await axios.get(url, {
          timeout: 10000, // Increased timeout
          headers: {
            'User-Agent': 'SentinelScan/1.0 RateLimitTest',
            'X-Forwarded-For': `192.168.1.${i}`, // Simulate different IPs
          },
        });

        const responseTime = Date.now() - startTime;

        responses.push({
          status: response.status,
          headers: response.headers,
          responseTime,
          requestNumber: i + 1,
        });

        // Check for rate limiting headers
        const rateLimitHeaders = {
          'X-RateLimit-Limit': response.headers['x-ratelimit-limit'],
          'X-RateLimit-Remaining': response.headers['x-ratelimit-remaining'],
          'X-RateLimit-Reset': response.headers['x-ratelimit-reset'],
          'Retry-After': response.headers['retry-after'],
        };

        if (
          Object.values(rateLimitHeaders).some((header) => header !== undefined)
        ) {
          issues.push(
            'Rate limiting headers detected - good security practice'
          );
        }

        // Small delay between requests
        if (i < requests - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;

        responses.push({
          status: error.response?.status || 'Error',
          error: error.message,
          responseTime,
          requestNumber: i + 1,
        });
      }
    }

    // Analyze responses
    const statusCodes = responses.map((r) => r.status);
    const uniqueStatuses = [...new Set(statusCodes)];

    // Check for rate limiting indicators
    const rateLimitedResponses = responses.filter(
      (r) =>
        r.status === 429 ||
        r.status === 503 ||
        (r.error && r.error.includes('rate limit'))
    );

    const blockedResponses = responses.filter(
      (r) => r.status === 403 || r.status === 401
    );

    // Check for response time patterns (throttling)
    const responseTimes = responses.map((r) => r.responseTime || 0);
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    // Look for significant increases in response time (throttling)
    const significantDelays = responses.filter(
      (r, index) => index > 2 && r.responseTime > avgResponseTime * 1.5
    );

    const hasThrottling = significantDelays.length > 2; // More than 2 requests show throttling

    // Check for progressive blocking (requests getting blocked as we go)
    const progressiveBlocking = responses.filter((r, index) => {
      if (index < 5) return false; // Skip first 5 requests
      return r.status === 429 || r.status === 403 || r.status === 503;
    });

    if (
      rateLimitedResponses.length === 0 &&
      blockedResponses.length === 0 &&
      !hasThrottling
    ) {
      issues.push(
        'No rate limiting detected - server may be vulnerable to brute force attacks, DoS attacks, and API abuse'
      );
    } else {
      if (rateLimitedResponses.length > 0) {
        issues.push(
          `Rate limiting detected after ${rateLimitedResponses[0].requestNumber} requests - good protection against abuse`
        );
      }

      if (hasThrottling) {
        issues.push(
          'Response time throttling detected - server implements progressive delays to prevent abuse'
        );
      }

      if (progressiveBlocking.length > 0) {
        issues.push(
          `Progressive blocking detected - server blocks requests after ${progressiveBlocking[0].requestNumber} attempts`
        );
      }
    }

    // Check for rate limit headers in successful responses
    const hasRateLimitHeaders = responses.some(
      (r) =>
        r.headers &&
        (r.headers['x-ratelimit-limit'] ||
          r.headers['x-ratelimit-remaining'] ||
          r.headers['retry-after'])
    );

    if (hasRateLimitHeaders) {
      issues.push('Rate limiting headers present - follows API best practices');
    }

    return {
      requestsMade: requests,
      rateLimited: rateLimitedResponses.length,
      blocked: blockedResponses.length,
      throttlingDetected: hasThrottling,
      progressiveBlocking: progressiveBlocking.length,
      hasRateLimitHeaders,
      averageResponseTime: Math.round(avgResponseTime),
      issues,
      vulnerable: issues.some(
        (issue) =>
          issue.includes('vulnerable') || issue.includes('No rate limiting')
      ),
      statusCodes: uniqueStatuses,
      responsePattern: {
        firstFive: responses
          .slice(0, 5)
          .map((r) => ({ status: r.status, time: r.responseTime })),
        lastFive: responses
          .slice(-5)
          .map((r) => ({ status: r.status, time: r.responseTime })),
      },
    };
  } catch (error) {
    throw new Error(`Rate Limiting check failed: ${error.message}`);
  }
}

export { check };
