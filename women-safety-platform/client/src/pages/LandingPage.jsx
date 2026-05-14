import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Zap, MapPin, Users, Bell, Clock,
  ArrowRight, Phone, MessageCircle, Eye, Heart, Star,
  CheckCircle, Globe
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'One-Click SOS',
    description: 'Instantly alert nearby volunteers and emergency contacts with a single tap.',
    color: 'from-accent-500 to-red-600'
  },
  {
    icon: MapPin,
    title: 'Live Location Sharing',
    description: 'Real-time GPS tracking shared with responders for fastest assistance.',
    color: 'from-primary-500 to-indigo-600'
  },
  {
    icon: Users,
    title: 'Verified Volunteers',
    description: 'Background-checked volunteers ready to help within your vicinity.',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Automated SMS and real-time notifications to your emergency contacts.',
    color: 'from-amber-500 to-orange-600'
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Communicate directly with responding volunteers during emergencies.',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Clock,
    title: 'Rapid Response',
    description: 'Average response time under 2 minutes from alert to assistance.',
    color: 'from-pink-500 to-rose-600'
  }
];

const stats = [
  { value: '10K+', label: 'Women Protected' },
  { value: '2.5K+', label: 'Verified Volunteers' },
  { value: '<2min', label: 'Avg Response Time' },
  { value: '98%', label: 'Resolution Rate' }
];

const steps = [
  { step: '01', title: 'Register & Setup', desc: 'Create your account and add emergency contacts' },
  { step: '02', title: 'Press SOS', desc: 'One tap sends alert to nearby verified volunteers' },
  { step: '03', title: 'Get Help Fast', desc: 'Volunteers receive your location and rush to help' },
  { step: '04', title: 'Stay Connected', desc: 'Real-time tracking until you are safe' }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              SafeGuard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm hidden sm:block">Login</Link>
            <Link to="/register" className="btn-primary text-sm !py-2 !px-5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center gradient-hero overflow-hidden pt-16">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/8 rounded-full blur-[120px] animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/20 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-dark-200">Platform Active — Protecting Women Nationwide</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-6">
              <span className="text-dark-50">Your Safety,</span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-pink-400 bg-clip-text text-transparent">
                One Tap Away
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Instant SOS alerts, real-time location sharing, and a verified volunteer network — 
              because every woman deserves to feel safe.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="btn-accent text-lg !px-8 !py-4 flex items-center gap-2 group"
              >
                <Shield className="w-5 h-5" />
                Get Protected Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register?role=volunteer"
                className="btn-outline text-lg !px-8 !py-4 flex items-center gap-2"
              >
                <Heart className="w-5 h-5" />
                Become a Volunteer
              </Link>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="glass rounded-xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-dark-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-dark-950/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-50 mb-4">
              Comprehensive Safety Features
            </h2>
            <p className="text-dark-400 max-w-xl mx-auto">
              Every feature designed to minimize response time and maximize your safety.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-hover group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 
                  group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-dark-50 mb-2">{feature.title}</h3>
                <p className="text-sm text-dark-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-50 mb-4">
              How It Works
            </h2>
            <p className="text-dark-400 max-w-xl mx-auto">
              Simple, fast, and effective — help is always just a tap away.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="text-5xl font-black text-primary-500/15 mb-2">{step.step}</div>
                <h3 className="text-lg font-bold text-dark-100 mb-2">{step.title}</h3>
                <p className="text-sm text-dark-400">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 w-8">
                    <ArrowRight className="w-5 h-5 text-dark-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-dark-50 mb-4">
                Your Safety Matters
              </h2>
              <p className="text-dark-300 max-w-xl mx-auto mb-8">
                Join thousands of women who trust SafeGuard for their safety. 
                Sign up today and stay protected.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn-accent !px-8 !py-4 text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sign Up Free
                </Link>
                <Link to="/register?role=volunteer" className="btn-outline !px-8 !py-4 text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Join as Volunteer
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-500" />
              <span className="font-bold text-dark-200">SafeGuard</span>
            </div>
            <p className="text-sm text-dark-500">
              © 2026 SafeGuard Platform. Making the world safer for women.
            </p>
            <div className="flex items-center gap-4 text-dark-500">
              <Phone className="w-4 h-4 hover:text-primary-400 cursor-pointer transition-colors" />
              <Globe className="w-4 h-4 hover:text-primary-400 cursor-pointer transition-colors" />
              <Heart className="w-4 h-4 hover:text-accent-400 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
