#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { generateCommitMessage } from './commands/generate';
import { setupShellIntegration } from './commands/setup';
import { checkPrerequisites } from './utils/prerequisites';

const program = new Command();

program
  .name('git-suggest')
  .description('Generate contextual Git commit messages powered by GitHub Copilot CLI')
  .version('1.0.2');

program
  .command('generate')
  .alias('g')
  .description('Generate a commit message based on staged changes')
  .option('-p, --prefix <prefix>', 'Prefix for the commit message (e.g., "feat(auth):")')
  .option('-t, --type <type>', 'Commit type (feat, fix, docs, style, refactor, test, chore)')
  .option('-s, --scope <scope>', 'Commit scope')
  .option('--no-interactive', 'Skip interactive mode')
  .action(async (options) => {
    try {
      await checkPrerequisites();
      await generateCommitMessage(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Setup shell integration for git commit autocomplete')
  .option('--shell <shell>', 'Shell type (bash, zsh, fish)', 'auto')
  .action(async (options) => {
    try {
      await setupShellIntegration(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Check if all prerequisites are installed')
  .action(async () => {
    try {
      await checkPrerequisites(true);
      console.log(chalk.green('✓ All prerequisites are installed and configured'));
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();