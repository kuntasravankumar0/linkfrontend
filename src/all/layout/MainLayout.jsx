import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  Home, Search, PlusCircle, Zap, ShieldCheck,
  Menu, X, Sparkles, Tag, LogOut, HelpCircle, Sun, Moon,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { isAdminLoggedIn, adminLogout } from '../hooks/useAdminAuth';
import { useTheme } from '../hooks/useTheme';

const publicLinks = [
  { to: '/',           label: 'Home',       icon: Home,     exact: true  },
  { to: '/search',     label: 'Explore',    icon: Search,   exact: false },
  { to: '/categories', label: 'Categories', icon: Tag,      exact: false },
  { to: '/ai',         label: 'AI',         icon: Sparkles, exact: false },
];

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate  = useNavigate();
  const loggedIn  = isAdminLoggedIn();
  const { dark, toggle } = useTheme();

  const handleLogout = () => {
    adminLogout();
    toast.success('Logged out');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 transition-colors duration-200">

      {/* ── Header ── */}
      <header className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-700/80 sticky top-0 z-50 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/30 group-hover:scale-105 transition-transform">
              <Zap size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              for<span className="gradient-text">you</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {publicLinks.map(({ to, label, icon: Icon, exact }) => (
              <NavLink key={to} to={to} end={exact}
                className={({ isActive }) => {
                  if (to === '/ai') return `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${isActive
                      ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-lg shadow-brand-primary/25'
                      : 'text-brand-accent hover:bg-brand-accent/10 border border-brand-accent/30'}`;
                  if (to === '/categories') return `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${isActive
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`;
                  return `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${isActive
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`;
                }}>
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}

            {loggedIn && (
              <NavLink to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                   ${isActive
                     ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <ShieldCheck size={16} />
                <span>Admin</span>
              </NavLink>
            )}

            {/* Upload button */}
            <NavLink to="/add"
              className="ml-2 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:scale-105 transition-all active:scale-95">
              <PlusCircle size={16} />
              <span>Upload</span>
            </NavLink>

            {/* Dark / Light toggle */}
            <button onClick={toggle}
              className="ml-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {loggedIn && (
              <button onClick={handleLogout}
                className="ml-1 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-800 transition-all"
                title="Logout from admin">
                <LogOut size={15} />
                <span className="hidden lg:inline">Logout</span>
              </button>
            )}
          </nav>

          {/* Mobile: theme toggle + menu */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggle}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
              onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 space-y-1 transition-colors duration-200">
            {publicLinks.map(({ to, label, icon: Icon, exact }) => (
              <NavLink key={to} to={to} end={exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                   ${isActive
                     ? 'bg-brand-primary/10 text-brand-primary'
                     : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}

            {loggedIn && (
              <NavLink to="/admin" onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                   ${isActive
                     ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                     : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <ShieldCheck size={18} />
                <span>Admin</span>
              </NavLink>
            )}

            <NavLink to="/add" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl text-sm font-bold mt-2">
              <PlusCircle size={18} />
              <span>Upload Project</span>
            </NavLink>

            <NavLink to="/help" onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                 ${isActive
                   ? 'bg-brand-primary/10 text-brand-primary'
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <HelpCircle size={18} />
              <span>Help</span>
            </NavLink>

            {loggedIn ? (
              <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-bold transition-all border border-red-100 dark:border-red-800 mt-1">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            ) : null}
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1 py-8 px-4 sm:px-6 bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 py-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            &copy; 2026 ForYou Platform
          </span>
          <div className="flex items-center gap-4">
            <Link to="/help"    className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold transition-colors">Help</Link>
            <span className="text-slate-200 dark:text-slate-700">·</span>
            <Link to="/terms"   className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold transition-colors">Terms</Link>
            <span className="text-slate-200 dark:text-slate-700">·</span>
            <Link to="/contact" className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold transition-colors">Contact</Link>
            <span className="text-slate-200 dark:text-slate-700">·</span>
            <Link to="/ai"      className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold transition-colors">AI Chat</Link>
          </div>
        </div>
      </footer>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            borderRadius: '14px', fontWeight: 700, fontSize: '13px',
            background: dark ? '#1e293b' : '#fff',
            color: dark ? '#f1f5f9' : '#0f172a',
            border: dark ? '1px solid #334155' : '1px solid #e2e8f0',
          },
          success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
