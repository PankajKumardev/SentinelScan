#!/usr/bin/env node

import figlet from 'figlet';
import chalk from 'chalk';
import fs from 'fs';
import { run } from './scanner.js';
import AIChat from './utils/aiChat.js';

function renderBanner({ noBanner } = {}) {
  if (noBanner) return;

  // Pick a font that fits the terminal width
  const width = process.stdout.columns || 80;
  const font = width >= 60 ? 'Standard' : 'Small';

  try {
    const text = figlet.textSync('SentinelScan', {
      font,
      horizontalLayout: 'default',
    });
    console.log(chalk.cyan(text));
    console.log(chalk.gray('A terminal-focused website security scanner\n'));
  } catch (err) {
    // Fallback to a simple, clean title when figlet fails
    console.log(chalk.cyan('SentinelScan'));
    console.log(chalk.gray('A terminal-focused website security scanner\n'));
  }
}

async function runAIAnalysis(reportFile) {
  try {
    console.log(chalk.blue(`Loading scan results from: ${reportFile}`));

    if (!fs.existsSync(reportFile)) {
      console.error(chalk.red('Error: Report file not found'));
      process.exit(1);
    }

    const reportData = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    console.log(chalk.green('✅ Report loaded successfully'));
    console.log(chalk.gray(`URL: ${reportData.url}`));
    console.log(chalk.gray(`Timestamp: ${reportData.timestamp}`));
    console.log('');

    const aiChat = new AIChat(reportData);
    await aiChat.startInteractiveChat();
  } catch (error) {
    console.error(chalk.red('Error loading report:'), error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(chalk.yellow('Usage:'));
  console.log('  npm start [options] [url] [checks] [format] [output-dir]');
  console.log('  npm start --bulk-file <file>');
  console.log('  npm start --ai-analyze <report.json>');
  console.log('');
  console.log(chalk.yellow('Options:'));
  console.log('  --help, -h              Show this help message');
  console.log('  --no-banner             Hide the banner');
  console.log(
    '  --bulk-file <file>      Scan multiple URLs from a file (one URL per line)'
  );
  console.log(
    '  --ai-analyze <file>     Start AI chat analysis on existing scan report'
  );
  console.log('');
  console.log(chalk.yellow('Arguments:'));
  console.log(
    '  url                     Website URL to scan (e.g., https://example.com)'
  );
  console.log(
    '  checks                  Comma-separated list of checks (default: all)'
  );
  console.log(
    '  format                  Report format: PDF, CSV, or JSON (default: JSON)'
  );
  console.log(
    '  output-dir              Output directory (default: ./reports)'
  );
  console.log('');
  console.log(chalk.yellow('Available checks:'));
  console.log('  tls, headers, methods, mixedContent, robots, cookies, xss,');
  console.log(
    '  openRedirect, cors, serverInfo, directoryListing, sqlInjection,'
  );
  console.log('  csrf, sslCipher, dnsSecurity, brokenAuth, clickjacking,');
  console.log('  sessionManagement, fileUpload, rateLimiting');
  console.log('');
  console.log(chalk.yellow('Examples:'));
  console.log('  npm start https://example.com');
  console.log('  npm start https://example.com tls,headers,xss PDF');
  console.log('  npm start --bulk-file urls.txt');
  console.log('  npm start --ai-analyze reports/security-scan-2025-10-28.json');
  console.log(
    '  npm start --no-banner https://example.com all JSON ./my-reports'
  );
}

async function main() {
  console.clear();

  // Parse command line arguments
  const args = process.argv.slice(2);

  // Check for help first - BEFORE anything else
  const helpIndex = args.indexOf('--help');
  const hIndex = args.indexOf('-h');
  if (helpIndex !== -1 || hIndex !== -1) {
    renderBanner();
    showHelp();
    process.exit(0);
  }

  // Check for AI analysis command
  const aiAnalysisIndex = args.indexOf('--ai-analyze');
  if (aiAnalysisIndex !== -1 && args[aiAnalysisIndex + 1]) {
    const reportFile = args[aiAnalysisIndex + 1];
    renderBanner();
    await runAIAnalysis(reportFile);
    return;
  }

  const noBannerIndex = args.indexOf('--no-banner');
  const noBanner = process.env.NO_BANNER === '1' || noBannerIndex !== -1;

  // Check for bulk file
  const bulkIndex = args.indexOf('--bulk-file');
  let bulkUrls = [];
  if (bulkIndex !== -1 && args[bulkIndex + 1]) {
    const bulkFile = args[bulkIndex + 1];
    try {
      const content = fs.readFileSync(bulkFile, 'utf8');
      bulkUrls = content
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url && url.startsWith('http'));
      // Remove --bulk-file and filename from args
      args.splice(bulkIndex, 2);
    } catch (error) {
      console.error(chalk.red('Error reading bulk file:'), error.message);
      process.exit(1);
    }
  }

  // Remove --no-banner from args if present (recalculate index after bulk removal)
  const updatedNoBannerIndex = args.indexOf('--no-banner');
  if (updatedNoBannerIndex !== -1) {
    args.splice(updatedNoBannerIndex, 1);
  }

  renderBanner({ noBanner });

  try {
    if (bulkUrls.length > 0) {
      console.log(
        chalk.blue(`Starting bulk scan of ${bulkUrls.length} URLs...\n`)
      );
      for (let i = 0; i < bulkUrls.length; i++) {
        const url = bulkUrls[i];
        console.log(
          chalk.yellow(`Scanning ${i + 1}/${bulkUrls.length}: ${url}`)
        );
        // Modify argv for this URL
        process.argv = [process.argv[0], process.argv[1], url, ...args];
        await run();
        console.log(''); // Empty line between scans
      }
    } else {
      // Pass filtered args to scanner
      process.argv = [process.argv[0], process.argv[1], ...args];
      await run();
    }
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error.message);
    process.exit(1);
  }
}

main();
