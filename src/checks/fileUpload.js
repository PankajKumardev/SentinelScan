import { fetchPage } from '../utils/fetchPage.js';
import * as cheerio from 'cheerio';

async function check(url) {
  try {
    const response = await fetchPage(url);
    const $ = cheerio.load(response.data);

    const uploadForms = [];
    const issues = [];

    // Find forms with file inputs
    $('form').each((i, form) => {
      const $form = $(form);
      const fileInputs = $form.find('input[type="file"]');

      if (fileInputs.length > 0) {
        const action = $form.attr('action') || '';
        const method = ($form.attr('method') || 'POST').toUpperCase();
        const enctype =
          $form.attr('enctype') || 'application/x-www-form-urlencoded';

        const accept = fileInputs.attr('accept') || '';
        const multiple = fileInputs.attr('multiple') !== undefined;

        uploadForms.push({
          action,
          method,
          enctype,
          accept,
          multiple,
          fileInputsCount: fileInputs.length,
        });

        // Check for issues
        if (method !== 'POST') {
          issues.push(`Upload form uses ${method} instead of POST`);
        }
        if (enctype !== 'multipart/form-data') {
          issues.push(`Upload form missing enctype="multipart/form-data"`);
        }
        if (!accept) {
          issues.push(
            `Upload form allows all file types (no accept attribute)`
          );
        }
        if (multiple) {
          issues.push(`Upload form allows multiple files which increases risk`);
        }
      }
    });

    // Test for common upload paths
    const uploadPaths = ['/upload', '/fileupload', '/files', '/media'];
    const foundPaths = [];
    for (const path of uploadPaths) {
      try {
        const testResponse = await fetchPage(url + path);
        if (testResponse.status === 200) {
          foundPaths.push(path);
          issues.push(`Common upload path '${path}' is accessible`);
        }
      } catch (e) {
        // Path not found
      }
    }

    return {
      uploadFormsFound: uploadForms.length,
      commonPathsFound: foundPaths.length,
      issues,
      vulnerable: issues.length > 0,
      forms: uploadForms,
      paths: foundPaths,
    };
  } catch (error) {
    throw new Error(`File Upload check failed: ${error.message}`);
  }
}

export { check };
