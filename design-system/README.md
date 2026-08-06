# Swiss Modernism 2.0 — Design System

Reusable design tokens and component primitives. Standalone package —
no dependency on the rest of this repo — so it can be copied into any
React project.

## Stack

React + Vite + Tailwind CSS v4 + [lucide-react](https://lucide.dev).
No component libraries (no MUI, Ant Design, Bootstrap, shadcn/ui) — every
primitive here is hand-built against the token set.

## Run

```
npm install
npm run dev      # showcase page at http://localhost:5183
npm run build
```

## Structure

```
src/styles/tokens.css     Tailwind v4 @theme — the single source of truth
                           for color, type, radius, motion tokens
src/styles/index.css      Tailwind import, fonts, base element styles
src/components/           Button, IconButton, Field (Input/Textarea),
                           Select, Checkbox, Panel, StatusTag, DataTable,
                           Skeleton, EmptyState, Modal, Toast, PageHeader,
                           SectionHeader, ResponsiveShell
src/components/index.js   barrel export
src/App.jsx                showcase page exercising every primitive/state
```

## Using it in another project

Copy `src/styles/`, `src/lib/cn.js`, and `src/components/` into the
target app, install the same three dependencies, and import from
`components/index.js`:

```jsx
import { Button, Panel, Field, Input } from './components/index.js';
```

Every token lives in `tokens.css` — change a value there and every
primitive picks it up, since components reference Tailwind utilities
generated from those tokens rather than hard-coded values.
