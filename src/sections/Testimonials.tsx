import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

const Testimonials = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      company: 'Google',
      image: 'SJ',
      content:
        'JobAuto completely transformed my job search. I applied to over 200 positions in just two weeks and landed 5 interviews. The AI matching is incredibly accurate - every job it suggested was relevant to my skills.',
      rating: 5,
      metric: '200+',
      metricLabel: 'Applications',
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'Stripe',
      image: 'MC',
      content:
        'As a busy professional, I didnt have time to manually apply to jobs. JobAuto saved me 10+ hours per week and helped me find opportunities I would have never discovered on my own.',
      rating: 5,
      metric: '10hrs',
      metricLabel: 'Time Saved/Week',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Data Scientist',
      company: 'Netflix',
      image: 'ER',
      content:
        'The resume optimization feature is a game-changer. My application response rate went from 5% to 35% after using JobAuto. I received 3 offers within a month!',
      rating: 5,
      metric: '3',
      metricLabel: 'Job Offers',
    },
    {
      id: 4,
      name: 'David Park',
      role: 'UX Designer',
      company: 'Airbnb',
      image: 'DP',
      content:
        'I was skeptical at first, but JobAuto exceeded all my expectations. The interview prep materials and company insights gave me a huge advantage. Highly recommend!',
      rating: 5,
      metric: '7',
      metricLabel: 'Interviews',
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      role: 'Marketing Director',
      company: 'HubSpot',
      image: 'LT',
      content:
        'The salary insights helped me negotiate a 25% higher offer than my previous role. JobAuto doesnt just find you jobs - it helps you get paid what you deserve.',
      rating: 5,
      metric: '25%',
      metricLabel: 'Salary Increase',
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.testimonials-title', {
        scrollTrigger: {
          trigger: '.testimonials-title',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
      });

      gsap.from('.testimonials-carousel', {
        scrollTrigger: {
          trigger: '.testimonials-carousel',
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: 'power3.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#7c39f6]/10 rounded-full blur-[120px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#a855f7]/10 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="testimonials-title inline-block px-4 py-1.5 rounded-full bg-[#7c39f6]/10 border border-[#7c39f6]/30 text-[#a855f7] text-sm font-medium mb-4">
            Success Stories
          </span>
          <h2 className="testimonials-title text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Loved by{' '}
            <span className="bg-gradient-to-r from-[#7c39f6] to-[#a855f7] bg-clip-text text-transparent">
              50,000+ Job Seekers
            </span>
          </h2>
          <p className="testimonials-title text-gray-400 text-lg max-w-2xl mx-auto">
            See how JobAuto has helped professionals land their dream jobs faster and with less
            effort.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="testimonials-carousel relative max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="relative glass rounded-3xl p-8 lg:p-12 border border-[#7c39f6]/20">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-8 w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center">
              <Quote className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="pt-4">
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-xl lg:text-2xl text-white leading-relaxed mb-8">
                {testimonials[currentIndex].content}
              </p>

              {/* Author */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center text-white font-bold text-lg">
                    {testimonials[currentIndex].image}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{testimonials[currentIndex].name}</h4>
                    <p className="text-gray-400 text-sm">
                      {testimonials[currentIndex].role} at {testimonials[currentIndex].company}
                    </p>
                  </div>
                </div>

                {/* Metric */}
                <div className="glass rounded-xl px-6 py-3 border border-[#7c39f6]/20">
                  <div className="text-2xl font-bold bg-gradient-to-r from-[#7c39f6] to-[#a855f7] bg-clip-text text-transparent">
                    {testimonials[currentIndex].metric}
                  </div>
                  <div className="text-xs text-gray-400">{testimonials[currentIndex].metricLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={goToPrev}
              className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:border-[#7c39f6]/50 hover:bg-[#7c39f6]/10 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-gradient-to-r from-[#7c39f6] to-[#a855f7]'
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white hover:border-[#7c39f6]/50 hover:bg-[#7c39f6]/10 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: '4.9/5', label: 'Average Rating' },
            { value: '50K+', label: 'Happy Users' },
            { value: '85%', label: 'Got Hired Within 3 Months' },
            { value: '2M+', label: 'Applications Sent' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 glass rounded-xl border border-white/5">
              <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#7c39f6] to-[#a855f7] bg-clip-text text-transparent mb-2">
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

export default Testimonials;
