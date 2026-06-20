import { useState, useEffect, useCallback, useRef } from 'react';
import { templateService, contactService, chatService, API_BASE_URL } from '../api/api';
import { getChatClient } from '../api/chatRealtime';
import { invalidateAllCaches } from '../../utils/cache';
import {
  CheckCircle, XCircle, Trash2, Loader2, ShieldCheck,
  Search, Edit3, X, Save, RefreshCw, Tag, Layers, Copy, Check,
  Mail, Phone, MessageSquare, Eye, EyeOff, Clock,
  BarChart2, Send, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORIES, parseSubCategory } from '../data/categories';
import { copyToClipboard } from '../../utils/copy';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm flex items-center gap-4 ${color}`}>
      {Icon && <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"><Icon size={18} className="text-slate-500 dark:text-slate-400" /></div>}
      <div>
        <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function UuidBadge({ uuid }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const success = await copyToClipboard(uuid);
    if (success) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <button onClick={copy} title={`Copy UUID: ${uuid}`}
      className="flex items-center gap-1 text-[9px] font-mono text-slate-300 hover:text-brand-primary transition-colors group">
      <span className="group-hover:text-brand-primary">{uuid?.slice(0, 8)}…</span>
      {copied ? <Check size={9} className="text-green-500" /> : <Copy size={9} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONTACT MESSAGES PANEL
───────────────────────────────────────────────────────────────────────────── */
function ContactPanel() {
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [acting, setActing]       = useState(null);
  const [unread, setUnread]       = useState(0);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await contactService.getAll();
      setMessages(res.data.content || []);
      setUnread(res.data.unread || 0);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleRead = async (msg) => {
    setActing(`read-${msg.id}`);
    try {
      if (msg.is_read) await contactService.markUnread(msg.id);
      else             await contactService.markRead(msg.id);
      fetchMessages(true);
    } catch { toast.error('Action failed'); }
    finally { setActing(null); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this message permanently?')) return;
    setActing(`del-${id}`);
    try {
      await contactService.delete(id);
      toast.success('Message deleted');
      if (selected?.id === id) setSelected(null);
      fetchMessages(true);
    } catch { toast.error('Delete failed'); }
    finally { setActing(null); }
  };

  const openMessage = async (msg) => {
    setSelected(msg);
    if (!msg.is_read) {
      try { await contactService.markRead(msg.id); fetchMessages(true); } catch (e) { void e; }
    }
  };

  const filtered = messages.filter(m =>
    m.name.toLowerCase().includes(filter.toLowerCase()) ||
    m.email.toLowerCase().includes(filter.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(filter.toLowerCase()) ||
    m.message.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Messages" value={messages.length} color="border-slate-100 dark:border-slate-700" icon={MessageSquare} />
        <StatCard label="Unread"         value={unread}          color="border-blue-100 dark:border-blue-800"   icon={Mail} />
        <StatCard label="Read"           value={messages.length - unread} color="border-green-100 dark:border-green-800" icon={Eye} />
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input type="text" placeholder="Search messages..."
            value={filter} onChange={e => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-medium focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 dark:text-white" />
        </div>
        <button onClick={() => fetchMessages(true)}
          className={`p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${refreshing ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} className="text-slate-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={36} className="animate-spin text-brand-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Message List */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No messages found</p>
              </div>
            ) : filtered.map(msg => (
              <div key={msg.id}
                onClick={() => openMessage(msg)}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md
                  ${selected?.id === msg.id ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}
                  ${!msg.is_read ? 'border-l-4 border-l-blue-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black
                      ${!msg.is_read ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {msg.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{msg.name}</span>
                        {!msg.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{msg.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); handleRead(msg); }}
                      disabled={acting === `read-${msg.id}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-blue-500"
                      title={msg.is_read ? 'Mark unread' : 'Mark read'}>
                      {msg.is_read ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(msg.id); }}
                      disabled={acting === `del-${msg.id}`}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-slate-300 hover:text-red-500"
                      title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {msg.subject && (
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-2 truncate">{msg.subject}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{msg.message}</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-2 flex items-center gap-1">
                  <Clock size={9} />
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Message Detail */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {selected ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <h3 className="font-black uppercase text-sm tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={16} className="text-brand-primary" /> Message Detail
                  </h3>
                  <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
                    <X size={16} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-lg font-black text-brand-primary">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">{selected.name}</p>
                      <p className="text-xs text-slate-400">{selected.email}</p>
                    </div>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Phone size={14} className="text-slate-400" />
                      <a href={`tel:${selected.phone}`} className="hover:text-brand-primary transition-colors">{selected.phone}</a>
                    </div>
                  )}
                  {selected.subject && (
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Subject</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selected.subject}</p>
                    </div>
                  )}
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={10} />{new Date(selected.created_at).toLocaleString()}</span>
                    <span className={`px-2 py-1 rounded-full font-black uppercase text-[9px] ${selected.is_read ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                      {selected.is_read ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Your message'}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all">
                      <Mail size={14} /> Reply via Email
                    </a>
                    <button onClick={() => handleDelete(selected.id)}
                      className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl text-xs font-black hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-800">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 p-12 text-center">
                <MessageSquare size={40} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-bold text-sm">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROJECTS PANEL (original AdminProjects logic)
───────────────────────────────────────────────────────────────────────────── */
function ProjectsPanel() {
  const [projects, setProjects]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [filter, setFilter]             = useState('');
  const [statusTab, setStatusTab]       = useState('ALL');
  const [editingProject, setEditingProject] = useState(null);
  const [actionLoading, setActionLoading]   = useState(null);
  const [nameWarning, setNameWarning]       = useState('');

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const response = await templateService.getAll();
      setProjects(response.data.content || []);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAction = async (action, id) => {
    if (action === 'delete' && !confirm('Delete this project permanently?')) return;
    setActionLoading(`${action}-${id}`);
    try {
      if (action === 'approve') await templateService.approve(id);
      if (action === 'reject')  await templateService.reject(id);
      if (action === 'delete')  await templateService.delete(id);
      invalidateAllCaches(); // Clear frontend cache so Home page shows fresh data
      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} successful`);
      fetchAll(true);
    } catch { toast.error(`Failed to ${action}`); }
    finally { setActionLoading(null); }
  };

  const openEdit = (project) => {
    const { main, sub } = parseSubCategory(project.subCategory);
    setEditingProject({ ...project, _editCat: main || project.subCategory || '', _editSub: sub || '' });
    setNameWarning('');
  };

  const handleEditNameChange = (value) => {
    setEditingProject(prev => ({ ...prev, projectName: value }));
    const trimmed = value.trim().toLowerCase();
    const dup = projects.find(p => p.projectName.trim().toLowerCase() === trimmed && p.id !== editingProject.id);
    setNameWarning(dup ? `"${dup.projectName}" already exists (ID: ${dup.id})` : '');
  };

  const handleUpdate = async e => {
    e.preventDefault();
    if (nameWarning) { toast.error('Please use a unique project name.'); return; }
    setActionLoading('update');
    const cat = (editingProject._editCat || '').trim();
    const sub = (editingProject._editSub || '').trim();
    let subCategoryValue = '';
    if (cat && sub) subCategoryValue = `${cat} > ${sub}`;
    else if (cat)   subCategoryValue = cat;
    else if (sub)   subCategoryValue = sub;
    const payload = {
      projectName: editingProject.projectName, subCategory: subCategoryValue,
      accessType: editingProject.accessType, details: editingProject.details,
      subdetails: editingProject.subdetails, guide: editingProject.guide,
      source: editingProject.source, link: editingProject.link,
      image: editingProject.image, implementation: editingProject.implementation,
    };
    try {
      await templateService.updateByUuid(editingProject.uniqueId, payload);
      invalidateAllCaches(); // Clear frontend cache
      toast.success('Project updated');
      setEditingProject(null);
      fetchAll(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setActionLoading(null); }
  };

  const filtered = projects.filter(p => {
    const matchTab    = statusTab === 'ALL' || p.approvalStatus === statusTab;
    const matchSearch = p.projectName.toLowerCase().includes(filter.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    ALL: projects.length,
    PENDING:  projects.filter(p => p.approvalStatus === 'PENDING').length,
    APPROVED: projects.filter(p => p.approvalStatus === 'APPROVED').length,
    REJECTED: projects.filter(p => p.approvalStatus === 'REJECTED').length,
  };

  const tabColor = { ALL: 'text-slate-600', PENDING: 'text-yellow-600', APPROVED: 'text-green-600', REJECTED: 'text-red-600' };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total"    value={counts.ALL}      color="border-slate-100 dark:border-slate-700" />
        <StatCard label="Pending"  value={counts.PENDING}  color="border-yellow-100 dark:border-yellow-800" />
        <StatCard label="Approved" value={counts.APPROVED} color="border-green-100 dark:border-green-800" />
        <StatCard label="Rejected" value={counts.REJECTED} color="border-red-100 dark:border-red-800" />
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input type="text" placeholder="Search projects..."
            value={filter} onChange={e => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-medium focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 dark:text-white" />
        </div>
        <button onClick={() => fetchAll(true)}
          className={`p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${refreshing ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setStatusTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap
              ${statusTab === tab ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : `bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 ${tabColor[tab]} hover:bg-slate-50 dark:hover:bg-slate-800`}`}>
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={36} className="animate-spin text-brand-primary" /></div>
      ) : (
        <div className="space-y-2">
          {/* Desktop table header - hidden on mobile */}
          <div className="hidden md:grid md:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <span>Project</span>
            <span className="w-20 text-center">Access</span>
            <span className="w-24 text-center">Status</span>
            <span className="w-28 text-right">Actions</span>
          </div>

          {filtered.map(project => {
            const isActing = actionLoading?.includes(String(project.id));
            const { main, sub } = parseSubCategory(project.subCategory);
            const cat = CATEGORIES.find(c => c.label === main);
            return (
              <div key={project.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-all">
                {/* Mobile: stacked layout / Desktop: grid */}
                <div className="md:grid md:grid-cols-[1fr_auto_auto_auto] md:items-center gap-4">
                  {/* Project info */}
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{project.projectName}</div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5 flex items-center gap-1 flex-wrap">
                      {main && <span>{cat?.icon} {main}</span>}
                      {sub && <span className="text-brand-primary/70">› {sub}</span>}
                      <span className="text-slate-300 dark:text-slate-600">#{project.id}</span>
                    </div>
                  </div>

                  {/* Access badge */}
                  <div className="hidden md:block w-20 text-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase
                      ${project.accessType === 'FREE' ? 'badge-free' : project.accessType === 'PAID' ? 'badge-paid' : 'badge-both'}`}>
                      {project.accessType}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div className="hidden md:block w-24 text-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight
                      ${project.approvalStatus === 'APPROVED' ? 'badge-approved' : project.approvalStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                      {project.approvalStatus}
                    </span>
                  </div>

                  {/* Mobile: badges + actions row */}
                  <div className="flex items-center justify-between mt-2 md:mt-0 md:w-28 md:justify-end">
                    {/* Mobile-only badges */}
                    <div className="flex items-center gap-1.5 md:hidden">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase
                        ${project.accessType === 'FREE' ? 'badge-free' : project.accessType === 'PAID' ? 'badge-paid' : 'badge-both'}`}>
                        {project.accessType}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase
                        ${project.approvalStatus === 'APPROVED' ? 'badge-approved' : project.approvalStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                        {project.approvalStatus}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      {project.approvalStatus === 'PENDING' && (
                        <>
                          <button onClick={() => handleAction('approve', project.id)} disabled={isActing}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all disabled:opacity-40" title="Approve">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleAction('reject', project.id)} disabled={isActing}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-40" title="Reject">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => openEdit(project)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleAction('delete', project.id)} disabled={isActing}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-40" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No projects found</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <Edit3 size={18} className="text-brand-primary shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-black uppercase text-sm tracking-wide text-slate-900 dark:text-white">Edit Project</h2>
                  <p className="text-[9px] font-mono text-slate-400 truncate">UUID: {editingProject.uniqueId}</p>
                </div>
              </div>
              <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 shrink-0">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-8 space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-mono text-slate-400">
                <span>ID: <strong className="text-slate-600 dark:text-slate-300">{editingProject.id}</strong></span>
                <span className="text-slate-200 dark:text-slate-700">|</span>
                <span className="truncate">UUID: <strong className="text-brand-primary">{editingProject.uniqueId}</strong></span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Project Name *</label>
                  <input required value={editingProject.projectName} onChange={e => handleEditNameChange(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 transition-all text-slate-900 dark:text-white
                      ${nameWarning ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-100 dark:border-slate-700 focus:ring-brand-primary/10 focus:border-brand-primary'}`} />
                  {nameWarning && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">⚠ {nameWarning}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Access Type</label>
                  <select value={editingProject.accessType || 'FREE'} onChange={e => setEditingProject({ ...editingProject, accessType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all font-bold text-slate-900 dark:text-white">
                    <option value="FREE">🟢 Free</option>
                    <option value="PAID">🟡 Paid</option>
                    <option value="BOTH">🔵 Both</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Tag size={10} /> Category</label>
                  <input value={editingProject._editCat || ''} onChange={e => setEditingProject({ ...editingProject, _editCat: e.target.value })}
                    placeholder="e.g. Frontend"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Layers size={10} /> Subcategory</label>
                  <input value={editingProject._editSub || ''} onChange={e => setEditingProject({ ...editingProject, _editSub: e.target.value })}
                    placeholder="e.g. React"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 dark:text-white" />
                </div>
              </div>
              {(editingProject._editCat || editingProject._editSub) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px]">
                  <span className="text-slate-400 font-black uppercase tracking-widest">Stored as:</span>
                  <span className="text-brand-primary font-bold font-mono">
                    "{editingProject._editCat && editingProject._editSub ? `${editingProject._editCat} > ${editingProject._editSub}` : editingProject._editCat || editingProject._editSub}"
                  </span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Image URL</label>
                <input value={editingProject.image || ''} onChange={e => setEditingProject({ ...editingProject, image: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 dark:text-white"
                  placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Details</label>
                <textarea rows={3} value={editingProject.details || ''} onChange={e => setEditingProject({ ...editingProject, details: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all resize-none text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Implementation Code</label>
                <textarea rows={8} value={editingProject.implementation || ''} onChange={e => setEditingProject({ ...editingProject, implementation: e.target.value })}
                  className="w-full bg-slate-900 text-slate-300 font-mono rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-brand-primary resize-none custom-scrollbar" />
              </div>
              <button type="submit" disabled={actionLoading === 'update' || !!nameWarning}
                className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-black uppercase tracking-wide flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {actionLoading === 'update'
                  ? <><Loader2 size={18} className="animate-spin" /><span>Saving...</span></>
                  : <><Save size={18} /><span>Save Changes</span></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHAT ADMIN PANEL — SSE-powered realtime chat (NO POLLING, NO RELOAD)
   Architecture: SSE push for instant updates, HTTP only for initial load + sends
───────────────────────────────────────────────────────────────────────────── */
function ChatAdminPanel() {
  const [threads, setThreads]     = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply]         = useState('');
  const [sending, setSending]     = useState(false);
  const [filter, setFilter]       = useState('');
  const [connState, setConnState] = useState('disconnected');
  const [userTyping, setUserTyping] = useState(null);
  const bottomRef                 = useRef(null);
  const sseClientRef              = useRef(null);
  const selectedRef               = useRef(null);
  const typingTimeoutRef          = useRef(null);

  // Keep selectedRef in sync so SSE callbacks can read current selected
  selectedRef.current = selected;

  // ── Initial load (ONE TIME ONLY — no polling) ──────────────────────────────
  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await chatService.getAllThreads();
      setThreads(res.data.threads || []);
      setUnread(res.data.total_unread || 0);
    } catch (err) {
      if (!err.response) toast.error('Cannot reach server');
    } finally {
      setLoading(false);
    }
  }, []);

  const openThread = useCallback(async (email) => {
    setLoadingThread(true);
    try {
      const res = await chatService.getThreadAdmin(email);
      setSelected(res.data);
      // Mark as read in local state
      setThreads(prev => {
        const thread = prev.find(t => t.email === email);
        if (thread && thread.unread > 0) {
          setUnread(u => Math.max(0, u - thread.unread));
        }
        return prev.map(t => t.email === email ? { ...t, unread: 0 } : t);
      });
    } catch (err) {
      // If 404, show empty thread (user may have just started)
      if (err.response?.status === 404) {
        setSelected({ email, name: null, messages: [] });
      } else {
        toast.error(err.response?.data?.message || 'Failed to load thread');
      }
    } finally {
      setLoadingThread(false);
    }
  }, []);

  // ── SSE REALTIME CONNECTION — replaces all polling ─────────────────────────
  useEffect(() => {
    fetchThreads();

    const adminKey = import.meta.env.VITE_ADMIN_KEY;
    const client = getChatClient({ email: 'admin', isAdmin: true, adminKey });
    sseClientRef.current = client;

    // When a new message arrives via SSE — update UI instantly, NO reload
    const unsub1 = client.on('new_message', (data) => {
      const msg = data.message;
      const email = data.email;
      if (!msg || !email) return;

      // Update thread list instantly (add message count, update last_message)
      setThreads(prev => {
        const existing = prev.find(t => t.email === email);
        if (existing) {
          return prev.map(t => t.email === email ? {
            ...t,
            last_message: msg.message?.substring(0, 120) || t.last_message,
            last_at: msg.created_at || t.last_at,
            total: t.total + 1,
            unread: msg.sender === 'user' ? t.unread + 1 : t.unread,
          } : t).sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
        } else if (msg.sender === 'user') {
          // New thread from a new user
          return [{
            email, name: msg.name || null,
            last_message: msg.message?.substring(0, 120) || '',
            last_at: msg.created_at || new Date().toISOString(),
            total: 1, unread: 1,
          }, ...prev];
        }
        return prev;
      });

      // Update unread count
      if (msg.sender === 'user') {
        setUnread(prev => prev + 1);
      }

      // If this thread is currently open, append message directly
      const currentSelected = selectedRef.current;
      if (currentSelected?.email === email) {
        setSelected(prev => {
          if (!prev) return prev;
          // Deduplicate
          if (prev.messages.some(m => m.id === msg.id)) return prev;
          // Remove optimistic messages
          const filtered = prev.messages.filter(m => !String(m.id).startsWith('pending-'));
          return { ...prev, messages: [...filtered, msg] };
        });
      }
    });

    // Typing indicator from user
    const unsub2 = client.on('typing', (data) => {
      if (data.sender === 'user') {
        setUserTyping(data.email);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setUserTyping(null), 3000);
      }
    });

    // Thread deleted
    const unsub3 = client.on('thread_deleted', (data) => {
      setThreads(prev => prev.filter(t => t.email !== data.email));
      const currentSelected = selectedRef.current;
      if (currentSelected?.email === data.email) setSelected(null);
    });

    // Connection state
    const unsub4 = client.on('stateChange', ({ to }) => setConnState(to));

    client.connect();

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4();
      clearTimeout(typingTimeoutRef.current);
      client.disconnect();
    };
  }, [fetchThreads]);

  // Auto-scroll when messages change in selected thread
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages?.length]);

  // ── SEND REPLY — optimistic UI, no reload ──────────────────────────────────
  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selected) return;

    const optimisticReply = {
      id: `pending-admin-${Date.now()}`,
      email: selected.email,
      name: null,
      sender: 'admin',
      message: reply.trim(),
      is_read: true,
      created_at: new Date().toISOString(),
    };

    // Optimistic: show message immediately (append only, no reload)
    setSelected(prev => prev ? { ...prev, messages: [...prev.messages, optimisticReply] } : prev);
    const replyText = reply.trim();
    setReply('');
    setSending(true);

    try {
      const res = await chatService.reply({ email: selected.email, message: replyText });
      // Replace optimistic message with confirmed one from server
      const confirmedMsg = res.data;
      setSelected(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(m =>
            m.id === optimisticReply.id ? confirmedMsg : m
          ),
        };
      });
      // Update thread list last_message
      setThreads(prev => prev.map(t =>
        t.email === selected.email ? {
          ...t,
          last_message: replyText.substring(0, 120),
          last_at: confirmedMsg.created_at || new Date().toISOString(),
          total: t.total + 1,
        } : t
      ));
    } catch (err) {
      const msg = err.userMessage || err.response?.data?.message || 'Failed to send reply';
      toast.error(msg);
      // Remove optimistic message on failure
      setSelected(prev => prev ? { ...prev, messages: prev.messages.filter(m => m.id !== optimisticReply.id) } : prev);
      setReply(replyText);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (email) => {
    if (!confirm(`Delete entire chat thread for ${email}?`)) return;
    try {
      await chatService.deleteThread(email);
      toast.success('Thread deleted');
      // SSE will handle removal, but also do it locally for instant feedback
      if (selected?.email === email) setSelected(null);
      setThreads(prev => prev.filter(t => t.email !== email));
    } catch { toast.error('Delete failed'); }
  };

  const filtered = threads.filter(t =>
    t.email.toLowerCase().includes(filter.toLowerCase()) ||
    (t.name || '').toLowerCase().includes(filter.toLowerCase())
  );

  const connColor = connState === 'connected' ? 'bg-green-500' : connState === 'connecting' || connState === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Threads" value={threads.length}  color="border-slate-100 dark:border-slate-700" icon={MessageSquare} />
        <StatCard label="Unread"        value={unread}          color="border-blue-100 dark:border-blue-800"   icon={Mail} />
        <StatCard label="Read"          value={threads.length - threads.filter(t => t.unread > 0).length} color="border-green-100 dark:border-green-800" icon={Eye} />
      </div>

      {/* Search + Connection Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input type="text" placeholder="Search by email or name..."
            value={filter} onChange={e => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-medium focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 dark:text-white" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl">
          <div className={`w-2 h-2 rounded-full ${connColor}`} />
          <span className="text-[10px] font-bold text-slate-400 uppercase">{connState === 'connected' ? 'Live' : connState}</span>
        </div>
        <button onClick={fetchThreads}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
          <RefreshCw size={16} className="text-slate-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={36} className="animate-spin text-brand-primary" /></div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700">
                <MessageSquare size={36} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No chat threads yet</p>
              </div>
            ) : filtered.map(t => (
              <div key={t.email}
                onClick={() => openThread(t.email)}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md
                  ${selected?.email === t.email ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}
                  ${t.unread > 0 ? 'border-l-4 border-l-blue-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black
                      ${t.unread > 0 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {t.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{t.name || t.email}</span>
                        {t.unread > 0 && <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-full">{t.unread}</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{t.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); handleDelete(t.email); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-slate-300 hover:text-red-500" title="Delete thread">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{t.last_message}</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 flex items-center gap-1">
                  <Clock size={9} />{new Date(t.last_at).toLocaleString()}
                  <span className="ml-auto">{t.total} msg{t.total !== 1 ? 's' : ''}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Thread detail + reply */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {loadingThread ? (
              <div className="flex justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700">
                <Loader2 size={28} className="animate-spin text-brand-primary" />
              </div>
            ) : selected ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col" style={{ height: '520px' }}>
                {/* Thread header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
                  <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center text-sm font-black text-brand-primary shrink-0">
                    {selected.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-slate-900 dark:text-white truncate">{selected.name || selected.email}</p>
                    <p className="text-[11px] text-slate-400 truncate">{selected.email}</p>
                  </div>
                  <a href={`mailto:${selected.email}`} className="ml-auto p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-brand-primary" title="Email user">
                    <Mail size={15} />
                  </a>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {selected.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                        ${msg.sender === 'admin'
                          ? 'bg-brand-primary text-white rounded-br-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'}`}>
                        {msg.sender === 'user' && (
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500 dark:text-slate-400">{selected.name || selected.email}</p>
                        )}
                        <p>{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${msg.sender === 'admin' ? 'text-white/60' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {userTyping === selected.email && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1 items-center">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                          ))}
                          <span className="text-[10px] text-slate-400 ml-2">typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Reply input */}
                <form onSubmit={handleReply} className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                  <input type="text" value={reply} onChange={e => {
                      setReply(e.target.value);
                      // Send typing indicator to user (throttled)
                      if (sseClientRef.current && selected) {
                        const now = Date.now();
                        if (now - (sseClientRef.current._lastAdminTyping || 0) > 2000) {
                          sseClientRef.current._lastAdminTyping = now;
                          fetch(`${API_BASE_URL}/chat/stream/typing?email=${encodeURIComponent(selected.email)}&sender=admin`, { method: 'POST' }).catch(() => {});
                        }
                      }
                    }}
                    placeholder="Type your reply..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                    disabled={sending} />
                  <button type="submit" disabled={sending || !reply.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-black text-sm flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 p-12 text-center">
                <MessageSquare size={40} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-bold text-sm">Select a thread to view and reply</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN ADMIN PAGE — tabs between Projects and Contact Messages
───────────────────────────────────────────────────────────────────────────── */
export default function AdminProjects() {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Admin Panel</h1>
              <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Manage Projects · Contact Messages</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-6 flex-wrap">
          <button onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all
              ${activeTab === 'projects' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            <BarChart2 size={16} /> Projects
          </button>
          <button onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all
              ${activeTab === 'contacts' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            <Mail size={16} /> Contact Messages
          </button>
          <button onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all
              ${activeTab === 'chats' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            <MessageSquare size={16} /> Live Chats
          </button>
        </div>
      </div>

      {/* Panel */}
      {activeTab === 'projects' && <ProjectsPanel />}
      {activeTab === 'contacts' && <ContactPanel />}
      {activeTab === 'chats'    && <ChatAdminPanel />}
    </div>
  );
}
