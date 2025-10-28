const { fetchPage } = require('../utils/fetchPage');
const cheerio = require('cheerio');

async function check(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:') {
    return { mixedContent: false, reason: 'Not HTTPS' };
  }

  try {
    const response = await fetchPage(url);
    const $ = cheerio.load(response.data);
    const mixedUrls = [];

    // Check img, script, link, iframe, etc.
    $('img[src], script[src], link[href], iframe[src]').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('href');
      if (src && src.startsWith('http://')) {
        mixedUrls.push(src);
      }
    });

    return {
      mixedContent: mixedUrls.length > 0,
      count: mixedUrls.length,
      urls: mixedUrls.slice(0, 10), // Limit to 10
    };
  } catch (error) {
    throw new Error(`Mixed content check failed: ${error.message}`);
  }
}

module.exports = { check };
