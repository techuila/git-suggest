import { execSync } from 'child_process';
import chalk from 'chalk';

export async function checkPrerequisites(verbose: boolean = false): Promise<void> {
  const checks = [
    { name: 'Git', command: 'git --version', required: true },
    { name: 'GitHub CLI', command: 'gh --version', required: true },
    { name: 'GitHub Copilot CLI', command: 'gh copilot --help', required: true }
  ];

  const results: { name: string; installed: boolean; version?: string; error?: string }[] = [];

  for (const check of checks) {
    try {
      const output = execSync(check.command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 5000
      });
      
      const version = output.split('\n')[0].trim();
      results.push({ name: check.name, installed: true, version });
      
      if (verbose) {
        console.log(chalk.green(`✓ ${check.name}: ${version}`));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ name: check.name, installed: false, error: errorMessage });
      
      if (verbose) {
        console.log(chalk.red(`✗ ${check.name}: Not installed or not accessible`));
      }
    }
  }

  const missingRequired = results.filter(r => !r.installed);
  
  if (missingRequired.length > 0) {
    console.error(chalk.red('\nMissing required dependencies:'));
    
    for (const missing of missingRequired) {
      console.error(chalk.red(`  ✗ ${missing.name}`));
      
      switch (missing.name) {
        case 'Git':
          console.error(chalk.yellow('    Install from: https://git-scm.com/downloads'));
          break;
        case 'GitHub CLI':
          console.error(chalk.yellow('    Install with: npm install -g @github/gh'));
          console.error(chalk.yellow('    Or visit: https://cli.github.com/'));
          break;
        case 'GitHub Copilot CLI':
          console.error(chalk.yellow('    Install with: gh extension install github/gh-copilot'));
          console.error(chalk.yellow('    Requires GitHub Copilot subscription'));
          break;
      }
    }
    
    throw new Error(`Missing ${missingRequired.length} required dependencies. Please install them and try again.`);
  }

  // Check GitHub CLI authentication
  try {
    execSync('gh auth status', { stdio: 'pipe', timeout: 5000 });
    if (verbose) {
      console.log(chalk.green('✓ GitHub CLI: Authenticated'));
    }
  } catch {
    console.warn(chalk.yellow('⚠ GitHub CLI: Not authenticated. Run "gh auth login" to authenticate.'));
  }
}

export async function installPrerequisites(): Promise<void> {
  console.log(chalk.blue('Installing prerequisites...'));
  
  const platform = process.platform;
  
  try {
    // Check if GitHub CLI is installed
    try {
      execSync('gh --version', { stdio: 'pipe' });
      console.log(chalk.green('✓ GitHub CLI already installed'));
    } catch {
      console.log(chalk.yellow('Installing GitHub CLI...'));
      
      if (platform === 'darwin') {
        // macOS - try homebrew first, then npm
        try {
          execSync('brew install gh', { stdio: 'inherit' });
        } catch {
          execSync('npm install -g @github/gh', { stdio: 'inherit' });
        }
      } else if (platform === 'win32') {
        // Windows - use npm
        execSync('npm install -g @github/gh', { stdio: 'inherit' });
      } else {
        // Linux - use npm
        execSync('npm install -g @github/gh', { stdio: 'inherit' });
      }
      
      console.log(chalk.green('✓ GitHub CLI installed'));
    }
    
    // Install GitHub Copilot CLI extension
    try {
      execSync('gh copilot --help', { stdio: 'pipe' });
      console.log(chalk.green('✓ GitHub Copilot CLI already installed'));
    } catch {
      console.log(chalk.yellow('Installing GitHub Copilot CLI extension...'));
      execSync('gh extension install github/gh-copilot', { stdio: 'inherit' });
      console.log(chalk.green('✓ GitHub Copilot CLI extension installed'));
    }
    
    console.log(chalk.green('\n✓ All prerequisites installed successfully!'));
    console.log(chalk.blue('\nNext steps:'));
    console.log(chalk.blue('1. Authenticate with GitHub: gh auth login'));
    console.log(chalk.blue('2. Ensure you have GitHub Copilot subscription'));
    console.log(chalk.blue('3. Run: git-suggest setup'));
    
  } catch (error) {
    console.error(chalk.red('Failed to install prerequisites:'), error);
    throw error;
  }
}