import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';

const Pricing = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.pricing-title', {
        scrollTrigger: {
          trigger: '.pricing-title',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
      });

      gsap.from('.pricing-card', {
        scrollTrigger: {
          trigger: '.pricing-grid',
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const plans = [
    {
      name: 'Free',
      icon: Sparkles,
      description: 'Get started with basic job automation',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        { text: '5 auto-applies per month', included: true },
        { text: 'Basic AI matching', included: true },
        { text: '3 job portals', included: true },
        { text: 'Email support', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Unlimited auto-applies', included: false },
        { text: 'Advanced AI matching', included: false },
        { text: 'All 50+ portals', included: false },
        { text: 'Resume optimization', included: false },
        { text: 'Interview scheduler', included: false },
      ],
      cta: 'Get Started Free',
      popular: false,
      gradient: 'from-gray-500 to-gray-600',
    },
    {
      name: 'Professional',
      icon: Zap,
      description: 'Perfect for active job seekers',
      monthlyPrice: 29,
      yearlyPrice: 24,
      features: [
        { text: 'Unlimited auto-applies', included: true },
        { text: 'Advanced AI matching (50%+)', included: true },
        { text: 'All 50+ job portals', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Resume optimization', included: true },
        { text: 'Interview scheduler', included: true },
        { text: 'Salary insights', included: true },
        { text: 'Custom integrations', included: false },
        { text: 'API access', included: false },
      ],
      cta: 'Start Free Trial',
      popular: true,
      gradient: 'from-[#7c39f6] to-[#a855f7]',
    },
    {
      name: 'Enterprise',
      icon: Crown,
      description: 'For teams and agencies',
      monthlyPrice: 99,
      yearlyPrice: 79,
      features: [
        { text: 'Everything in Professional', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'API access', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'White-label options', included: true },
        { text: 'SSO authentication', included: true },
        { text: 'Custom contracts', included: true },
        { text: 'SLA guarantee', included: true },
        { text: '24/7 phone support', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#7c39f6]/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#a855f7]/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="pricing-title inline-block px-4 py-1.5 rounded-full bg-[#7c39f6]/10 border border-[#7c39f6]/30 text-[#a855f7] text-sm font-medium mb-4">
            Pricing Plans
          </span>
          <h2 className="pricing-title text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-[#7c39f6] to-[#a855f7] bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h2>
          <p className="pricing-title text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Start free and scale as you grow. All plans include core features to accelerate your job
            search.
          </p>

          {/* Billing Toggle */}
          <div className="pricing-title inline-flex items-center gap-4 p-1.5 glass rounded-xl border border-white/10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-grid grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card relative glass rounded-2xl p-6 lg:p-8 border transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? 'border-[#7c39f6]/50 ring-1 ring-[#7c39f6]/30 scale-105 lg:scale-110 z-10'
                  : 'border-white/5 hover:border-[#7c39f6]/30'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] rounded-full text-sm font-semibold text-white">
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div
                  className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}
                >
                  <plan.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl lg:text-5xl font-bold text-white">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-gray-400">/month</span>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                  <p className="text-sm text-green-400 mt-1">
                    Billed annually (${plan.yearlyPrice * 12}/year)
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 text-gray-500" />
                      </div>
                    )}
                    <span className={feature.included ? 'text-gray-300 text-sm' : 'text-gray-500 text-sm'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`w-full py-4 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white hover:shadow-[0_0_30px_rgba(124,57,246,0.5)] hover:-translate-y-0.5'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm mb-4">Trusted by professionals from</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix'].map((company) => (
              <span key={company} className="text-xl font-bold text-gray-500">
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
