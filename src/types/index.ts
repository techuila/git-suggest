export interface CommitOptions {
  prefix?: string;
  type?: string;
  scope?: string;
  interactive?: boolean;
}

export interface GitChange {
  file: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  diff?: string;
}

export interface CommitSuggestion {
  message: string;
  confidence: number;
  reasoning?: string;
}

export interface ShellIntegrationOptions {
  shell: 'bash' | 'zsh' | 'fish' | 'auto';
}

export type CommitType = 
  | 'feat'     // New feature
  | 'fix'      // Bug fix
  | 'docs'     // Documentation only changes
  | 'style'    // Changes that do not affect the meaning of the code
  | 'refactor' // Code change that neither fixes a bug nor adds a feature
  | 'perf'     // Code change that improves performance
  | 'test'     // Adding missing tests or correcting existing tests
  | 'chore'    // Changes to the build process or auxiliary tools
  | 'ci'       // Changes to CI configuration files and scripts
  | 'build'    // Changes that affect the build system or external dependencies
  | 'revert';  // Reverts a previous commit