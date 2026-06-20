import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORIES as DEFAULT_CATS } from '../data/categories';

const LS_KEY = 'foryou_categories_v1';

function loadCats() {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : DEFAULT_CATS; }
  catch { return DEFAULT_CATS; }
}

const COLOR_OPTIONS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-slate-50 text-slate-700 border-slate-200',
  'bg-red-50 text-red-700 border-red-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-teal-50 text-teal-700 border-teal-200',
];

export default function Categories() {
  const [cats, setCats]                 = useState(loadCats);
  const [expandedId, setExpandedId]     = useState(null);
  const [editingCat, setEditingCat]     = useState(null);
  const [newCatForm, setNewCatForm]     = useState(false);
  const [newCat, setNewCat]             = useState({ label: '', icon: '📁', color: COLOR_OPTIONS[6] });
  const [newSubInputs, setNewSubInputs] = useState({});
  const [editSubState, setEditSubState] = useState(null);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(cats)); }, [cats]);

  const addCategory = () => {
    if (!newCat.label.trim()) { toast.error('Category name required'); return; }
    const id = newCat.label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    setCats(p => [...p, { id, label: newCat.label.trim(), icon: newCat.icon, color: newCat.color, subs: [] }]);
    setNewCat({ label: '', icon: '📁', color: COLOR_OPTIONS[6] });
    setNewCatForm(false);
    toast.success('Category added');
  };

  const updateCategory = () => {
    if (!editingCat.label.trim()) { toast.error('Name required'); return; }
    setCats(p => p.map(c => c.id === editingCat.id ? { ...c, label: editingCat.label, icon: editingCat.icon, color: editingCat.color } : c));
    setEditingCat(null);
    toast.success('Category updated');
  };

  const deleteCategory = (id) => {
    if (!confirm('Delete this category and all its subcategories?')) return;
    setCats(p => p.filter(c => c.id !== id));
    toast.success('Category deleted');
  };

  const addSub = (catId) => {
    const val = (newSubInputs[catId] || '').trim();
    if (!val) { toast.error('Subcategory name required'); return; }
    setCats(p => p.map(c => c.id === catId ? { ...c, subs: [...c.subs, val] } : c));
    setNewSubInputs(p => ({ ...p, [catId]: '' }));
    toast.success('Subcategory added');
  };

  const updateSub = () => {
    if (!editSubState.value.trim()) { toast.error('Name required'); return; }
    setCats(p => p.map(c => {
      if (c.id !== editSubState.catId) return c;
      const subs = [...c.subs];
      subs[editSubState.idx] = editSubState.value.trim();
      return { ...c, subs };
    }));
    setEditSubState(null);
    toast.success('Subcategory updated');
  };

  const deleteSub = (catId, idx) => {
    setCats(p => p.map(c => c.id !== catId ? c : { ...c, subs: c.subs.filter((_, i) => i !== idx) }));
    toast.success('Subcategory removed');
  };

  const resetToDefault = () => {
    if (!confirm('Reset all categories to default?')) return;
    setCats(DEFAULT_CATS);
    localStorage.removeItem(LS_KEY);
    toast.success('Reset to defaults');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Tag size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Category Manager</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                {cats.length} categories · {cats.reduce((a, c) => a + c.subs.length, 0)} subcategories
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={resetToDefault}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all">
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={() => setNewCatForm(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95">
              <Plus size={14} /> Add Category
            </button>
          </div>
        </div>
      </div>

      {/* New Category Form */}
      {newCatForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-brand-primary/20 dark:border-brand-primary/30 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">New Main Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input value={newCat.label} onChange={e => setNewCat(p => ({ ...p, label: e.target.value }))}
              placeholder="Category name..." autoFocus
              className="sm:col-span-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all" />
            <input value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))}
              placeholder="Emoji"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-center text-xl" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Color Theme</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setNewCat(p => ({ ...p, color: c }))}
                  className={`w-8 h-8 rounded-xl border-2 text-xs font-black transition-all ${c} ${newCat.color === c ? 'scale-110 border-slate-500' : 'border-transparent'}`}>
                  A
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addCategory}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setNewCatForm(false)}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="space-y-3">
        {cats.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

            {/* Category row */}
            <div className="flex items-center gap-3 px-6 py-4">
              <button type="button" onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ${expandedId === cat.id ? 'rotate-0' : '-rotate-90'}`} />
                <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-black uppercase tracking-wide ${cat.color}`}>
                  <span className="text-lg leading-none">{cat.icon}</span>
                  {cat.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{cat.subs.length} subs</span>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => setEditingCat({ id: cat.id, label: cat.label, icon: cat.icon, color: cat.color })}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                  <Edit3 size={15} />
                </button>
                <button type="button" onClick={() => deleteCategory(cat.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Edit inline */}
            {editingCat?.id === cat.id && (
              <div className="px-6 pb-4 border-t border-slate-100 dark:border-slate-700 space-y-3 bg-slate-50/50 dark:bg-slate-800/30 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input value={editingCat.label} onChange={e => setEditingCat(p => ({ ...p, label: e.target.value }))}
                    autoFocus className="sm:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all" />
                  <input value={editingCat.icon} onChange={e => setEditingCat(p => ({ ...p, icon: e.target.value }))}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-center text-xl" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} type="button" onClick={() => setEditingCat(p => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-lg border-2 text-xs font-black transition-all ${c} ${editingCat.color === c ? 'scale-110 border-slate-500' : 'border-transparent'}`}>
                      A
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={updateCategory}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
                    <Save size={13} /> Save
                  </button>
                  <button onClick={() => setEditingCat(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Subcategories */}
            {expandedId === cat.id && (
              <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-5 space-y-4 bg-slate-50/30 dark:bg-slate-800/20">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <ChevronRight size={11} /> Subcategories of {cat.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.subs.length === 0 && (
                    <span className="text-xs text-slate-300 dark:text-slate-600 italic">No subcategories yet.</span>
                  )}
                  {cat.subs.map((sub, idx) => (
                    <div key={idx}>
                      {editSubState?.catId === cat.id && editSubState?.idx === idx ? (
                        <div className="flex items-center gap-1">
                          <input value={editSubState.value}
                            onChange={e => setEditSubState(p => ({ ...p, value: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') updateSub(); if (e.key === 'Escape') setEditSubState(null); }}
                            autoFocus
                            className="bg-white dark:bg-slate-800 border border-brand-primary rounded-lg px-3 py-1 text-xs outline-none w-32 text-slate-900 dark:text-white" />
                          <button type="button" onClick={updateSub} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><Save size={12} /></button>
                          <button type="button" onClick={() => setEditSubState(null)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X size={12} /></button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 group">
                          {sub}
                          <button type="button" onClick={() => setEditSubState({ catId: cat.id, idx, value: sub })}
                            className="ml-1 text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Edit3 size={10} />
                          </button>
                          <button type="button" onClick={() => deleteSub(cat.id, idx)}
                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <X size={10} />
                          </button>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newSubInputs[cat.id] || ''}
                    onChange={e => setNewSubInputs(p => ({ ...p, [cat.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') addSub(cat.id); }}
                    placeholder={`Add subcategory to ${cat.label}...`}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 rounded-xl px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all" />
                  <button type="button" onClick={() => addSub(cat.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shrink-0">
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {cats.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700">
          <div className="text-5xl mb-3">📂</div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No categories yet.</p>
          <button onClick={() => setNewCatForm(true)}
            className="mt-4 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
            Add First Category
          </button>
        </div>
      )}
    </div>
  );
}
