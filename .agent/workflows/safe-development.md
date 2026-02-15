---
description: Critical rules for safe development - prevents server-breaking changes
---

# Safe Development Rules

> **These rules MUST be followed at all times to prevent breaking the application startup.**

## 🔴 NEVER Modify These Files Without Extreme Caution

### Entry Point Files (DO NOT DELETE or RENAME)

1. **`index.tsx`** — The main entry point referenced by `index.html`. Must always contain:
   - `import './src/index.css';` (Tailwind + all styles)
   - `import App from './App';` (main App component)
   - `createRoot(document.getElementById('root')!).render(<App />);`
2. **`index.html`** — The HTML shell. Must always have:
   - `<div id="root"></div>`
   - `<script type="module" src="/index.tsx"></script>`
3. **`App.tsx`** — The root React component with auth routing
4. **`vite.config.ts`** — Vite configuration (port, aliases, plugins)
5. **`src/index.css`** — Tailwind directives and global styles

## 🟡 Rules

1. **Never delete `index.tsx`** — If you need to reorganize, move logic to `App.tsx` but keep `index.tsx` as the thin entry point.
2. **Never remove the CSS import** from `index.tsx` — Without `import './src/index.css'`, the entire app loses all styling.
3. **Never remove the `@` alias** from `vite.config.ts` — Many imports depend on `@/src/...` paths.
4. **Never change the dev server port** without updating all references.
5. **Test imports before deleting files** — Before deleting any file, grep for imports of that file across the project.

## ✅ Safe Operations

- Creating new components in `components/`
- Adding new services in `src/services/`
- Adding new hooks in `src/hooks/`
- Adding new types in `src/types/`
- Modifying component logic (not entry points)
- Adding new CSS classes to `src/index.css`

## 🧪 After Any Structural Change

Always verify the server starts correctly:
// turbo

```bash
npm run dev
```
