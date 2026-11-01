# Theme toggle

The app uses a project-local theme provider and `useTheme()` hook; it does not use `next-themes`. The provider stores the preference in `localStorage` under the key `theme`, supports `light`, `dark`, and `system`, listens for system color-scheme changes, and applies the resolved theme to the document root.

`ThemeToggle` is shown in the shared header. On small screens it renders an icon button; on desktop it renders a switch with sun/moon indicators. It uses `useClientOnlyMounted()` to render a hydration-safe placeholder before client state is available. The control toggles between light and dark; system mode remains available through the provider API/default.

## Use in a component

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function HeaderActions() {
  return <ThemeToggle />;
}
```

For a component that changes theme programmatically:

```tsx
import { useTheme } from "@/lib/theme/theme-provider";

const { theme, resolvedTheme, setTheme } = useTheme();
setTheme("system");
```

Components using `useTheme()` must be descendants of the app's `ThemeProvider`. Use CSS variables and Tailwind `dark:` variants for theme-aware UI. Keep server/client rendering consistent and avoid reading `localStorage` in a server component.

## Source map

- [`src/lib/theme/theme-provider.tsx`](../src/lib/theme/theme-provider.tsx) — context, persistence, and theme application
- [`src/components/ui/theme-toggle.tsx`](../src/components/ui/theme-toggle.tsx) — responsive toggle control
- [`src/components/ui/switch.tsx`](../src/components/ui/switch.tsx) — shared switch primitive
- [`src/hooks/useHydrationSafe.ts`](../src/hooks/useHydrationSafe.ts) — client-mounted hook
