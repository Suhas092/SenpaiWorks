Integration notes — SenpaiWorks admin frontend

This folder contains the new admin frontend (Vite + React + TypeScript).
Follow these steps to build and integrate it with the existing backend server in the repository root.

1) Install dependencies

  # from project root or inside admin-frontend
  cd /Users/ashetty/Personal/Senpai-Works/SenpaiWorks/admin-frontend
  npm install

  # Alternative: use yarn or pnpm if you prefer
  # pnpm install
  # yarn install

2) Build the production static assets

  npm run build

  # Output: admin-frontend/dist/client/ (index.html is a copy of _shell.html).
  # The backend serves dist/client. dist/server is not used.
  # .env.production sets VITE_DEMO_MODE=false and VITE_API_BASE_URL=/api.

3) Start or restart the backend server

  cd /Users/ashetty/Personal/Senpai-Works/SenpaiWorks/backend
  PORT=5050 DISABLE_LIVERELOAD=true npm start

  # PORT defaults to 5000, which macOS AirPlay Receiver often holds.
  # DISABLE_LIVERELOAD=true skips the livereload server on port 35729 when that port is in use.
  # NODE_ENV=production requires SESSION_SECRET and forces HTTPS redirects.
  # The admin console is at ADMIN_ROUTE (default: /senpaiworks-console), e.g. http://localhost:5050/senpaiworks-console/

Important: building for a subpath (ADMIN_ROUTE)

  If the backend serves the admin SPA under a non-root path (e.g. /senpaiworks-console), make sure the Vite build uses that base path so static assets resolve correctly.

  Example build command that sets the base path at build time:

    VITE_BASE="/senpaiworks-console/" VITE_API_BASE_URL="/api" npm run build

  Or set these in an .env file inside admin-frontend:

    VITE_BASE=/senpaiworks-console/
    VITE_API_BASE_URL=/api

  This ensures index.html references asset paths like /senpaiworks-console/assets/… so they are correctly served by the backend at the ADMIN_ROUTE.

4) Developer workflow (optional)

  # To run the frontend in dev mode with HMR and proxy to the backend APIs, run:
  cd admin-frontend
  npm run dev

  # If you prefer Vite to proxy API requests to the backend, update vite.config.ts with a dev server proxy targeting the backend port (usually 5000).

Notes & Troubleshooting

- If the server still serves the legacy admin UI, ensure the build produced `admin-frontend/dist/client/index.html`.
- If you run into missing package manager (npm not found), install Node.js (v18+ recommended) and npm, or use pnpm/bun if you prefer.
- The backend serves admin-frontend/dist/client on the configured ADMIN_ROUTE when that folder exists. No API changes were made.
- Most admin resources (rigs, motion, polls, coupons, replacements, donations, settings, reviews, product-health) have no backend endpoints yet, and admin login is not wired into the new UI.

If you'd like, I can also:
- Add an npm script to the backend to build the frontend automatically (e.g., "build:admin": "cd admin-frontend && npm ci && npm run build")
- Add a `.env.example` entry explaining ADMIN_ROUTE
- Run the build and restart the server for you (if you enable npm/pnpm in the environment)