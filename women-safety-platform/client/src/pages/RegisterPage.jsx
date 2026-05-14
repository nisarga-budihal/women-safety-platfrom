import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle, FileText, Heart } from 'lucide-react';
import { ID_DOCUMENT_TYPES, SPECIALIZATIONS } from '../utils/constants';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'volunteer' ? 'volunteer' : 'user';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    // Volunteer fields
    documentType: 'aadhar',
    documentNumber: '',
    specializations: ['general'],
    bio: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleSpec = (value) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter(s => s !== value)
        : [...prev.specializations, value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const data = await register(formData);
      toast.success(`Welcome to SafeGuard, ${data.user.name}!`);
      const routes = { volunteer: '/volunteer', user: '/dashboard' };
      navigate(routes[data.user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-5/12 gradient-hero relative items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/8 rounded-full blur-[120px] animate-float" style={{ animationDelay: '3s' }} />
        </div>
        <div className="relative text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Join SafeGuard</h1>
          <p className="text-lg text-dark-300 leading-relaxed">
            {formData.role === 'volunteer'
              ? 'Become a verified volunteer and help protect women in your community.'
              : 'Create your safety profile and get instant access to emergency assistance.'}
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 bg-dark-900 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">SafeGuard</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-dark-50 mb-2">Create Account</h2>
          <p className="text-dark-400 mb-6">Fill in your details to get started</p>

          {/* Role Toggle */}
          <div className="flex rounded-xl bg-dark-800/80 p-1 mb-6 border border-dark-700/50">
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, role: 'user' }))}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                formData.role === 'user'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <User className="w-4 h-4" />
              User
            </button>
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, role: 'volunteer' }))}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                formData.role === 'volunteer'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <Heart className="w-4 h-4" />
              Volunteer
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-dark-300 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field !pl-11"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-dark-300 mb-1.5 block">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field !pl-11"
                    placeholder="+91-XXXXXXXXXX"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-300 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field !pl-11"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-dark-300 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field !pl-11"
                    placeholder="Min 6 chars"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-dark-300 mb-1.5 block">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field !pl-11"
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="rounded bg-dark-700 border-dark-600 text-primary-500"
              />
              Show passwords
            </label>

            {/* Volunteer-specific fields */}
            {formData.role === 'volunteer' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 border-t border-dark-700/50 pt-4 mt-4"
              >
                <p className="text-sm font-semibold text-primary-400">Volunteer Verification</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-dark-300 mb-1.5 block">ID Type</label>
                    <select
                      name="documentType"
                      value={formData.documentType}
                      onChange={handleChange}
                      className="input-field"
                    >
                      {ID_DOCUMENT_TYPES.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark-300 mb-1.5 block">Document Number</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <input
                        name="documentNumber"
                        value={formData.documentNumber}
                        onChange={handleChange}
                        className="input-field !pl-11"
                        placeholder="XXXX-XXXX-XXXX"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-300 mb-2 block">Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALIZATIONS.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => toggleSpec(s.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          formData.specializations.includes(s.value)
                            ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                            : 'border-dark-600/50 text-dark-400 hover:border-dark-500'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-dark-300 mb-1.5 block">Bio (Optional)</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Tell us about your experience and why you want to volunteer..."
                  />
                </div>
              </motion.div>
            )}

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3.5 text-base flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {formData.role === 'volunteer' ? 'Register as Volunteer' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
