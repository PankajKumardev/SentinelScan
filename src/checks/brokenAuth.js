import { fetchPage } from '../utils/fetchPage.js';
import * as cheerio from 'cheerio';

async function check(url) {
  try {
    const response = await fetchPage(url);
    const $ = cheerio.load(response.data);

    const loginForms = [];
    const passwordFields = $('input[type="password"]');
    const loginIndicators = ['login', 'signin', 'auth', 'username', 'email'];

    // Find forms with password fields on main page
    passwordFields.each((i, elem) => {
      const form = $(elem).closest('form');
      if (form.length > 0) {
        const formAction = form.attr('action') || '';
        const method = (form.attr('method') || 'GET').toUpperCase();
        const hasUsername =
          form.find(
            'input[type="text"], input[type="email"], input[name*="user"], input[name*="email"]'
          ).length > 0;
        const hasRememberMe =
          form.find('input[name*="remember"], input[type="checkbox"]').length >
          0;

        loginForms.push({
          action: formAction,
          method,
          hasUsername,
          hasPassword: true,
          hasRememberMe,
          secureMethod: method === 'POST',
          page: 'main',
        });
      }
    });

    // Check for common login paths and analyze them
    const commonPaths = [
      '/login',
      '/signin',
      '/auth',
      '/admin',
      '/account/login',
      '/user/login',
      '/signin',
      '/signup',
      '/register',
      '/account/register',
    ];
    const foundPaths = [];
    const pathForms = [];

    for (const path of commonPaths) {
      try {
        const testResponse = await fetchPage(url + path);
        if (testResponse.status === 200) {
          foundPaths.push(path);

          // Analyze the login page for forms
          const $page = cheerio.load(testResponse.data);
          const pagePasswordFields = $page('input[type="password"]');

          pagePasswordFields.each((i, elem) => {
            const form = $page(elem).closest('form');
            if (form.length > 0) {
              const formAction = form.attr('action') || '';
              const method = (form.attr('method') || 'GET').toUpperCase();
              const hasUsername =
                form.find(
                  'input[type="text"], input[type="email"], input[name*="user"], input[name*="email"]'
                ).length > 0;
              const hasRememberMe =
                form.find('input[name*="remember"], input[type="checkbox"]')
                  .length > 0;

              pathForms.push({
                action: formAction,
                method,
                hasUsername,
                hasPassword: true,
                hasRememberMe,
                secureMethod: method === 'POST',
                page: path,
              });
            }
          });
        }
      } catch (e) {
        // Path not found or error
      }
    }

    // Combine all forms
    const allForms = [...loginForms, ...pathForms];

    const issues = [];

    allForms.forEach((form, index) => {
      if (!form.secureMethod) {
        issues.push(`Login form on ${form.page} uses insecure GET method`);
      }
      if (!form.hasUsername) {
        issues.push(`Login form on ${form.page} missing username/email field`);
      }
      if (form.hasRememberMe) {
        issues.push(
          `Login form on ${form.page} has 'Remember Me' which may extend session unnecessarily`
        );
      }
    });

    // Additional checks
    if (foundPaths.length > 0) {
      issues.push(
        `Found ${foundPaths.length} accessible login/auth paths - ensure proper protection`
      );
    }

    return {
      loginFormsFound: allForms.length,
      commonPathsFound: foundPaths.length,
      mainPageForms: loginForms.length,
      pathForms: pathForms.length,
      issues,
      vulnerable: issues.length > 0,
      forms: allForms,
      paths: foundPaths,
    };
  } catch (error) {
    throw new Error(`Broken Authentication check failed: ${error.message}`);
  }
}

export { check };
