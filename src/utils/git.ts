import { execSync } from 'child_process';
import { GitChange } from '../types';

export class GitUtils {
  static async getStagedChanges(): Promise<GitChange[]> {
    try {
      const statusOutput = execSync('git status --porcelain --staged', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });

      if (!statusOutput.trim()) {
        throw new Error('No staged changes found. Please stage your changes with "git add" first.');
      }

      const changes: GitChange[] = [];
      const lines = statusOutput.trim().split('\n');

      for (const line of lines) {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        
        let changeType: GitChange['status'];
        if (status.includes('A')) changeType = 'added';
        else if (status.includes('M')) changeType = 'modified';
        else if (status.includes('D')) changeType = 'deleted';
        else if (status.includes('R')) changeType = 'renamed';
        else changeType = 'modified';

        const stats = await this.getFileStats(file, changeType);
        const diff = await this.getFileDiff(file, changeType);

        changes.push({
          file,
          status: changeType,
          additions: stats.additions,
          deletions: stats.deletions,
          diff
        });
      }

      return changes;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not a git repository')) {
        throw new Error('Not in a Git repository. Please run this command from within a Git repository.');
      }
      throw error;
    }
  }

  private static async getFileStats(file: string, status: GitChange['status']): Promise<{ additions: number; deletions: number }> {
    try {
      if (status === 'deleted') {
        return { additions: 0, deletions: 0 };
      }

      const output = execSync(`git diff --cached --numstat "${file}"`, { 
        encoding: 'utf8',
        cwd: process.cwd()
      });

      const [additions, deletions] = output.trim().split('\t').map(n => parseInt(n) || 0);
      return { additions, deletions };
    } catch {
      return { additions: 0, deletions: 0 };
    }
  }

  private static async getFileDiff(file: string, status: GitChange['status']): Promise<string> {
    try {
      if (status === 'deleted') {
        return `File deleted: ${file}`;
      }

      const output = execSync(`git diff --cached "${file}"`, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 // 1MB limit for diff output
      });

      return output.trim();
    } catch {
      return `Unable to get diff for ${file}`;
    }
  }

  static async getCurrentBranch(): Promise<string> {
    try {
      const branch = execSync('git branch --show-current', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      return branch.trim();
    } catch {
      return 'main';
    }
  }

  static async getRecentCommits(count: number = 5): Promise<string[]> {
    try {
      const output = execSync(`git log --oneline -n ${count}`, { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      return output.trim().split('\n').filter(line => line.trim());
    } catch {
      return [];
    }
  }

  static async getRepositoryContext(): Promise<{ name: string; remote?: string }> {
    try {
      const remoteOutput = execSync('git remote get-url origin', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const remote = remoteOutput.trim();
      const name = remote.split('/').pop()?.replace('.git', '') || 'unknown';
      
      return { name, remote };
    } catch {
      const pwd = process.cwd();
      const name = pwd.split('/').pop() || 'unknown';
      return { name };
    }
  }
}