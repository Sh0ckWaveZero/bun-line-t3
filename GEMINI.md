# Gemini Project Configuration

This file provides context and guidelines for Gemini when interacting with this project.

## Project Overview

This is a full-stack web application built with the T3 stack, using Bun as the runtime and package manager.

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Runtime**: Bun
- **Styling**: Tailwind CSS with PostCSS
- **UI Components**: Custom components, likely in `src/components/ui`.
- **Database ORM**: Prisma
- **Authentication**: NextAuth.js (inferred from general T3 stack patterns)
- **Deployment**: Docker and GitHub Actions

## Development Guidelines

- **Package Manager**: Always use `bun` for package management (`bun install`, `bun add`, `bun remove`). Do not use `npm` or `yarn`.
- **Code Style**: Adhere to the existing code style. Formatting is enforced by Prettier and linting by ESLint. Run `bun lint` and `bun format` before committing.
- **Commits**: Follow conventional commit standards.
- **File Naming**: Use kebab-case for files and directories.
- **API Routes**: Located in `src/app/api/`. Follow existing patterns for creating new routes.
