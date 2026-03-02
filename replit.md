# TheTradersCartel

## Overview

TheTradersCartel is a single-page marketing and lead-generation website for a trading mentorship business. It showcases the mentor (Imaad), mentorship curriculum, course pricing tiers (Seminar, Zoom, In-Person), student reviews, and a contact form. The site features a dark, high-contrast aesthetic with parallax animations, a canvas-based black hole background effect, and smooth scroll-based transitions. The only server-side functionality is a contact form submission endpoint that stores messages in a PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) — currently only two routes: `/` (Home) and a 404 catch-all
- **Styling**: Tailwind CSS v4 (using `@tailwindcss/vite` plugin and `@import "tailwindcss"` syntax), with a custom dark theme defined via CSS `@theme` variables in `client/src/index.css`
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives. Components live in `client/src/components/ui/`. The `components.json` configures shadcn with path aliases.
- **Animations**: Framer Motion for scroll-based parallax effects, fade-ins, and transitions. A custom `FadeIn` component wraps motion.div for reusable scroll-triggered animations.
- **Canvas Effect**: Custom `BlackHoleBackground` component renders a particle-based background using HTML5 Canvas
- **Data Fetching**: TanStack React Query with a custom `apiRequest` helper and `queryClient` configured with sensible defaults (no refetch on focus, infinite stale time)
- **Forms**: React Hook Form with Zod validation via `@hookform/resolvers`
- **Fonts**: Inter (body) and Oswald (headings) loaded from Google Fonts
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, run with `tsx` in development
- **API**: Single REST endpoint — `POST /api/contact` for contact form submissions
- **Development Server**: Vite dev server integrated as Express middleware (via `server/vite.ts`) with HMR support
- **Production**: Static files served from `dist/public` with SPA fallback to `index.html`
- **Build**: Custom build script (`script/build.ts`) that runs Vite for client and esbuild for server, outputting to `dist/`

### Database
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema**: Single table `contact_submissions` with fields: `id` (serial), `name` (text), `email` (text), `message` (text), `createdAt` (timestamp)
- **Schema Location**: `shared/schema.ts` — shared between client and server
- **Migrations**: Managed via `drizzle-kit push` command (schema-push approach, no migration files needed)
- **Connection**: `pg` Pool with `drizzle-orm/node-postgres` adapter

### Project Structure
```
client/           — Frontend React application
  src/
    components/
      layout/     — Navbar
      sections/   — Page sections (Hero, About, Mentorship, Courses, Reviews, Join, FAQ, Contact, Footer)
      ui/         — shadcn/ui components
    hooks/        — Custom React hooks
    lib/          — Utilities (queryClient, cn helper)
    pages/        — Page components (Home, NotFound)
    assets/       — Image imports
server/           — Express backend
  index.ts        — Server entry point
  routes.ts       — API route registration
  storage.ts      — Database access layer
  static.ts       — Production static file serving
  vite.ts         — Development Vite middleware setup
shared/           — Shared code between client and server
  schema.ts       — Drizzle database schema and Zod validation
```

### Key Design Decisions
- **Monorepo structure**: Client and server share types and validation schemas through the `shared/` directory, ensuring type safety across the stack
- **Storage abstraction**: `IStorage` interface in `storage.ts` allows swapping database implementations, though currently only `DatabaseStorage` (PostgreSQL) is implemented
- **Single-page app**: The entire site is one scrollable page with anchor navigation — no complex routing needed
- **Minimal API surface**: Only one API endpoint exists (contact form), keeping the backend extremely simple

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connection string must be provided via `DATABASE_URL` environment variable. Used for storing contact form submissions.

### Key npm Packages
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **express** v5: HTTP server framework
- **framer-motion**: Animation library for scroll effects
- **@tanstack/react-query**: Server state management
- **react-hook-form** + **zod**: Form handling and validation
- **shadcn/ui** (Radix UI primitives): Component library foundation
- **wouter**: Lightweight client-side routing
- **embla-carousel-react**: Carousel component (used in Reviews section)
- **connect-pg-simple**: PostgreSQL session store (available but not actively used for sessions currently)

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer** and **@replit/vite-plugin-dev-banner**: Dev-only Replit integration plugins
- **vite-plugin-meta-images**: Custom plugin for OpenGraph meta tag management with Replit deployment URLs