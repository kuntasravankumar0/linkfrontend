import { X, Copy, Check, Terminal, Info, ExternalLink, BookOpen, Layers, Tag, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CATEGORIES, parseSubCategory } from '../data/categories';
import { copyToClipboard } from '../../utils/copy';

export default function ProjectDetailsModal({ project, onClose }) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const copyCode = async () => {
    if (!project?.implementation) return;
    const success = await copyToClipboard(project.implementation);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Code copied');
    } else {
      toast.error('Failed to copy. Try selecting the code manually.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800">

        {/* ── Header ── */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-wrap">
            {/* Access badge */}
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase shrink-0
              ${project.accessType === 'FREE' ? 'badge-free' : project.accessType === 'PAID' ? 'badge-paid' : 'badge-both'}`}>
              {project.accessType}
            </span>
            {/* Category breadcrumb */}
            {(() => {
              const { main, sub } = parseSubCategory(project.subCategory);
              const cat = CATEGORIES.find(c => c.label === main);
              return (
                <>
                  {main && (
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-full border shrink-0
                      ${cat?.color || 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-700'}`}>
                      {cat?.icon} {main}
                    </span>
                  )}
                  {main && sub && <ChevronRight size={11} className="text-slate-300 dark:text-slate-600 shrink-0" />}
                  {sub && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2.5 py-1.5 rounded-full uppercase border border-brand-primary/20 shrink-0">
                      <Tag size={9} /> {sub}
                    </span>
                  )}
                  {!main && !sub && project.subCategory && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2.5 py-1.5 rounded-full uppercase shrink-0">
                      <Tag size={9} /> {project.subCategory}
                    </span>
                  )}
                </>
              );
            })()}
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white truncate min-w-0">
              {project.projectName}
            </h2>
          </div>
          <button onClick={onClose}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-300 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900 rounded-2xl transition-all shadow-sm shrink-0 ml-4">
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Image */}
              {project.image ? (
                <img
                  src={project.image}
                  alt={project.projectName}
                  className="w-full h-56 object-cover rounded-3xl shadow-md border border-slate-100 dark:border-slate-800"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-slate-100 dark:from-slate-800 to-slate-200 dark:to-slate-900 rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-650">
                  <span className="text-xs font-bold uppercase tracking-widest">No Preview</span>
                </div>
              )}

              {/* Details */}
              <div className="space-y-5">
                {project.details && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                      <Info size={12} /> Overview
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {project.details}
                    </p>
                  </div>
                )}

                {project.subdetails && (
                  <div className="space-y-2 border-t border-slate-50 dark:border-slate-850 pt-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                      <BookOpen size={12} /> Subdetails
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {project.subdetails}
                    </p>
                  </div>
                )}

                {/* Links */}
                <div className="flex flex-col gap-2 pt-2">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:bg-black dark:hover:bg-slate-100 transition-all"
                    >
                      <ExternalLink size={14} />
                      <span className="truncate">Open Live Link</span>
                    </a>
                  )}
                  {project.source && (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-700">
                      <Info size={14} />
                      <span>Source: {project.source}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-6 overflow-hidden">
              {/* Guide */}
              {project.guide && (
                <div className="bg-slate-900 dark:bg-slate-950/40 p-6 rounded-3xl space-y-3 border border-transparent dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase text-brand-secondary tracking-widest flex items-center gap-2">
                    <Layers size={12} /> Implementation Guide
                  </h4>
                  <div className="text-slate-300 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {project.guide}
                  </div>
                </div>
              )}

              {/* Code */}
              <div className="rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-[#0f172a]">
                <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <Terminal size={13} className="text-slate-400 ml-2" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Code
                    </span>
                  </div>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-lg text-slate-500 dark:text-slate-300 transition-all text-xs font-bold"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="max-h-[420px] overflow-auto custom-scrollbar">
                  <SyntaxHighlighter
                    language="javascript"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.75rem', fontSize: '0.82rem', background: 'transparent' }}
                    showLineNumbers
                    lineNumberStyle={{ color: '#334155', fontSize: '0.72rem' }}
                  >
                    {project.implementation || '// No code provided'}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-300 dark:text-slate-500 font-mono uppercase">
            ID: {project.id} · {project.uniqueId?.slice(0, 8)}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
