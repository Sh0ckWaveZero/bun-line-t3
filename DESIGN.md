---
name: Bun LINE T3
description: Thai-first productivity hub. LINE Bot + web dashboard for expenses, attendance, leave, and more.
colors:
  primary: "#7c5cbf"
  primary-foreground: "#f5f3fc"
  accent: "#c9506e"
  accent-foreground: "#5a1a2a"
  destructive: "#c44830"
  destructive-foreground: "#f5f3fc"
  background: "#f5f3fc"
  foreground: "#3b3658"
  card: "#ffffff"
  card-foreground: "#3b3658"
  muted: "#ddd9eb"
  muted-foreground: "#6d6590"
  border: "#c8c2d8"
  input: "#e6e2f0"
  ring: "#7c5cbf"
  line-green: "#07b53b"
  card-bg-blue: "#dbeafe"
  card-bg-green: "#dcfce7"
  card-bg-purple: "#f3e8ff"
  card-bg-orange: "#fed7aa"
  card-bg-red: "#fee2e2"
  chart-amber: "#d4960d"
  chart-teal: "#0d9488"
typography:
  display:
    fontFamily: "Syne, Geist, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1
  headline:
    fontFamily: "Noto Sans Thai, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Noto Sans Thai, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Noto Sans Thai, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Noto Sans Thai, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.025em"
  mono:
    fontFamily: "Fira Code, Courier New, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  "2xl": "16px"
  "3xl": "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "#6b4eaa"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input-field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card-surface:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  chip-badge:
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Bun LINE T3

## 1. Overview

**Creative North Star: "The Orderly Desk"**

A clean, organized workspace where everything has its place. Like a well-kept desk with labeled trays, a pen in its holder, and a calendar within arm's reach. The interface respects your attention by being where you need it, when you need it, and getting out of the way otherwise.

The system is Thai-first: Noto Sans Thai is the body typeface, all spacing is tested against Thai script's taller x-height and wider glyphs, and every label is in Thai. Dark and light modes are both first-class citizens with independent OKLCH token sets tuned for each environment. The palette centers on Muted Violet-Indigo as the primary, with tinted neutrals that carry a faint purple hue throughout. LINE green appears only in LINE-branded contexts (login button, header logo).

This system explicitly rejects: generic SaaS dashboards with hero-metric cards and gradient accents, crypto-native dark UIs with neon colors, overly playful internal tools, and anything that takes more than two clicks for a simple task.

**Key Characteristics:**
- Thai-first typography and spacing
- Flat-by-default surfaces; shadows appear on state, not at rest
- Muted Violet-Indigo primary with tinted neutrals
- Tactile, confident interactive elements
- Dual-theme (light and dark) with independent token tuning

## 2. Colors

The palette is Restrained: tinted neutrals carry 90% of any surface, with Muted Violet-Indigo appearing sparingly on primary actions and active states. Colorful card backgrounds (blue, green, purple, orange, red) are used as semantic category markers in data views.

### Primary
- **Muted Violet-Indigo** (#7c5cbf / oklch(0.61 0.08 300)): Primary actions, active navigation, focus rings, chart accent. Used on buttons, active tabs, and interactive highlights. Its rarity is the point.

### Accent
- **Warm Rose** (#c9506e / oklch(0.79 0.08 0)): Secondary accent for hover states on ghost/outline buttons, and nav items. Warmer than the primary, creating a complementary push without competing.

### Semantic
- **Destructive Red-Orange** (#c44830 / oklch(0.63 0.16 23)): Delete actions, error states, danger confirmations.
- **LINE Green** (#07b53b): Reserved exclusively for LINE-branded elements: the login button, the "LINE" word in the logo, and LINE-related UI. Never used as a general accent.

### Neutral
- **Lavender Mist Background** (#f5f3fc / oklch(0.98 0.004 301)): Page background. A white so faintly violet it feels warm, not sterile.
- **Deep Indigo Text** (#3b3658 / oklch(0.37 0.03 287)): Primary text color. Dark enough for AA contrast, tinted violet to harmonize with the primary.
- **Soft Violet Border** (#c8c2d8 / oklch(0.84 0.02 300)): Borders and dividers. Visible but never harsh.
- **Muted Lavender** (#ddd9eb / oklch(0.89 0.01 300)): Disabled backgrounds, muted containers, tab bars.
- **Gray-Violet Muted Text** (#6d6590 / oklch(0.53 0.04 291)): Secondary text, placeholder text, captions.

### Category Colors (data views only)
- **Blue** (#dbeafe bg / #2563eb text): Attendance data, ocean-themed metrics
- **Green** (#dcfce7 bg / #059669 text): Hours worked, emerald metrics
- **Purple** (#f3e8ff bg / #7c3aed text): Overtime, violet metrics
- **Orange** (#fed7aa bg / #d97706 text): Efficiency, amber metrics
- **Red** (#fee2e2 bg / #e11d48 text): Late arrivals, destructive highlights

### Dark Mode
Dark mode shifts backgrounds to deep indigo-navy (#1e1b33 / oklch(0.22 0.02 293)), cards to slightly lighter slate (#2a2650 / oklch(0.25 0.03 293)), and text to cool lavender (#e0dced / oklch(0.91 0.02 294)). The primary brightens to (#9070d0 / oklch(0.71 0.08 302)) for visibility. Category card colors use reduced-opacity variants.

**The One Accent Rule.** Muted Violet-Indigo is used on interactive elements only: buttons, active states, focus rings. It appears on less than 10% of any given screen. Its rarity makes it meaningful.

**The LINE Green Rule.** LINE Green (#07b53b) is reserved for LINE-branded contexts exclusively. It is never used as a generic success color or UI accent.

## 3. Typography

**Display Font:** Syne (with Geist fallback) for the home page hero only.
**Body Font:** Noto Sans Thai (sans-serif fallback) for all UI text.
**Monospace Font:** Fira Code (Courier New fallback) for code and numerical data.

**Character:** Noto Sans Thai is clean and legible at all sizes, with proper Thai diacritics and tone marks. Syne provides a geometric, slightly eccentric display voice for the brand surface. The pairing is purposeful: the body font prioritizes readability for Thai script, while the display font adds personality where the brand surface needs it.

### Hierarchy
- **Display** (Syne 800, clamp(2.5rem, 7vw, 4.5rem), line-height 1): Home page hero only. Never used on authenticated product surfaces.
- **Headline** (Noto Sans Thai 600, 1.5rem / 24px, line-height 1.3): Page titles, section headers, dialog titles.
- **Title** (Noto Sans Thai 600, 1.125rem / 18px, line-height 1.4): Card titles, subsection headers, feature headings.
- **Body** (Noto Sans Thai 400, 0.875rem / 14px, line-height 1.6): All body text, descriptions, table cells. Max line length 65-75ch.
- **Label** (Noto Sans Thai 500, 0.75rem / 12px, letter-spacing 0.025em): Form labels, captions, badge text, timestamps.
- **Mono** (Fira Code 400, 0.8125rem / 13px, line-height 1.5): Numbers in data tables, code snippets, crypto values.

**The Thai-First Rule.** All spacing, line heights, and padding are tested against Thai script first. Thai glyphs are taller and wider than Latin equivalents. If a layout works for Thai, it works for English.

## 4. Elevation

This system is flat by default. Cards, containers, and surfaces rest flush against their background. Depth is conveyed through tonal layering: slightly different background values between surface and page, and 1px borders that separate without projecting.

Shadows appear only as a response to state: hover on interactive cards, focus on inputs and buttons, and modals elevated above the page. At rest, nothing casts a shadow.

### Shadow Vocabulary
- **Rest state**: No shadow. Flat against background.
- **Subtle lift** (0 1px 2px rgba(99,102,241,0.05)): Standard shadcn `shadow-sm` on cards at rest (minimal, almost imperceptible).
- **Hover lift** (0 4px 6px rgba(30,27,75,0.08)): Cards and interactive elements on hover. Faint indigo tint.
- **Modal elevation** (0 25px 50px rgba(0,0,0,0.4)): Dialogs and modals. Strong depth separation.
- **Toast float** (0 10px 15px rgba(30,27,75,0.1)): Toast notifications above the page.

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only on state change (hover, focus, modal open). If a card casts a shadow without interaction, remove it.

## 5. Components

Tactile and confident: controls that feel solid to press, states that respond clearly, and shapes that are consistent without being monotonous.

### Buttons
- **Shape:** Gently rounded (6px / rounded-md)
- **Primary:** Muted Violet-Indigo background with white text (8px 16px padding, 40px height). Hover darkens slightly. Focus ring in primary color with 2px offset.
- **Secondary:** Lavender background with deep text. Lighter and quieter than primary.
- **Ghost:** Transparent background. Hover reveals accent-tinted background. Used for nav items, toolbars.
- **Destructive:** Red-orange background with white text. Only on delete/remove actions.
- **Sizes:** Default h-10 (40px), small h-9 (36px), large h-11 (44px), icon h-10 w-10 square.
- **Disabled:** 50% opacity, no pointer events.

### Cards
- **Corner Style:** Rounded-xl (12px)
- **Background:** White in light mode (#ffffff), deep slate in dark mode (oklch(0.25 0.03 293))
- **Shadow Strategy:** Shadow-sm at rest (near-invisible indigo tint), shadow-hover on interaction
- **Border:** 1px solid, using the Soft Violet Border token
- **Internal Padding:** 24px (p-6), header and content separated by 6px gap

### Inputs / Fields
- **Style:** 1px border in input token color, transparent background, rounded-md (6px)
- **Focus:** 2px ring in primary color with 2px offset. Clear visual response.
- **Height:** 40px (h-10), consistent with buttons
- **Error:** Destructive border color, error message in destructive text below field

### Navigation
- **Sticky header** at top, 56px height, frosted glass background (bg-background/80 with backdrop-blur)
- **Desktop:** Horizontal nav links with dropdowns. Active state: primary-tinted background + primary text. Hover: subtle primary wash.
- **Mobile:** Hamburger menu, full-width collapsible sections. Frosted background.
- **Logo:** "Bun" in foreground color, "LINE" in LINE green, "T3" in violet.

### Tabs
- **Tab bar:** Muted background (lavender), rounded-md, with 4px padding
- **Active tab:** White background with shadow-sm, foreground text
- **Inactive tab:** Muted text, transparent background
- **Transition:** All properties (background, text color, shadow) on state change

### Toast Notifications
- **Position:** Fixed top-right, z-9999
- **Shape:** Rounded-lg (8px), 2px colored left border indicating type
- **Types:** Success (green), Error (red), Info (blue), Warning (yellow)
- **Duration:** 3500ms auto-dismiss

### LINE Login Button
- **Strict adherence** to LINE Login Button Design Guidelines
- **Background:** #06C755 (LINE green), with hover/press overlay states
- **Shape:** 4px border-radius
- **Layout:** Layered stacking: base color, hover overlay, vertical divider, LINE icon + text

## 6. Do's and Don'ts

### Do:
- **Do** use Noto Sans Thai as the default body font for all UI text. Test spacing against Thai script before English.
- **Do** use Muted Violet-Indigo sparingly. Less than 10% of any screen surface.
- **Do** keep surfaces flat at rest. Shadows appear on hover, focus, and modals only.
- **Do** use the category color system (blue/green/purple/orange/red) for data views to create quick visual scanning.
- **Do** use rounded-xl (12px) for cards, rounded-md (6px) for buttons and inputs, rounded-full for badges and avatars.
- **Do** support both light and dark modes as first-class citizens with independent OKLCH tokens.
- **Do** use Thai for all user-facing labels, navigation, and error messages. English is acceptable in code comments and technical logs only.
- **Do** respect reduced-motion preferences by disabling animations for users who prefer it.

### Don't:
- **Don't** use hero-metric cards with big numbers, small labels, and gradient accents. Per PRODUCT.md: "generic SaaS dashboards with hero-metric cards and gradient accents" are explicitly rejected.
- **Don't** use LINE Green (#07b53b) as a generic success color or UI accent outside LINE-branded contexts.
- **Don't** add shadows to cards or containers at rest. Flat-by-default is the rule.
- **Don't** use gradient text (background-clip: text with a gradient). Use weight or size for emphasis.
- **Don't** use side-stripe borders (border-left or border-right greater than 1px) as colored accents on cards or list items.
- **Don't** use glassmorphism as a default pattern. The header backdrop-blur is a specific, justified exception.
- **Don't** use neon colors or crypto-native dark UI aesthetics. Per PRODUCT.md: "crypto-native dark UIs with neon colors and twitchy animations" are rejected.
- **Don't** create identical card grids with the same icon + heading + text repeated. Vary size, emphasis, and layout.
- **Don't** use modals as the first solution for displaying information. Exhaust inline and progressive alternatives first.
