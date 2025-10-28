import { fetchPage } from '../utils/fetchPage.js';
import * as cheerio from 'cheerio';

async function check(url) {
  try {
    const response = await fetchPage(url);
    const $ = cheerio.load(response.data);

    const forms = $('form');
    const formAnalysis = [];

    forms.each((i, form) => {
      const $form = $(form);
      const method = ($form.attr('method') || 'GET').toUpperCase();
      const action = $form.attr('action') || '';

      // Check for CSRF tokens
      const hasCsrfToken =
        $form.find(
          'input[name*="csrf"], input[name*="token"], input[name*="nonce"]'
        ).length > 0;

      // Check for state-changing methods
      const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
        method
      );

      formAnalysis.push({
        method,
        action,
        hasCsrfToken,
        isStateChanging,
        vulnerable: isStateChanging && !hasCsrfToken,
      });
    });

    const vulnerableForms = formAnalysis.filter((f) => f.vulnerable);
    const totalForms = formAnalysis.length;
    const stateChangingForms = formAnalysis.filter(
      (f) => f.isStateChanging
    ).length;

    return {
      totalForms,
      stateChangingForms,
      vulnerableForms: vulnerableForms.length,
      forms: formAnalysis,
      overallVulnerable: vulnerableForms.length > 0,
    };
  } catch (error) {
    throw new Error(`CSRF check failed: ${error.message}`);
  }
}

export { check };
