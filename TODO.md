# Deployment Fixes - TypeScript Errors

**Status:** 0/12 ✅ Plan approved

## Steps:
- [ ] 1. Create Express types in types/index.ts
- [ ] 2. Fix all 8 route files (add Request, Response types to handlers)
- [ ] 3. Fix job.ts Prisma include (move jobPreferences to User, add skills)
- [ ] 4. Fix jwt.ts expiresIn type (use number or cast)
- [ ] 5. Update backend/tsconfig.json (if needed)
- [ ] 6. Test local build: cd backend && npm run build
- [ ] 7. git add/commit/push → Render auto-deploys
- [ ] 8. Deploy Frontend Static Site
- [ ] 9. Seed DB & Test
- [ ] 10. Complete deployment

**Current:** Starting file fixes...

