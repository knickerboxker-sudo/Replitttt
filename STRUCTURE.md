# Project Structure

This document describes the organization of the Sortir project after reorganization from the original Replit upload.

## Directory Layout

```
.
├── server/                 # Backend Express.js application
│   ├── index.ts           # Main server entry point
│   ├── routes.ts          # API route definitions
│   ├── db.ts              # Database connection setup
│   ├── schema.ts          # Drizzle ORM database schema
│   ├── storage.ts         # File storage utilities
│   ├── seed.ts            # Database seeding
│   ├── vector-store.ts    # AI vector embeddings (Cohere)
│   ├── static.ts          # Static file serving
│   ├── vite.ts            # Vite dev server integration
│   └── API Clients:
│       ├── cpsc-client.ts    # Consumer Product Safety Commission
│       ├── fda-client.ts     # Food and Drug Administration
│       └── nhtsa-client.ts   # National Highway Traffic Safety Admin
│
├── src/                   # Frontend React application
│   ├── main.tsx          # React application entry point
│   ├── App.tsx           # Root component with routing
│   ├── index.css         # Global styles (Tailwind CSS)
│   │
│   ├── components/
│   │   ├── layout/       # Layout components
│   │   │   ├── BottomNav.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   └── RecallCard.tsx
│   │   ├── legal/        # Legal components
│   │   │   └── TermsAcceptanceFlow.tsx
│   │   └── ui/           # shadcn/ui components
│   │       ├── badge.tsx
│   │       ├── card.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       └── tooltip.tsx
│   │
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── MyBrandsPage.tsx
│   │   ├── VehiclesPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── TermsPage.tsx
│   │   ├── PrivacyPage.tsx
│   │   └── not-found.tsx
│   │
│   ├── lib/              # Utilities
│   │   ├── queryClient.ts  # TanStack Query configuration
│   │   └── utils.ts        # Helper functions (cn, etc.)
│   │
│   └── hooks/            # Custom React hooks
│       └── use-toast.ts
│
├── public/               # Static assets
│   ├── index.html       # HTML template
│   ├── sw.js            # Service Worker (PWA)
│   ├── manifest.webmanifest  # PWA manifest
│   ├── favicon.png
│   ├── apple-touch-icon.png
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
├── Configuration Files:
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration (main)
├── tsconfig.node.json   # TypeScript configuration (build tools)
├── vite.config.ts       # Vite bundler configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── drizzle.config.ts    # Drizzle ORM configuration
├── build.ts             # Production build script
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore patterns
└── README.md            # Project documentation
```

## Key Changes from Original Upload

### Before (Root directory chaos):
- All 27 files mixed together in root directory
- No clear separation of concerns
- Missing configuration files
- No package.json or tsconfig

### After (Organized structure):
- ✅ 11 server files in `server/`
- ✅ 26+ client files organized in `src/` with subdirectories
- ✅ 7 static assets in `public/`
- ✅ 11 configuration files in root
- ✅ Complete package.json with all dependencies
- ✅ TypeScript configurations for both client and server
- ✅ All missing components and pages created

## Import Paths

The project uses path aliases for cleaner imports:

- `@/*` → Maps to `./src/*` (client code)
- `@db/*` → Maps to `./server/*` (server/database code)

### Examples:
```typescript
// Client imports
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import HomePage from "@/pages/HomePage";

// Server imports  
import { db } from "@db/db";
import { schema } from "@db/schema";
```

## Scripts

```bash
npm run dev      # Start development server (tsx server/index.ts)
npm run build    # Build for production (client + server)
npm start        # Start production server
npm run db:push  # Push database schema changes
npm run db:studio # Open Drizzle Studio (database GUI)
```

## Technology Stack

**Backend:**
- Express.js + TypeScript
- PostgreSQL (via Drizzle ORM)
- Cohere AI (vector embeddings)
- Passport.js (authentication)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TanStack React Query (data fetching)
- Wouter (routing)
- Tailwind CSS + shadcn/ui (styling)
- Service Workers (PWA support)

**External APIs:**
- FDA OpenFDA API
- CPSC Recalls API
- NHTSA Recalls API
