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
