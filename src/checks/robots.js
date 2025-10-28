import { fetchPage } from '../utils/fetchPage.js';

async function check(url) {
  const parsedUrl = new URL(url);
  const robotsUrl = `${parsedUrl.origin}/robots.txt`;

  try {
    const response = await fetchPage(robotsUrl);
    const hasRobots = response.status === 200;
    const content = response.data;
    const hasSitemap = /Sitemap:/i.test(content);

    return {
      robotsTxt: hasRobots,
      sitemap: hasSitemap,
    };
  } catch (error) {
    return {
      robotsTxt: false,
      sitemap: false,
      error: error.message,
    };
  }
}

export { check };
