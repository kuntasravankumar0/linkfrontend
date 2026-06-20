import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Send, Code2,
  Link as LinkIcon, Image as ImageIcon,
  Tag, FileText, BookOpen, Layers, ChevronDown, X, Plus, Save, Sparkles,
} from 'lucide-react';
import { templateService } from '../api/api';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../data/categories';
import { fetchProjectDetails } from '../api/groqAutofill';
import { useTheme } from '../hooks/useTheme';
import { invalidateAllCaches } from '../../utils/cache';

const LS_KEY = 'foryou_categories_v1';

// Load categories from localStorage (same key as Categories page)
function loadCategories() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
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

const INITIAL = {
  projectName: '', category: '', subCategory: '',
  accessType: 'FREE', details: '', subdetails: '',
  guide: '', source: '', link: '', image: '', implementation: '',
};

// Sanitize text — strip HTML tags and trim
function sanitize(str) {
  return String(str).replace(/<[^>]*>/g, '').trim();
}

function inputCls(dark) {
  return `w-full rounded-xl px-4 py-3 outline-none transition-all text-sm font-medium
    border focus:ring-4
    ${dark
      ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:ring-brand-primary/20 focus:border-brand-primary'
      : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-300 focus:ring-brand-primary/10 focus:border-brand-primary'}`;
}
function textareaCls(dark) { return `${inputCls(dark)} resize-none`; }

function Field({ label, icon: Icon, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-400 tracking-widest">
        {Icon && <Icon size={12} />}{label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// Category dropdown — now accepts categories as prop
function CategoryDropdown({ value, onChange, dark, categories }) {
  const [open, setOpen] = useState(false);
  const selected = categories.find(c => c.label === value);

  return (
    <div className="relative">
      <button type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium border transition-all
          ${dark
            ? 'bg-slate-800 border-slate-600 text-slate-100 hover:border-brand-primary'
            : 'bg-slate-50 border-slate-100 text-slate-900 hover:border-brand-primary'}`}>
        <span className={value ? '' : 'text-slate-400 font-normal'}>
          {selected ? `${selected.icon} ${selected.label}` : 'Select a category'}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute z-50 top-full mt-1 w-full rounded-2xl border shadow-2xl overflow-hidden max-h-80 overflow-y-auto
          ${dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
          {/* Clear option */}
          <button type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b
              ${dark
                ? 'text-slate-400 hover:bg-slate-700 border-slate-700'
                : 'text-slate-400 hover:bg-slate-50 border-slate-100'}`}>
            <X size={13} /> Clear selection
          </button>
          {categories.map(cat => (
            <button type="button" key={cat.id}
              onClick={() => { onChange(cat.label); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all
                ${value === cat.label
                  ? `${cat.color} opacity-100`
                  : dark
                    ? 'text-slate-300 hover:bg-slate-700'
                    : 'text-slate-700 hover:bg-slate-50'}`}>
              <span className="text-base">{cat.icon}</span>
              <span>{cat.label}</span>
              {value === cat.label && <span className="ml-auto text-[10px] font-black uppercase tracking-widest opacity-60">selected</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Subcategory chips — now accepts categories as prop
function SubCategoryPicker({ category, value, onChange, dark, categories }) {
  const subs = useMemo(() => {
    if (!category) return [];
    const cat = categories.find(c => c.label === category);
    return cat?.subs || [];
  }, [category, categories]);

  if (!category) return (
    <p className="text-[11px] text-slate-400 italic">Select a category above to see subcategories.</p>
  );
  if (subs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Layers size={11} className="text-slate-300" />
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          {category
            ? `Subcategories under "${category}" — click to select`
            : 'All subcategories — click to select'}
        </span>
        {value && (
          <button type="button" onClick={() => onChange('')}
            className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors font-bold">
            <X size={10} /> clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {subs.map(sub => (
          <button type="button" key={sub}
            onClick={() => onChange(value === sub ? '' : sub)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
              ${value === sub
                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                : dark
                  ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-brand-primary/50 hover:text-brand-primary'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-brand-primary/5 hover:border-brand-primary/40 hover:text-brand-primary'}`}>
            {sub}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Add Category Inline Form ──
function AddCategoryForm({ dark, onAdd, onCancel }) {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState(COLOR_OPTIONS[6]);
  const [subs, setSubs] = useState('');

  const handleSave = () => {
    if (!label.trim()) { toast.error('Category name is required'); return; }
    const id = label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const subsArray = subs.trim()
      ? subs.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    onAdd({ id, label: label.trim(), icon, color, subs: subsArray });
  };

  return (
    <div className={`p-6 rounded-2xl border space-y-4 ${dark ? 'bg-slate-800 border-brand-primary/30' : 'bg-white border-brand-primary/20'} shadow-lg`}>
      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
        <Plus size={12} /> Add New Category
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Category name..."
          autoFocus
          className={`sm:col-span-2 rounded-xl px-4 py-2.5 text-sm outline-none border focus:ring-4 transition-all
            ${dark
              ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:ring-brand-primary/20 focus:border-brand-primary'
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-brand-primary/10 focus:border-brand-primary'}`}
        />
        <input
          value={icon}
          onChange={e => setIcon(e.target.value)}
          placeholder="Emoji"
          className={`rounded-xl px-4 py-2.5 text-sm outline-none border focus:ring-4 transition-all text-center text-xl
            ${dark
              ? 'bg-slate-700 border-slate-600 text-white focus:ring-brand-primary/20 focus:border-brand-primary'
              : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-brand-primary/10 focus:border-brand-primary'}`}
        />
      </div>

      {/* Color picker */}
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Color Theme</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-lg border-2 text-xs font-black transition-all ${c} ${color === c ? 'scale-110 border-slate-500' : 'border-transparent'}`}>
              A
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories (optional) */}
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Subcategories (optional, comma-separated)</p>
        <input
          value={subs}
          onChange={e => setSubs(e.target.value)}
          placeholder="e.g. React, Vue, Angular"
          className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none border focus:ring-4 transition-all
            ${dark
              ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:ring-brand-primary/20 focus:border-brand-primary'
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-brand-primary/10 focus:border-brand-primary'}`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button type="button" onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
          <Save size={14} /> Save Category
        </button>
        <button type="button" onClick={onCancel}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all
            ${dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AddProject() {
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(false);
  const [formData, setFormData]   = useState(INITIAL);
  const [charCount, setCharCount] = useState(0);
  const [allProjects, setAllProjects] = useState([]);
  const [_dbLoading, setDbLoading] = useState(true);
  const [nameWarning, setNameWarning] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categories, setCategories] = useState(loadCategories);
  const [aiLoading, setAiLoading] = useState(false);

  // Get dark mode from context (reactive — updates when toggled)
  const { dark } = useTheme();

  useEffect(() => {
    templateService.getAll()
      .then(r => setAllProjects(r.data.content || []))
      .catch(() => {})
      .finally(() => setDbLoading(false));
  }, []);

  // ── AI Auto-fill handler ──
  const handleAiAutofill = async () => {
    if (!formData.projectName.trim() && !formData.link.trim()) {
      toast.error('Enter a project name or link first to auto-fill.');
      return;
    }
    setAiLoading(true);
    try {
      const result = await fetchProjectDetails(
        formData.projectName || 'Unknown',
        formData.link || '',
        categories
      );
      // Merge AI suggestions into form — only fill empty fields (don't overwrite user edits)
      setFormData(prev => ({
        ...prev,
        details:        prev.details        || result.details        || '',
        subdetails:     prev.subdetails     || result.subdetails     || '',
        guide:          prev.guide          || result.guide          || '',
        source:         prev.source         || result.source         || '',
        category:       prev.category       || result.category       || '',
        subCategory:    prev.subCategory    || result.subCategory    || '',
        accessType:     result.accessType   || prev.accessType,
        image:          prev.image          || result.image          || '',
        implementation: prev.implementation || result.implementation || '',
      }));
      toast.success('AI auto-filled project details!');
    } catch (err) {
      toast.error(err.message || 'AI auto-fill failed. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddCategory = (newCat) => {
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setShowAddCategory(false);
    // Auto-select the newly added category
    setFormData(prev => ({ ...prev, category: newCat.label, subCategory: '' }));
    toast.success(`Category "${newCat.label}" added!`);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    // Don't sanitize image/link/implementation — they can contain special chars, base64, etc.
    const noSanitize = ['image', 'link', 'implementation'];
    const clean = noSanitize.includes(name) ? value : sanitize(value);
    setFormData(prev => ({ ...prev, [name]: clean }));
    if (name === 'implementation') setCharCount(value.length);
    if (name === 'projectName') {
      const lower = clean.toLowerCase();
      const dup = allProjects.find(p => p.projectName.trim().toLowerCase() === lower);
      setNameWarning(dup ? `"${dup.projectName}" already exists (ID: ${dup.id})` : '');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (nameWarning) { toast.error('Please use a unique project name.'); return; }
    if (!formData.projectName.trim()) { toast.error('Project name is required.'); return; }

    setLoading(true);
    const cat = formData.category.trim();
    const sub = formData.subCategory.trim();
    let subCategoryValue = '';
    if (cat && sub)  subCategoryValue = `${cat} > ${sub}`;
    else if (cat)    subCategoryValue = cat;
    else if (sub)    subCategoryValue = sub;

    const payload = {
      projectName:    sanitize(formData.projectName),
      subCategory:    sanitize(subCategoryValue),
      accessType:     formData.accessType,
      details:        sanitize(formData.details),
      subdetails:     sanitize(formData.subdetails),
      guide:          sanitize(formData.guide),
      source:         sanitize(formData.source),
      link:           formData.link.trim(),         // No sanitize — can be long URL
      image:          formData.image.trim(),        // No sanitize — can be base64 or long URL
      implementation: formData.implementation,      // Code — keep as-is
    };

    try {
      await templateService.create(payload);
      invalidateAllCaches(); // Clear cached data so Home refetches fresh
      toast.success('Project submitted for review!');
      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.message
        || Object.values(error.response?.data?.errors || {})[0]
        || 'Failed to submit. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const ic = inputCls(dark);
  const tc = textareaCls(dark);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)}
          className="p-2.5 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Upload Project</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Submitted projects go to admin review</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Basic Info ── */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 transition-colors duration-200">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Tag size={14} /> Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Project Name" required icon={Tag}>
              <input required name="projectName" value={formData.projectName}
                onChange={handleChange} placeholder="My Awesome Project"
                maxLength={120}
                className={`${ic} ${nameWarning ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`} />
              {nameWarning && (
                <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 mt-1">
                  ⚠ {nameWarning}
                </p>
              )}
            </Field>
            <Field label="Access Type">
              <select name="accessType" value={formData.accessType}
                onChange={handleChange} className={ic}>
                <option value="FREE">🟢 Free</option>
                <option value="PAID">🟡 Paid</option>
                <option value="BOTH">🔵 Both (Free + Paid)</option>
              </select>
            </Field>
          </div>

          {/* ── Category dropdown + Add Category button ── */}
          <Field label="Category" icon={Tag}>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <CategoryDropdown
                  value={formData.category}
                  onChange={val => setFormData(prev => ({ ...prev, category: val, subCategory: '' }))}
                  dark={dark}
                  categories={categories}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategory(o => !o)}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0
                  ${showAddCategory
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    : 'bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-lg hover:scale-105 active:scale-95'}`}
              >
                {showAddCategory ? <><X size={14} /> Close</> : <><Plus size={14} /> Add Category</>}
              </button>
            </div>
          </Field>

          {/* ── Inline Add Category Form ── */}
          {showAddCategory && (
            <AddCategoryForm
              dark={dark}
              onAdd={handleAddCategory}
              onCancel={() => setShowAddCategory(false)}
            />
          )}

          {/* ── Subcategory chips ── */}
          <div className="space-y-3">
            <Field label="Subcategory" icon={Layers}>
              {/* Show selected value */}
              {formData.subCategory && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-2
                  ${dark ? 'bg-brand-primary/20 border-brand-primary/40' : 'bg-brand-primary/5 border-brand-primary/20'}`}>
                  <span className="text-xs font-bold text-brand-primary">{formData.subCategory}</span>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, subCategory: '' }))}
                    className="ml-auto text-brand-primary/60 hover:text-brand-primary transition-colors">
                    <X size={13} />
                  </button>
                </div>
              )}
              <SubCategoryPicker
                category={formData.category}
                value={formData.subCategory}
                onChange={val => setFormData(prev => ({ ...prev, subCategory: val }))}
                dark={dark}
                categories={categories}
              />
            </Field>
          </div>

          {/* Stored value preview */}
          {(formData.category || formData.subCategory) && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border
              ${dark ? 'bg-brand-primary/10 border-brand-primary/20' : 'bg-brand-primary/5 border-brand-primary/10'}`}>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stored as:</span>
              <span className="text-xs font-bold text-brand-primary font-mono">
                "{formData.category && formData.subCategory
                  ? `${formData.category} > ${formData.subCategory}`
                  : formData.category || formData.subCategory}"
              </span>
            </div>
          )}

          {/* Image URL + preview */}
          <Field label="Image URL" icon={ImageIcon}>
            <input name="image" value={formData.image} onChange={handleChange}
              placeholder="https://example.com/preview.png"
              className={ic} />
            {formData.image && (
              <div className="mt-2 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-40 bg-slate-100 dark:bg-slate-800">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="hidden absolute inset-0 items-center justify-center text-slate-400 text-xs font-bold flex-col gap-2">
                  <ImageIcon size={24} />
                  <span>Invalid image URL</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] bg-black/50 text-white px-2 py-1 rounded-lg font-bold">Preview</span>
                </div>
              </div>
            )}
          </Field>
        </div>

        {/* ── Links & Source ── */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 transition-colors duration-200">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <LinkIcon size={14} /> Links & Source
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Source" icon={LinkIcon}>
              <input name="source" value={formData.source} onChange={handleChange}
                placeholder='e.g. "GitHub", "GitLab", "npm"'
                maxLength={100}
                className={ic} />
            </Field>
            <Field label="Live Link" icon={LinkIcon}>
              <input name="link" value={formData.link} onChange={handleChange}
                placeholder="https://your-project.com"
                className={ic} />
            </Field>
          </div>

          {/* ── AI Auto-fill Button ── */}
          <button
            type="button"
            onClick={handleAiAutofill}
            disabled={aiLoading || (!formData.projectName.trim() && !formData.link.trim())}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold transition-all border
              ${aiLoading
                ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-500 cursor-wait'
                : (!formData.projectName.trim() && !formData.link.trim())
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:shadow-lg hover:shadow-violet-100 dark:hover:shadow-violet-900/20 hover:scale-[1.01] active:scale-[0.99]'}`}
          >
            {aiLoading
              ? <><Loader2 size={16} className="animate-spin" /><span>AI is analyzing...</span></>
              : <><Sparkles size={16} /><span>Auto-fill with AI</span><span className="text-[10px] opacity-60 font-normal">(uses name & link)</span></>}
          </button>
          {(!formData.projectName.trim() && !formData.link.trim()) && (
            <p className="text-[10px] text-slate-400 text-center italic">Enter a project name or link above to enable AI auto-fill</p>
          )}
        </div>

        {/* ── Description ── */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 transition-colors duration-200">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <FileText size={14} /> Description
          </h2>
          <Field label="Details" icon={FileText}>
            <textarea name="details" value={formData.details} onChange={handleChange}
              rows={3} placeholder="Brief overview of the project..."
              maxLength={2000}
              className={tc} />
          </Field>
          <Field label="Subdetails" icon={BookOpen}>
            <textarea name="subdetails" value={formData.subdetails} onChange={handleChange}
              rows={3} placeholder="Technical details, requirements, features..."
              maxLength={2000}
              className={tc} />
          </Field>
          <Field label="Guide" icon={BookOpen}>
            <textarea name="guide" value={formData.guide} onChange={handleChange}
              rows={3} placeholder="Step-by-step usage guide..."
              maxLength={3000}
              className={tc} />
          </Field>
        </div>

        {/* ── Code ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
          <div className="bg-slate-900 dark:bg-slate-950 px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code2 size={18} className="text-brand-secondary" />
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Implementation Code</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{charCount.toLocaleString()} chars</span>
          </div>
          <textarea name="implementation" value={formData.implementation}
            onChange={handleChange}
            rows={14} placeholder="// Paste your source code here..."
            className="w-full bg-[#0f172a] text-slate-300 font-mono text-sm p-8 outline-none border-none focus:ring-0 resize-none custom-scrollbar" />
        </div>

        {/* ── Submit ── */}
        <button type="submit" disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-2xl font-black uppercase tracking-wide transition-all shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
          {loading
            ? <><Loader2 size={20} className="animate-spin" /><span>Submitting...</span></>
            : <><Send size={20} /><span>Submit for Review</span></>}
        </button>
      </form>
    </div>
  );
}
