# Fix Preferences and Portals Blank Screen

## Root Cause
- Preferences.tsx: When API fails, `prefs` stays `null`, render falls to `: null` → blank screen
- Portals.tsx: Empty array with no empty-state message → appears blank

## Steps
- [x] Create TODO.md with plan
- [x] Fix `src/lib/api.ts` — local dev fallback URL + better error logging
- [x] Create `src/components/ErrorState.tsx` — reusable error card
- [x] Create `src/components/EmptyState.tsx` — reusable empty state
- [x] Rewrite `src/pages/Preferences.tsx` — error/empty states + missing fields
- [x] Rewrite `src/pages/Portals.tsx` — error/empty states + 50+ portals
- [x] Update `backend/prisma/schema.prisma` — new fields + expanded JobPortal enum
- [x] Update `backend/src/routes/preferences.ts` — handle new fields
- [x] Update `backend/src/routes/portals.ts` — 50+ portals array
- [x] Create `VS_CODE_DEBUG_GUIDE.md`
- [ ] Run Prisma migrate + generate
- [ ] Test and verify

## Deployment Commands
```bash
# Backend
cd backend
npx prisma migrate dev --name add_preferences_fields
npx prisma generate
npm run dev

# Frontend (new terminal)
npm run dev
```

## Manual Fallback Setup
If UI is still broken after fixes, use curl:
```bash
# Preferences
curl -X PUT http://localhost:5000/api/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "desiredRoles": ["GIS Analyst"],
    "desiredLocations": ["Kuwait", "Remote"],
    "remotePreference": "remote",
    "minSalary": 800,
    "maxSalary": 1500,
    "salaryCurrency": "KWD",
    "salaryPeriod": "monthly",
    "minMatchScore": 60,
    "skills": ["GIS", "Python", "SQL"],
    "experienceLevel": "mid",
    "autoApplyLimit": 5
  }'

# Connect portals
curl -X POST http://localhost:5000/api/portals/LINKEDIN/connect -H "Authorization: Bearer YOUR_TOKEN" -d '{}'
curl -X POST http://localhost:5000/api/portals/BAYT/connect -H "Authorization: Bearer YOUR_TOKEN" -d '{}'
curl -X POST http://localhost:5000/api/portals/INDEED/connect -H "Authorization: Bearer YOUR_TOKEN" -d '{}'
```

