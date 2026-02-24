import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Brain,
  MousePointerClick,
  FileText,
  BarChart3,
  Calendar,
  DollarSign,
  Building2,
  Users,
  TrendingUp,
} from 'lucide-react';

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.from('.features-title', {
        scrollTrigger: {
          trigger: '.features-title',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Feature cards animation
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: '.features-grid',
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Matching',
      description:
        'Our advanced AI analyzes 50+ data points to match you with jobs that fit your skills, experience, and preferences with 90%+ accuracy.',
      gradient: 'from-violet-500 to-purple-500',
      highlight: true,
    },
    {
      icon: MousePointerClick,
      title: 'One-Click Apply',
      description:
        'Apply to hundreds of jobs across all major platforms with a single click. No more filling out the same forms repeatedly.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FileText,
      title: 'Smart Resume Builder',
      description:
        'AI-optimized resume templates that pass ATS systems. Get real-time suggestions to improve your chances of getting noticed.',
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      icon: BarChart3,
      title: 'Application Tracking',
      description:
        'Unified dashboard to track all your applications. Know exactly where you stand with every company at a glance.',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Calendar,
      title: 'Interview Scheduler',
      description:
        'Automatically schedule interviews based on your availability. Get reminders and prep materials delivered to your inbox.',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: DollarSign,
      title: 'Salary Insights',
      description:
        'Access real-time salary data and negotiation tips. Know your worth and get paid what you deserve.',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Building2,
      title: 'Company Research',
      description:
        'Deep insights into company culture, interview process, and employee reviews. Make informed decisions about your next move.',
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Users,
      title: 'Network Leverage',
      description:
        'Identify connections at target companies and request warm introductions. Turn cold applications into warm leads.',
      gradient: 'from-teal-500 to-cyan-500',
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description:
        'Detailed analytics on your job search performance. Track application rates, response rates, and time-to-offer metrics.',
      gradient: 'from-red-500 to-pink-500',
    },
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-[#7c39f6]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-[#a855f7]/10 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <span className="features-title inline-block px-4 py-1.5 rounded-full bg-[#7c39f6]/10 border border-[#7c39f6]/30 text-[#a855f7] text-sm font-medium mb-4">
            Powerful Features
          </span>
          <h2 className="features-title text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-[#7c39f6] to-[#a855f7] bg-clip-text text-transparent">
              Land Your Dream Job
            </span>
          </h2>
          <p className="features-title text-gray-400 text-lg max-w-2xl mx-auto">
            Our comprehensive suite of AI-powered tools handles every aspect of your job search,
            from discovery to offer negotiation.
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`feature-card group relative glass rounded-2xl p-6 lg:p-8 border border-white/5 hover:border-[#7c39f6]/30 transition-all duration-300 hover:-translate-y-2 ${
                feature.highlight ? 'lg:col-span-1 ring-1 ring-[#7c39f6]/30' : ''
              }`}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#a855f7] transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c39f6]/0 to-[#a855f7]/0 group-hover:from-[#7c39f6]/5 group-hover:to-[#a855f7]/5 transition-all duration-300 -z-10" />

              {/* Popular Badge */}
              {feature.highlight && (
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] rounded-full text-xs font-semibold text-white">
                  Popular
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 lg:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: '50+', label: 'Job Portals' },
            { value: '90%+', label: 'Match Accuracy' },
            { value: '24/7', label: 'Auto-Apply' },
            { value: '10hrs+', label: 'Time Saved/Week' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 glass rounded-xl border border-white/5"
            >
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#7c39f6] to-[#a855f7] bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
