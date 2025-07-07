import { execSync } from 'child_process';
import { GitChange, CommitSuggestion, CommitType } from '../types';

export class CopilotUtils {
  static async generateCommitMessage(
    changes: GitChange[],
    options: {
      prefix?: string;
      type?: string;
      scope?: string;
    } = {}
  ): Promise<CommitSuggestion> {
    const context = this.buildContext(changes, options);
    
    try {
      const prompt = this.buildPrompt(context, options);
      const response = await this.callCopilot(prompt);
      
      return {
        message: this.parseResponse(response, options),
        confidence: this.calculateConfidence(response, changes),
        reasoning: this.extractReasoning(response)
      };
    } catch (error) {
      throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : error}`);
    }
  }

  private static buildContext(changes: GitChange[], options: any): string {
    const filesSummary = changes.map(change => {
      const status = change.status.charAt(0).toUpperCase() + change.status.slice(1);
      const stats = change.additions || change.deletions 
        ? ` (+${change.additions}/-${change.deletions})`
        : '';
      return `${status}: ${change.file}${stats}`;
    }).join('\n');

    const diffSummary = changes
      .filter(change => change.diff && change.diff.length < 2000) // Limit diff size
      .map(change => `\n--- ${change.file} ---\n${change.diff}`)
      .join('\n');

    return `Files changed:\n${filesSummary}\n\nDiff summary:${diffSummary}`;
  }

  private static buildPrompt(context: string, options: any): string {
    const typeHint = options.type ? `Type: ${options.type}` : '';
    const scopeHint = options.scope ? `Scope: ${options.scope}` : '';
    const prefixHint = options.prefix ? `Prefix: ${options.prefix}` : '';

    return `You are an expert at writing conventional commit messages. Based on the following git changes, generate a concise, descriptive commit message following conventional commit format.

${typeHint}
${scopeHint}
${prefixHint}

Rules:
1. Use conventional commit format: type(scope): description
2. Keep the description under 50 characters when possible
3. Use present tense ("add" not "added")
4. Don't capitalize the first letter of description
5. No period at the end
6. Choose appropriate type: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert
7. Include scope if it's clear from the changes
8. Focus on WHAT changed and WHY, not HOW

Git changes:
${context}

Respond with just the commit message, nothing else.`;
  }

  private static async callCopilot(prompt: string): Promise<string> {
    try {
      // Use gh copilot suggest for commit message generation
      const command = `gh copilot suggest -t shell "${prompt.replace(/"/g, '\\"')}"`;
      
      const response = execSync(command, {
        encoding: 'utf8',
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      return response.trim();
    } catch (error) {
      // Fallback to a simpler approach if copilot suggest fails
      try {
        const simpleCommand = `echo "${prompt}" | gh copilot explain`;
        const response = execSync(simpleCommand, {
          encoding: 'utf8',
          timeout: 15000
        });
        return response.trim();
      } catch {
        throw new Error('GitHub Copilot CLI is not responding. Please check your authentication and subscription.');
      }
    }
  }

  private static parseResponse(response: string, options: any): string {
    // Extract commit message from copilot response
    const lines = response.split('\n').filter(line => line.trim());
    
    // Look for lines that look like commit messages
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip explanatory text
      if (trimmed.includes('suggest') || trimmed.includes('command') || trimmed.includes('git commit')) {
        continue;
      }
      
      // Look for conventional commit format
      if (this.isValidCommitMessage(trimmed)) {
        return this.enhanceWithOptions(trimmed, options);
      }
    }
    
    // Fallback: use the first non-empty line
    const fallback = lines.find(line => line.trim().length > 0)?.trim();
    return this.enhanceWithOptions(fallback || 'update: staged changes', options);
  }

  private static isValidCommitMessage(message: string): boolean {
    // Check if message follows conventional commit format
    const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?: .+/;
    return conventionalPattern.test(message) && message.length <= 100;
  }

  private static enhanceWithOptions(message: string, options: any): string {
    if (options.prefix) {
      return `${options.prefix} ${message}`;
    }
    
    if (options.type && options.scope) {
      // Replace or add type and scope
      const withoutType = message.replace(/^[a-z]+(\(.+\))?: /, '');
      return `${options.type}(${options.scope}): ${withoutType}`;
    }
    
    if (options.type) {
      // Replace or add type
      const withoutType = message.replace(/^[a-z]+(\(.+\))?: /, '');
      return `${options.type}: ${withoutType}`;
    }
    
    return message;
  }

  private static calculateConfidence(response: string, changes: GitChange[]): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on response quality
    if (this.isValidCommitMessage(response)) confidence += 0.3;
    if (response.length > 10 && response.length < 80) confidence += 0.1;
    if (changes.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private static extractReasoning(response: string): string {
    // Extract any explanatory text from the response
    const lines = response.split('\n');
    const explanations = lines.filter(line => 
      line.includes('because') || 
      line.includes('since') || 
      line.includes('This commit')
    );
    
    return explanations.join(' ').trim() || 'Generated based on staged changes';
  }
}