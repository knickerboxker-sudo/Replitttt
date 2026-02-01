# Sortir - Food Safety Scanner

A Progressive Web App (PWA) that helps you scan groceries, products, and vehicles to check for safety recalls from FDA, CPSC, and NHTSA databases.

## Features

- 🍎 **Food Safety**: Scan grocery receipts and check for FDA food recalls
- 🚗 **Vehicle Recalls**: Track your vehicles and monitor NHTSA safety recalls
- 🏠 **Product Safety**: Monitor consumer products for CPSC recalls
- 📱 **PWA Support**: Install as an app on your device for offline access
- 🔍 **AI-Powered Search**: Vector search using Cohere AI for intelligent matching
- 🔔 **Real-time Alerts**: Get notified when recalls match your items

## Project Structure

```
.
├── server/              # Backend Express server
│   ├── index.ts        # Server entry point
│   ├── routes.ts       # API routes
│   ├── db.ts           # Database configuration
│   ├── schema.ts       # Database schema (Drizzle ORM)
│   ├── vector-store.ts # AI vector embeddings
│   └── *-client.ts     # External API clients (FDA, CPSC, NHTSA)
├── src/                # Frontend React application
│   ├── main.tsx        # React entry point
│   ├── App.tsx         # Root component
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   └── lib/            # Utilities and helpers
├── public/             # Static assets
│   ├── index.html      # HTML template
│   ├── sw.js           # Service Worker
│   └── icons/          # PWA icons
└── dist/               # Build output (generated)
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database:**
   ```bash
   npm run db:push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption

Optional (for enhanced features):
- `COHERE_API_KEY` - For AI-powered vector search
- `OPENAI_API_KEY` - Alternative AI provider
- `GEMINI_API_KEY` - Alternative AI provider

## Technologies

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TanStack React Query (data fetching)
- Wouter (routing)
- Tailwind CSS + shadcn/ui (styling)
- Service Workers (PWA)

### Backend
- Express + TypeScript
- PostgreSQL + Drizzle ORM
- Passport.js (authentication)
- Cohere AI (vector embeddings)
- Multer (file uploads)

### External APIs
- FDA OpenFDA API (food recalls)
- CPSC API (consumer product recalls)
- NHTSA API (vehicle recalls)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## License

MIT
