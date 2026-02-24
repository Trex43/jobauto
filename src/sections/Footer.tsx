import { Zap, Twitter, Linkedin, Github, Instagram, Mail } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Integrations', href: '#' },
      { name: 'API', href: '#' },
      { name: 'Changelog', href: '#' },
    ],
    Company: [
      { name: 'About', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
      { name: 'Partners', href: '#' },
    ],
    Resources: [
      { name: 'Documentation', href: '#' },
      { name: 'Help Center', href: '#' },
      { name: 'Community', href: '#' },
      { name: 'Templates', href: '#' },
      { name: 'Webinars', href: '#' },
    ],
    Legal: [
      { name: 'Privacy', href: '#' },
      { name: 'Terms', href: '#' },
      { name: 'Security', href: '#' },
      { name: 'Cookies', href: '#' },
      { name: 'GDPR', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Instagram, href: '#', label: 'Instagram' },
  ];

  return (
    <footer className="relative pt-20 pb-10 overflow-hidden border-t border-white/5">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0f]" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#7c39f6]/5 rounded-full blur-[150px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <a href="#" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Job<span className="text-[#7c39f6]">Auto</span>
              </span>
            </a>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              AI-powered job automation platform. Apply to 100+ jobs while you sleep and land your
              dream job faster.
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <p className="text-white text-sm font-medium mb-3">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#7c39f6]/50"
                  />
                </div>
                <button className="px-4 py-2.5 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white text-sm font-medium rounded-lg hover:shadow-[0_0_15px_rgba(124,57,246,0.4)] transition-all">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#7c39f6]/50 hover:bg-[#7c39f6]/10 transition-all"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 text-sm hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} JobAuto. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">
              Cookie Settings
            </a>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-500 text-sm">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
