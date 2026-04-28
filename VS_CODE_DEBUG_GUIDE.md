# VS Code / Blackbox AI Extension Debug Guide

## How to Inspect Blackbox Extension Logs

### 1. Open VS Code Webview Developer Tools
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Developer: Open Webview Developer Tools"
3. Select it — this opens Chrome DevTools for the Blackbox webview

### 2. Check Browser/Extension Console
- Look for red errors in the **Console** tab
- Search for `[API]` prefixed logs to see request/response details
- Check for CORS errors (`Access-Control-Allow-Origin`)
- Look for 401/403 auth errors

### 3. Check Network Tab
- Filter by "api" to see all backend requests
- Inspect `/api/preferences` and `/api/portals` calls
- Check response status and payload
- Verify request headers include `Authorization: Bearer <token>`

### 4. Check Cached Auth State
Open VS Code terminal or browser console and run:

```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));

// Decode JWT payload (basic)
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token expires:', new Date(payload.exp * 1000));
  console.log('Token valid:', payload.exp * 1000 > Date.now());
}
```

### 5. Reset Extension Session (If Dashboard Failed)
If the dashboard fails to initialize:

```javascript
// Clear all cached auth data
localStorage.removeItem('token');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');

// Clear any extension-specific keys
Object.keys(localStorage).forEach(key => {
  if (key.includes('blackbox') || key.includes('auth')) {
    localStorage.removeItem(key);
  }
});

// Reload the webview
location.reload();
```

### 6. Detect Free Version UI Restrictions
- Check if API responses include `tier: "FREE"` or subscription data
- Free tier may have `autoAppliesLimit: 5` vs unlimited for paid
- Check for any `upgradeRequired` flags in API responses
- Inspect if certain UI elements are conditionally rendered based on `user.role` or `subscription.tier`

### 7. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `HTTP 401` on /api/preferences | Token expired or missing | Log out and log back in |
| `HTTP 404` on /api/portals | Route not registered | Verify backend server.ts includes portalRoutes |
| `Network Error` | Backend not running | Start backend: `cd backend && npm run dev` |
| `CORS blocked` | Origin not allowed | Check backend CORS config in server.ts |
| `Prisma error P2021` | Missing database column | Run `npx prisma migrate dev` |
| Blank screen, no errors | `prefs` is null, falls to `: null` | Fixed in this patch — adds ErrorState + EmptyState |

### 8. Testing the Fix Locally

```bash
# 1. Start the backend
cd backend
npm install
npx prisma migrate dev --name add_preferences_fields
npx prisma generate
npm run dev

# 2. In a new terminal, start the frontend
cd ..
npm install
npm run dev

# 3. Open http://localhost:5173
# 4. Register / Login
# 5. Navigate to /preferences and /portals
```

### 9. Manual Setup Fallback (If UI Still Broken)
If the dashboard UI is completely broken, you can manually configure via API:

```bash
# Set preferences via curl
curl -X PUT http://localhost:5000/api/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "desiredRoles": ["GIS Analyst", "Data Analyst"],
    "desiredLocations": ["Kuwait", "Remote"],
    "remotePreference": "remote",
    "minSalary": 800,
    "maxSalary": 1500,
    "salaryCurrency": "KWD",
    "salaryPeriod": "monthly",
    "minMatchScore": 60,
    "skills": ["GIS", "Python", "SQL", "Remote Sensing"],
    "experienceLevel": "mid",
    "autoApplyLimit": 5
  }'

# Connect portals via curl
curl -X POST http://localhost:5000/api/portals/LINKEDIN/connect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'

curl -X POST http://localhost:5000/api/portals/BAYT/connect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'

curl -X POST http://localhost:5000/api/portals/INDEED/connect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```

### 10. Production Deployment Checklist
- [ ] Run `npx prisma migrate deploy` on production database
- [ ] Run `npx prisma generate` before build
- [ ] Verify `DATABASE_URL` env var is set
- [ ] Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- [ ] Ensure `CLIENT_URL` matches your frontend domain
- [ ] Check Render/Railway logs for startup errors
- [ ] Test `/health` endpoint returns 200
- [ ] Test `/api/preferences` with valid auth token
- [ ] Test `/api/portals` with valid auth token

