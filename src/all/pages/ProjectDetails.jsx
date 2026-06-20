import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, Terminal, BookOpen,
  ExternalLink, Image as ImageIcon, Layout, Info,
  Tag, Hash, ChevronRight
} from 'lucide-react';
import { templateService } from '../api/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import { CATEGORIES, parseSubCategory } from '../data/categories';
import { copyToClipboard } from '../../utils/copy';

function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 animate-pulse">
      <div className="h-8 skeleton w-32" />
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 flex flex-col md:flex-row">
        <div className="w-full md:w-80 h-80 skeleton shrink-0" />
        <div className="p-10 flex-1 space-y-4">
          <div className="h-4 skeleton w-24" />
          <div className="h-10 skeleton w-3/4" />
          <div className="h-4 skeleton w-full" />
          <div className="h-4 skeleton w-2/3" />
          <div className="flex gap-3 mt-6">
            <div className="h-12 skeleton w-40 rounded-2xl" />
            <div className="h-12 skeleton w-32 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchDetails = async () => {
      try {
        const response = await templateService.getById(id);
        if (mounted) {
          setProject(response.data);
          setLoading(false);
        }
      } catch (err) {
        retryCount++;
        // Retry up to 3 times with increasing delay (covers Vercel cold start)
        if (mounted && retryCount <= maxRetries) {
          setTimeout(() => { if (mounted) fetchDetails(); }, retryCount * 2000);
        } else if (mounted) {
          // Only show error after all retries exhausted
          toast.error('Could not load project. Please try again.');
          setLoading(false);
        }
      }
    };
    fetchDetails();
    return () => { mounted = false; };
  }, [id]);

  const copyCode = async () => {
    if (!project?.implementation) return;
    const success = await copyToClipboard(project.implementation);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Code copied to clipboard');
    } else {
      toast.error('Failed to copy. Try selecting the code manually.');
    }
  };

  if (loading) return <Skeleton />;
  if (!project) return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-4">
      <div className="text-5xl">😕</div>
      <h2 className="text-xl font-black text-slate-900 dark:text-white">Could not load project</h2>
      <p className="text-slate-400 text-sm">The server might be waking up. Try again.</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => { setLoading(true); window.location.reload(); }}
          className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
          Retry
        </button>
        <button onClick={() => navigate('/')}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
          Go Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">

      {/* ── Back ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-brand-primary font-bold transition-all group text-sm"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Gallery</span>
      </button>

      {/* ── Hero ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row">
        {/* Image */}
        <div className="w-full md:w-80 h-72 md:h-auto shrink-0 bg-slate-50 dark:bg-slate-850 relative">
          {project.image ? (
            <img src={project.image} alt={project.projectName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-900 text-slate-200 dark:text-slate-755">
              <ImageIcon size={64} />
            </div>
          )}
          {/* Badges */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-sm
              ${project.accessType === 'FREE' ? 'badge-free' : project.accessType === 'PAID' ? 'badge-paid' : 'badge-both'}`}>
              {project.accessType}
            </span>
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase shadow-sm
              ${project.approvalStatus === 'APPROVED' ? 'badge-approved' :
                project.approvalStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
              {project.approvalStatus}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-8 md:p-10 flex-1 space-y-5 overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const { main, sub } = parseSubCategory(project.subCategory);
                const cat = CATEGORIES.find(c => c.label === main);
                return (
                  <>
                    {main && (
                      <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border
                        ${cat?.color || 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-700'}`}>
                        {cat?.icon} {main}
                      </span>
                    )}
                    {main && sub && <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />}
                    {sub && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full border border-brand-primary/20">
                        <Tag size={9} /> {sub}
                      </span>
                    )}
                    {!main && !sub && project.subCategory && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                        <Tag size={10} /> {project.subCategory}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] font-mono text-slate-300 dark:text-slate-600 uppercase">
                      <Hash size={10} /> {project.id}
                    </span>
                  </>
                );
              })()}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white break-words leading-tight">
              {project.projectName}
            </h1>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed break-words max-w-2xl">
            {project.details || 'No overview provided for this project.'}
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm hover:bg-black dark:hover:bg-slate-100 transition-all shadow-lg active:scale-95"
              >
                <ExternalLink size={16} />
                <span>Live Link</span>
              </a>
            )}
            {project.source && (
              <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-2xl font-bold text-sm border border-slate-100 dark:border-slate-700">
                <Info size={16} />
                <span>{project.source}</span>
              </div>
            )}
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-6 py-3 bg-brand-primary/10 text-brand-primary rounded-2xl font-bold text-sm hover:bg-brand-primary/20 transition-all"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-8">
            {project.subdetails && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> Technical Details
                </h4>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {project.subdetails}
                </div>
              </div>
            )}

            {project.guide && (
              <div className="space-y-3 border-t border-slate-50 dark:border-slate-800 pt-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <Layout size={14} /> Implementation Guide
                </h4>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {project.guide}
                </div>
              </div>
            )}

            {!project.subdetails && !project.guide && (
              <p className="text-slate-300 dark:text-slate-600 text-sm font-medium text-center py-4">
                No additional details provided.
              </p>
            )}
          </div>
        </div>

        {/* Right: Code */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col h-full">
            {/* Code header */}
            <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <Terminal size={16} className="text-brand-secondary ml-2" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Implementation
                </span>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 dark:bg-slate-850 hover:bg-white/10 rounded-xl text-white transition-all text-xs font-bold"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code body */}
            <div className="flex-1 min-h-[400px] max-h-[700px] overflow-auto bg-[#0f172a] custom-scrollbar">
              <SyntaxHighlighter
                language="javascript"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '2rem',
                  fontSize: '0.82rem',
                  lineHeight: '1.7',
                  background: 'transparent',
                }}
                showLineNumbers
                lineNumberStyle={{ color: '#334155', fontSize: '0.75rem', minWidth: '2.5rem' }}
              >
                {project.implementation || '// No implementation provided'}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
