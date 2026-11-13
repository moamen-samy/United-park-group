# United Park Group (PARK) — Deployment, Cloud SQL & Firebase SQL Connect Guide

## 1. Architecture Summary

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 (bilingual English LTR / Arabic RTL).
- **Backend**: Node.js (`v22`) + Express + TypeScript (`server.ts`), serving REST APIs (`/api/public/*`, `/api/admin/*`), dynamic SEO endpoints (`/sitemap.xml`, `/robots.txt`), and secure media asset streaming (`/api/media/:id`).
- **Database**: Google Cloud SQL for PostgreSQL (25 normalized tables managed via Drizzle ORM in `src/db/schema.ts`).
- **Authentication**: Firebase Authentication (Google Sign-In) with server-side ID token verification (`firebase-admin`) and PostgreSQL RBAC (`admin_roles`, `users`, `activity_logs`).

---

## 2. Database Schema & Migrations

1. Schema definition: `src/db/schema.ts`
2. Drizzle Kit configuration: `src/db/drizzle.config.ts`
3. Generate SQL migration files locally (when needed):
   ```bash
   npx drizzle-kit generate --config=src/db/drizzle.config.ts
   ```
4. Push schema changes to Cloud SQL:
   ```bash
   npx drizzle-kit push --config=src/db/drizzle.config.ts
   ```

---

## 3. Firebase SQL Connect (Data Connect) Integration Blueprint

In AI Studio Build, the Node.js backend connects directly to the provisioned Cloud SQL for PostgreSQL instance via the Cloud SQL Auth Proxy (`pg.Pool` + Drizzle ORM). To also attach **Firebase SQL Connect** directly to the same Cloud SQL PostgreSQL instance (`ai-studio-99cd46b8`, project `potent-net-x5v9p`):

1. Install Firebase CLI & initialize Data Connect:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init dataconnect
   ```
2. Point `dataconnect/dataconnect.yaml` to your Cloud SQL instance (`europe-west2` or `me-west1` for Saudi data residency) and database `park_corporate`.
3. Use `dataconnect/schema.gql` (included in this repository) to expose GraphQL-over-PostgreSQL connectors with `@auth(level: PUBLIC)` for public catalog reads and `@auth(level: USER)` / admin role checks for CMS mutations.
4. Deploy Firebase SQL Connect connectors:
   ```bash
   firebase deploy --only dataconnect
   ```

---

## 4. Environment Variables (`.env`)

Copy `.env.example` to `.env` and populate via Cloud Run / Secret Manager (never commit secrets):

- `APP_URL`: Public HTTPS origin (used for canonical URLs and `/sitemap.xml`).
- `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`: Runtime Cloud SQL credentials.
- `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`: Admin credentials for Drizzle Kit schema migrations.
- `ADMIN_BOOTSTRAP_EMAILS`: Comma-separated Google emails automatically assigned `super_admin` upon first sign-in.
- `RFQ_NOTIFICATION_WEBHOOK_URL` / `RFQ_NOTIFICATION_EMAIL`: Optional webhook endpoint for instant quotation notifications to `info@park.com.sa`.

---

## 5. Production Build & Cloud Run Deployment

```bash
npm install
npm run build
NODE_ENV=production npm start
```
