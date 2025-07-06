# Claude Project Configuration

Development Commands

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
- **Styling**: Tailwind CSS and Radix UI with dark/light mode support
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
- **Leave-Attendance Integration**: Leave records automatically create WorkAttendance records with standardized timestamps

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
- **Leave Auto-Stamp System**: Automatically creates attendance records for leave days with standardized times:
  - Check-in: 01:00 UTC (08:00 Bangkok time)
  - Check-out: 10:00 UTC (17:00 Bangkok time)
  - Hours worked: 9.0 hours
  - Status: LEAVE

Remember to maintain security-first practices, validate all inputs, and ensure proper error handling throughout the codebase.

# Using Gemini CLI for Large Codebase Analysis

Gemini CLI is ideal for analyzing large codebases or multiple files that may exceed the context limit of typical AI tools. Use the `gemini -p` command to leverage Google Gemini's large context window.

## File and Directory Inclusion Syntax

Use the `@` symbol before file or directory names you want Gemini to analyze (paths are relative to where you run the command).

### Usage Examples

**Single file analysis:**

```
gemini -p "@src/main.py Explain the structure and purpose of this file"
```

**Multiple files:**

```
gemini -p "@package.json @src/index.js Analyze the dependencies used in this code"
```

**Entire directory:**

```
gemini -p "@src/ Summarize the architecture of this codebase"
```

**Multiple directories:**

```
gemini -p "@src/ @tests/ Analyze test coverage for the source code"
```

**Current directory and subdirectories:**

```
gemini -p "@./ Give me an overview of this entire project"
```

**Or use --all_files:**

```
gemini --all_files -p "Analyze the project structure and dependencies"
```

## Implementation Verification Examples

**Check if dark mode is implemented:**

```
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"
```

**Verify authentication implementation:**

```
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"
```

**Check for specific patterns:**

```
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"
```

**Verify error handling:**

```
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"
```

**Check for rate limiting:**

```
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"
```

**Verify caching strategy:**

```
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"
```

**Check for specific security measures:**

```
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"
```

**Verify test coverage for features:**

```
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"
```

## When to Use Gemini CLI

- Analyzing entire codebases or large directories
- Comparing multiple large files
- Checking project-wide patterns or architecture
- When the context window of other AI tools is insufficient
- Verifying features or security measures across many files at once

## Important Notes

- Paths after @ are relative to your current working directory when running gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle large codebases that Claude may not support
- When checking for features, be specific about what you want for accurate results
