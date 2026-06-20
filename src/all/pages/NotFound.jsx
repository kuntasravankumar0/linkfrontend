import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft, Zap } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'40px 40px'}} />
      </div>

      <div className="relative text-center max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={17} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="text-xl font-black text-white">
            for<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">you</span>
          </span>
        </div>

        {/* 404 */}
        <div className="relative mb-6">
          <div className="text-[10rem] font-black leading-none text-white/5 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">🔍</div>
              <div className="text-5xl font-black text-white/90 tracking-tight">404</div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-3">
          Page Not Found
        </h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-all">
            <ArrowLeft size={16} /> Go Back
          </button>
          <button onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all">
            <Home size={16} /> Home
          </button>
          <button onClick={() => navigate('/search')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-all">
            <Search size={16} /> Explore
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {['/', '/search', '/add', '/categories', '/ai', '/help'].map(path => (
            <button key={path} onClick={() => navigate(path)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 rounded-lg text-xs font-bold transition-all">
              {path === '/' ? 'Home' : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
