# JobAuto - AI Job Automation Platform

A production-ready, full-stack job automation platform that uses AI to match job seekers with relevant opportunities and automatically apply on their behalf across 50+ job portals.

## 🚀 Features

- **AI-Powered Job Matching** - 50+ data points analyzed for 90%+ accuracy
- **One-Click Auto-Apply** - Apply to 100+ jobs while you sleep
- **Smart Resume Builder** - AI-optimized resumes that pass ATS systems
- **Application Tracking** - Unified dashboard for all applications
- **Interview Scheduler** - Automated scheduling and prep materials
- **Salary Insights** - Real-time data and negotiation tips
- **Multi-Portal Integration** - Connect 50+ job platforms
- **Secure & Scalable** - Enterprise-grade security and architecture

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **GSAP** - Smooth animations

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** - Database management
- **PostgreSQL** - Primary database
- **Redis** - Caching & sessions
- **JWT** - Authentication

### External Integrations
- **Stripe** - Payment processing
- **OpenAI** - AI job matching & resume optimization
- **Resend** - Email notifications
- **LinkedIn/Indeed APIs** - Job portal integrations

## 📁 Project Structure

```
jobauto/
├── backend/                 # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth, error handling, logging
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities (prisma, jwt, email)
│   │   ├── types/           # TypeScript types
│   │   └── server.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── Dockerfile
│   └── package.json
├── src/                     # React frontend
│   ├── sections/            # Page sections
│   ├── components/          # Reusable components
│   ├── hooks/               # Custom hooks
│   ├── types/               # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── docker-compose.yml       # Local development
├── Dockerfile               # Production frontend
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Option 1: Docker (Recommended for Local Development)

```bash
# Clone the repository
git clone <repository-url>
cd jobauto

# Create environment file
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate dev

# Seed the database (optional)
docker-compose exec backend npm run db:seed
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Database: localhost:5432

### Option 2: Manual Setup

#### 1. Database Setup
```bash
# Create PostgreSQL database
createdb jobauto

# Create Redis instance (or use Docker)
docker run -d -p 6379:6379 redis:7-alpine
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

#### 3. Frontend Setup
```bash
# In project root
npm install

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jobauto?schema=public"

# Server
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_ENTERPRISE=price_...

# OpenAI
OPENAI_API_KEY=sk-...

# Email
RESEND_API_KEY=re_...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Deployment

### Free Deployment Options

#### 1. Render (Recommended - Free Tier)

**Backend:**
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Build Command: `npm install && npm run build && npx prisma migrate deploy`
5. Start Command: `npm start`
6. Add environment variables

**Frontend:**
1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add `VITE_API_URL` environment variable

**Database:**
1. Create a new PostgreSQL database on Render (free tier)
2. Copy the internal database URL to your backend environment variables

#### 2. Railway (Free Tier)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy backend
cd backend
railway up

# Deploy frontend
cd ..
railway up
```

#### 3. Vercel + Neon (Free Tier)

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Backend (Vercel Serverless):**
1. Create `vercel.json` in backend folder
2. Deploy with `vercel --prod`

**Database (Neon):**
1. Create a free Neon PostgreSQL database
2. Copy connection string to environment variables

### Production Deployment

#### Docker Production Build

```bash
# Build frontend
docker build -t jobauto-frontend .

# Build backend
cd backend
docker build -t jobauto-backend .

# Run with docker-compose production
docker-compose -f docker-compose.prod.yml up -d
```

#### AWS Deployment

**Using ECS + RDS:**
1. Push Docker images to ECR
2. Create ECS cluster and task definitions
3. Set up RDS PostgreSQL instance
4. Configure Application Load Balancer
5. Set up auto-scaling policies

**Using Elastic Beanstalk:**
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker jobauto

# Create environment
eb create production

# Deploy
eb deploy
```

## 📊 Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users** - User accounts with roles (USER, ADMIN, SUPER_ADMIN)
- **Profiles** - User profiles with skills, experience, education
- **Subscriptions** - Subscription management with Stripe integration
- **Jobs** - Cached job listings from various portals
- **Applications** - Job applications with status tracking
- **Interviews** - Interview scheduling and management
- **PortalConnections** - OAuth connections to job portals

Run `npx prisma studio` to explore the database visually.

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (RBAC)
- **Password Hashing** with bcrypt (12 rounds)
- **Rate Limiting** on all endpoints
- **Input Validation** with express-validator
- **Helmet.js** for security headers
- **CORS** configuration
- **SQL Injection Protection** via Prisma ORM

## 🤖 AI Features

### Job Matching Algorithm
The AI analyzes:
- Skills match (50% weight)
- Experience level (20% weight)
- Location preference (15% weight)
- Role alignment (15% weight)

### Resume Optimization
- ATS compatibility scoring
- Keyword extraction and suggestions
- Professional summary rewriting
- Format optimization

### Interview Preparation
- Company-specific question generation
- Technical topic recommendations
- Salary negotiation tips

## 📧 Email Templates

The application includes pre-built email templates:
- Welcome email
- Email verification
- Password reset
- Application confirmation
- Interview reminders
- Subscription notifications

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test

# E2E tests
npm run test:e2e
```

## 📈 Monitoring & Analytics

- **Winston Logger** for application logs
- **Activity Logs** for user actions
- **User Analytics** for engagement metrics
- **Error Tracking** with detailed stack traces

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- Documentation: [docs.jobauto.com](https://docs.jobauto.com)
- Email: support@jobauto.com
- Community: [Discord](https://discord.gg/jobauto)

---

Built with ❤️ by the JobAuto Team
