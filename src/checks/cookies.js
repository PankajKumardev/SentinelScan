const { fetchHead } = require('../utils/fetchPage');
const cookie = require('cookie');

async function check(url) {
  try {
    const response = await fetchHead(url);
    const setCookies = response.headers['set-cookie'] || [];

    let total = 0;
    let secure = 0;
    let httpOnly = 0;
    let sameSite = 0;

    for (const cookieStr of setCookies) {
      total++;
      const parsed = cookie.parse(cookieStr);
      if (parsed.Secure) secure++;
      if (parsed.HttpOnly) httpOnly++;
      if (parsed.SameSite) sameSite++;
    }

    return {
      total,
      secure: `${secure}/${total}`,
      httpOnly: `${httpOnly}/${total}`,
      sameSite: `${sameSite}/${total}`,
    };
  } catch (error) {
    throw new Error(`Cookies check failed: ${error.message}`);
  }
}

module.exports = { check };
