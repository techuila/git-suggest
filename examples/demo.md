# git-suggest Demo

This document shows how to use git-suggest in various scenarios.

## Basic Usage

```bash
# Stage some changes
git add src/components/LoginForm.tsx

# Generate a commit message
git-suggest generate
```

Output:
```
📝 Suggested commit message:
"feat(auth): add login form component with validation"

? What would you like to do?
❯ Use this message
  Edit this message  
  Generate another suggestion
  Cancel
```

## With Type and Scope

```bash
# Generate with specific type and scope
git-suggest generate --type fix --scope validation
```

Output:
```
📝 Suggested commit message:
"fix(validation): handle empty email input correctly"
```

## Non-Interactive Mode

```bash
# Generate without prompts
git-suggest generate --no-interactive
```

Output:
```
📝 Suggested commit message:
"feat(ui): add responsive navigation component"

To use this commit message, run:
git commit -m "feat(ui): add responsive navigation component"
```

## Shell Integration

After running `git-suggest setup`, you can use autocomplete:

```bash
git commit -m "feat: <TAB>
# Suggests: "feat(data-validation): add email format validation"
```

## Different Commit Types

### Feature Addition
```bash
# Added new user registration
git add src/auth/register.ts
git-suggest generate
# Output: "feat(auth): add user registration with email verification"
```

### Bug Fix
```bash
# Fixed validation bug
git add src/utils/validation.js
git-suggest generate
# Output: "fix(validation): prevent null pointer exception in email check"
```

### Documentation
```bash
# Updated README
git add README.md
git-suggest generate
# Output: "docs: update installation and usage instructions"
```

### Refactoring
```bash
# Refactored user service
git add src/services/userService.ts
git-suggest generate
# Output: "refactor(services): extract user validation logic"
```

### Tests
```bash
# Added unit tests
git add tests/auth.test.ts
git-suggest generate
# Output: "test(auth): add unit tests for login validation"
```
