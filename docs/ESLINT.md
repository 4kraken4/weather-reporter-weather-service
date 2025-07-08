# ESLint Configuration Guide

This document provides a comprehensive guide to the ESLint configuration used in this Node.js weather service project.

## Overview

The project uses a modern ESLint flat configuration with security plugins and file-type-specific overrides to ensure code quality, security, and developer productivity. The configuration is designed to be consistent across all environments without environment-specific rule variations.

## Configuration Structure

### Core Plugins Used

- **@eslint/js**: Basic JavaScript rules
- **eslint-plugin-prettier**: Code formatting integration
- **eslint-plugin-import**: ES6+ import/export linting
- **eslint-plugin-security**: Security vulnerability detection
- **eslint-plugin-n**: Node.js specific rules
- **eslint-config-prettier**: Disables conflicting rules with Prettier

### File-Specific Configurations

#### 1. Database and Setup Files (`db/`, `jest.setup.js`)

- **Globals**: Node.js + Jest
- **Special Rules**:
  - `no-console`: OFF (logging is expected)
  - `security/detect-object-injection`: OFF (common in DB operations)

#### 2. Main Application Files (`src/`)

- **Plugins**: All security and import plugins enabled
- **Consistent rules**: Same severity across all environments
- **Security**: Full security plugin suite with warnings

#### 3. Test Files (`*.test.js`, `*.spec.js`, `tests/`)

- **Globals**: Node.js + Jest
- **Relaxed Rules**:
  - `no-console`: OFF
  - `no-unused-expressions`: OFF (for expect statements)
  - `prefer-const`: OFF (test readability)
  - Security rules relaxed for test data

#### 4. Script Files (`scripts/`)

- **Most Permissive**: Allows console, process.exit, file operations
- **Security**: Disabled for utility scripts
- **Globals**: Node.js + Jest (for test scripts)

#### 5. Infrastructure & ORM Files

- **Files**: `src/infrastructure/`, `*Repository*.js`, `*Schema*.js`
- **Special Allowances**:
  - `no-useless-constructor`: WARN (ORM patterns)
  - `security/detect-non-literal-regexp`: OFF (search functionality)
  - `security/detect-unsafe-regex`: OFF (search patterns)
  - `prefer-destructuring`: OFF (database field access)

#### 6. Configuration Files

- **Files**: `*.config.js`, `.eslintrc.js`
- **Rules**: Minimal restrictions for config syntax

### Consistent Rule Configuration

The ESLint configuration maintains consistent rules across all environments for predictable behavior:

**Core Principles:**

- `no-console`: Always WARN (allows console logging but highlights it)
- `no-debugger`: Always WARN (highlights debugging statements)
- `no-unused-vars`: Always WARN (catches dead code without blocking development)
- `security/detect-object-injection`: Always WARN (highlights potential security issues)

This approach ensures that:

- Code quality is consistent regardless of environment
- Developers see the same warnings locally as in CI/CD
- No surprises when moving between development and production builds
- Security issues are always highlighted for review

## Security Rules

### Enabled Security Checks

- **Object Injection**: Detects `obj[prop]` where prop is user input
- **Unsafe RegExp**: Flags potentially catastrophic backtracking
- **Non-literal RegExp**: Warns about dynamic regex construction
- **Buffer NoAssert**: Prevents buffer overflow vulnerabilities
- **Child Process**: Warns about command execution
- **Eval Detection**: Prevents code injection via eval
- **File System**: Warns about dynamic file paths
- **Timing Attacks**: Detects potential timing vulnerabilities
- **Crypto Weaknesses**: Flags weak random number generation

### Security Rule Severity

- **Errors**: Critical security issues (eval, buffer overflow, weak crypto)
- **Warnings**: Potential issues that need review (object injection, unsafe regex)
- **Off**: Rules that are too noisy for specific file types

## Import Rules

### Import Organization

```javascript
'import/order': [
  'error',
  {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    'newlines-between': 'always',
    alphabetize: { order: 'asc', caseInsensitive: true }
  }
]
```

### Import Validation

- **No Unresolved**: Ensures all imports can be resolved
- **No Duplicates**: Prevents duplicate imports
- **No Default Export**: Disabled (allows default exports)

## Node.js Rules

- **No Unsupported Features**: OFF (allows modern ES features)
- **No Missing Import**: OFF (handled by import plugin)
- **No Process Exit**: WARN (except in scripts)
- **No Deprecated API**: ERROR (prevents deprecated Node.js usage)

## Best Practices Rules

### Code Quality

- **Prefer Const**: Enforces immutability where possible
- **No Var**: Prevents `var` usage
- **Arrow Spacing**: Consistent arrow function formatting
- **Object Shorthand**: Encourages `{name}` over `{name: name}`
- **Prefer Template**: Encourages template literals over concatenation

### Error Prevention

- **No Unused Variables**: Prevents dead code (with `_` prefix exception)
- **No Duplicate Imports**: Prevents import conflicts
- **Array Callback Return**: Ensures array methods return values
- **No Useless Catch**: Prevents empty catch blocks
- **No Self Compare**: Prevents `x === x` comparisons

### Modern JavaScript

- **Prefer Destructuring**: Encourages object/array destructuring
- **Prefer Rest Params**: Encourages `...args` over `arguments`
- **Prefer Spread**: Encourages spread operator
- **No Useless Constructor**: Prevents empty constructors
- **No Useless Rename**: Prevents `{a: a}` destructuring

## Usage Commands

### Lint All Files

```bash
npm run lint
```

### Lint Specific Files

```bash
npx eslint src/
npx eslint "src/**/*.js"
npx eslint tests/
```

### Auto-fix Issues

```bash
npm run lint:fix
npx eslint --fix src/
```

### Check Specific Rules

```bash
npx eslint --rule "no-console: error" src/
npx eslint --rule "security/detect-unsafe-regex: warn" src/
```

## Common Issues and Solutions

### 1. Unused ESLint Disable Comments

**Issue**: `Unused eslint-disable directive`
**Solution**: Remove unnecessary `// eslint-disable-next-line` comments

### 2. Security Warnings in Search Functions

**Issue**: `security/detect-unsafe-regex` in search functionality
**Solution**: Already configured to be warnings, review regex patterns for complexity

### 3. Object Injection Warnings

**Issue**: `security/detect-object-injection` on `obj[key]` access
**Solution**:

- Use `Object.hasOwnProperty.call(obj, key)` for safety
- Or add specific disable comments for validated cases

### 4. Constructor Issues in ORM

**Issue**: `no-useless-constructor` in repository classes
**Solution**: Already configured as warning for infrastructure files

### 5. Import Order Issues

**Issue**: Imports not organized correctly
**Solution**: Run `npx eslint --fix` to auto-organize imports

## IDE Integration

### VS Code

The configuration works automatically with the ESLint extension:

- Install: `ms-vscode.vscode-eslint`
- Auto-fix on save: Add to settings.json:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript"]
}
```

### Other IDEs

Most modern IDEs support ESLint through plugins. The flat config format is supported in:

- ESLint v8.21.0+
- VS Code ESLint extension v2.4.0+
- WebStorm 2023.1+
- Vim/Neovim with appropriate plugins

## Customization

### Adding New Rules

Add to the appropriate file configuration in `eslint.config.js`:

```javascript
{
  files: ['your-pattern/**/*.js'],
  rules: {
    'your-rule': 'error'
  }
}
```

### Ignoring Files

Add patterns to the ignores array:

```javascript
{
  ignores: ['dist', 'build', 'your-generated-files/**'];
}
```

## Performance Considerations

### File Patterns

The configuration uses specific file patterns to apply rules only where needed:

- Database files: Different rules than application code
- Test files: Relaxed rules for test patterns
- Scripts: Minimal restrictions
- Infrastructure: Balanced between security and flexibility

### Plugin Loading

Plugins are loaded only for relevant file types to improve performance:

- Security plugins: Only for main application files
- Jest globals: Only for test and setup files
- Import rules: Consistent across all ES modules

### Rule Severity

Rules are tuned for practical development:

- Critical security issues: Errors
- Code quality issues: Warnings in development, errors in production
- Style issues: Handled by Prettier integration

This configuration balances security, code quality, and developer experience while providing flexibility for different types of files in the project.
