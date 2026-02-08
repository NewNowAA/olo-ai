# faturAI - Invoice Management App

> Plataforma inteligente de gestão de faturas com IA integrada.

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run development server
npm run dev
```

App will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components (Button, Card, Modal, etc.)
│   │   ├── layout/          # Layout components (Header, Sidebar)
│   │   └── features/        # Feature-specific components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services (Gemini AI)
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── constants/           # App constants
│   └── config/              # Configuration files
├── components/              # Legacy components (migrate to src/)
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template
└── DEPENDENCIES.md          # Package tracking
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI features |
| `VITE_APP_NAME` | No | App name (default: faturAI) |
| `VITE_APP_ENVIRONMENT` | No | Environment (development/production) |

---

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 🛠️ Tech Stack

- **React 19** - UI Framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Charts
- **Google Gemini** - AI Integration

See [DEPENDENCIES.md](./DEPENDENCIES.md) for full package list.
