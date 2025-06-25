# Gemini `src` Directory Configuration

This file provides context for the `src` directory.

- **Structure**: This directory follows a feature-based structure. For example, authentication-related code is in `src/features/auth`.
- **Components**: Reusable UI components are in `src/components/ui`. More complex, feature-specific components are in `src/components/<feature>`.
- **Styling**: Global styles are in `src/styles/globals.css`. Component-specific styles should be co-located with the component or defined within Tailwind CSS utility classes.
- **State Management**: State management is likely handled by React hooks and context, or a library like Zustand or Jotai. Check existing code before adding new state management.
