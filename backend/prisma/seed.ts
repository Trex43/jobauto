import { PrismaClient, UserRole, SubscriptionTier, JobPortal, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jobauto.com' },
    update: {},
    create: {
      email: 'admin@jobauto.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      profile: {
        create: {
          headline: 'System Administrator',
          summary: 'Platform administrator with full access.',
        },
      },
      subscription: {
        create: {
          tier: SubscriptionTier.ENTERPRISE,
          autoAppliesLimit: -1,
        },
      },
      jobPreferences: {
        create: {},
      },
      analytics: {
        create: {},
      },
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@jobauto.com' },
    update: {},
    create: {
      email: 'demo@jobauto.com',
      password: demoPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.USER,
      emailVerified: true,
      profile: {
        create: {
          headline: 'Full Stack Developer',
          summary: 'Passionate developer with 5 years of experience in web technologies.',
          yearsOfExperience: 5,
          currentTitle: 'Senior Developer',
          currentCompany: 'Tech Corp',
          location: 'San Francisco, CA',
          skills: {
            create: [
              { name: 'JavaScript', category: 'technical', proficiency: 9 },
              { name: 'TypeScript', category: 'technical', proficiency: 8 },
              { name: 'React', category: 'technical', proficiency: 9 },
              { name: 'Node.js', category: 'technical', proficiency: 8 },
              { name: 'Python', category: 'technical', proficiency: 7 },
              { name: 'PostgreSQL', category: 'technical', proficiency: 7 },
              { name: 'AWS', category: 'technical', proficiency: 6 },
              { name: 'Communication', category: 'soft', proficiency: 8 },
              { name: 'Leadership', category: 'soft', proficiency: 7 },
            ],
          },
          experiences: {
            create: [
              {
                title: 'Senior Full Stack Developer',
                company: 'Tech Corp',
                location: 'San Francisco, CA',
                startDate: new Date('2021-01-01'),
                isCurrent: true,
                description: 'Leading development of web applications using React and Node.js.',
              },
              {
                title: 'Full Stack Developer',
                company: 'Startup Inc',
                location: 'San Francisco, CA',
                startDate: new Date('2019-06-01'),
                endDate: new Date('2020-12-31'),
                isCurrent: false,
                description: 'Developed and maintained web applications.',
              },
            ],
          },
          educations: {
            create: [
              {
                institution: 'University of California, Berkeley',
                degree: 'Bachelor of Science',
                fieldOfStudy: 'Computer Science',
                startDate: new Date('2015-09-01'),
                endDate: new Date('2019-05-01'),
                isCurrent: false,
              },
            ],
          },
        },
      },
      subscription: {
        create: {
          tier: SubscriptionTier.PROFESSIONAL,
          autoAppliesLimit: -1,
        },
      },
      jobPreferences: {
        create: {
          desiredRoles: ['Full Stack Developer', 'Senior Developer', 'Tech Lead'],
          desiredLocations: ['San Francisco, CA', 'Remote', 'New York, NY'],
          remotePreference: 'hybrid',
          minSalary: 120000,
          maxSalary: 180000,
          minMatchScore: 50,
        },
      },
      analytics: {
        create: {
          totalApplications: 45,
          successfulApplications: 12,
          interviewRate: 26.7,
          offerRate: 8.9,
          estimatedTimeSaved: 120,
        },
      },
    },
  });
  console.log('✅ Created demo user:', demoUser.email);

  // Create sample jobs
  const sampleJobs = [
    {
      externalId: 'sample-1',
      portal: JobPortal.LINKEDIN,
      title: 'Senior Full Stack Engineer',
      company: 'Google',
      companyLogo: 'https://logo.clearbit.com/google.com',
      location: 'Mountain View, CA',
      remoteType: 'hybrid',
      description: 'We are looking for a Senior Full Stack Engineer to join our team. You will be responsible for building scalable web applications and mentoring junior developers.',
      requirements: '5+ years of experience with JavaScript, React, and Node.js. Experience with cloud platforms preferred.',
      salaryMin: 150000,
      salaryMax: 220000,
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
      applyUrl: 'https://careers.google.com',
      originalUrl: 'https://linkedin.com/jobs/1',
      skillsRequired: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'GCP'],
      postedAt: new Date(),
      isActive: true,
    },
    {
      externalId: 'sample-2',
      portal: JobPortal.INDEED,
      title: 'Full Stack Developer',
      company: 'Stripe',
      companyLogo: 'https://logo.clearbit.com/stripe.com',
      location: 'San Francisco, CA',
      remoteType: 'remote',
      description: 'Join our engineering team to build the future of internet payments. We are looking for talented full stack developers.',
      requirements: '3+ years of experience. Strong knowledge of JavaScript, React, and backend technologies.',
      salaryMin: 130000,
      salaryMax: 190000,
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
      applyUrl: 'https://stripe.com/jobs',
      originalUrl: 'https://indeed.com/jobs/2',
      skillsRequired: ['JavaScript', 'React', 'Node.js', 'Ruby', 'PostgreSQL'],
      postedAt: new Date(),
      isActive: true,
    },
    {
      externalId: 'sample-3',
      portal: JobPortal.LINKEDIN,
      title: 'Software Engineer - Frontend',
      company: 'Netflix',
      companyLogo: 'https://logo.clearbit.com/netflix.com',
      location: 'Los Gatos, CA',
      remoteType: 'hybrid',
      description: 'Help us build the best streaming experience in the world. We are looking for frontend engineers passionate about performance and user experience.',
      requirements: '4+ years of frontend development experience. Expert in React, TypeScript, and modern web technologies.',
      salaryMin: 160000,
      salaryMax: 240000,
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
      applyUrl: 'https://jobs.netflix.com',
      originalUrl: 'https://linkedin.com/jobs/3',
      skillsRequired: ['JavaScript', 'React', 'TypeScript', 'GraphQL', 'CSS'],
      postedAt: new Date(),
      isActive: true,
    },
    {
      externalId: 'sample-4',
      portal: JobPortal.ANGELLIST,
      title: 'Tech Lead - Full Stack',
      company: 'StartupXYZ',
      companyLogo: '',
      location: 'Remote',
      remoteType: 'remote',
      description: 'Join our fast-growing startup as a Tech Lead. You will architect and build our core product.',
      requirements: '7+ years of experience. Strong leadership skills and full stack expertise.',
      salaryMin: 140000,
      salaryMax: 200000,
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
      applyUrl: 'https://angel.co/startupxyz',
      originalUrl: 'https://angel.co/jobs/4',
      skillsRequired: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      postedAt: new Date(),
      isActive: true,
    },
    {
      externalId: 'sample-5',
      portal: JobPortal.LINKEDIN,
      title: 'Senior React Developer',
      company: 'Meta',
      companyLogo: 'https://logo.clearbit.com/meta.com',
      location: 'Menlo Park, CA',
      remoteType: 'hybrid',
      description: 'Build products that connect billions of people. Join our React engineering team.',
      requirements: '5+ years of React experience. Deep understanding of JavaScript and modern web development.',
      salaryMin: 170000,
      salaryMax: 250000,
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
      applyUrl: 'https://careers.meta.com',
      originalUrl: 'https://linkedin.com/jobs/5',
      skillsRequired: ['JavaScript', 'React', 'TypeScript', 'GraphQL', 'Relay'],
      postedAt: new Date(),
      isActive: true,
    },
  ];

  for (const job of sampleJobs) {
    await prisma.job.upsert({
      where: { externalId: job.externalId },
      update: {},
      create: job,
    });
  }
  console.log(`✅ Created ${sampleJobs.length} sample jobs`);

  // Create sample applications for demo user
  const jobs = await prisma.job.findMany({ take: 3 });
  for (const job of jobs) {
    await prisma.application.upsert({
      where: {
        userId_jobId: {
          userId: demoUser.id,
          jobId: job.id,
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        jobId: job.id,
        status: ApplicationStatus.APPLIED,
        appliedAt: new Date(),
        matchScore: 75 + Math.floor(Math.random() * 20),
        matchReasons: ['Skills match', 'Experience level', 'Location preference'],
        isAutoApplied: true,
      },
    });
  }
  console.log('✅ Created sample applications');

  // Create email templates
  const emailTemplates = [
    {
      name: 'welcome',
      subject: 'Welcome to JobAuto!',
      body: '<h1>Welcome {{firstName}}!</h1><p>Thank you for joining JobAuto. Start your job search automation today!</p>',
      variables: ['firstName', 'email'],
    },
    {
      name: 'email_verification',
      subject: 'Verify Your Email - JobAuto',
      body: '<h1>Verify Your Email</h1><p>Click <a href="{{verificationUrl}}">here</a> to verify your email.</p>',
      variables: ['firstName', 'verificationUrl'],
    },
    {
      name: 'password_reset',
      subject: 'Reset Your Password - JobAuto',
      body: '<h1>Password Reset</h1><p>Click <a href="{{resetUrl}}">here</a> to reset your password.</p>',
      variables: ['firstName', 'resetUrl'],
    },
    {
      name: 'application_confirmation',
      subject: 'Application Submitted: {{jobTitle}}',
      body: '<h1>Application Submitted!</h1><p>You have successfully applied to {{jobTitle}} at {{company}}.</p>',
      variables: ['firstName', 'jobTitle', 'company'],
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }
  console.log(`✅ Created ${emailTemplates.length} email templates`);

  // Create system settings
  const systemSettings = [
    { key: 'maintenance_mode', value: 'false', description: 'Enable/disable maintenance mode' },
    { key: 'max_auto_applies_free', value: '5', description: 'Maximum auto-applies for free tier' },
    { key: 'default_match_threshold', value: '50', description: 'Default minimum match score' },
    { key: 'email_notifications_enabled', value: 'true', description: 'Enable email notifications' },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ Created ${systemSettings.length} system settings`);

  console.log('\n✨ Database seed completed successfully!');
  console.log('\n📧 Login credentials:');
  console.log('   Admin: admin@jobauto.com / admin123');
  console.log('   Demo:  demo@jobauto.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
