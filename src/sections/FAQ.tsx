import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.faq-title', {
        scrollTrigger: {
          trigger: '.faq-title',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
      });

      gsap.from('.faq-item', {
        scrollTrigger: {
          trigger: '.faq-list',
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const faqs = [
    {
      question: 'How does the AI job matching work?',
      answer:
        'Our AI analyzes over 50 data points from your profile including skills, experience, preferences, and career goals. It then matches you with jobs that have a 50%+ compatibility score, ensuring you only apply to positions where you have a strong chance of success.',
    },
    {
      question: 'Is my data secure when connecting job portals?',
      answer:
        'Absolutely. We use bank-level 256-bit encryption for all data transfers and OAuth 2.0 for secure authentication with job portals. We never store your passwords, and you can revoke access at any time. Your data is never sold or shared with third parties.',
    },
    {
      question: 'Can I customize which jobs get auto-applied?',
      answer:
        'Yes! You have full control over your preferences. Set minimum match scores, desired salary ranges, locations, remote work preferences, and company size. You can also exclude specific companies or keywords, and review every match before it gets applied.',
    },
    {
      question: 'What happens after I auto-apply to a job?',
      answer:
        "You'll receive a confirmation email for each application. All applications are tracked in your unified dashboard where you can monitor status changes, schedule interviews, and take notes. We also send you alerts when employers view your application or request interviews.",
    },
    {
      question: 'How is this different from other job boards?',
      answer:
        "Unlike traditional job boards where you manually search and apply, JobAuto uses AI to find opportunities across 50+ platforms and automatically applies on your behalf. This saves 10+ hours per week and ensures you never miss a relevant opportunity, even while you sleep.",
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer:
        'Yes, you can cancel your subscription at any time with no cancellation fees. If you cancel, youll continue to have access until the end of your billing period. You can also downgrade to the Free plan and keep your profile and application history.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'We offer a 14-day money-back guarantee for all paid plans. If youre not satisfied with JobAuto for any reason, contact our support team within 14 days of your purchase for a full refund, no questions asked.',
    },
    {
      question: 'How do I get started?',
      answer:
        "Getting started is easy! Create a free account, upload your resume or connect your LinkedIn profile, link your preferred job portals, and set your job preferences. Our AI will start finding and applying to matching jobs within minutes. The entire setup takes less than 5 minutes.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#7c39f6]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-[#a855f7]/10 rounded-full blur-[100px]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="faq-title inline-block px-4 py-1.5 rounded-full bg-[#7c39f6]/10 border border-[#7c39f6]/30 text-[#a855f7] text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="faq-title text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-[#7c39f6] to-[#a855f7] bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="faq-title text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to know about JobAuto. Cant find the answer youre looking for?{' '}
            <a href="#" className="text-[#a855f7] hover:underline">
              Contact our support team
            </a>
            .
          </p>
        </div>

        {/* FAQ List */}
        <div className="faq-list space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item glass rounded-xl border transition-all duration-300 ${
                openIndex === index
                  ? 'border-[#7c39f6]/30 bg-[#7c39f6]/5'
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      openIndex === index
                        ? 'bg-gradient-to-br from-[#7c39f6] to-[#a855f7]'
                        : 'bg-white/5'
                    }`}
                  >
                    <HelpCircle
                      className={`w-5 h-5 ${openIndex === index ? 'text-white' : 'text-gray-400'}`}
                    />
                  </div>
                  <span className="text-white font-semibold pr-4">{faq.question}</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-6 pl-20">
                  <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 text-center">
          <div className="glass rounded-2xl p-8 border border-[#7c39f6]/20">
            <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
            <p className="text-gray-400 mb-6">
              Our team is here to help. Reach out and well get back to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all">
                Contact Support
              </button>
              <button className="px-6 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
