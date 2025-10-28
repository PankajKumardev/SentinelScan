import { fetchPage } from '../utils/fetchPage.js';
import * as cheerio from 'cheerio';

async function check(url) {
  try {
    const response = await fetchPage(url);
    const headers = response.headers;

    const xFrameOptions = headers['x-frame-options'];
    const csp = headers['content-security-policy'];

    let frameBusting = false;
    let cspFrameAncestors = false;

    // Check X-Frame-Options
    const xFrameValid =
      xFrameOptions &&
      ['DENY', 'SAMEORIGIN'].includes(xFrameOptions.toUpperCase());

    // Check CSP frame-ancestors
    if (csp) {
      cspFrameAncestors =
        csp.includes('frame-ancestors') &&
        !csp.includes("frame-ancestors 'none'");
    }

    // Check for JavaScript frame-busting
    const $ = cheerio.load(response.data);
    const scripts = $('script').text();
    frameBusting =
      /top\.location|window\.top|self\.parent/.test(scripts) ||
      /if\s*\(\s*window\s*!==\s*window\.top/.test(scripts);

    const vulnerable = !xFrameValid && !cspFrameAncestors && !frameBusting;

    return {
      xFrameOptions: xFrameOptions || 'Not set',
      cspFrameAncestors,
      frameBustingCode: frameBusting,
      protected: !vulnerable,
      vulnerable,
      protectionMethods: {
        xFrameOptions: !!xFrameValid,
        cspFrameAncestors,
        frameBusting,
      },
    };
  } catch (error) {
    throw new Error(`Clickjacking check failed: ${error.message}`);
  }
}

export { check };
