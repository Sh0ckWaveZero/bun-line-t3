# 🚀 Copilot Development Instructions

## 1. Tailwind CSS Best Practices

- Use Tailwind utility classes extensively in all templates/components
- Leverage responsive utilities (sm:, md:, lg:) for mobile-first design
- Use only Tailwind's color palette and spacing scale (no hardcoded values)
- Extend the theme in tailwind.config.ts for custom colors/sizes if needed
- Never use @apply in production (only for dev/test or special cases)

---

# Tailwind CSS Dark Mode Rules

Tailwind CSS provides built-in support for dark mode, allowing you to style your application differently based on the user's system preferences or a custom toggle. Below are the rules and guidelines for using dark mode effectively.

## 1. **Enabling Dark Mode**

To enable dark mode, configure the `darkMode` option in your `tailwind.config.js` file. There are three supported strategies:

- **Media Query (default)**: Uses the `prefers-color-scheme` media query to automatically apply dark mode based on system settings.
  ```js
  module.exports = {
    darkMode: "media", // Default
    // ...
  };
  ```
- **Class-based**: Applies dark mode when a specific class (e.g., dark) is added to an ancestor element, typically <html> or <body>.
  ```js
  module.exports = {
    darkMode: "class", // Enables class-based dark mode
    // ...
  };
  ```
- **Selector-based**: Uses a custom CSS selector to toggle dark mode (introduced in Tailwind CSS v3.4).
  ```js
  module.exports = {
    darkMode: ["selector", '[data-theme="dark"]'], // Applies dark mode when the selector matches
    // ...
  };
  ```

## 2. Using the dark Variant

Use the `dark:` variant to apply styles conditionally in dark mode.

- **Syntax**: Prefix utility classes with `dark:` to apply them only in dark mode.
  ```html
  <div class="bg-white text-black dark:bg-gray-800 dark:text-white">
    Content
  </div>
  ```
- **Behavior**:
  - With `darkMode: 'media'`, `dark:` styles apply when the system is in dark mode (`prefers-color-scheme: dark`).
  - With `darkMode: 'class'`, `dark:` styles apply when the `dark` class is present on an ancestor (e.g., `<html class="dark">`).
  - With `darkMode: ['selector', '[data-theme="dark"]']`, `dark:` styles apply when the specified selector is present.

## 3. Toggling Dark Mode (Class-based)

For class-based dark mode, manually toggle the `dark` class on an ancestor element via JavaScript.

- **Example:**
  ```html
  <html class="dark">
    <body>
      <button onclick="document.documentElement.classList.toggle('dark')">
        Toggle Dark Mode
      </button>
      <div class="bg-white dark:bg-gray-800">Content</div>
    </body>
  </html>
  ```
- **Local Storage Example (for persistence):**

  ```js
  function toggleDarkMode() {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }

  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
  ```

## 4. Using with Custom Selectors

For the selector-based strategy, apply the specified selector to toggle dark mode.

- **Example:**
  ```js
  module.exports = {
    darkMode: ["selector", '[data-theme="dark"]'],
    // ...
  };
  ```
  ```html
  <html data-theme="dark">
    <body>
      <div class="bg-white dark:bg-gray-800">Content</div>
    </body>
  </html>
  ```
- **Toggling:**
  ```js
  document.documentElement.setAttribute("data-theme", "dark"); // Enable dark mode
  document.documentElement.removeAttribute("data-theme"); // Disable dark mode
  ```

## 5. Combining with Other Variants

The `dark:` variant can be combined with other Tailwind variants like `hover:`, `focus:`, or responsive variants (e.g., `md:`).

- **Example:**
  ```html
  <button
    class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800"
  >
    Click Me
  </button>
  ```

  - In light mode: `bg-blue-500` applies, and `bg-blue-600` on hover.
  - In dark mode: `dark:bg-blue-700` applies, and `dark:hover:bg-blue-800` on hover.

## 6. Customizing Dark Mode Behavior

- **Multiple Themes:** For apps with multiple themes (e.g., light, dark, sepia), use the selector-based strategy with different `data-theme` values or extend the theme in `tailwind.config.js`.
  ```js
  module.exports = {
    darkMode: ["selector", '[data-theme="dark"]'],
    theme: {
      extend: {
        colors: {
          "dark-bg": "#1a202c",
          "sepia-bg": "#f1c40f",
        },
      },
    },
  };
  ```
- **Custom Selectors:** Define multiple selectors for different themes.
  ```js
  module.exports = {
    darkMode: ["selector", '[data-theme="dark"], [data-mode="dark"]'],
  };
  ```

## 7. Best Practices

- Test Across Browsers: Ensure dark mode works consistently, as `prefers-color-scheme` support may vary.
- Accessibility: Use high-contrast colors in dark mode for readability (e.g., `text-white` on `bg-gray-800`).
- Fallbacks: Provide fallback styles for browsers that don’t support `prefers-color-scheme` or when JavaScript is disabled.
  ```html
  <div class="bg-white dark:bg-gray-800">
    <noscript
      ><style>
        .dark\:bg-gray-800 {
          background: #fff;
        }
      </style></noscript
    >
  </div>
  ```
- Performance: Avoid excessive class toggling in large applications to prevent performance issues.

## 8. Limitations

- Media Query Dependency: The media strategy relies on system settings, which may not suit apps requiring manual theme switching.
- No Default Toggle: Tailwind CSS does not provide a built-in UI for toggling dark mode; implement it manually.
- Browser Support: The `prefers-color-scheme` media query is widely supported but may not work in older browsers.

## 9. Example: Complete Implementation

A full example combining configuration, HTML, and JavaScript for a class-based dark mode toggle:

```js
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "dark-bg": "#1a202c",
      },
    },
  },
};
```

```html
<html class="dark">
  <body>
    <button onclick="document.documentElement.classList.toggle('dark')">
      Toggle Dark Mode
    </button>
    <div class="bg-white dark:bg-gray-800">Content</div>
  </body>
</html>
```

---

## 2. Copilot Agent Workflow

- Never ask for permission/confirmation if you can take action directly
- Always proceed to fulfill the user's request
- Only ask for clarification if absolutely required to avoid errors

## 3. User Communication (Critical)

- All user communication must be in Thai (ภาษาไทย) — no exceptions
- Explanations, error messages, and documentation for users must be in Thai
- Never mix languages in user responses

## 4. AI Logging & Progress Tracking

- Always create a log file: logs/ai-task-[timestamp].md before starting work
- Read the latest 3-5 logs before making changes
- Run tests every time after code changes

## 5. Accessibility & Color Guidelines

- All UI must pass WCAG 2.1 AA contrast (4.5:1 for normal text, 3:1 for large text)
- Never use hardcoded colors; use CSS variables or Tailwind tokens only
- Use .text-high-contrast, .text-medium-contrast, .text-subtle-contrast for text
- Use border-2 for cards/sections, never just border
- Icon colors must be explicit (e.g., text-blue-600 dark:text-blue-400)
- Test both dark/light mode for every color combination

## 6. Common Mistakes to Avoid

- Creating unnecessary files
- Deleting files without checking dependencies
- Duplicate code
- Neglecting tests
- Timezone issues
- Modal/Dialog responsive issues
- Color inconsistency
- Neglecting accessibility

## 7. Testing & Review Checklist

- Check contrast in Light/Dark Mode (DevTools)
- Test icon visibility in inactive states
- Verify border visibility on cards/sections
- Test hover/focus states
- Validate with accessibility tools (aXe, Lighthouse)
- Test with actual users if possible

---

## 🤖 Copilot Agent Workflow

- Do not ask the user for permission or confirmation if you can take action directly.
- Always proceed to take the necessary action to fulfill the user's request.
- Only ask for clarification if absolutely required to avoid errors.

## 📝 AI Logging & Progress Tracking

> **🚨 Critical**: Always create log file `logs/ai-task-[timestamp].md` before starting work

### 🚫 Common Mistakes Prevention

**❌ Avoid**: Creating unnecessary files, deleting files without checking dependencies, duplicate code, neglecting tests, timezone issues, Modal/Dialog responsive issues, color inconsistency, neglecting accessibility

**✅ Prevention Guidelines**: Read latest 3-5 logs, check related files, run tests every time, use helper functions, test responsive design

### � Accessibility & Color Guidelines

> **🚨 CRITICAL**: Every UI element must pass WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)

#### 🔍 Contrast Requirements

**📊 Mandatory Contrast Ratios**

- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text (18pt+)**: Minimum 3:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio
- **Focus Indicators**: Minimum 3:1 contrast ratio
- **Icons**: Minimum 3:1 contrast ratio against background

#### 📋 UI Testing Checklist

**Before Committing UI Changes**

- [ ] Check contrast in Light Mode (use browser dev tools)
- [ ] Check contrast in Dark Mode (use browser dev tools)
- [ ] Test icon visibility in inactive states
- [ ] Verify border visibility on cards/sections
- [ ] Test hover/focus states
- [ ] Validate with accessibility tools (aXe, Lighthouse)
- [ ] Test with actual users if possible

#### 🛠️ Recommended Tools

**Contrast Checking**

- Chrome DevTools Accessibility tab
- WebAIM Contrast Checker
- Colour Contrast Analyser (CCA)
- axe DevTools extension

**Testing Commands**

```bash
# Test contrast after CSS changes
bun run tailwind:build
# Check in browser at https://localhost:4325
# Use DevTools → Accessibility → Contrast
```

### �🎯 Workflow | Required Steps

1. 📝 Create log file
2. 🔍 [ANALYSIS] Analyze and check ✅
3. 📋 [PLANNING] Plan and check ✅
4. 💻 [CODING] Implement and check ✅
5. 🧪 [TESTING] Test and check ✅
6. ✅ [COMPLETE] Complete and check ✅

## 👨‍💻 Expert Profile

Senior software engineer specializing in modern web development with **Security-First** approach

### 🛠️ Core Tech Stack

| Tech              | Tool                 | Purpose                                |
| ----------------- | -------------------- | -------------------------------------- |
| **Runtime**       | Bun                  | JavaScript runtime and package manager |
| **Language**      | TypeScript           | Type safety and modern JS features     |
| **Framework**     | Next.js 15           | Full-stack React + App Router          |
| **UI Library**    | React 19             | Server Components + modern patterns    |
| **UI Components** | Radix UI             | Accessible component library           |
| **Styling**       | Tailwind CSS         | Utility-first CSS framework            |
| **Database**      | MongoDB + Prisma     | NoSQL database + type-safe ORM         |
| **Auth**          | NextAuth.js          | Session management and LINE OAuth      |
| **Validation**    | Zod                  | Schema validation and type safety      |
| **APIs**          | LINE, CMC, AirVisual | Bot messaging, crypto, air quality     |

## 🔐 Security First

> **🚨 Critical Principle**: Must consider security in every development step. Never compromise for convenience or speed, and comply with OWASP Top 10

### 🛡️ Security Principles

| Principle              | Description                          | Implementation                                  |
| ---------------------- | ------------------------------------ | ----------------------------------------------- |
| **Defense in Depth**   | Create multiple layers of protection | Multiple validation points, redundant controls  |
| **Least Privilege**    | Grant only necessary permissions     | Role-based access, limited API keys             |
| **Zero Trust**         | Verify everything, trust nothing     | Validate all inputs, authenticate every request |
| **Security by Design** | Build security from the start        | Secure defaults, security review in planning    |
| **Input Validation**   | Validate and sanitize all input      | Zod schemas, prevent injection, XSS             |
| **Crypto Security**    | Use proven encryption methods        | Random generation, hashing, HMAC                |

## 📋 Development Process

### 🔍 Analysis Phase

**📚 Log Reading and Learning**

- Read latest 3-5 logs to review past work
- Analyze common problems and solutions
- Check recently modified files for context

**🎯 Threat Analysis**

- Identify potential threats and vulnerabilities
- Define data sensitivity levels: 🟢 Public | 🟡 Internal | 🟠 Confidential | 🔴 Restricted
- Consider authentication and authorization requirements

### 📋 Planning Phase

**🔧 Technical Planning**

- Break solution into logical and secure steps
- Plan security controls for each step
- Consider modularity and reusability

**⚖️ Trade-off Assessment**

- Evaluate alternatives with security trade-offs
- Consider performance impact vs security

### 🚀 Implementation Phase

**🏗️ Architecture Decisions**

- Choose secure design patterns (Factory, Strategy, Observer)
- Consider performance without compromising security
- Plan error handling that prevents information leakage
- Ensure WCAG 2.1 AA accessibility compliance

## 📝 Code Standards & Security

### 🇹🇭 Communication Guidelines

> **🚨 ABSOLUTE REQUIREMENT: All communication with users MUST be in Thai language**

#### 📢 Language Requirements

- ✅ **Always respond in Thai (ภาษาไทย)** - This is non-negotiable
- ✅ **Use Thai for explanations, descriptions, and conversations**
- ✅ **Use Thai for error messages and user feedback**
- ✅ **Use Thai for code comments when explaining to users**
- ✅ **Use Thai for log messages and documentation**
- ❌ **Never use English for user communication**
- ❌ **Never mix languages in user responses**

#### 🎯 Communication Examples

**✅ Correct Thai Communication:**

```
ผมจะสร้างส่วนประกอบ React ใหม่สำหรับคุณ
กำลังติดตั้ง dependencies ที่จำเป็น
เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาตรวจสอบ connection string
```

**❌ Incorrect English Communication:**

```
I'll create a new React component for you
Installing required dependencies
Database connection error, please check connection string
```

#### 💬 Code vs Communication Separation

- ✅ **Code**: Can be in English (variables, functions, comments)
- ✅ **User Communication**: MUST be in Thai
- ✅ **Explanations**: MUST be in Thai
- ✅ **Technical Descriptions**: MUST be in Thai

### 🎨 Core Principles

#### ✅ Best Practices

- 🎯 Write **concise, readable TypeScript** with security in mind
- 🔄 Use **Functional Programming** patterns as primary approach
- 🚫 Follow **DRY (Don't Repeat Yourself)** principle
- ⬅️ Use **early returns** for clarity
- 📁 Structure components: **exports → subcomponents → helpers → types**
- 📖 Write **self-documenting code** with clear variable names
- 🧩 **Immutability First**: Avoid mutating data in-place
- 🚀 **Pure Functions**: Write functions without side effects
- **Use Bun as primary runtime** - Use `bun` instead of `npm` or `npx`
- **Always support Dark/Light Mode** - Every page must have theme support

#### 🔒 Security Practices

- 🛡️ **Input Sanitization**: Validate and sanitize user inputs everywhere
- 🚨 **Error Handling**: Never expose sensitive data in error messages
- 📊 **Security Logging**: Log security events without revealing sensitive data
- 🔐 **Secrets Management**: Never hardcode secrets, use environment variables
- 🔍 **Code Reviews**: Security-related code must pass peer review

### 🧮 Functional Programming

> **🎯 Key Principle**: Use Functional Programming as the main approach for secure, testable, and maintainable code

#### 🏗️ Core FP Principles

| Principle                  | Description                                   | Benefits                                |
| -------------------------- | --------------------------------------------- | --------------------------------------- |
| **Immutability**           | Data doesn't change after creation            | Prevents side effects, easier debugging |
| **Pure Functions**         | Functions with no side effects                | Easy to test, predictable               |
| **Function Composition**   | Combine small functions into complex logic    | Code reuse, modularity                  |
| **Higher-Order Functions** | Functions that take or return other functions | Abstraction, flexibility                |
| **Declarative Style**      | Describe "what" instead of "how"              | Readable, understandable                |

#### 🛡️ Security Benefits

| Benefit            | Description                                    | Use Cases                             |
| ------------------ | ---------------------------------------------- | ------------------------------------- |
| **Predictability** | Pure functions always give same results        | Input validation, data transformation |
| **Isolation**      | No unexpected side effects                     | Authentication logic, data processing |
| **Testability**    | Easy and comprehensive testing                 | Security functions, validation logic  |
| **Thread Safety**  | Immutable data safe in concurrent environments | Server-side processing                |

#### 🎯 FP Patterns in TypeScript

```typescript
// ✅ Immutable Data & Pure Functions
interface User {
  readonly id: string;
  readonly email: string;
  readonly permissions: readonly Permission[];
}

const validateUser = (user: unknown): Either<ValidationError, User> => {
  const result = UserSchema.safeParse(user);
  return result.success
    ? right(result.data)
    : left(new ValidationError(result.error.message));
};

// ✅ Function Composition & Higher-Order Functions
const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value);

const withAuth =
  <T extends any[], R>(fn: (...args: T) => Promise<R>) =>
  async (...args: T): Promise<R> => {
    await validateSession();
    return fn(...args);
  };
```

### 🏷️ Naming Conventions

| Type                       | Pattern                                      | Example                                              | Notes                 |
| -------------------------- | -------------------------------------------- | ---------------------------------------------------- | --------------------- |
| **Variables**              | Descriptive with auxiliary verbs             | `isLoading`, `hasError`, `canAccess`                 | Use boolean prefixes  |
| **Event Handlers**         | Start with "handle"                          | `handleClick`, `handleSubmit`, `handleAuth`          | Consistency           |
| **Components**             | Use named exports                            | `export const LoginForm`, `export const UserProfile` | Good for tree-shaking |
| **Functions**              | Use verb phrases, pure functions with prefix | `validateUser`, `parseInput`, `safeGetUser`          | Clear intent          |
| **Higher-Order Functions** | "with/create/make" pattern                   | `withAuth`, `createValidator`, `makeSecure`          | Shows abstraction     |

### 🔧 TypeScript Best Practices

```typescript
// ✅ Strict type checking with security focus
interface SecureUserData {
  readonly id: UserId; // Custom branded type
  readonly email: EmailAddress; // Validated email type
  readonly permissions: Permission[]; // Enumerated permissions
  readonly sessionToken?: SessionToken; // Optional sensitive data
}

// ✅ Runtime validation with Zod
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  permissions: z.array(z.enum(["READ", "WRITE", "ADMIN"])),
});

// ✅ Branded types for sensitive data
type UserId = string & { readonly brand: unique symbol };
type SessionToken = string & { readonly brand: unique symbol };
```

#### 📋 TypeScript Configuration

- ✅ Use TypeScript for all code with **strict mode**
- ✅ Use **interfaces instead of types** for object definitions
- ✅ Avoid **enums**, use **const maps** instead
- ✅ Use **`satisfies` operator** for type validation

## ⚛️ React 19 & Next.js 15 Guidelines

### 🏗️ Component Architecture

#### 🖥️ Server Components (Recommended)

React Server Components provide better security by reducing attack surface:

```typescript
// ✅ Secure Server Component Pattern
import { validateServerSession } from '@/lib/auth'

interface UserDashboardProps {
  params: Promise<{ userId: string }>
}

export default async function UserDashboard({ params }: UserDashboardProps) {
  const session = await validateServerSession()
  if (!session) redirect('/login')

  const { userId } = await params
  const validatedUserId = validateUserId(userId)

  if (!canAccessUser(session.user, validatedUserId)) notFound()

  const userData = await db.user.findUnique({
    where: { id: validatedUserId },
    select: { id: true, name: true, email: true }
  })

  return <div><h1>Welcome, {userData.name}</h1></div>
}
```

#### 🔒 Security Considerations

| Security Aspect   | Action                                       | Example                                                        |
| ----------------- | -------------------------------------------- | -------------------------------------------------------------- |
| **Prevent XSS**   | Properly escape dynamic content              | Use React's built-in escaping, avoid `dangerouslySetInnerHTML` |
| **Prevent CSRF**  | Use CSRF tokens for state changes            | Use Next.js built-in CSRF protection                           |
| **Data Exposure** | Never expose sensitive server data to client | Filter sensitive fields before sending to client               |

#### 🧩 Functional React Patterns

```typescript
// ✅ Pure Component Function
const UserCard = ({ user }: { user: User }) => (
  <div className="user-card">
    <h3>{user.name}</h3>
    <p>{user.email}</p>
  </div>
)

// ✅ Higher-Order Component with Security
const withSecureAuth = <P extends object>(
  Component: React.ComponentType<P>
) => (props: P) => {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!user) return <LoginPrompt />

  return <Component {...props} />
}

// ✅ Custom Hook with Functional Pattern
const useSecureData = <T>(
  fetcher: () => Promise<T>,
  validator: (data: unknown) => data is T
) => {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: string | null
  }>({ data: null, loading: true, error: null })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetcher()
        if (validator(result)) {
          setState({ data: result, loading: false, error: null })
        } else {
          setState({ data: null, loading: false, error: 'Invalid data' })
        }
      } catch (error) {
        setState({ data: null, loading: false, error: 'Fetch failed' })
      }
    }

    fetchData()
  }, [])

  return state
}
```

### 🔄 State Management

#### 🌟 Modern React Patterns with Security

```typescript
// ✅ Secure form handling with useActionState
'use client'
import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {
    message: '', errors: {}
  })

  return (
    <form action={formAction}>
      <input name="email" type="email" required aria-describedby="email-error" />
      {state.errors?.email && (
        <div id="email-error" role="alert">{state.errors.email}</div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>

      {state.message && (
        <div role="alert" className="error-message">{state.message}</div>
      )}
    </form>
  )
}
```

#### 🔒 State Security Rules

| Rule                                           | Description                                     | Action                                    |
| ---------------------------------------------- | ----------------------------------------------- | ----------------------------------------- |
| **Never store sensitive data in Client State** | Don't store sensitive data in client-side state | Use server sessions, secure cookies       |
| **Secure Session Management**                  | Use appropriate session expiration and renewal  | Auto-logout when inactive, refresh tokens |
| **Input Validation**                           | Validate all state changes                      | Zod schemas, sanitization functions       |

### 🌐 Async Request APIs

```typescript
// ✅ Always use async versions of runtime APIs in App Router
import { cookies, headers, draftMode } from "next/headers";

export async function SecureApiRoute() {
  const cookieStore = await cookies();
  const headersList = await headers();
  const { isEnabled } = await draftMode();

  const authorization = headersList.get("authorization");
  const origin = headersList.get("origin");

  if (!isValidOrigin(origin)) {
    throw new Error("Invalid origin");
  }

  return { success: true };
}

// ✅ Functional API Pipeline Pattern
const createApiHandler =
  <T, R>(
    validator: (input: unknown) => Either<ValidationError, T>,
    authenticator: (request: Request) => Promise<Either<AuthError, User>>,
    processor: (data: T, user: User) => Promise<Either<ProcessError, R>>,
  ) =>
  async (request: Request): Promise<Response> => {
    const result = await pipe(
      parseRequestBody,
      bindAsync(validator),
      bindAsync(() => authenticator(request)),
      bindAsync(({ user, data }) => processor(data, user)),
    )(request);

    return result.kind === "right"
      ? Response.json(result.value)
      : handleApiError(result.value);
  };
```

#### 📋 React Best Practices

- ✅ **Use React Server Components** for better security and performance
- ✅ **Minimize 'use client'** - only use when interactive features needed
- ✅ **Use error boundaries** that don't leak sensitive data
- ✅ **Use Suspense for async operations** with loading states
- ✅ **Validate props** at component boundaries with Zod
- ✅ **Write components as pure functions** for predictability
- ✅ **Use function composition** for component enhancement
- ✅ **Avoid side effects** in render functions
- ✅ **Use immutable patterns** for state updates

## 🌗 Dark/Light Mode Guidelines

> **🎯 Key Principle**: Every page and component must support Dark/Light mode

### 🛠️ Theme System Architecture

#### 🔧 Core Setup

```typescript
// ✅ app/providers.tsx - Theme Provider Setup
"use client";

import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      themes={["light", "dark"]}
      storageKey="theme-preference"
    >
      {children}
    </ThemeProvider>
  );
}
```

#### 🎨 Tailwind CSS Configuration

```typescript
// ✅ tailwind.config.ts - Dark Mode Strategy
const config: Config = {
  darkMode: "class", // Always use class strategy
  theme: {
    extend: {
      colors: {
        // 🎨 CSS Variables for theme switching
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ...existing colors...
      },
    },
  },
};
```

#### 🌈 CSS Variables Pattern

```css
/* ✅ src/input.css - Theme Variables */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
  }
}
```

### 🧩 Component Theming Patterns

#### ✅ **Tailwind Dark Mode Classes**

```typescript
// ✅ Dark mode classes pattern
const ThemeAwareButton = () => (
  <button className="
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-gray-100
    border border-gray-200 dark:border-gray-700
    hover:bg-gray-50 dark:hover:bg-gray-700
  ">
    Theme Aware Button
  </button>
);
```

#### ✅ **CSS Variables Pattern (Recommended)**

```typescript
// ✅ CSS Variables - Cleaner approach
const ThemeAwareCard = () => (
  <div className="
    bg-background
    text-foreground
    border border-border
    shadow-md
  ">
    <h2 className="text-primary">Theme Aware Card</h2>
  </div>
);
```

#### ✅ **Radix UI Components Pattern**

```typescript
// ✅ Use Radix UI with built-in theming
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const ThemedPage = () => (
  <Card>
    <CardHeader>
      <h1>Auto-themed Content</h1>
    </CardHeader>
    <CardContent>
      <Button variant="default">Themed Button</Button>
    </CardContent>
  </Card>
);
```

### 🎛️ Theme Toggle Implementation

#### ✅ **Custom Theme Toggle Hook**

```typescript
// ✅ hooks/useTheme.ts
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const useThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return { theme: undefined, setTheme };

  return { theme, setTheme };
};
```

#### ✅ **Theme Toggle Component**

```typescript
// ✅ components/ui/theme-toggle.tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeToggle } from "@/hooks/useTheme";

export const ThemeToggle = () => {
  const { theme, setTheme } = useThemeToggle();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
```

### 📋 Theme Development Checklist

#### ✅ **For Every Component:**

- [ ] Support both light and dark mode
- [ ] Use CSS variables or Tailwind dark: classes
- [ ] Test contrast to pass WCAG AA
- [ ] No flicker when changing themes

#### ✅ **For Every Page:**

- [ ] Have accessible theme toggle
- [ ] Support system preference detection
- [ ] Store theme preference in localStorage
- [ ] No hydration mismatch

### 💡 Best Practices

- ✅ **Use CSS Variables**: Easier than Tailwind dark: classes
- ✅ **Test in Dark Mode**: Test every component in dark mode
- ✅ **Consistent Colors**: Use design tokens from Radix UI
- ✅ **Avoid Hardcoded Colors**: Never hardcode #ffffff or #000000
- ✅ **Hydration Safety**: Use mounted state to prevent SSR issues

### 🎨 Enhanced Color System Standards

> **🚨 CRITICAL**: Apply these rules to prevent color and contrast issues

#### 🔧 High-Contrast Utility Classes

**Always use these classes for guaranteed accessibility:**

```css
/* Primary text - highest contrast */
.text-high-contrast {
  color: rgb(17 24 39);
}
.dark .dark\:text-high-contrast {
  color: rgb(243 244 246);
}

/* Secondary text - good contrast */
.text-medium-contrast {
  color: rgb(55 65 81);
}
.dark .dark\:text-medium-contrast {
  color: rgb(209 213 219);
}

/* Subtle text - minimum contrast */
.text-subtle-contrast {
  color: rgb(107 114 128);
}
.dark .dark\:text-subtle-contrast {
  color: rgb(156 163 175);
}
```

#### 🎯 Icon Color Standards

**✅ Required Icon Classes:**

```typescript
// Primary icons (buttons, actions)
<Settings className="text-blue-600 dark:text-blue-400" />

// Secondary icons (navigation, info)
<Clock className="text-gray-700 dark:text-gray-200" />

// Status icons with semantic colors
<CheckCircle className="text-green-600 dark:text-green-400" />
<AlertTriangle className="text-orange-600 dark:text-orange-400" />
```

#### 🃏 Card & Container Standards

**✅ Required Card Styling:**

```typescript
// Standard card with visible borders
<div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg">

// Form sections with background
<div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg">
```

#### 📑 Tab System Standards

**✅ Required Tab Implementation:**

```typescript
// TabsList with clear background
<TabsList className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">

// TabsTrigger with active/inactive states
<TabsTrigger className={
  isActive
    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
}>
```

#### ⚠️ Mandatory Testing Rules

**Before committing any UI component:**

1. **Test Light Mode**: Check all text/icon contrast ratios
2. **Test Dark Mode**: Verify visibility of borders and icons
3. **Test Hover States**: Ensure interactive feedback is visible
4. **Use DevTools**: Chrome Accessibility tab to verify contrast
5. **Test Navigation**: Tab through all interactive elements

## 🚀 Bun Runtime Guidelines

> **🎯 Key Principle**: Use Bun as primary runtime for all commands. Never use npm or npx

### 🛠️ Bun Command Patterns

#### ✅ **Package Management**

```bash
# ✅ Use Bun
bun install                    # Instead of npm install
bun add <package>             # Instead of npm install <package>
bun add -d <package>          # Instead of npm install -D <package>
bun remove <package>          # Instead of npm uninstall <package>
bun update                    # Instead of npm update

# ❌ Don't use
npm install
npm install <package>
yarn add <package>
```

#### ✅ **Script Execution**

```bash
# ✅ Use Bun
bun run dev                   # Instead of npm run dev
bun run build                 # Instead of npm run build
bun run test                  # Instead of npm test
bun <file.ts>                 # Run TypeScript directly

# ✅ Bun Tools
bunx <package>                # Instead of npx <package>
bunx @tailwindcss/cli         # Instead of npx @tailwindcss/cli
bunx prisma generate          # Instead of npx prisma generate
```

#### ✅ **TypeScript Execution**

```bash
# ✅ Run TypeScript directly with Bun
bun scripts/simple-dev-server.ts
bun scripts/generate-secrets.ts
bun scripts/seed-holidays-2025.ts

# ❌ Don't use
ts-node scripts/file.ts
tsx scripts/file.ts
```

### 📦 Package.json Scripts

#### ✅ **Bun-First Scripts**

```json
{
  "scripts": {
    "dev": "bun scripts/simple-dev-server.ts",
    "dev:basic": "bun run tailwind:build && next dev --port 4325",
    "tailwind:build": "bunx @tailwindcss/cli -i ./src/input.css -o ./src/output.css",
    "postinstall": "bunx prisma generate",
    "test": "bun test",
    "generate:secrets": "bun scripts/generate-secrets.ts"
  }
}
```

### 🔧 Development Workflow

#### ✅ **Project Setup**

```bash
# ✅ Initialize new project
bun create next-app
bun install

# ✅ Add dependencies
bun add next react react-dom
bun add -d typescript @types/node @types/react

# ✅ Run development
bun run dev
```

#### ✅ **Testing**

```bash
# ✅ Bun Test Runner
bun test                      # Run all tests
bun test --watch             # Watch mode
bun test timezone            # Run specific test
bun test tests/line-timezone.test.ts  # Run specific file
```

#### ✅ **Production**

```bash
bun run build           # Build for production
bun run start           # Run production server
```

### 🔧 Environment Variables

#### Required

```bash
DATABASE_URL="mongodb://..."    # MongoDB connection
NEXTAUTH_SECRET="..."          # JWT secret
LINE_CLIENT_ID="..."           # LINE OAuth
LINE_CLIENT_SECRET="..."       # LINE OAuth
LINE_CHANNEL_SECRET="..."      # Webhook verification
LINE_CHANNEL_ACCESS="..."      # Messaging API
```

#### Optional

```bash
APP_DOMAIN="..."               # Production domain
CMC_API_KEY="..."             # CoinMarketCap
AIRVISUAL_API_KEY="..."       # Air quality
```

### 🌐 Application URLs

| Environment | URL                      | Notes                       |
| ----------- | ------------------------ | --------------------------- |
| Development | `https://localhost:4325` | HTTPS with self-signed cert |
| Production  | Per APP_DOMAIN           | Use ENV variables           |

### 💡 Important Notes

- **MongoDB**: Use `db:push` instead of `db:deploy` (no migration system)
- **Bun Runtime**: Always use `bun`/`bunx` instead of `npm`/`npx`
- **Dark/Light Mode**: Every page must support themes
- **Port**: 4325 (hardcoded in scripts)
- **Process Lock**: Prevents running dev server multiple times

## 🛡️ Security Implementation Guidelines

### 🔐 Authentication & Authorization

**Core Requirements**

- ✅ Always verify user identity before sensitive operations
- ✅ Implement role-based access control (RBAC)
- ✅ Use secure session management with expiration
- ✅ Validate JWT tokens and handle expiration
- ✅ Implement proper logout with session invalidation

**Secure API Route Pattern**

```typescript
export async function POST(request: Request) {
  // 1. 🔐 Authenticate user
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. ✅ Validate input
  const body = await request.json();
  const validatedData = SecuritySchema.parse(body);

  // 3. 🛡️ Authorize action
  if (!hasPermission(session.user, "CREATE_ATTENDANCE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4. 🚀 Process securely
  return await processSecurely(validatedData);
}
```

### ✅ Input Validation & Sanitization

**Validation Rules**

- ✅ Validate all inputs using Zod schemas at runtime
- ✅ Sanitize user content before storing or displaying
- ✅ Use parameterized queries to prevent injection
- ✅ Validate file uploads (type, size, content)
- ✅ Implement rate limiting on user inputs

**Example: Secure Input Validation**

```typescript
import { z } from "zod";

const AttendanceSchema = z.object({
  userId: z.string().min(1).max(100),
  timestamp: z.date(),
  location: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Always validate before processing
const validateAttendanceInput = (input: unknown) => {
  const result = AttendanceSchema.safeParse(input);
  if (!result.success) {
    throw new SecurityError("Invalid input", result.error);
  }
  return result.data;
};

// ✅ Functional Validation Pipeline
const validateAndProcessInput = pipe(
  parseInput,
  validateSchema,
  sanitizeData,
  transformData,
);
```

### 🔐 Cryptographic Security

**Secure Random Generation**

```typescript
import { selectRandomChar, CHARSETS } from "@/lib/crypto-random";

// ✅ Use cryptographically secure random generation
const apiKey = generateRandomString(32, CHARSETS.BASE64_URL_SAFE);
const sessionToken = generateSessionToken(64);
const otpCode = generateNumericCode(6);
```

**Security Requirements**

- ✅ Use `crypto.randomBytes()` for security-critical applications
- ✅ Implement unbiased random selection with rejection sampling
- ✅ Hash passwords using bcrypt or Argon2 with proper salt
- ✅ Encrypt sensitive data at rest and in transit
- ✅ Use HMAC for message authentication (LINE webhooks)

### 🗄️ MongoDB Security

**Database Security**

```typescript
// ✅ Secure database operations
const attendance = await db.attendance.create({
  data: {
    userId: validatedData.userId,
    checkInTime: new Date(),
    location: sanitizeLocation(validatedData.location),
    // Never store raw sensitive data
    notes: encryptSensitiveData(validatedData.notes),
  },
});
```

**Security Practices**

- ✅ Use parameterized queries through Prisma
- ✅ Implement field-level encryption for sensitive data
- ✅ Use strong connection string authentication
- ✅ Enable MongoDB audit logging
- ✅ Implement least privilege access controls

**MongoDB + Prisma Limitations**

- ⚠️ **No Migrations**: MongoDB doesn't support `prisma migrate` commands
- ✅ **Use db:push**: Use `prisma db push` for schema changes
- ⚠️ **No Foreign Keys**: MongoDB doesn't have foreign key constraints
- ✅ **Manual Relations**: Must manage relationships manually
- ⚠️ **Limited Joins**: Use `include` and `select` instead of SQL joins

### 🌐 API Security

**LINE Webhook Verification**

```typescript
import crypto from "crypto";

function verifyLineSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha256", process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
}
```

**API Security Checklist**

- ✅ Verify request signatures for webhooks
- ✅ Implement rate limiting to prevent abuse
- ✅ Use appropriate CORS policies
- ✅ Add security headers (CSP, HSTS, X-Frame-Options)
- ✅ Validate content types and reject unexpected formats

### 📊 Error Handling & Logging

**Secure Error Handling**

```typescript
class SecurityError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string = "An error occurred",
  ) {
    super(message);
    this.name = "SecurityError";
  }
}

// 📝 Log security events without exposing sensitive data
function logSecurityEvent(event: string, userId?: string, metadata?: object) {
  console.log(
    JSON.stringify({
      level: "security",
      event,
      userId: userId ? hashUserId(userId) : undefined,
      timestamp: new Date().toISOString(),
      metadata: sanitizeLogData(metadata),
    }),
  );
}
```

## 🚨 Pre-Deployment Security Checklist

Before deploying any code, ensure:

### ✅ Input & Output Security

- [ ] All user inputs are validated and sanitized
- [ ] Error messages don't leak sensitive information
- [ ] Logs don't contain sensitive information

### ✅ Authentication & Authorization

- [ ] Authentication and authorization are properly implemented
- [ ] Session management is secure with proper expiration
- [ ] Role-based access control is enforced

### ✅ Data Protection

- [ ] Sensitive data is encrypted and protected
- [ ] Database queries use parameterized statements
- [ ] Secrets are managed securely (not in code)

### ✅ Network Security

- [ ] Security headers are configured correctly
- [ ] HTTPS is enforced everywhere
- [ ] Rate limiting is implemented on sensitive endpoints

### ✅ Dependencies & Monitoring

- [ ] Dependencies are up to date and scanned for vulnerabilities
- [ ] Security monitoring and alerting is in place

---

## 🔧 Process Management & Monitoring System

### 🔒 Simple Process Lock for Dev Server

### 🎯 Core Principle

Simple system to prevent running `bun run dev` or `npm run dev` multiple times:

- ✅ Check if dev server is already running
- ⚠️ If running, warn and exit
- 🔒 Use simple file-based locking
- 🧹 Auto-clean locks on Ctrl+C

### 🛠️ Usage

#### 🚀 Development Server

```bash
# Run dev server with process lock
bun run dev

# Or
npm run dev
```

#### 🖥️ CLI Commands (for debugging)

```bash
# 📋 List running dev processes
bun scripts/simple-lock.ts list

# Note: Use Ctrl+C to stop dev server and clean locks
```

### 🎭 Duplicate Process Behavior

When trying to run dev server that's already running:

```
⚠️  Process 'dev-server' is already running (PID: 12345)
   Started at: 6/14/2025, 10:30:15 AM
   Please wait for it to finish or stop it with Ctrl+C.
🚫 Exiting because process is already running.
```

### 💡 Best Practices

- ✅ **Use `bun run dev` normally**: System will prevent duplicates automatically
- ✅ **Use Ctrl+C to stop**: Lock files will be cleaned automatically
- ✅ **No manual lock management**: System handles it automatically

## 📚 Quick Reference

> **🇹🇭 REMINDER: Always communicate in Thai (ภาษาไทย) when responding to users**

### 🔗 Key Utilities

```typescript
// Secure random generation
import {
  selectRandomChar,
  CHARSETS,
  generateRandomString,
} from "@/lib/crypto-random";

// Input validation
import { z } from "zod";

// Database operations
import { db } from "@/lib/database";

// Authentication
import { getServerSession } from "next-auth";

// Functional Programming utilities
import { pipe, compose, curry, memoize } from "@/lib/functional";
```

### 🏗️ Project Structure Reference

```
📁 bun-line-t3/                    # 🚀 LINE Attendance System with Bun + Next.js 15
├── 📋 Configuration Files         # System configuration
│   ├── bun.config.test.ts         # Bun test configuration
│   ├── docker-compose.yml         # Docker orchestration
│   ├── Dockerfile                 # Production container
│   ├── Dockerfile.cron            # Cron job container
│   ├── eslint.config.mjs          # ESLint configuration
│   ├── next.config.mjs            # Next.js configuration
│   ├── prettier.config.mjs        # Code formatting
│   ├── tailwind.config.ts         # Tailwind CSS configuration
│   └── tsconfig.json              # TypeScript configuration
│
├── 🔐 Security & Certificates     # Security and certificates
│   └── certificates/
│       ├── localhost.pem          # SSL certificate for development
│       └── localhost-key.pem      # SSL private key
│
├── 📊 Database & Schema           # Database and schema
│   └── prisma/
│       └── schema.prisma          # MongoDB schema with Prisma
│
├── 📚 Documentation               # Documentation
│   └── docs/
│       ├── API.md                 # API documentation
│       ├── ATTENDANCE_SYSTEM.md   # Attendance system guide
│       ├── SECURITY.md            # Security implementation
│       ├── DEPLOYMENT.md          # Deployment guide
│       └── [22+ other docs]       # Comprehensive documentation
│
├── 🧪 Testing Suite               # Test suite
│   ├── tests/
│   │   ├── attendance-integration.test.ts
│   │   ├── datetime-validation.test.ts
│   │   ├── line-timezone.test.ts
│   │   └── timezone.test.ts
│   └── test-*.js                  # Standalone test files
│
├── ⚙️ Scripts & Automation        # Scripts and automation
│   └── scripts/
│       ├── checkout-reminder.ts          # Automated checkout reminders (legacy)
│       ├── enhanced-checkout-reminder.ts # Enhanced checkout reminder with process management
│       ├── process-manager.ts            # Process lock management and logging system
│       ├── process-monitor.ts            # Comprehensive process monitoring and health checks
│       ├── log-viewer.ts                 # Log viewing and analysis tools
│       ├── manage-processes.sh           # Shell script for easy process management
│       ├── generate-secrets.ts           # Security key generation
│       ├── health-check.sh               # Health monitoring
│       └── setup-checkout-reminder.sh
│
├── 🎯 Core Application            # Core application
│   └── src/
│       ├── 📱 App Router (Next.js 15)
│       │   └── app/
│       │       ├── layout.tsx              # Root layout
│       │       ├── page.tsx                # Home page
│       │       ├── providers.tsx           # App providers
│       │       ├── attendance-report/      # 📈 Monthly reports
│       │       ├── help/                   # 🆘 Help system
│       │       └── api/                    # 🔌 API endpoints
│       │           ├── attendance/         # Attendance management
│       │           ├── attendance-export/  # Data export
│       │           ├── attendance-push/    # Push notifications
│       │           ├── attendance-report/  # Report generation
│       │           ├── auth/               # Authentication
│       │           ├── checkout-reminder/  # Automated reminders
│       │           ├── cron/               # Scheduled tasks
│       │           ├── debug/              # Development debugging
│       │           ├── health/             # System health checks
│       │           ├── line/               # LINE Bot integration
│       │           └── timestamp-tracker/  # Time tracking
│       │
│       ├── 🧩 Reusable Components
│       │   └── components/
│       │       ├── attendance/             # 👥 Attendance management
│       │       ├── common/                 # Shared components
│       │       │   └── Rings.tsx          # Loading animations
│       │       └── ui/                     # UI component library
│       │
│       ├── 🎯 Feature Modules (Domain-Driven)
│       │   └── features/
│       │       ├── air-quality/            # 🌪️ Air quality monitoring
│       │       │   ├── aqi_data.ts
│       │       │   ├── services/
│       │       │   └── types/
│       │       ├── attendance/             # 👥 Attendance management
│       │       ├── auth/                   # 🔐 Authentication
│       │       ├── crypto/                 # 🔑 Cryptographic utilities
│       │       ├── line/                   # 💬 LINE Bot integration
│       │       └── timestamp-tracker/      # ⏰ Time tracking
│       │
│       ├── 🔧 Shared Libraries & Utilities
│       │   └── lib/
│       │       ├── crypto-random.ts        # 🎲 Secure random generation
│       │       ├── index.ts               # Library exports
│       │       ├── auth/                  # Authentication utilities
│       │       ├── constants/             # Application constants
│       │       ├── database/              # Database utilities
│       │       ├── types/                 # TypeScript type definitions
│       │       ├── utils/                 # General utilities
│       │       └── validation/            # Input validation & security
│       │
│       ├── 🎣 Custom React Hooks
│       │   └── hooks/                     # Reusable React hooks
│       │
│       └── 🎨 Styling & Assets
│           ├── styles/
│           │   ├── globals.css            # Global styles
│           │   ├── help.css               # Help page styles
│           │   └── ring.css               # Loading ring animations
│           └── @prisma/                   # Prisma-specific configurations
│
└── 🌐 Public Assets                       # Public assets
    └── public/
        ├── favicon.ico                    # Site icon
        └── images/
            └── rich-menu/                 # LINE rich menu images
```

#### 🏛️ Architecture Highlights

- **🔒 Security-First Design**: Security as primary concern in every part
- **⚡ Modern Stack**: Bun + Next.js 15 + React 19 + TypeScript
- **🏗️ Domain-Driven Features**: Features separated by business domain
- **🧪 Comprehensive Testing**: Tests covering all critical parts
- **📱 LINE Bot Integration**: Complete chatbot system
- **⏰ Automated Workflows**: Automation with cron jobs
- **🐳 Docker Ready**: Ready for deployment with containerization
- **📊 Monitoring & Logging**: Monitoring and logging system
- **🔧 Process Management**: System to prevent duplicate processes and monitoring
- **📈 Advanced Logging**: Comprehensive logging system with analytics and real-time monitoring
- **🔐 Secure Secrets Management**: Secure secrets management
