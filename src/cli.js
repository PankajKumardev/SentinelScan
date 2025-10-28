#!/usr/bin/env node

const figlet = require('figlet');
const chalk = require('chalk');
const scanner = require('./scanner');

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

async function main() {
  console.clear();

  // Allow disabling the banner with environment variable or CLI flag
  const noBanner =
    process.env.NO_BANNER === '1' || process.argv.includes('--no-banner');
  renderBanner({ noBanner });

  try {
    await scanner.run();
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error.message);
    process.exit(1);
  }
}

main();
