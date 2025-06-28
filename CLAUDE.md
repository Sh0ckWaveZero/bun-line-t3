# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands

- `bun run dev` - Start development server on port 4325 with process lock
- `bun run build` - Build production application
- `bun run lint` - Run ESLint code analysis
- `bun run format` - Format code with Prettier
- `bun run format:check` - Check code formatting

### Database Commands

- `bun run db:push` - Push Prisma schema to MongoDB (no migrations)
- `bun run db:generate` - Generate Prisma client
- `bun run seed:holidays` - Seed Thai holiday data for 2025

### Testing Commands

- `bun test` - Run all tests with Bun test runner
- `bun test --watch` - Run tests in watch mode
- `bun test timezone` - Run timezone-specific tests
- `bun test tests/line-timezone.test.ts` - Run specific test file

### Utility Commands

- `bun run tailwind:build` - Build Tailwind CSS output
- `bun run generate:secrets` - Generate secure API keys and tokens
- `bun run env:dev` / `bun run env:prod` - Switch environment configurations

## Architecture Overview

### Tech Stack

- **Runtime**: Bun (primary runtime, never use npm/npx)
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with Server Components
- **Language**: TypeScript with strict mode
- **Database**: MongoDB with Prisma ORM
- **Styling**: Tailwind CSS with dark/light mode support
- **Authentication**: NextAuth.js with LINE OAuth

### Project Structure

The codebase follows a **Feature-Based Architecture** pattern:

```
src/
├── features/              # Domain-driven feature modules
│   ├── attendance/        # Work attendance management
│   ├── auth/             # Authentication & user management
│   ├── crypto/           # Cryptocurrency tracking
│   ├── line/             # LINE Bot integration & commands
│   ├── air-quality/      # Air quality monitoring
│   └── user-settings/    # User preferences & settings
├── lib/                  # Shared utilities & configurations
│   ├── auth/            # Authentication utilities
│   ├── database/        # Database connection & queries
│   ├── constants/       # Application constants
│   ├── utils/           # General utilities (date, crypto, etc)
│   ├── validation/      # Input validation schemas
│   └── security/        # Security utilities (URL validation)
├── app/                 # Next.js App Router
│   ├── api/            # API routes organized by feature
│   └── (pages)/        # Application pages
└── components/          # Reusable UI components
    ├── attendance/      # Attendance-specific components
    ├── common/         # Shared components
    └── ui/             # Base UI component library
```

### Key Architectural Principles

- **Domain Separation**: Each feature is self-contained with services, types, and helpers
- **Security-First**: Input validation, authentication, and secure coding practices throughout
- **Type Safety**: Strict TypeScript with Zod runtime validation
- **Path Aliases**: Clean imports using `@/` prefix and feature-specific aliases
- **Server Components**: Prefer RSC for better performance and security

## Development Guidelines

### Database (MongoDB + Prisma)

- **No Migrations**: Use `bun run db:push` instead of migrate commands
- **No Foreign Keys**: MongoDB doesn't support foreign key constraints
- **Manual Relations**: Manage relationships manually in application code

### Testing Configuration

- Test runner: Bun with configuration in `tests/bun.test.config.ts`
- Test patterns: `**/tests/**/*.test.{ts,tsx}`
- Coverage: Configured for `src/**/*.{ts,tsx}` files
- Test timeout: 10 seconds default

### LINE Bot Integration

- Webhook URL: `/api/line/route.ts`
- Command handlers in `src/features/line/commands/`
- Rich menu support with image assets in `public/images/rich-menu/`
- Timezone handling for Thai users (Asia/Bangkok)

### Security Features

- URL validation with whitelist/blacklist in `src/lib/security/url-validator.ts`
- Secure random generation in `src/lib/crypto-random.ts`
- Input sanitization using Zod schemas
- Authentication middleware and session management

### Process Management

- Development server uses process lock to prevent multiple instances
- Script: `scripts/simple-dev-server.ts` with automatic cleanup on Ctrl+C
- Process monitoring utilities in `scripts/` directory

### Environment Configuration

- Development: HTTPS on localhost:4325 with self-signed certificates
- Environment switching: Scripts in `scripts/switch-env.sh`
- Required ENV vars: DATABASE*URL, NEXTAUTH_SECRET, LINE*\* credentials

### Code Style Requirements

- Use Bun as primary runtime (never npm/npx)
- Follow functional programming patterns where possible
- Prefer early returns and immutable data structures
- Use TypeScript interfaces over types for objects
- Support dark/light mode in all components
- Implement proper error handling without exposing sensitive data

## External Integrations

### LINE Platform

- Messaging API for bot responses
- OAuth for user authentication
- Rich menu for interactive commands
- Webhook signature verification required

### Third-party APIs

- CoinMarketCap for cryptocurrency data
- AirVisual for air quality monitoring
- Integration patterns in respective feature modules

### Automated Systems

- Cron jobs for attendance reminders (Docker-based)
- Health check endpoints for monitoring
- Automated checkout reminders with configurable timing

Remember to maintain security-first practices, validate all inputs, and ensure proper error handling throughout the codebase.
