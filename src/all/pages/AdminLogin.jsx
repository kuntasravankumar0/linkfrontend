/**
 * AdminLogin.jsx — Email + Password only (secret = password, hidden from UI)
 * Credentials:
 *   Email    : SRAVAN  (treated as email field)
 *   Password : SRAVAN@123
 *   Secret   : SRAVAN@123  (auto-filled = password, never shown)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminLogin } from '../hooks/useAdminAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [attempts, setAttempts] = useState(0);
  const MAX = 5;
  const locked = attempts >= MAX;

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (locked) { toast.error('Too many attempts. Refresh to try again.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    try {
      // Secret code = same as password (hidden from user)
      const ok = await adminLogin(form.email, form.password, form.password);
      if (ok) {
        toast.success('Welcome back!');
        navigate('/admin', { replace: true });
      } else {
        const left = MAX - attempts - 1;
        setAttempts(a => a + 1);
        toast.error(left > 0 ? `Wrong credentials. ${left} attempt(s) left.` : 'Account locked.');
        setForm(p => ({ ...p, password: '' }));
      }
    } catch {
      toast.error('Auth error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-sky-600/8 rounded-full blur-3xl" />
        {/* Dot grid */}
        <div className="absolute inset-0"
          style={{backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'28px 28px'}} />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          {/* Unique hexagon-style icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[20px] rotate-12 opacity-30 blur-md scale-110" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-[20px] flex items-center justify-center shadow-2xl shadow-indigo-500/40">
              {/* Custom "FY" monogram */}
              <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
                {/* F */}
                <path d="M8 8h12v3H11v5h8v3h-8v9H8V8z" fill="white" fillOpacity="0.95"/>
                {/* Y */}
                <path d="M22 8l5 9 5-9h3l-6.5 11v9h-3v-9L19 8h3z" fill="white" fillOpacity="0.7"/>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white tracking-tight">
              for<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">you</span>
            </div>
            <div className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Admin Portal</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">

          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

          <div className="px-7 py-8 space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-lg font-black text-white">Sign In</h1>
              <p className="text-white/30 text-xs mt-1">Admin access only</p>
            </div>

            {/* Locked */}
            {locked && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <Lock size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs font-bold">Locked. Refresh to retry.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1.5">
                  <Mail size={10} /> Email / Username
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input name="email" type="text" value={form.email}
                    onChange={handleChange} placeholder="Enter your email"
                    required disabled={locked} autoComplete="username"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all" />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-1.5">
                  <Lock size={10} /> Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input name="password" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={handleChange}
                    placeholder="••••••••••" required disabled={locked}
                    autoComplete="current-password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all" />
                  <button type="button" onClick={() => setShowPass(o => !o)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Attempt bar */}
              {attempts > 0 && !locked && (
                <div className="flex gap-1 items-center">
                  {[...Array(MAX)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < attempts ? 'bg-red-500' : 'bg-white/10'}`} />
                  ))}
                  <span className="text-[10px] text-red-400 font-bold ml-1.5 shrink-0">{attempts}/{MAX}</span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading || locked}
                className="w-full py-3.5 mt-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /><span>Signing in...</span></>
                  : <span>Sign In to Admin</span>}
              </button>
            </form>

            <div className="text-center pt-1">
              <a href="/" className="text-[11px] text-white/25 hover:text-white/50 font-bold transition-colors">
                ← Back to site
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-white/15 text-[10px] font-bold uppercase tracking-widest mt-5">
          SHA-256 Protected · ForYou Platform
        </p>
      </div>
    </div>
  );
}
