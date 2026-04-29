# JobAuto Fix TODO - Portal Connect + Job Sync
Approved Plan: Fix "Invalid data provided" + "Sync failed/No jobs found"

## Progress: 0/12 ✅

### STEP 1: Create this TODO.md [DONE]

### Backend Fixes (6)
1. [x] `backend/src/routes/portals.ts` - Fix connect validation + empty body
2. [x] `backend/src/services/jobAggregator.ts` - User-aware sync from connected portals only
3. [ ] `backend/src/routes/job.ts` - Prioritize user's connected portals in search
4. [ ] Create 5 new job sources: `backend/src/services/jobSources/`
   - [ ] adzuna.ts (free API)
   - [ ] themuse.ts (free API)
   - [ ] remoteyoke.ts (free)
   - [ ] publicapis.ts (aggregate)
   - [ ] google-jobs-scraper.ts (free scraper)
5. [ ] `backend/src/routes/portals.ts` - Fix /:portal/sync to use specific portal
6. [ ] Install deps: `cd backend && npm i axios cheerio node-fetch`

### Frontend Fixes (3)
7. [ ] `src/pages/Portals.tsx` - Add "No login needed" messaging + better UX
8. [ ] `src/pages/Jobs.tsx` - Fix empty state: Show portal sync reminder
9. [ ] `src/components/EmptyState.tsx` - Customize for jobs

### Database/Deploy (2)
10. [ ] `npx prisma generate && npx prisma db push`
11. [ ] Test endpoints + UI

### Verification (1)
12. [ ] **Connect portal → Sync → Search shows jobs** → attempt_completion

**Next:** Edit portals.ts connect endpoint

