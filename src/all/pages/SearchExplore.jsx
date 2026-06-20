import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { templateService } from '../api/api';
import { Search, Loader2, Database, Image as ImageIcon, Filter, X, SlidersHorizontal, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectDetailsModal from '../components/ProjectDetailsModal';
import { CATEGORIES as DEFAULT_CATS, parseSubCategory } from '../data/categories';
import { getCache, setCache } from '../../utils/cache';

const LS_KEY = 'foryou_categories_v1';
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

// Use loaded categories for filter chip display
const CATEGORIES = loadCats();

function SkeletonRow() {
  return (
    <tr>
      <td className="px-6 py-4"><div className="w-12 h-12 skeleton rounded-xl" /></td>
      <td className="px-6 py-4">
        <div className="h-4 skeleton w-40 mb-2" />
        <div className="h-3 skeleton w-24" />
      </td>
      <td className="px-6 py-4 hidden sm:table-cell"><div className="h-5 skeleton w-20 mx-auto rounded-full" /></td>
      <td className="px-6 py-4"><div className="h-4 skeleton w-16 ml-auto" /></td>
    </tr>
  );
}

function CategoryFilterPanel({ allProjects, selectedMain, selectedSub, onMainChange, onSubChange }) {
  const [expanded, setExpanded] = useState(true);
  const [CATEGORIES] = useState(loadCats);

  // Count projects per main category
  const mainCounts = useMemo(() => {
    const counts = {};
    allProjects.forEach(p => {
      const { main } = parseSubCategory(p.subCategory);
      const key = main || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [allProjects]);

  // Count projects per subcategory under selected main
  const subCounts = useMemo(() => {
    if (!selectedMain) return {};
    const counts = {};
    allProjects.forEach(p => {
      const { main, sub } = parseSubCategory(p.subCategory);
      if (main === selectedMain && sub) {
        counts[sub] = (counts[sub] || 0) + 1;
      }
    });
    return counts;
  }, [allProjects, selectedMain]);

  const activeCat = CATEGORIES.find(c => c.label === selectedMain);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Header */}
      <button
        onClick={() => setExpanded(o => !o)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
          <Tag size={14} />
          <span>Browse by Category</span>
          {selectedMain && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${activeCat?.color || 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              {selectedMain}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-slate-50 dark:border-slate-800">

          {/* All categories */}
          <div className="pt-4">
            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-3">Main Categories</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { onMainChange(''); onSubChange(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                  ${!selectedMain
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-transparent'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                All
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">{allProjects.length}</span>
              </button>
              {CATEGORIES.map(cat => {
                const count = mainCounts[cat.label] || 0;
                if (count === 0) return null;
                return (
                  <button key={cat.id}
                    onClick={() => { onMainChange(cat.label); onSubChange(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                      ${selectedMain === cat.label
                        ? `${cat.color} shadow-sm`
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black
                      ${selectedMain === cat.label ? 'bg-white/40' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategories — only when main is selected */}
          {selectedMain && Object.keys(subCounts).length > 0 && (
            <div className="border-t border-slate-50 dark:border-slate-800 pt-4">
              <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-3 flex items-center gap-1.5">
                <ChevronRight size={12} />
                Subcategories under <span className="text-slate-650 dark:text-slate-300">{selectedMain}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onSubChange('')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                    ${!selectedSub
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  All in {selectedMain}
                </button>
                {Object.entries(subCounts).sort((a,b) => b[1]-a[1]).map(([sub, count]) => (
                  <button key={sub}
                    onClick={() => onSubChange(sub)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                      ${selectedSub === sub
                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-brand-primary/30'}`}
                  >
                    {sub}
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black
                      ${selectedSub === sub ? 'bg-white/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchExplore() {
  const [searchParams] = useSearchParams();
  const [allProjects, setAllProjects]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterAccess, setFilterAccess]   = useState('');
  const [filterMain, setFilterMain]       = useState(searchParams.get('main') || '');
  const [filterSub, setFilterSub]         = useState(searchParams.get('sub') || '');
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch all once, filter client-side for instant response
  const fetchAll = useCallback(async () => {
    // Try cache first
    const cached = getCache('approved_projects');
    if (cached && cached.data && cached.data.length > 0) {
      setAllProjects(cached.data);
      setLoading(false);
      // Background refresh if stale
      if (cached.isStale) {
        try {
          const response = await templateService.getApproved();
          const freshData = getProjectsFromResponse(response);
          if (freshData.length > 0) {
            setAllProjects(freshData);
            setCache('approved_projects', freshData);
          }
        } catch { /* stale cache is fine */ }
      }
      return;
    }
    // No cache — fetch fresh
    setLoading(true);
    try {
      const response = await templateService.getApproved();
      const freshData = getProjectsFromResponse(response);
      setAllProjects(freshData);
      setCache('approved_projects', freshData);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Client-side filtering — instant, no debounce needed
  const filtered = useMemo(() => {
    return allProjects.filter(p => {
      // Search
      if (searchQuery && !p.projectName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      // Access type
      if (filterAccess && p.accessType !== filterAccess) return false;
      // Main category
      if (filterMain) {
        const { main } = parseSubCategory(p.subCategory);
        if (main !== filterMain) return false;
      }
      // Subcategory
      if (filterSub) {
        const { sub } = parseSubCategory(p.subCategory);
        if (sub !== filterSub) return false;
      }
      return true;
    });
  }, [allProjects, searchQuery, filterAccess, filterMain, filterSub]);

  const hasFilters = searchQuery || filterAccess || filterMain || filterSub;

  const clearAll = () => {
    setSearchQuery('');
    setFilterAccess('');
    setFilterMain('');
    setFilterSub('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* ── Search & Filter Header ── */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Search & Explore</h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
              {loading ? 'Loading...' : `${allProjects.length} total projects`}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={20} />
            <input type="text" placeholder="Search by project name..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-300 dark:placeholder:text-slate-600" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-650 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Access filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" size={16} />
            <select value={filterAccess} onChange={e => setFilterAccess(e.target.value)}
              className="pl-10 pr-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-600 dark:text-slate-300 text-sm focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all cursor-pointer appearance-none min-w-[160px]">
              <option value="">All Access</option>
              <option value="FREE">Free Only</option>
              <option value="PAID">Paid Only</option>
              <option value="BOTH">Both</option>
            </select>
          </div>

          {hasFilters && (
            <button onClick={clearAll}
              className="px-5 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm transition-all flex items-center gap-2">
              <X size={16} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Panel ── */}
      {!loading && (
        <CategoryFilterPanel
          allProjects={allProjects}
          selectedMain={filterMain}
          selectedSub={filterSub}
          onMainChange={setFilterMain}
          onSubChange={setFilterSub}
        />
      )}

      {/* ── Active filter chips ── */}
      {hasFilters && !loading && (
        <div className="flex items-center gap-2 flex-wrap px-1">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Active:</span>
          {searchQuery && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold border border-brand-primary/20">
              🔍 "{searchQuery}"
              <button onClick={() => setSearchQuery('')}><X size={11} /></button>
            </span>
          )}
          {filterAccess && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-900">
              {filterAccess}
              <button onClick={() => setFilterAccess('')}><X size={11} /></button>
            </span>
          )}
          {filterMain && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-900">
              {CATEGORIES.find(c=>c.label===filterMain)?.icon} {filterMain}
              <button onClick={() => { setFilterMain(''); setFilterSub(''); }}><X size={11} /></button>
            </span>
          )}
          {filterSub && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold border border-brand-primary/20">
              <Tag size={10} /> {filterSub}
              <button onClick={() => setFilterSub('')}><X size={11} /></button>
            </span>
          )}
          <span className="text-[10px] text-slate-400 dark:text-slate-550 font-mono ml-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* ── Results Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
            <Database size={14} />
            <span>{loading ? 'Loading...' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}</span>
          </div>
          {hasFilters && !loading && (
            <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Filtered
            </span>
          )}
        </div>

        {loading ? (
          <table className="w-full">
            <tbody>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <div className="text-5xl">🔍</div>
            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">No matching projects found.</p>
            {hasFilters && (
              <button onClick={clearAll} className="text-brand-primary text-sm font-bold hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left w-16">Preview</th>
                <th className="px-6 py-4 text-left">Project Info</th>
                <th className="px-6 py-4 text-left hidden md:table-cell">Category</th>
                <th className="px-6 py-4 text-center hidden sm:table-cell">Access</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map(p => {
                const { main, sub } = parseSubCategory(p.subCategory);
                const cat = CATEGORIES.find(c => c.label === main);
                return (
                  <tr key={p.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedProject(p)}>
                    <td className="px-6 py-4">
                      {p.image ? (
                        <img src={p.image} alt={p.projectName}
                          className="w-12 h-12 object-cover rounded-xl shadow-sm group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 dark:from-slate-800 to-slate-200 dark:to-slate-900 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors text-sm line-clamp-1">
                        {p.projectName}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase tracking-tight">
                        #{p.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {main && (
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-tight
                            ${cat?.color || 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-700'}`}>
                            {cat?.icon} {main}
                          </span>
                        )}
                        {sub && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 uppercase tracking-tight">
                            {sub}
                          </span>
                        )}
                        {!main && !sub && p.subCategory && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{p.subCategory}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tight
                        ${p.accessType === 'FREE' ? 'badge-free' : p.accessType === 'PAID' ? 'badge-paid' : 'badge-both'}`}>
                        {p.accessType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={e => { e.stopPropagation(); setSelectedProject(p); }}
                        className="text-xs font-bold text-brand-primary hover:bg-brand-primary/10 px-3 py-1.5 rounded-lg transition-all uppercase tracking-tight">
                        Open →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedProject && (
        <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  );
}
