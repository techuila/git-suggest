import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ShellIntegrationOptions } from '../types';

export async function setupShellIntegration(options: ShellIntegrationOptions): Promise<void> {
  console.log(chalk.blue('Setting up shell integration for git-suggest...'));
  
  const shell = options.shell === 'auto' ? await detectShell() : options.shell;
  
  console.log(chalk.gray(`Detected shell: ${shell}`));
  
  try {
    switch (shell) {
      case 'bash':
        await setupBashIntegration();
        break;
      case 'zsh':
        await setupZshIntegration();
        break;
      case 'fish':
        await setupFishIntegration();
        break;
      default:
        throw new Error(`Unsupported shell: ${shell}`);
    }
    
    console.log(chalk.green('✓ Shell integration setup complete!'));
    console.log(chalk.blue('\nRestart your terminal or run:'));
    console.log(chalk.white(`source ~/.${shell}rc`));
    console.log(chalk.blue('\nThen try typing: git commit -m "feat('));
    
  } catch (error) {
    console.error(chalk.red('Failed to setup shell integration:'), error);
    throw error;
  }
}

async function detectShell(): Promise<'bash' | 'zsh' | 'fish'> {
  const shell = process.env.SHELL || '';
  
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('fish')) return 'fish';
  if (shell.includes('bash')) return 'bash';
  
  // Default to bash if we can't detect
  return 'bash';
}

async function setupBashIntegration(): Promise<void> {
  const bashrcPath = join(process.env.HOME || '', '.bashrc');
  const profilePath = join(process.env.HOME || '', '.bash_profile');
  
  const integrationScript = `
# git-suggest integration
_git_suggest_complete() {
    local cur prev
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    
    if [[ "\${COMP_WORDS[1]}" == "commit" && "\${prev}" == "-m" ]]; then
        # Generate suggestions when user types git commit -m
        local suggestions
        suggestions=$(git-suggest generate --no-interactive 2>/dev/null | grep -o '".*"' | tr -d '"' 2>/dev/null || echo "")
        if [[ -n "\$suggestions" ]]; then
            COMPREPLY=( $(compgen -W "\$suggestions" -- "\$cur") )
        fi
    fi
}

# Enable git-suggest completion for git command
complete -F _git_suggest_complete git
`;

  await appendToShellConfig(bashrcPath, integrationScript, 'bash');
  
  // Also try .bash_profile for macOS
  if (process.platform === 'darwin') {
    try {
      await appendToShellConfig(profilePath, integrationScript, 'bash');
    } catch {
      // Ignore if .bash_profile doesn't exist or can't be written
    }
  }
}

async function setupZshIntegration(): Promise<void> {
  const zshrcPath = join(process.env.HOME || '', '.zshrc');
  
  const integrationScript = `
# git-suggest integration
_git_suggest_complete() {
    local context state line
    typeset -A opt_args
    
    _arguments -C \\
        '1:command:->command' \\
        '*::arg:->args' && return 0
    
    case \$state in
        command)
            _values 'git command' \\
                'commit[Record changes to the repository]'
            ;;
        args)
            case \$line[1] in
                commit)
                    if [[ \$words[CURRENT-1] == "-m" ]]; then
                        # Generate suggestions when user types git commit -m
                        local suggestions
                        suggestions=($(git-suggest generate --no-interactive 2>/dev/null | grep -o '".*"' | tr -d '"' 2>/dev/null || echo ""))
                        if [[ \${#suggestions[@]} -gt 0 ]]; then
                            _describe 'commit messages' suggestions
                        fi
                    else
                        _git-commit
                    fi
                    ;;
            esac
            ;;
    esac
}

# Enable git-suggest completion
compdef _git_suggest_complete git
`;

  await appendToShellConfig(zshrcPath, integrationScript, 'zsh');
}

async function setupFishIntegration(): Promise<void> {
  const fishConfigDir = join(process.env.HOME || '', '.config', 'fish');
  const completionsDir = join(fishConfigDir, 'completions');
  
  // Ensure completions directory exists
  try {
    await fs.mkdir(completionsDir, { recursive: true });
  } catch {
    // Directory might already exist
  }
  
  const completionScript = `
# git-suggest completion for fish shell
function __git_suggest_complete
    set -l cmd (commandline -opc)
    
    if test (count $cmd) -ge 3
        if test $cmd[2] = "commit"; and test $cmd[3] = "-m"
            # Generate suggestions when user types git commit -m
            set -l suggestions (git-suggest generate --no-interactive 2>/dev/null | grep -o '".*"' | tr -d '"' 2>/dev/null)
            if test -n "$suggestions"
                for suggestion in $suggestions
                    echo $suggestion
                end
            end
        end
    end
end

# Register completion for git commit -m
complete -c git -n '__fish_git_using_command commit' -s m -l message -a '(__git_suggest_complete)'
`;

  const completionPath = join(completionsDir, 'git-suggest.fish');
  await fs.writeFile(completionPath, completionScript);
}

async function appendToShellConfig(configPath: string, script: string, shellName: string): Promise<void> {
  const marker = '# git-suggest integration';
  
  try {
    // Check if file exists and read it
    let content = '';
    try {
      content = await fs.readFile(configPath, 'utf8');
    } catch {
      // File doesn't exist, that's okay
    }
    
    // Check if integration is already present
    if (content.includes(marker)) {
      console.log(chalk.yellow(`⚠ git-suggest integration already exists in ${configPath}`));
      
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Overwrite existing integration?',
          default: false
        }
      ]);
      
      if (!overwrite) {
        return;
      }
      
      // Remove existing integration
      const lines = content.split('\n');
      const startIndex = lines.findIndex(line => line.includes(marker));
      if (startIndex !== -1) {
        const endIndex = lines.findIndex((line, index) => 
          index > startIndex && line.trim() === '' && 
          !lines[index + 1]?.startsWith('#') && 
          !lines[index + 1]?.trim().startsWith('_')
        );
        
        if (endIndex !== -1) {
          lines.splice(startIndex, endIndex - startIndex + 1);
          content = lines.join('\n');
        }
      }
    }
    
    // Append new integration
    const newContent = content + '\n' + script + '\n';
    await fs.writeFile(configPath, newContent);
    
    console.log(chalk.green(`✓ Added integration to ${configPath}`));
    
  } catch (error) {
    throw new Error(`Failed to update ${shellName} configuration: ${error instanceof Error ? error.message : error}`);
  }
}