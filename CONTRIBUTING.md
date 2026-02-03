# Contributing to Delivery App

We welcome pull requests and issues that improve the platform. This guide outlines the workflow, expectations, and coding standards.

## Getting Started

- Fork the repo and create a feature branch from `main` (e.g., `feat/add-requests-capping`).
- Ensure you have the prerequisites installed (Node 18+, Docker, MongoDB, etc.).
- Copy `env.sample` to `.env` (or use the files under `env/`) and fill in required secrets.
- Run `npm install` and `npm run dev` to verify your local environment.

## Branch & Commit Guidelines

- Prefix branches with `feat/`, `fix/`, `chore/`, `docs/`, etc.
- Use conventional commits: `feat: add weekly scoring pseudocode`, `fix: tighten metrics auth`.
- Keep commits focused; avoid bundling unrelated changes.
- Reference issues in commit messages or PR descriptions when applicable.

## Coding Standards

- Follow the linting rules enforced by ESLint/Prettier (`npm run lint`, `npm run format`).
- Favor modular, testable code. Add or update unit/integration tests alongside features or fixes.
- Use environment variables for secrets; do not hard-code credentials.
- Keep functions short, handle errors explicitly, and log using the provided Winston logger.

## Testing Checklist

Before opening a PR:

- `npm run lint`
- `npm test`
- Update/add tests covering new behavior
- Manually exercise critical endpoints if the change affects API contracts

## Pull Request Process

1. Rebase on the latest `main` before opening the PR.
2. Fill out the PR template (feature description, testing evidence, screenshots when relevant).
3. Ensure CI passes (lint, tests, coverage, Docker build, security scans).
4. Address review feedback promptly; keep discussions respectful and constructive.
5. Once approved, maintainers will merge using squash or rebase (no merge commits).

## Reporting Issues

- Use the issue templates (bug report, feature request) for structured submissions.
- Provide steps to reproduce, expected vs. actual behavior, and environment details.
- Security vulnerabilities should be reported privately following `SECURITY.md`.

Thank you for helping improve Delivery App! 🚚
