import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService } from '../api/api';
import { ArrowRight, Image as ImageIcon, Sparkles, TrendingUp, Globe, Tag, ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORIES as DEFAULT_CATS, parseSubCategory } from '../data/categories';
import { getCache, setCache } from '../../utils/cache';

const LS_KEY = 'foryou_categories_v1';
const PROJECTS_CACHE_KEY = 'approved_projects';
const ITEMS_PER_PAGE = 12;

function loadCats() {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : DEFAULT_CATS; }
  catch { return DEFAULT_CATS; }
}

function getProjectsFromResponse(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
      <div className="h-28 skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 skeleton w-3/4" />
        <div className="h-3 skeleton w-full" />
        <div className="h-4 skeleton w-1/3 rounded-full" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, darkBg }) {
  return (
    <div className={`${bg} ${darkBg} rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3`}>
      <div className={`${color} bg-white/60 dark:bg-white/10 p-2 rounded-lg`}>
        <Icon size={16} />
      </div>
      <div>
        <div className="text-xl font-black text-slate-900 dark:text-white">{value}</div>
        <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeMain, setActiveMain] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [CATEGORIES]                = useState(loadCats);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function loadProjects(attempt = 1) {
      const cached = getCache(PROJECTS_CACHE_KEY);
      if (cached && cached.data && cached.data.length > 0) {
        if (mounted) { setProjects(cached.data); setLoading(false); }
        if (cached.isStale) {
          try {
            const freshResponse = await templateService.getApproved();
            const freshData = getProjectsFromResponse(freshResponse);
            if (mounted && freshData.length > 0) { setProjects(freshData); setCache(PROJECTS_CACHE_KEY, freshData); }
          } catch { /* stale cache OK */ }
        }
        return;
      }
      setLoading(true);
      try {
        const approvedResponse = await templateService.getApproved();
        const freshData = getProjectsFromResponse(approvedResponse);
        if (mounted) { setProjects(freshData); setCache(PROJECTS_CACHE_KEY, freshData); setLoading(false); }
      } catch {
        if (mounted && attempt < 3) {
          setTimeout(() => { if (mounted) loadProjects(attempt + 1); }, attempt * 3000);
        } else if (mounted) { toast.error('Could not load projects'); setLoading(false); }
      }
    }

    loadProjects();
    return () => { mounted = false; };
  }, []);

  // Reset page when category changes
  useEffect(() => { setCurrentPage(1); }, [activeMain]);

  const catStats = useMemo(() => {
    const counts = {};
    projects.forEach(p => {
      const { main } = parseSubCategory(p.subCategory);
      counts[main || 'Other'] = (counts[main || 'Other'] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const displayProjects = useMemo(() => {
    if (!activeMain) return projects;
    return projects.filter(p => parseSubCategory(p.subCategory).main === activeMain);
  }, [projects, activeMain]);

  // Pagination
  const totalPages = Math.ceil(displayProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [displayProjects, currentPage]);

  const activeCats = CATEGORIES.filter(c => catStats[c.label] > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Hero ── */}
      <div className="relative bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 md:p-8 text-white overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-brand-secondary text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={12} /><span>For You — Resource Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Everything You Need,
              <span className="text-brand-secondary"> All In One Place</span>
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Hosting, software, AI tools, web deployment, databases, and much more — curated for you.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl font-black text-white">{projects.length}</div>
              <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Projects</div>
            </div>
            <div className="bg-brand-primary/30 backdrop-blur rounded-xl p-4 text-center border border-brand-primary/30">
              <div className="text-2xl font-black text-white">{activeCats.length}</div>
              <div className="text-slate-300 text-[9px] font-black uppercase tracking-widest mt-0.5">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total"  value={projects.length} icon={TrendingUp} color="text-brand-primary" bg="bg-white" darkBg="dark:bg-slate-900" />
          <StatCard label="Free"   value={projects.filter(p => p.accessType === 'FREE').length} icon={Sparkles} color="text-emerald-600" bg="bg-emerald-50/50" darkBg="dark:bg-emerald-900/20" />
          <StatCard label="Paid"   value={projects.filter(p => p.accessType === 'PAID').length} icon={Globe} color="text-amber-600" bg="bg-amber-50/50" darkBg="dark:bg-amber-900/20" />
          <StatCard label="Both"   value={projects.filter(p => p.accessType === 'BOTH').length} icon={ArrowRight} color="text-blue-600" bg="bg-blue-50/50" darkBg="dark:bg-blue-900/20" />
        </div>
      )}

      {/* ── Category Browse ── */}
      {!loading && activeCats.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Tag size={14} className="text-brand-primary" /> Categories
            </h2>
            <button onClick={() => navigate('/search')} className="flex items-center gap-1 text-brand-primary text-xs font-bold hover:underline">
              All <ArrowRight size={11} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setActiveMain('')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                ${!activeMain ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              All <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-white/20 dark:bg-black/20">{projects.length}</span>
            </button>
            {activeCats.map(cat => (
              <button key={cat.id} onClick={() => setActiveMain(activeMain === cat.label ? '' : cat.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                  ${activeMain === cat.label ? `${cat.color} shadow-sm` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <span className="text-sm leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-slate-100 dark:bg-slate-700 text-slate-400">{catStats[cat.label]}</span>
              </button>
            ))}
          </div>

          {activeMain && (() => {
            const subCounts = {};
            projects.forEach(p => {
              const { main, sub } = parseSubCategory(p.subCategory);
              if (main === activeMain && sub) subCounts[sub] = (subCounts[sub] || 0) + 1;
            });
            const subs = Object.entries(subCounts).sort((a, b) => b[1] - a[1]);
            if (subs.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5 pl-2 border-l-2 border-brand-primary/20 ml-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest self-center mr-1">
                  <ChevronRight size={10} className="inline" /> Sub:
                </span>
                {subs.map(([sub, count]) => (
                  <button key={sub} onClick={() => navigate(`/search?main=${encodeURIComponent(activeMain)}&sub=${encodeURIComponent(sub)}`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-brand-primary/5 hover:border-brand-primary/30 transition-all">
                    {sub} <span className="text-[8px] bg-slate-100 dark:bg-slate-700 text-slate-400 px-1 py-0.5 rounded-full font-black">{count}</span>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Section Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
          {activeMain ? `${CATEGORIES.find(c => c.label === activeMain)?.icon} ${activeMain}` : 'All'}
          <span className="text-slate-400 font-normal text-sm ml-2">({displayProjects.length})</span>
        </h2>
        {totalPages > 1 && (
          <span className="text-[10px] text-slate-400 font-bold">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* ── Project Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayProjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
          <div className="text-4xl">📭</div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            {activeMain ? `No projects in ${activeMain} yet.` : 'No approved site yet.'}
          </p>
          <button onClick={() => navigate('/add')}
            className="mt-3 px-4 py-2 bg-brand-primary text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all">
            Be the first to upload
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {paginatedProjects.map(project => {
              const { main, sub } = parseSubCategory(project.subCategory);
              const cat = CATEGORIES.find(c => c.label === main);
              return (
                <div key={project.id}
                  className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}>
                  <div className="h-24 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {project.image ? (
                      <img src={project.image} alt={project.projectName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    {main && (
                      <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border
                        ${cat?.color || 'bg-white/90 text-slate-700 border-slate-200'}`}>
                        {cat?.icon}
                      </div>
                    )}
                    <div className={`absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded
                      ${project.accessType === 'FREE' ? 'bg-emerald-100 text-emerald-700' : project.accessType === 'PAID' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {project.accessType}
                    </div>
                  </div>
                  <div className="p-2.5 space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors line-clamp-1">
                      {project.projectName}
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] line-clamp-1 leading-relaxed">
                      {project.details || 'No description.'}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[8px] text-slate-300 dark:text-slate-600 font-mono">#{project.id}</span>
                      <ArrowRight size={10} className="text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and neighbors
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .reduce((acc, page, idx, arr) => {
                  // Add ellipsis between gaps
                  if (idx > 0 && page - arr[idx - 1] > 1) {
                    acc.push(<span key={`dots-${page}`} className="px-1 text-slate-400 text-xs">...</span>);
                  }
                  acc.push(
                    <button key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all
                        ${currentPage === page
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      {page}
                    </button>
                  );
                  return acc;
                }, [])}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
