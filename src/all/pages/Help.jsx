import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, Upload, ShieldCheck, Tag, Zap, MessageSquare, ExternalLink } from 'lucide-react';

const FAQS = [
  {
    cat: 'Getting Started', icon: '🚀',
    items: [
      { q: 'What is ForYou?', a: 'ForYou is a multipurpose project gallery where you can discover, share, and explore projects across hosting, AI tools, software, deployment, databases, frontend, backend, and more.' },
      { q: 'Do I need an account to browse?', a: 'No. Anyone can browse, search, and view all approved projects without signing up. Only admins need to log in.' },
      { q: 'How do I find a specific project?', a: 'Use the Explore page to search by name, filter by category, subcategory, or access type (Free/Paid/Both).' },
    ],
  },
  {
    cat: 'Uploading Projects', icon: '📤',
    items: [
      { q: 'How do I submit a project?', a: 'Click the "Upload" button in the top navigation. Fill in the project name, category, description, links, and optionally paste your implementation code. Submit for review.' },
      { q: 'Why is my project not showing on the home page?', a: 'All submitted projects go through admin review first. Once approved, they appear on the home page.' },
      { q: 'Can I submit duplicate project names?', a: 'No. The system checks for duplicate names and will warn you before submission.' },
      { q: 'What is the "Category > Subcategory" format?', a: 'Projects are organized in a two-level hierarchy. For example: "Frontend > React" or "Database > MySQL". Select from the dropdown and chips.' },
    ],
  },
  {
    cat: 'Categories', icon: '🏷️',
    items: [
      { q: 'How do categories work?', a: 'Main categories (like Frontend, Backend, AI Tools) contain subcategories (like React, FastAPI, ChatBot). Select from the dropdown when uploading.' },
      { q: 'Where are categories stored?', a: 'Custom categories are saved in your browser\'s localStorage. They persist across sessions on the same device.' },
      { q: 'Can I reset categories to default?', a: 'Yes. On the Categories page, click the "Reset" button to restore the default category tree.' },
    ],
  },
  {
    cat: 'AI Assistant', icon: '🤖',
    items: [
      { q: 'What can the AI assistant do?', a: 'The AI assistant can help with coding questions, debugging, architecture advice, deployment guides, and general programming topics. It uses Groq-powered LLMs.' },
      { q: 'Is my chat history saved?', a: 'Chat history is stored only in your browser\'s localStorage. It never goes to our backend.' },
      { q: 'Can I use voice input?', a: 'Yes! Click the microphone button to speak your question. Supports English, Telugu, Hindi, and English UK. Works best in Chrome or Edge.' },
      { q: 'What models are available?', a: 'GPT-OSS: GPT-OSS 120B and 20B. Llama 4: Llama 4 Scout 17B and Llama 4 Maverick 17B.' },
    ],
  },
  {
    cat: 'Admin', icon: '🛡️',
    items: [
      { q: 'How do I access the admin panel?', a: 'Click the shield icon in the navigation or go to /admin-login. You need the admin username, password, and secret code.' },
      { q: 'What can admins do?', a: 'Admins can approve or reject pending projects, edit any project, delete projects, and view all submissions.' },
      { q: 'How long does the admin session last?', a: 'The session is stored in sessionStorage and clears automatically when you close the browser tab.' },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all
      ${open
        ? 'border-brand-primary/30 bg-brand-primary/[0.02] dark:bg-brand-primary/10'
        : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-brand-primary shrink-0" />
          : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-700">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const [search, setSearch] = useState('');

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item => !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">

      {/* Header */}
      <div className="bg-gradient-to-br from-brand-primary to-brand-accent rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
            <HelpCircle size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Help Center</h1>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-0.5">Frequently Asked Questions</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Search,      label: 'Explore',    href: '/search' },
          { icon: Upload,      label: 'Upload',     href: '/add' },
          { icon: Tag,         label: 'Categories', href: '/categories' },
          { icon: Zap,         label: 'AI Chat',    href: '/ai' },
        ].map(({ icon: Icon, label, href }) => (
          <a key={label} href={href}
            className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:border-brand-primary/30 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 transition-all group">
            <Icon size={16} className="text-brand-primary" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-primary transition-colors">{label}</span>
            <ExternalLink size={11} className="text-slate-300 dark:text-slate-600 ml-auto" />
          </a>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
        <input type="text" placeholder="Search help articles..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all shadow-sm" />
      </div>

      {/* FAQ sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No results for "{search}"</p>
        </div>
      ) : (
        filtered.map(cat => (
          <div key={cat.cat} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{cat.icon}</span>
              <h2 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">{cat.cat}</h2>
            </div>
            <div className="space-y-2">
              {cat.items.map(item => <FAQItem key={item.q} {...item} />)}
            </div>
          </div>
        ))
      )}

      {/* Contact */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-2xl flex items-center justify-center shrink-0">
          <MessageSquare size={20} className="text-brand-primary" />
        </div>
        <div>
          <p className="font-black text-slate-800 dark:text-white text-sm">Still need help?</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Use the AI assistant for instant answers to coding and platform questions.</p>
        </div>
        <a href="/ai"
          className="ml-auto px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-indigo-700 transition-all shrink-0">
          Ask AI
        </a>
      </div>
    </div>
  );
}
