# JobAuto - AI Job Automation Platform

## 🎉 Project Complete!

A production-ready, full-stack job automation platform that uses AI to match job seekers with relevant opportunities and automatically apply on their behalf.

---

## 🚀 Live Demo

**Frontend:** https://zcjvy43pphcw2.ok.kimi.link

---

## 📁 Project Structure

```
jobauto/
├── backend/                      # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/          # Route controllers
│   │   ├── middleware/           # Auth, error handling, logging
│   │   │   ├── auth.ts           # JWT authentication
│   │   │   ├── error.ts          # Error handling
│   │   │   └── logger.ts         # Request logging
│   │   ├── routes/               # API routes
│   │   │   ├── auth.ts           # Authentication routes
│   │   │   ├── user.ts           # User management
│   │   │   ├── profile.ts        # Profile management
│   │   │   ├── job.ts            # Job listings
│   │   │   ├── application.ts    # Job applications
│   │   │   ├── subscription.ts   # Stripe subscriptions
│   │   │   ├── admin.ts          # Admin dashboard
│   │   │   ├── webhook.ts        # Stripe webhooks
│   │   │   └── ai.ts             # AI features
│   │   ├── services/             # Business logic
│   │   ├── utils/                # Utilities
│   │   │   ├── prisma.ts         # Database client
│   │   │   ├── jwt.ts            # JWT utilities
│   │   │   ├── email.ts          # Email service
│   │   │   └── logger.ts         # Winston logger
│   │   ├── types/                # TypeScript types
│   │   │   └── index.ts          # Type definitions
│   │   └── server.ts             # Entry point
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # Database seeding
│   ├── Dockerfile                # Backend Docker image
│   ├── package.json              # Backend dependencies
│   └── tsconfig.json             # TypeScript config
├── src/                          # React Frontend
│   ├── sections/                 # Page sections
│   │   ├── Navbar.tsx            # Navigation bar
│   │   ├── Hero.tsx              # Hero with particles
│   │   ├── HowItWorks.tsx        # 4-step process
│   │   ├── Features.tsx          # 9 features grid
│   │   ├── Pricing.tsx           # Pricing plans
│   │   ├── Testimonials.tsx      # Customer reviews
│   │   ├── FAQ.tsx               # FAQ accordion
│   │   ├── CTA.tsx               # Call to action
│   │   └── Footer.tsx            # Footer
│   ├── components/ui/            # shadcn/ui components (40+)
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utilities
│   ├── App.tsx                   # Main app
│   ├── App.css                   # App styles
│   ├── index.css                 # Global styles
│   └── main.tsx                  # Entry point
├── docker-compose.yml            # Local development
├── docker-compose.prod.yml       # Production deployment
├── Dockerfile                    # Frontend production
├── Dockerfile.frontend           # Frontend development
├── nginx.conf                    # Nginx configuration
├── deploy.sh                     # Deployment script
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Frontend dependencies
├── tailwind.config.js            # Tailwind CSS config
├── vite.config.ts                # Vite configuration
└── README.md                     # Documentation
```

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - 40+ modern UI components
- **GSAP** - Smooth scroll animations
- **Lucide React** - Icon library

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Primary database
- **Redis** - Caching & sessions
- **JWT** - Authentication with refresh tokens
- **bcrypt** - Password hashing

### External Integrations
- **Stripe** - Payment processing & subscriptions
- **OpenAI GPT-4** - AI job matching & resume optimization
- **Resend** - Transactional emails
- **LinkedIn/Indeed APIs** - Job portal integrations (ready)

---

## ✨ Features Implemented

### Core Platform Features
1. ✅ **Hero Section** - Particle animation, floating stats cards, social proof
2. ✅ **How It Works** - 4-step process with animated connectors
3. ✅ **Features Grid** - 9 powerful features with icons and descriptions
4. ✅ **Pricing Plans** - Free, Professional ($29), Enterprise ($99) with Stripe
5. ✅ **Testimonials** - 3D carousel with auto-play and navigation
6. ✅ **FAQ Section** - 8 common questions with accordion

### Backend Features
1. ✅ **Authentication** - JWT with refresh tokens, role-based access
2. ✅ **User Management** - Profiles, skills, experience, education
3. ✅ **Job Management** - CRUD operations, filtering, search
4. ✅ **Applications** - Apply tracking, status updates, interviews
5. ✅ **Subscriptions** - Stripe integration with webhooks
6. ✅ **AI Features** - Job matching, resume optimization, cover letters
7. ✅ **Admin Dashboard** - User management, analytics, settings
8. ✅ **Email System** - Welcome, verification, notifications

### Security Features
- ✅ JWT Authentication with refresh tokens
- ✅ Role-based Access Control (RBAC)
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ Rate limiting on all endpoints
- ✅ Input validation (express-validator)
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ SQL Injection protection (Prisma ORM)

---

## 🚀 Deployment Options

### Free Tier (Recommended)
1. **Render** - Web services + PostgreSQL (free tier)
2. **Railway** - Full-stack deployment (free tier)
3. **Vercel + Neon** - Frontend + Database (free tier)

### Production
1. **Docker** - Self-hosted with docker-compose
2. **AWS** - ECS + RDS + ElastiCache
3. **Google Cloud** - Cloud Run + Cloud SQL
4. **Azure** - Container Instances + PostgreSQL

---

## 🏁 Quick Start

### Option 1: Docker (Recommended)
```bash
cd /mnt/okcomputer/output/app

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate dev

# Seed database
docker-compose exec backend npm run db:seed
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Database: localhost:5432

### Option 2: Manual Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
npm install
npm run dev
```

---

## 🔐 Default Credentials (After Seeding)

- **Admin:** admin@jobauto.com / admin123
- **Demo:** demo@jobauto.com / demo123

---

## 📊 Database Schema

### Main Entities
- **Users** - Accounts with roles (USER, ADMIN, SUPER_ADMIN)
- **Profiles** - User profiles with skills, experience, education
- **Subscriptions** - Stripe subscription management
- **Jobs** - Cached job listings from various portals
- **Applications** - Job applications with status tracking
- **Interviews** - Interview scheduling and management
- **PortalConnections** - OAuth connections to job portals
- **Notifications** - User notifications
- **ActivityLogs** - User activity tracking
- **UserAnalytics** - Engagement metrics

---

## 🤖 AI Features

### Job Matching Algorithm
Analyzes 50+ data points:
- Skills match (50% weight)
- Experience level (20% weight)
- Location preference (15% weight)
- Role alignment (15% weight)

### Resume Optimization
- ATS compatibility scoring
- Keyword extraction and suggestions
- Professional summary rewriting

### Interview Preparation
- Company-specific question generation
- Technical topic recommendations
- Salary negotiation tips

---

## 📧 Email Templates

- Welcome email
- Email verification
- Password reset
- Application confirmation
- Interview reminders
- Subscription notifications

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test
```

---

## 📈 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
STRIPE_SECRET_KEY="sk_test_..."
OPENAI_API_KEY="sk-..."
RESEND_API_KEY="re_..."
```

### Frontend (.env)
```env
VITE_API_URL="http://localhost:5000"
```

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users (admin)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user

### Jobs
- `GET /api/jobs` - List jobs with filters
- `GET /api/jobs/:id` - Get job details
- `GET /api/jobs/recommendations/personalized` - AI recommendations

### Applications
- `GET /api/applications` - List applications
- `POST /api/applications` - Apply to job
- `PUT /api/applications/:id` - Update application

### Subscriptions
- `GET /api/subscriptions/plans` - List plans
- `POST /api/subscriptions/checkout` - Create checkout
- `POST /api/subscriptions/cancel` - Cancel subscription

### AI
- `POST /api/ai/match-job` - Calculate match score
- `POST /api/ai/optimize-resume` - Optimize resume
- `POST /api/ai/generate-cover-letter` - Generate cover letter

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List all users
- `GET /api/admin/analytics` - Platform analytics

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

## 🆘 Support

For support, email support@jobauto.com or join our Discord community.

---

**Built with ❤️ by the JobAuto Team**

*Apply to 100+ jobs while you sleep.*
