import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { generate } from './utils/reportGenerator.js';

const checks = [
  { name: 'All Checks', value: 'all' },
  { name: 'SSL/TLS certificate validity & expiry', value: 'tls' },
  {
    name: 'HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)',
    value: 'headers',
  },
  { name: 'Allowed HTTP methods (GET, POST, PUT, DELETE…)', value: 'methods' },
  {
    name: 'Mixed-content detection (HTTP assets on HTTPS site)',
    value: 'mixedContent',
  },
  { name: 'Robots.txt & sitemap presence', value: 'robots' },
  {
    name: 'Cookie security flags (Secure, HttpOnly, SameSite)',
    value: 'cookies',
  },
  { name: 'XSS reflection quick test', value: 'xss' },
  { name: 'Open redirect test', value: 'openRedirect' },
  { name: 'CORS misconfiguration check', value: 'cors' },
  { name: 'Server information disclosure', value: 'serverInfo' },
  { name: 'Directory listing vulnerability', value: 'directoryListing' },
  { name: 'SQL injection vulnerability test', value: 'sqlInjection' },
  { name: 'CSRF token validation check', value: 'csrf' },
  { name: 'SSL/TLS cipher suite analysis', value: 'sslCipher' },
  { name: 'DNS security (DNSSEC, CAA, SPF, DKIM)', value: 'dnsSecurity' },
  { name: 'Broken authentication detection', value: 'brokenAuth' },
  { name: 'Clickjacking vulnerability test', value: 'clickjacking' },
  { name: 'Session management analysis', value: 'sessionManagement' },
  { name: 'File upload vulnerabilities', value: 'fileUpload' },
  { name: 'Rate limiting assessment', value: 'rateLimiting' },
];

function getRiskEmoji(riskLevel) {
  switch (riskLevel?.toLowerCase()) {
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
    case 'critical':
      return '🔴';
    default:
      return '⚪';
  }
}

async function run() {
  let url, selectedChecks, format, outputDir;

  if (process.argv.length > 2) {
    // Command line mode: node scanner.js <url> <checks> <format> <outputDir>
    url = process.argv[2];
    selectedChecks = process.argv[3]
      ? process.argv[3].split(',')
      : [
          'tls',
          'headers',
          'methods',
          'mixedContent',
          'robots',
          'cookies',
          'xss',
          'openRedirect',
          'cors',
          'serverInfo',
          'directoryListing',
          'sqlInjection',
          'csrf',
          'sslCipher',
          'dnsSecurity',
          'brokenAuth',
          'clickjacking',
          'sessionManagement',
          'fileUpload',
          'rateLimiting',
        ];
    // Parse format (support both --format and direct format)
    let formatArg = process.argv[4];
    if (formatArg?.startsWith('--')) {
      formatArg = formatArg.slice(2).toUpperCase();
    }
    format = ['PDF', 'CSV', 'JSON'].includes(formatArg) ? formatArg : 'JSON';
    outputDir = process.argv[5] || './reports';

    // Handle "All Checks" selection
    if (selectedChecks.includes('all')) {
      selectedChecks = checks.slice(1).map((c) => c.value);
    }
  } else {
    // Interactive mode
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter the website URL to scan:',
        validate: (input) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL (e.g., https://example.com)';
          }
        },
      },
      {
        type: 'checkbox',
        name: 'selectedChecks',
        message:
          'Select the security checks to run (space to toggle, a for all/none, enter to submit):',
        choices: checks,
        validate: (input) =>
          input.length > 0 || 'Please select at least one check.',
      },
      {
        type: 'list',
        name: 'format',
        message: 'Select report output format:',
        choices: ['PDF', 'CSV', 'JSON'],
      },
      {
        type: 'input',
        name: 'outputDir',
        message: 'Enter output directory (leave empty for ./reports):',
        default: './reports',
      },
    ]);

    url = answers.url || 'https://example.com';
    const initialSelectedChecks = answers.selectedChecks || ['tls'];
    format = answers.format || 'JSON';
    outputDir = answers.outputDir || './reports';

    selectedChecks = initialSelectedChecks;

    // Handle "All Checks" selection
    if (selectedChecks.includes('all')) {
      selectedChecks = checks.slice(1).map((c) => c.value);
    }
  }
  const outputPath = path.resolve(outputDir);

  // Ensure output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const results = {
    url,
    timestamp: new Date().toISOString(),
    results: {},
  };

  console.log(chalk.blue('\nStarting security scan...\n'));

  for (const check of selectedChecks) {
    const spinner = ora(`Running ${check} check...`).start();
    try {
      const checkModule = await import(`./checks/${check}.js`);
      const result = await checkModule.check(url);
      results.results[check] = result;
      spinner.succeed(`${check} check completed`);
    } catch (error) {
      results.results[check] = { error: error.message };
      spinner.fail(`${check} check failed: ${error.message}`);
    }
  }

  console.log(chalk.blue('\nGenerating report...\n'));

  const reportPath = await generate(results, format, outputPath);

  console.log(chalk.green(`Report generated: ${reportPath}`));

  // Display AI summary in terminal if available
  if (results.aiSummary) {
    console.log(chalk.blue('\n🤖 AI Security Assessment:'));
    console.log(chalk.yellow('─'.repeat(50)));

    const riskEmoji = getRiskEmoji(results.aiSummary.overallRisk);
    console.log(`Rating: ${chalk.bold(results.aiSummary.rating)} ${riskEmoji}`);
    console.log(`Risk Level: ${results.aiSummary.overallRisk} ${riskEmoji}`);
    console.log(`Severity Score: ${results.aiSummary.severityScore}/100`);
    console.log(`Summary: ${results.aiSummary.summary}`);

    if (results.aiSummary.criticalIssues?.length > 0) {
      console.log(chalk.red('\n🚨 Critical Issues:'));
      results.aiSummary.criticalIssues.forEach((issue) => {
        console.log(`  • ${issue}`);
      });
    }

    console.log(chalk.green('\n✅ Key Recommendations:'));
    results.aiSummary.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    if (results.aiSummary.immediateActions?.length > 0) {
      console.log(chalk.red('\n⏰ Immediate Actions (24 hours):'));
      results.aiSummary.immediateActions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action}`);
      });
    }

    console.log(chalk.yellow('─'.repeat(50)));
  }

  // Offer AI chat option
  if (process.env.GROQ_API_KEY) {
    const { startChat } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'startChat',
        message: chalk.cyan(
          '🤖 Would you like to chat with AI about these scan results?'
        ),
        default: false,
      },
    ]);

    if (startChat) {
      const { default: AIChat } = await import('./utils/aiChat.js');
      const aiChat = new AIChat(results);
      await aiChat.startInteractiveChat();
    }
  } else {
    console.log(
      chalk.yellow(
        '\n💡 Tip: Set up GROQ_API_KEY in .env for AI-powered analysis and interactive chat!'
      )
    );
  }
}

export { run };
