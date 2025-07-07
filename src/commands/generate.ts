import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { CommitOptions, CommitType } from '../types';
import { GitUtils } from '../utils/git';
import { CopilotUtils } from '../utils/copilot';

const COMMIT_TYPES: { value: CommitType; name: string; description: string }[] = [
  { value: 'feat', name: 'feat', description: 'A new feature' },
  { value: 'fix', name: 'fix', description: 'A bug fix' },
  { value: 'docs', name: 'docs', description: 'Documentation only changes' },
  { value: 'style', name: 'style', description: 'Changes that do not affect the meaning of the code' },
  { value: 'refactor', name: 'refactor', description: 'A code change that neither fixes a bug nor adds a feature' },
  { value: 'perf', name: 'perf', description: 'A code change that improves performance' },
  { value: 'test', name: 'test', description: 'Adding missing tests or correcting existing tests' },
  { value: 'chore', name: 'chore', description: 'Changes to the build process or auxiliary tools' },
  { value: 'ci', name: 'ci', description: 'Changes to CI configuration files and scripts' },
  { value: 'build', name: 'build', description: 'Changes that affect the build system or external dependencies' },
  { value: 'revert', name: 'revert', description: 'Reverts a previous commit' }
];

export async function generateCommitMessage(options: CommitOptions): Promise<void> {
  const spinner = ora('Analyzing staged changes...').start();
  
  try {
    // Get staged changes
    const changes = await GitUtils.getStagedChanges();
    spinner.succeed(`Found ${changes.length} staged file(s)`);
    
    // Show summary of changes
    console.log(chalk.blue('\nStaged changes:'));
    changes.forEach(change => {
      const icon = getStatusIcon(change.status);
      const stats = change.additions || change.deletions 
        ? chalk.gray(` (+${change.additions}/-${change.deletions})`)
        : '';
      console.log(`  ${icon} ${change.file}${stats}`);
    });
    
    // Interactive mode for additional options
    if (options.interactive !== false && !options.prefix && !options.type) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Select commit type:',
          choices: [
            { name: 'Auto-detect (recommended)', value: null },
            new inquirer.Separator(),
            ...COMMIT_TYPES.map(type => ({
              name: `${type.name} - ${type.description}`,
              value: type.value
            }))
          ],
          when: !options.type
        },
        {
          type: 'input',
          name: 'scope',
          message: 'Enter scope (optional):',
          when: (answers: any) => !options.scope && (answers.type || options.type)
        }
      ]);
      
      Object.assign(options, answers);
    }
    
    // Generate commit message
    const generateSpinner = ora('Generating commit message with GitHub Copilot...').start();
    
    try {
      const suggestion = await CopilotUtils.generateCommitMessage(changes, options);
      generateSpinner.succeed('Commit message generated');
      
      // Display the suggestion
      console.log(chalk.green('\n📝 Suggested commit message:'));
      console.log(chalk.white.bold(`"${suggestion.message}"`));
      
      if (suggestion.confidence < 0.7) {
        console.log(chalk.yellow(`⚠ Confidence: ${Math.round(suggestion.confidence * 100)}%`));
      }
      
      if (suggestion.reasoning) {
        console.log(chalk.gray(`💡 ${suggestion.reasoning}`));
      }
      
      // Interactive confirmation
      if (options.interactive !== false) {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Use this message', value: 'use' },
              { name: 'Edit this message', value: 'edit' },
              { name: 'Generate another suggestion', value: 'regenerate' },
              { name: 'Cancel', value: 'cancel' }
            ]
          }
        ]);
        
        switch (action) {
          case 'use':
            await commitWithMessage(suggestion.message);
            break;
          case 'edit':
            const { editedMessage } = await inquirer.prompt([
              {
                type: 'input',
                name: 'editedMessage',
                message: 'Edit commit message:',
                default: suggestion.message
              }
            ]);
            await commitWithMessage(editedMessage);
            break;
          case 'regenerate':
            console.log(chalk.blue('\nRegenerating...'));
            return generateCommitMessage(options);
          case 'cancel':
            console.log(chalk.yellow('Cancelled'));
            return;
        }
      } else {
        // Non-interactive mode - just output the message
        console.log(chalk.blue('\nTo use this commit message, run:'));
        console.log(chalk.white(`git commit -m "${suggestion.message}"`));
      }
      
    } catch (error) {
      generateSpinner.fail('Failed to generate commit message');
      throw error;
    }
    
  } catch (error) {
    spinner.fail('Failed to analyze changes');
    throw error;
  }
}

async function commitWithMessage(message: string): Promise<void> {
  const spinner = ora('Creating commit...').start();
  
  try {
    const { execSync } = require('child_process');
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    spinner.succeed(`Committed: ${message}`);
    
    // Show the commit hash
    try {
      const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      console.log(chalk.gray(`Commit hash: ${hash}`));
    } catch {
      // Ignore if we can't get the hash
    }
    
  } catch (error) {
    spinner.fail('Failed to create commit');
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    
    console.log(chalk.blue('\nYou can manually commit with:'));
    console.log(chalk.white(`git commit -m "${message}"`));
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'added': return chalk.green('A');
    case 'modified': return chalk.yellow('M');
    case 'deleted': return chalk.red('D');
    case 'renamed': return chalk.blue('R');
    default: return chalk.gray('?');
  }
}