# Job Search Fix Plan

**Current Issue:** No jobs + sync fails (empty DB, job fetchers fail)

**Diagnosis:**
- Job table empty
- No PortalConnections  
- Job sources need API keys/env vars
- No seed data on deployment

**Fix Steps:**
- [ ] Run seed.ts locally (`cd backend && npm run db:seed`)
- [ ] Add Render env vars for job APIs (ADZUNA_APP_ID etc)
- [ ] Test `/api/jobs/sync` endpoint
- [ ] Check Redis/BullMQ config for workers
- [ ] Add job count monitoring

**Immediate Test:**
```
cd backend
npm run db:seed
curl "http://localhost:5000/api/jobs?limit=10"
```

