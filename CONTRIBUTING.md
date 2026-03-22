# Contributing to Score

Thank you for contributing to Score.

## Contributor License Agreement

**All contributors must agree to the [Contributor License Agreement](CLA.md)
before their pull request can be merged.**

By opening a pull request, you automatically agree to the CLA terms. No
separate signature is required — your PR submission is your agreement.

## Code Standards

All contributions must follow the project thesis:

- Zero `let` — `const` everywhere
- Zero `class` — factory functions only
- Pure functions by default
- Append-only state — new versions, not mutations
- IO and hardware boundaries annotated explicitly with `// BOUNDARY — [reason]`

Contributions that do not follow these standards will receive a change request.

## Pull Request Process

1. Fork the repository and create your branch from `dev`
2. Write tests for any new functionality
3. Ensure all existing tests pass (`pnpm test`)
4. Add TSDoc comments to all public exports
5. Open your PR against `dev` (not `main`)
6. A maintainer will review and merge

## Reporting Issues

Open an issue on GitHub. For security issues, email bree@breeyard.com directly.

## License

By contributing, you agree that your contributions will be licensed under the
same terms as the project. See [LICENSE](LICENSE) and [CLA.md](CLA.md).
