# git-suggest 🤖

A lightweight command-line tool that automatically generates and suggests contextual, high-quality Git commit messages based on your staged code changes. Powered by GitHub Copilot CLI, it helps you write smarter commits with less typing.

## Features

- **AI-Powered**: Uses GitHub Copilot CLI to generate intelligent commit messages
- **Contextual**: Analyzes your staged changes to create relevant commit messages
- **Conventional Commits**: Follows semantic commit message conventions
- **Shell Integration**: Auto-complete support for `git commit -m` commands
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Interactive Mode**: Choose from suggestions or edit messages before committing
- **Type Detection**: Automatically detects commit types (feat, fix, docs, etc.)

## Quick Start

### Installation

```bash
npm install -g git-suggest
```

### Prerequisites

git-suggest requires:
- [Git](https://git-scm.com/) 
- [GitHub CLI](https://cli.github.com/)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli)
- GitHub Copilot subscription

The installation script will attempt to install missing prerequisites automatically.


### 🛠️ Setup

1. **Authenticate with GitHub:**
   ```bash
   gh auth login
   ```

2. **Setup shell integration:**
   ```bash
   git-suggest setup
   ```

3. **Restart your terminal** or source your shell config:
   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```

## 📖 Usage

### Basic Usage

1. **Stage your changes:**
   ```bash
   git add .
   ```

2. **Generate a commit message:**
   ```bash
   git-suggest generate
   ```

3. **Or use the shorthand:**
   ```bash
   git-suggest g
   ```

### Interactive Mode

The tool will analyze your staged changes and present you with options:

```
📝 Suggested commit message:
"feat(auth): add OAuth2 login integration"

? What would you like to do?
❯ Use this message
  Edit this message  
  Generate another suggestion
  Cancel
```

### Shell Integration

After running `git-suggest setup`, you can get autocomplete suggestions when typing:

```bash
git commit -m "feat(data-<TAB>
# Automatically suggests: "feat(data-validation): add email format validation"
```

### Command Options

```bash
# Generate with specific type
git-suggest generate --type feat

# Generate with scope
git-suggest generate --type fix --scope auth

# Generate with custom prefix
git-suggest generate --prefix "hotfix:"

# Non-interactive mode
git-suggest generate --no-interactive
```

### Available Commands

- `git-suggest generate` - Generate commit message from staged changes
- `git-suggest setup` - Setup shell integration
- `git-suggest check` - Check if prerequisites are installed
- `git-suggest --help` - Show help information

## 🎯 Commit Types

git-suggest supports all conventional commit types:

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that do not affect the meaning of the code |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `perf` | A code change that improves performance |
| `test` | Adding missing tests or correcting existing tests |
| `chore` | Changes to the build process or auxiliary tools |
| `ci` | Changes to CI configuration files and scripts |
| `build` | Changes that affect the build system or external dependencies |
| `revert` | Reverts a previous commit |

## 🔧 Configuration

### Shell Support

git-suggest supports:
- **Bash** (Linux, macOS, Windows WSL)
- **Zsh** (macOS default, Linux)
- **Fish** (Cross-platform)

### Environment Variables

- `SHELL` - Automatically detected shell type
- `HOME` - User home directory for config files

## 📋 Examples

### Example 1: New Feature
```bash
# You added a new login component
git add src/components/Login.tsx
git-suggest generate

# Output: "feat(auth): add login component with form validation"
```

### Example 2: Bug Fix
```bash
# You fixed a validation bug
git add src/utils/validation.js
git-suggest generate

# Output: "fix(validation): handle empty email input correctly"
```

### Example 3: Documentation
```bash
# You updated the README
git add README.md
git-suggest generate

# Output: "docs: update installation instructions"
```

## 🔧 Troubleshooting

### Permission Denied Error

If you get a "permission denied" error when running `git-suggest`:

```bash
# Fix permissions manually
chmod +x $(which git-suggest)

# Or if installed globally
sudo chmod +x /usr/local/bin/git-suggest
```

### Command Not Found

If `git-suggest` command is not found after global installation:

1. **Check if npm global bin is in PATH:**
   ```bash
   npm config get prefix
   echo $PATH
   ```

2. **Add npm global bin to PATH** (add to your shell config):
   ```bash
   export PATH="$(npm config get prefix)/bin:$PATH"
   ```

3. **Restart your terminal** or source your shell config

### Prerequisites Issues

If you encounter issues with GitHub CLI or Copilot:

```bash
# Check prerequisites
git-suggest check

# Manually install GitHub CLI
# macOS
brew install gh
# or
npm install -g @github/gh

# Install Copilot extension
gh extension install github/gh-copilot

# Authenticate
gh auth login
```

## 🛠️ Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/techuila/git-suggest.git
cd git-suggest

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git-suggest generate` 😉)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [GitHub Copilot](https://github.com/features/copilot) for the AI-powered suggestions
- [Conventional Commits](https://www.conventionalcommits.org/) for the commit message format
- [Commander.js](https://github.com/tj/commander.js/) for the CLI framework

## 📞 Support

- 🐛 [Report bugs](https://github.com/techuila/git-suggest/issues)
- 💡 [Request features](https://github.com/techuila/git-suggest/issues)
- 📖 [Documentation](https://github.com/techuila/git-suggest/wiki)

## 🔗 Related Projects

- [commitizen](https://github.com/commitizen/cz-cli) - Command line utility to format commit messages
- [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) - Generate changelogs from conventional commits
- [husky](https://github.com/typicode/husky) - Git hooks made easy

---

Made with ❤️ by developers, for developers. Happy committing! 🎉
