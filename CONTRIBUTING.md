# Contributing to nodejs-nets-core

Thank you for your interest in contributing to nodejs-nets-core! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/nodejs-nets-core.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`

## Development Setup

1. Copy `.env.example` to `.env` and configure your environment
2. Set up PostgreSQL and Redis locally
3. Run tests: `npm test`
4. Build: `npm run build`

## Code Style

- We use TypeScript with strict mode enabled
- Follow the existing code style (enforced by ESLint and Prettier)
- Run `npm run lint` before committing
- Run `npm run format` to auto-format code

## Making Changes

1. Write clear, concise commit messages
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass: `npm test`
5. Update CHANGELOG.md with your changes

## Pull Request Process

1. Update the README.md with details of significant changes
2. Update the type definitions if you've added/changed APIs
3. The PR will be merged once you have sign-off from maintainers

## Testing

- Write unit tests for all new features
- Maintain or improve code coverage
- Test both success and error cases
- Use meaningful test descriptions

Example:

```typescript
describe('RequestParam', () => {
  it('should parse integer values correctly', () => {
    const param = new RequestParam('age', 'int');
    expect(param.getValue({ age: '25' })).toBe(25);
  });
});
```

## Documentation

- Add JSDoc comments for public APIs
- Update README.md for user-facing changes
- Add examples for new features
- Keep MIGRATION.md up to date

## Reporting Issues

- Use GitHub Issues
- Provide clear reproduction steps
- Include environment details (Node version, OS, etc.)
- Add relevant error messages and logs

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a positive community

## Questions?

Feel free to open an issue for questions or discussions.

Thank you for contributing! 🎉
