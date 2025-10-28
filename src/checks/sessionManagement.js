import { fetchHead } from '../utils/fetchPage.js';

async function check(url) {
  try {
    const response = await fetchHead(url);
    const headers = response.headers;
    const setCookies = headers['set-cookie'] || [];

    const sessionCookies = [];
    const issues = [];

    for (const cookieStr of setCookies) {
      const cookie = parseCookie(cookieStr);

      // Check if it looks like a session cookie
      const isSessionCookie =
        /session|sess|auth|token|jwt/i.test(cookie.name) ||
        cookie.name.toLowerCase().includes('jsessionid') ||
        cookie.name.toLowerCase().includes('phpsessid');

      if (isSessionCookie) {
        sessionCookies.push(cookie);

        // Check security flags
        if (!cookie.secure) {
          issues.push(`Session cookie '${cookie.name}' not marked as Secure`);
        }
        if (!cookie.httpOnly) {
          issues.push(`Session cookie '${cookie.name}' not marked as HttpOnly`);
        }
        if (!cookie.sameSite) {
          issues.push(
            `Session cookie '${cookie.name}' missing SameSite attribute`
          );
        }
        if (cookie.sameSite === 'Lax' && cookie.name.includes('auth')) {
          issues.push(
            `Authentication cookie '${cookie.name}' uses SameSite=Lax instead of Strict`
          );
        }

        // Check for overly long expiration
        if (cookie.maxAge && cookie.maxAge > 86400 * 30) {
          // 30 days
          issues.push(
            `Session cookie '${cookie.name}' has very long expiration (${cookie.maxAge} seconds)`
          );
        }
      }
    }

    return {
      sessionCookiesFound: sessionCookies.length,
      issues,
      vulnerable: issues.length > 0,
      cookies: sessionCookies,
    };
  } catch (error) {
    throw new Error(`Session Management check failed: ${error.message}`);
  }
}

function parseCookie(cookieStr) {
  const parts = cookieStr.split(';').map((p) => p.trim());
  const [nameValue] = parts;
  const [name, value] = nameValue.split('=');

  const cookie = { name, value };

  for (let i = 1; i < parts.length; i++) {
    const [key, val] = parts[i].split('=');
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'secure') cookie.secure = true;
    else if (lowerKey === 'httponly') cookie.httpOnly = true;
    else if (lowerKey === 'samesite') cookie.sameSite = val;
    else if (lowerKey === 'max-age') cookie.maxAge = parseInt(val);
    else if (lowerKey === 'expires') cookie.expires = val;
  }

  return cookie;
}

export { check };
