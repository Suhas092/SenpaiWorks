# SenpaiWorks Admin

React 19 + TypeScript + Tailwind v4 + Headless UI. The host uses TanStack Start/Router instead of React Router. Modular page TSX files live in `src/pages/`, shared controls in `src/components/`, thin route wrappers in `src/routes/`. This is a frontend integration scaffold, not a deployed authenticated backend.

## Run

`bun install` then `bun run dev`. Tests: `bun run test`. Vite host/port config: `vite.config.ts`.

## Backend wiring

Demo mode is enabled by default and explicitly labeled. Sample users, emails, revenue, INR prices and orders are illustrative. Edits last for the current page session only. Set `VITE_DEMO_MODE=false` to enable existing backend requests. Set `VITE_API_BASE_URL` to your backend URL (defaults to `/api`). Adapt endpoints, fields and sample rows in `src/data/resources.ts`; currency formatting lives in `money()`.

`src/api.ts` exports get/post/put/patch/del with fetch `credentials: 'include'`, JSON parsing, HTTP errors and 204 support. List endpoints expect arrays; adapt useFetch for paginated envelopes. Lists currently filter and paginate loaded data locally. Reusable hooks include useFetch/useMutate/useProducts/useAdminReviews/useReviews/usePagination/useDebounce/useModal. Types: `src/types.ts`. Validation schemas: `src/lib/validation.ts`.

For a backend on a different port such as localhost:3001, enable CORS for the exact frontend origin and credentials; never use wildcard origins with cookies. Prefer same-origin proxying in production. Backend session cookies should be HttpOnly, Secure, SameSite=Lax; cross-site cookies require SameSite=None, Secure and CSRF protection. Backend must authenticate every admin request, enforce permissions and validate payloads. Client validation alone is not a security boundary. Never place private payment/API keys in VITE variables.

## Remaining integration work

- Dashboard metrics are demo values; wire `/admin/metrics` for live metrics.
- Image controls validate file type/size and show local previews. Implement multipart/signed uploads and store returned URLs; no simulated progress is shown.
- Hero/featured editors need initial GET mappings; visibility checkboxes need payload wiring.
- Order details need real line items, shipping address and history. Refund/replace controls request status changes, not payment transactions. Adapt `/orders/:id/status` to your backend.
- Replies require a valid email; email sending must occur server-side. Add your preferred send confirmation flow.
- Product DELETE 409 offers archive; adapt the archive endpoint/payload.
- Roles and payment settings are frontend fields only; real permissions, credentials and transaction handling belong to your backend.
- Library images are generated sample collectible photography; replace with actual artwork/motion assets.
- Site settings toggles need backend mappings. No login/logout service is included.

## Standalone use

Reuse `pages`, `components`, `hooks`, `api.ts`, `types.ts`, `data` and `styles.css` in a Vite React project with the `@` alias and QueryClientProvider. Install Headless UI, TanStack Query, lucide-react, sonner, zod and Tailwind v4. Replace TanStack Link/navigation imports and route wrappers if using another router. This repository itself must retain its TanStack Start bootstrap.
