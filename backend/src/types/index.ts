// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  phone?: string;
  location?: string;
  country?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  headline?: string;
  summary?: string;
  yearsOfExperience?: number;
  currentTitle?: string;
  currentCompany?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  resumeText?: string;
  skills: Skill[];
  experiences: Experience[];
  educations: Education[];
}

export interface Skill {
  id: string;
  profileId: string;
  name: string;
  category?: string;
  proficiency?: number;
  isAiExtracted: boolean;
  createdAt: Date;
}

export interface Experience {
  id: string;
  profileId: string;
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
  createdAt: Date;
}

export interface Education {
  id: string;
  profileId: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  gpa?: string;
  createdAt: Date;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  tier: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  status?: string;
  autoAppliesUsed: number;
  autoAppliesLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

// Job Types
export interface Job {
  id: string;
  externalId: string;
  portal: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  remoteType?: string;
  description: string;
  requirements?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryPeriod: string;
  applyUrl: string;
  originalUrl: string;
  skillsRequired: string[];
  matchScore?: number;
  postedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Application Types
export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: 'PENDING' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  appliedAt?: Date;
  coverLetter?: string;
  notes?: string;
  matchScore?: number;
  matchReasons: string[];
  isAutoApplied: boolean;
  autoApplyConfig?: any;
  responseReceivedAt?: Date;
  responseType?: string;
  createdAt: Date;
  updatedAt: Date;
  job?: Job;
  interviews?: Interview[];
}

export interface Interview {
  id: string;
  applicationId: string;
  userId: string;
  scheduledAt: Date;
  duration: number;
  type: string;
  round: string;
  interviewerName?: string;
  interviewerEmail?: string;
  status: string;
  notes?: string;
  prepMaterials?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Portal Connection Types
export interface PortalConnection {
  id: string;
  userId: string;
  portal: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  isConnected: boolean;
  connectedAt?: Date;
  lastSyncAt?: Date;
  portalUserId?: string;
  profileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Job Preference Types
export interface JobPreference {
  id: string;
  userId: string;
  desiredRoles: string[];
  desiredLocations: string[];
  remotePreference?: string;
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency: string;
  salaryPeriod: string;
  minMatchScore: number;
  industryPreferences: string[];
  companySizePreferences: string[];
  excludedCompanies: string[];
  excludedKeywords: string[];
  emailNotifications: boolean;
  dailyDigest: boolean;
  instantAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  actionText?: string;
  createdAt: Date;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  description?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Analytics Types
export interface UserAnalytics {
  id: string;
  userId: string;
  totalApplications: number;
  successfulApplications: number;
  interviewRate: number;
  offerRate: number;
  lastActiveAt?: Date;
  totalLogins: number;
  averageMatchScore: number;
  totalMatches: number;
  estimatedTimeSaved: number;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// AI Types
export interface JobMatchResult {
  matchScore: number;
  skillMatch: {
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
  };
  aiAnalysis?: {
    overallMatchScore: number;
    skillMatchScore: number;
    experienceMatchScore: number;
    keyStrengths: string[];
    gaps: string[];
    recommendations: string[];
  };
  isRecommended: boolean;
}

export interface ResumeOptimization {
  atsScore: number;
  keywordMatches: string[];
  missingKeywords: string[];
  suggestions: string[];
  optimizedSummary: string;
}

export interface ExtractedSkills {
  technicalSkills: Array<{ name: string; proficiency: number }>;
  softSkills: Array<{ name: string; proficiency: number }>;
  domainSkills: Array<{ name: string; proficiency: number }>;
  suggestedJobTitles: string[];
  experienceYears: number;
}

// Stripe Types
export interface StripeSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  metadata: {
    userId: string;
    plan: string;
  };
}

// Email Types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}
