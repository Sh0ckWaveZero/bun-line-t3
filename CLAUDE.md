# Claude Project Configuration

Development Commands

### Essential Commands

- `bun run dev` - Start development server with Turbopack on port 4325 with process lock
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
- **UI Theme Support**: All UI components MUST automatically support both light and dark modes
  - Use Tailwind's dark mode classes (dark:) for styling
  - Leverage Radix UI's built-in theme-aware components
  - Test components in both themes before completion
- Implement proper error handling without exposing sensitive data

### UI Design System & Style Patterns

The project follows a consistent design pattern for tool pages (Thai Names Generator, Thai ID Generator, etc.):

#### **Layout Architecture**
```tsx
// Two-Column Grid Layout (Desktop) / Stacked (Mobile)
<div className="container mx-auto max-w-6xl px-4 py-8">
  <div className="space-y-6">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
      <p className="text-muted-foreground">Description</p>
    </div>
    
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
      <Card>Settings Panel (350px fixed width)</Card>
      <div>Results Panel (flexible width)</div>
    </div>
  </div>
</div>
```

#### **Design Tokens (Auto Dark Mode)**
```tsx
// Use Design System Tokens for automatic dark mode support
bg-card              // Card background (auto adapts)
border               // Border color (auto adapts)
text-muted-foreground // Muted text (auto adapts)
bg-primary/10        // Primary color with 10% opacity
text-primary         // Primary color text
bg-accent            // Accent background for hover states
ring-ring            // Focus ring color
```

#### **Card Structure Pattern**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5" />
      Section Title
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Content with consistent spacing */}
  </CardContent>
</Card>
```

#### **Field Display Component**
```tsx
// Reusable pattern for displaying data with copy functionality
<div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent">
  <div className="flex min-w-0 flex-1 items-center gap-3">
    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-xs text-muted-foreground">Label</div>
      <div className="truncate font-mono font-medium">Value</div>
    </div>
  </div>
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
    <Copy className="h-4 w-4" />
  </Button>
</div>
```

#### **Dark Mode Color Schemes**
```tsx
// Success State (Green)
className="border-green-200 bg-green-50 text-green-700 
          dark:border-green-800 dark:bg-green-950 dark:text-green-400"

// Error State (Red)
className="border-red-200 bg-red-50 text-red-700
          dark:border-red-800 dark:bg-red-950 dark:text-red-400"

// Warning State (Amber)
className="border-amber-500/50 bg-amber-500/10 text-amber-700
          dark:text-amber-400"

// Info State (Blue)
className="border-blue-200 bg-blue-50 text-blue-700
          dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
```

#### **Spacing System**
```tsx
space-y-6  // Between major sections
space-y-4  // Between cards/items
space-y-3  // Between form elements
space-y-2  // Between list items
gap-6      // Grid gap
gap-3      // Small gaps
gap-2      // Minimal gaps
```

#### **Interactive States**
```tsx
// Hover & Transitions
className="transition-colors hover:bg-accent"
className="transition-all duration-200 hover:shadow-lg"

// Active/Click States  
className="active:scale-95"

// Focus States
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Disabled States
className="disabled:cursor-not-allowed disabled:opacity-50"
```

#### **Settings Panel Components**

**Checkbox Options:**
```tsx
<div className="space-y-3">
  <Label className="text-sm font-semibold">Section Title</Label>
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      <Checkbox id="option1" checked={value} onCheckedChange={handler} />
      <Label htmlFor="option1" className="cursor-pointer text-sm font-normal">
        Option Label
      </Label>
    </div>
  </div>
</div>
```

**Range Slider:**
```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label className="text-sm font-semibold">Count</Label>
    <Badge variant="secondary">{count}</Badge>
  </div>
  <input
    type="range"
    min="1"
    max="20"
    value={count}
    onChange={(e) => setCount(parseInt(e.target.value))}
    className="w-full"
  />
  <div className="flex justify-between text-xs text-muted-foreground">
    <span>1</span>
    <span>20</span>
  </div>
</div>
```

#### **Empty State Pattern**
```tsx
<Card>
  <CardContent className="flex min-h-[400px] items-center justify-center p-8">
    <div className="text-center text-muted-foreground">
      <Icon className="mx-auto mb-4 h-12 w-12 opacity-50" />
      <p>Instruction text here</p>
    </div>
  </CardContent>
</Card>
```

#### **Info/Warning Sections**
```tsx
// Features Section
<div className="space-y-4 rounded-lg border bg-card p-6">
  <h2 className="text-xl font-semibold">Features Title</h2>
  <ul className="space-y-2 text-sm text-muted-foreground">
    <li className="flex items-start gap-2">
      <span className="text-primary">•</span>
      <span>Feature description</span>
    </li>
  </ul>
</div>

// Warning Section
<div className="space-y-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-6">
  <h3 className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
    <Info className="h-5 w-5" />
    Warning Title
  </h3>
  <p className="text-sm text-amber-700/80 dark:text-amber-400/80">
    Warning message
  </p>
</div>
```

**Key Principles:**
- Always use design tokens (bg-card, text-muted-foreground, etc.) instead of hardcoded colors
- Include dark mode variants for all colored elements
- Maintain consistent spacing using the spacing system
- Use semantic HTML and ARIA labels for accessibility
- Implement smooth transitions for interactive elements
- Follow the two-column layout pattern for tool pages

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

### Containerization Notes

- Use podman in dev mode for containers
