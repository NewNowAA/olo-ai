# Project Dependencies

> Track all installed packages and their purposes here.

## Core Dependencies

| Package | Version | Purpose | Installed |
|---------|---------|---------|-----------|
| `react` | ^19.2.4 | UI Framework | ✅ Initial |
| `react-dom` | ^19.2.4 | React DOM rendering | ✅ Initial |
| `lucide-react` | ^0.563.0 | Icon library (modern, tree-shakeable) | ✅ Initial |
| `recharts` | ^3.7.0 | Charts and data visualization | ✅ Initial |
| `@google/genai` | ^1.40.0 | Google Gemini AI integration | ✅ Initial |
| `@supabase/supabase-js` | ^2.x | Supabase database client | ✅ |

## Dev Dependencies

| Package | Version | Purpose | Installed |
|---------|---------|---------|-----------|
| `vite` | ^6.2.0 | Build tool and dev server | ✅ Initial |
| `@vitejs/plugin-react` | ^5.0.0 | React plugin for Vite | ✅ Initial |
| `typescript` | ~5.8.2 | Type checking | ✅ Initial |
| `@types/node` | ^22.14.0 | Node.js type definitions | ✅ Initial |

---

## Adding New Dependencies

When installing new packages, add them to this file with:

```markdown
| `package-name` | ^x.x.x | Brief description | ✅ YYYY-MM-DD |
```

### Install Commands

```bash
# Production dependency
npm install package-name

# Dev dependency
npm install -D package-name
```
