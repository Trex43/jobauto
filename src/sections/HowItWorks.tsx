import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { UserPlus, Link2, Sliders, Rocket } from 'lucide-react';

const HowItWorks = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.from('.hiw-title', {
        scrollTrigger: {
          trigger: '.hiw-title',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Steps animation
      gsap.from('.hiw-step', {
        scrollTrigger: {
          trigger: '.hiw-steps',
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
      });

      // Connector line animation
      gsap.from('.hiw-connector', {
        scrollTrigger: {
          trigger: '.hiw-steps',
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        scaleX: 0,
        duration: 1.5,
        ease: 'power2.out',
        delay: 0.5,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      icon: UserPlus,
      number: '01',
      title: 'Create Your Profile',
      description:
        'Upload your resume or connect your LinkedIn. Our AI extracts your skills, experience, and preferences in seconds.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Link2,
      number: '02',
      title: 'Connect Job Portals',
      description:
        'Securely link your accounts from 50+ job platforms including LinkedIn, Indeed, Glassdoor, and more.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Sliders,
      number: '03',
      title: 'Set Preferences',
      description:
        'Define your desired role, salary range, location, and minimum match threshold (50%+ recommended).',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Rocket,
      number: '04',
      title: 'Auto-Apply & Track',
      description:
        'Our AI applies to matching jobs 24/7 while you sleep. Track everything from one unified dashboard.',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-[#7c39f6]/10 rounded-full blur-[100px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#a855f7]/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <span className="hiw-title inline-block px-4 py-1.5 rounded-full bg-[#7c39f6]/10 border border-[#7c39f6]/30 text-[#a855f7] text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="hiw-title text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Get Hired in{' '}
            <span className="bg-gradient-to-r from-[#7c39f6] to-[#a855f7] bg-clip-text text-transparent">
              4 Simple Steps
            </span>
          </h2>
          <p className="hiw-title text-gray-400 text-lg max-w-2xl mx-auto">
            Our AI-powered platform handles the heavy lifting so you can focus on preparing for
            interviews and landing your dream job.
          </p>
        </div>

        {/* Steps */}
        <div className="hiw-steps relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#7c39f6]/30 to-transparent">
            <div className="hiw-connector absolute inset-0 bg-gradient-to-r from-[#7c39f6] via-[#a855f7] to-[#7c39f6] origin-left" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="hiw-step relative group"
              >
                {/* Step Card */}
                <div className="relative glass rounded-2xl p-6 lg:p-8 border border-white/5 hover:border-[#7c39f6]/30 transition-all duration-300 hover:-translate-y-2 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>

                  {/* Hover Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7c39f6]/0 to-[#a855f7]/0 group-hover:from-[#7c39f6]/5 group-hover:to-[#a855f7]/5 transition-all duration-300 -z-10" />
                </div>

                {/* Arrow (Desktop, except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-4 z-10">
                    <div className="w-8 h-8 rounded-full bg-[#0a0a0f] border border-[#7c39f6]/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-[#7c39f6]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-6">
            Ready to automate your job search?{' '}
            <span className="text-white font-semibold">It takes less than 5 minutes to set up.</span>
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(124,57,246,0.5)] transition-all hover:-translate-y-1">
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
