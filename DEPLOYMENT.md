# 🚀 Render Deployment Guide - JobAuto

## Status: ✅ Backend Live — Frontend SPA Deployed

### Live URLs
- **Backend API**: https://jobauto-us7r.onrender.com
- **Frontend**: Will be deployed as Render Static Site (separate service)

---

## Backend Deployment ✅ COMPLETE

### Render Config (Web Service)
| Setting | Value |
|---------|-------|
| Build Command | `cd backend && npm install && npx prisma generate && npm run build` |
| Start Command | `cd backend && chmod +x start.sh && ./start.sh` |
| Root Directory | `backend` |

### Environment Variables (Required)
```
DATABASE_URL=postgresql://username:password@host:5432/dbname
JWT_SECRET=your-super-secret-64-char-string
JWT_REFRESH_SECRET=another-super-secret-64-char-string
CLIENT_URL=https://your-frontend-domain.onrender.com
NODE_ENV=production
PORT=5000
```

### Environment Variables (Optional - for full features)
```
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

### What start.sh does
1. `npx prisma db push --accept-data-loss` — Auto-creates DB tables (no migration files needed)
2. `node dist/server.js` — Starts the API server

### Health Check Endpoint
- `GET /` → Returns `{ status: "ok", service: "jobauto-api", timestamp: "..." }`

---

## Frontend Deployment

### Option A: Render Static Site (Recommended)
1. Create new **Static Site** on Render
2. Connect same GitHub repo
3. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variable**: `VITE_API_URL=https://jobauto-us7r.onrender.com`

### Option B: Vercel/Netlify
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://jobauto-us7r.onrender.com`

### Frontend Features Now Working
- ✅ React Router SPA routing (`/`, `/login`, `/register`, `/dashboard`)
- ✅ JWT auth with localStorage persistence
- ✅ Login/Register pages with API integration
- ✅ Protected Dashboard with sidebar navigation
- ✅ AuthContext for global auth state
- ✅ API client with Bearer token injection
- ✅ Landing page CTAs link to `/register`
- ✅ Navbar shows Dashboard button when logged in

---

## Testing the API

### Register a new user
```bash
curl -X POST https://jobauto-us7r.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST https://jobauto-us7r.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get applications stats (authenticated)
```bash
curl https://jobauto-us7r.onrender.com/api/applications/stats/overview \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend SPA   │────▶│  Render Backend │────▶│  Render PostgreSQL│
│  (Vite + React) │◀────│  (Express + Prisma)│◀────│  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
   LocalStorage (JWT)
```

---

## Troubleshooting

### Backend 500 P2021 (missing tables)
**Fixed**: `start.sh` runs `prisma db push --accept-data-loss` on startup, which auto-creates all tables from the schema.

### Frontend TypeScript errors in editor
These are just missing `node_modules` locally. Run `npm install` to resolve, or ignore — they won't affect the build on Render.

### CORS issues
Backend already has CORS configured. Ensure `CLIENT_URL` env var matches your frontend domain.

---

## Next Steps
1. ✅ Backend deployed and running
2. ✅ Frontend SPA code pushed
3. ⏳ Deploy frontend as Static Site on Render (or Vercel/Netlify)
4. ⏳ Set `CLIENT_URL` to match frontend domain
5. ⏳ Set `VITE_API_URL` in frontend to match backend domain

