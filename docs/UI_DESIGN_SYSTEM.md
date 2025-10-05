# UI Design System & Style Patterns

The project follows a consistent design pattern for tool pages (Thai Names Generator, Thai ID Generator, etc.).

## Layout Architecture

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

## Design Tokens (Auto Dark Mode)

```tsx
// Use Design System Tokens for automatic dark mode support
bg - card; // Card background (auto adapts)
border; // Border color (auto adapts)
text - muted - foreground; // Muted text (auto adapts)
bg - primary / 10; // Primary color with 10% opacity
text - primary; // Primary color text
bg - accent; // Accent background for hover states
ring - ring; // Focus ring color
```

## Card Structure Pattern

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

## Field Display Component

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

## Dark Mode Color Schemes

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

## Spacing System

```tsx
space - y - 6; // Between major sections
space - y - 4; // Between cards/items
space - y - 3; // Between form elements
space - y - 2; // Between list items
gap - 6; // Grid gap
gap - 3; // Small gaps
gap - 2; // Minimal gaps
```

## Interactive States

```tsx
// Hover & Transitions
className = "transition-colors hover:bg-accent";
className = "transition-all duration-200 hover:shadow-lg";

// Active/Click States
className = "active:scale-95";

// Focus States
className =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// Disabled States
className = "disabled:cursor-not-allowed disabled:opacity-50";
```

## Settings Panel Components

### Checkbox Options

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

### Range Slider

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

## Empty State Pattern

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

## Info/Warning Sections

### Features Section

```tsx
<div className="space-y-4 rounded-lg border bg-card p-6">
  <h2 className="text-xl font-semibold">Features Title</h2>
  <ul className="space-y-2 text-sm text-muted-foreground">
    <li className="flex items-start gap-2">
      <span className="text-primary">•</span>
      <span>Feature description</span>
    </li>
  </ul>
</div>
```

### Warning Section

```tsx
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

## Key Principles

- ✅ Always use design tokens (bg-card, text-muted-foreground, etc.) instead of hardcoded colors
- ✅ Include dark mode variants for all colored elements
- ✅ Maintain consistent spacing using the spacing system
- ✅ Use semantic HTML and ARIA labels for accessibility
- ✅ Implement smooth transitions for interactive elements
- ✅ Follow the two-column layout pattern for tool pages
