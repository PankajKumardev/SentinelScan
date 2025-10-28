#!/usr/bin/env node

import figlet from 'figlet';
import chalk from 'chalk';
import { run } from './scanner.js';

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

  // Parse command line arguments
  const args = process.argv.slice(2);
  const noBannerIndex = args.indexOf('--no-banner');
  const noBanner = process.env.NO_BANNER === '1' || noBannerIndex !== -1;

  // Remove --no-banner from args if present
  if (noBannerIndex !== -1) {
    args.splice(noBannerIndex, 1);
  }

  // Pass filtered args to scanner
  process.argv = [process.argv[0], process.argv[1], ...args];

  renderBanner({ noBanner });

  try {
    await run();
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error.message);
    process.exit(1);
  }
}

main();
