import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Play, Users, Briefcase, TrendingUp, Sparkles } from 'lucide-react';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Particle Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          color: Math.random() > 0.5 ? '#7c39f6' : '#a855f7',
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(124, 57, 246, ${0.2 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(drawParticles);
    };

    resize();
    createParticles();
    drawParticles();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text animation
      gsap.from('.hero-title', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2,
      });

      gsap.from('.hero-subtitle', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.4,
      });

      gsap.from('.hero-cta', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.6,
      });

      gsap.from('.hero-stats', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.8,
      });

      // Floating stats cards animation
      gsap.to('.stat-card-1', {
        y: -10,
        duration: 2,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.to('.stat-card-2', {
        y: 10,
        duration: 2.5,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.5,
      });

      gsap.to('.stat-card-3', {
        y: -8,
        duration: 3,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { icon: Briefcase, value: '100K+', label: 'Jobs Applied', className: 'stat-card-1' },
    { icon: Users, value: '50K+', label: 'Active Users', className: 'stat-card-2' },
    { icon: TrendingUp, value: '90%', label: 'Success Rate', className: 'stat-card-3' },
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#7c39f6]/10 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7c39f6]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#a855f7]/15 rounded-full blur-[100px]" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7c39f6]/10 border border-[#7c39f6]/30 mb-6">
              <Sparkles className="w-4 h-4 text-[#7c39f6]" />
              <span className="text-sm text-[#a855f7]">AI-Powered Job Automation</span>
            </div>

            {/* Title */}
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
              Apply to{' '}
              <span className="bg-gradient-to-r from-[#7c39f6] to-[#a855f7] bg-clip-text text-transparent">
                100+ Jobs
              </span>{' '}
              While You Sleep
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-lg sm:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 mb-8">
              Our AI matches you with perfect opportunities across 50+ job portals and auto-applies
              on your behalf. Get hired faster with 90%+ matching accuracy.
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <button className="group px-8 py-4 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(124,57,246,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Social Proof */}
            <div className="hero-stats flex items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c39f6] to-[#a855f7] border-2 border-[#0a0a0f] flex items-center justify-center text-xs font-bold text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  Trusted by <span className="text-white font-semibold">50,000+</span> job seekers
                </p>
              </div>
            </div>
          </div>

          {/* Right Content - Floating Stats Cards */}
          <div ref={statsRef} className="relative hidden lg:block h-[500px]">
            {/* Main Dashboard Preview */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-96 glass rounded-2xl p-6 border border-[#7c39f6]/30 shadow-[0_0_40px_rgba(124,57,246,0.2)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Applications</h3>
                  <p className="text-xs text-gray-400">This month</p>
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2">127</div>
              <div className="flex items-center gap-2 text-green-400 text-sm mb-6">
                <TrendingUp className="w-4 h-4" />
                <span>+23% from last month</span>
              </div>
              <div className="space-y-3">
                {['Applied', 'Interview', 'Offer', 'Rejected'].map((status, i) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7c39f6] to-[#a855f7] rounded-full"
                          style={{ width: `${[45, 30, 15, 10][i]}%` }}
                        />
                      </div>
                      <span className="text-sm text-white w-8">{[45, 30, 15, 10][i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Stat Cards */}
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`absolute ${
                  index === 0
                    ? 'top-10 right-10'
                    : index === 1
                    ? 'bottom-20 left-10'
                    : 'bottom-10 right-20'
                } glass rounded-xl p-4 border border-[#7c39f6]/20 ${stat.className}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#7c39f6]/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-[#7c39f6]" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Decorative Elements */}
            <div className="absolute top-20 left-20 w-20 h-20 border border-[#7c39f6]/20 rounded-full" />
            <div className="absolute bottom-32 right-10 w-16 h-16 border border-[#a855f7]/20 rounded-lg rotate-45" />
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
    </section>
  );
};

export default Hero;
