import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/scan');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 bg-blueprint">
      {/* Ambient glow */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-amber/10 rounded-full blur-[100px]" 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="fixed bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent-cyan/10 rounded-full blur-[120px]" 
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative"
      >
        {/* Card with scan-line border effect */}
        <div className="relative bg-bg-secondary border border-border rounded-xl overflow-hidden">
          {/* Animated top border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-accent-amber to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ width: '100%' }}
            />
          </div>

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-amber to-accent-amber-light flex items-center justify-center mb-4 glow-amber"
              >
                <Shield className="w-8 h-8 text-text-inverse" />
              </motion.div>
              <h1 className="text-2xl font-bold font-sans text-text-primary">MetroCheck</h1>
              <p className="text-xs font-mono text-text-muted mt-1 tracking-widest uppercase">
                Legal Metrology Compliance Scanner
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-accent-red-dim border border-accent-red/20 text-accent-red text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-xs font-mono text-text-secondary mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@metrocheck.gov.in"
                  required
                  className="w-full transition-all focus:shadow-[0_0_15px_rgba(255,0,127,0.4)] focus:border-accent-amber bg-bg-tertiary/50"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-xs font-mono text-text-secondary mb-2 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pr-10 transition-all focus:shadow-[0_0_15px_rgba(255,0,127,0.4)] focus:border-accent-amber bg-bg-tertiary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B100E8] to-[#FF007F] text-white font-bold text-sm shadow-[0_0_20px_rgba(255,0,127,0.3)]
                         hover:shadow-[0_0_30px_rgba(255,0,127,0.6)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         relative overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-text-muted mt-4 font-mono">
          Department of Consumer Affairs · Legal Metrology Act, 2009
        </p>
      </motion.div>
    </div>
  );
}
