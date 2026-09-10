import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, LayoutDashboard, History, BookOpen,
  LogOut, Shield, User, ChevronRight
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/scan', icon: ScanLine, label: 'New Scan' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/history', icon: History, label: 'Case History' },
    ...(isAdmin ? [{ to: '/rulebook', icon: BookOpen, label: 'Rulebook' }] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Ambient background glow */}
      <div className="fixed top-0 left-64 w-full h-96 bg-accent-amber/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-64 bg-bg-secondary/80 backdrop-blur-xl border-r border-border flex flex-col shrink-0 z-20"
      >
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.4 }}
              className="w-10 h-10 rounded-lg bg-accent-amber flex items-center justify-center glow-amber"
            >
              <Shield className="w-6 h-6 text-text-inverse" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold font-sans text-text-primary tracking-tight">
                MetroCheck
              </h1>
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                Compliance Scanner
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                    isActive
                      ? 'text-accent-amber bg-gradient-to-r from-accent-amber/10 to-transparent border-l-4 border-accent-amber rounded-l-none'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border-l-4 border-transparent'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-bg-tertiary border border-border flex items-center justify-center">
              <User className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] font-mono text-text-muted truncate">
                {user?.role?.replace('_', ' ') || 'officer'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-muted hover:text-accent-red rounded-md hover:bg-accent-red-dim transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="p-6 max-w-[1400px] mx-auto min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
