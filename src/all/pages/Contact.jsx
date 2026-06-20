import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { contactService, chatService } from '../api/api';
import { getChatClient, ConnectionState } from '../api/chatRealtime';
import {
  Mail, Phone, MessageSquare, Send, CheckCircle2,
  User, FileText, Loader2, MapPin, Clock, Zap,
  ArrowLeft, RefreshCw, WifiOff, Wifi, Circle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SUBJECTS = [
  'General Inquiry', 'Report a Bug', 'Feature Request',
  'Project Submission Help', 'Partnership / Collaboration', 'Other',
];

/* ── helpers ── */
function inputCls(err) {
  return `w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-3 text-sm outline-none transition-all
    text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500
    ${err
      ? 'border-red-300 dark:border-red-600 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400'
      : 'border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary'}`;
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
        <Icon size={11} />{label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 font-bold">⚠ {error}</p>}
    </div>
  );
}

function getErrMsg(err) {
  if (!err.response) return 'Cannot reach the server. Check your connection.';
  const d = err.response.data;
  if (d?.message) return d.message;
  if (d?.detail) return typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail);
  return `Server error (${err.response.status})`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHAT PANEL — Real-time SSE-powered chat (replaces broken polling)
───────────────────────────────────────────────────────────────────────────── */
function ChatPanel({ email, name, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
  const [adminTyping, setAdminTyping] = useState(false);
  const bottomRef = useRef(null);
  const sseClientRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  // Initial fetch of chat history
  const fetchThread = useCallback(async () => {
    try {
      const res = await chatService.getThread(email);
      setMessages(res.data.messages || []);
    } catch (err) {
      if (err.response?.status !== 404) {
        // silently ignore — no messages yet is fine
      }
      // 404 = no messages yet, that's fine
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Setup SSE real-time connection
  useEffect(() => {
    fetchThread();

    // Create SSE client
    const client = getChatClient({ email, isAdmin: false });
    sseClientRef.current = client;

    // Listen for new messages (real-time push)
    const unsub1 = client.on('new_message', (data) => {
      const msg = data.message;
      if (msg) {
        setMessages(prev => {
          // Deduplicate by id (already confirmed via HTTP response or already in list)
          if (prev.some(m => m.id === msg.id)) return prev;
          // Remove any remaining optimistic messages for this content
          const filtered = prev.filter(m => !String(m.id).startsWith('pending-'));
          return [...filtered, msg];
        });
      }
    });

    // Listen for typing indicators
    const unsub2 = client.on('typing', (data) => {
      if (data.sender === 'admin') {
        setAdminTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 3000);
      }
    });

    // Listen for messages read
    const unsub3 = client.on('messages_read', () => {
      setMessages(prev => prev.map(m => 
        m.sender === 'user' ? { ...m, is_read: true } : m
      ));
    });

    // Connection state changes
    const unsub4 = client.on('stateChange', ({ to }) => {
      setConnectionState(to);
    });

    // Connect
    client.connect();

    return () => {
      unsub1(); unsub2(); unsub3(); unsub4();
      clearTimeout(typingTimeoutRef.current);
      client.disconnect();
    };
  }, [email, fetchThread]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, adminTyping]);

  // Send typing indicator (throttled)
  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000 && sseClientRef.current) {
      sseClientRef.current.sendTyping();
      lastTypingSentRef.current = now;
    }
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const optimisticMessage = {
      id: `pending-${Date.now()}`,
      email, name, sender: 'user',
      message: text.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const msgText = text.trim();
    setText('');
    setSending(true);

    try {
      const res = await chatService.sendMessage({ email, name: name || undefined, message: msgText });
      // Replace optimistic message with confirmed one from server
      const confirmedMsg = res.data;
      setMessages(prev => prev.map(m =>
        m.id === optimisticMessage.id ? confirmedMsg : m
      ));
    } catch (err) {
      toast.error(getErrMsg(err));
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setText(msgText); // Restore text on failure
    } finally {
      setSending(false);
    }
  };

  // Connection status indicator
  const statusColor = useMemo(() => {
    switch (connectionState) {
      case ConnectionState.CONNECTED: return 'text-green-500';
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING: return 'text-yellow-500';
      case ConnectionState.OFFLINE: return 'text-red-500';
      default: return 'text-slate-400';
    }
  }, [connectionState]);

  const statusText = useMemo(() => {
    switch (connectionState) {
      case ConnectionState.CONNECTED: return 'Live';
      case ConnectionState.CONNECTING: return 'Connecting...';
      case ConnectionState.RECONNECTING: return 'Reconnecting...';
      case ConnectionState.OFFLINE: return 'Offline';
      default: return 'Disconnected';
    }
  }, [connectionState]);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden" style={{ height: '560px' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
          <ArrowLeft size={16} />
        </button>
        <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-sm font-black text-brand-primary shrink-0">
          {email.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-sm text-slate-900 dark:text-white truncate">{name || email}</p>
          <div className="flex items-center gap-1.5">
            <Circle size={6} className={`fill-current ${statusColor}`} />
            <span className={`text-[10px] font-bold ${statusColor}`}>{statusText}</span>
          </div>
        </div>
        <button onClick={fetchThread} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400" title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-brand-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <MessageSquare size={36} className="text-slate-200 dark:text-slate-700 mx-auto" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">No messages yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs">Send your first message below!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                ${msg.sender === 'user'
                  ? 'bg-brand-primary text-white rounded-br-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'}`}>
                {msg.sender === 'admin' && (
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Support</p>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <p className={`text-[10px] ${msg.sender === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.sender === 'user' && msg.is_read && (
                    <CheckCircle2 size={10} className="text-white/60" />
                  )}
                  {msg.sender === 'user' && String(msg.id).startsWith('pending-') && (
                    <Clock size={10} className="text-white/40" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {adminTyping && (
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

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 flex gap-2 shrink-0">
        <input
          type="text"
          value={text}
          onChange={e => { setText(e.target.value); handleTyping(); }}
          placeholder="Type your message..."
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
          disabled={sending}
          maxLength={2000}
        />
        <button type="submit" disabled={sending || !text.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-black text-sm flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMAIL ENTRY — user types their email to start or resume a chat
───────────────────────────────────────────────────────────────────────────── */
function ChatEntry({ onStart }) {
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [err, setErr]     = useState('');

  const handleStart = e => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setErr('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setErr('Enter a valid email address.'); return; }
    setErr('');
    onStart(trimmed.toLowerCase(), name.trim());
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare size={18} className="text-brand-primary" />
          Live Chat
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Enter your email to start or continue a chat. Your conversation is saved and linked to your email.
        </p>
      </div>
      <form onSubmit={handleStart} className="p-8 space-y-5">
        <Field label="Your Name (optional)" icon={User} error="">
          <input type="text" placeholder="John Doe" value={name}
            onChange={e => setName(e.target.value)}
            className={inputCls('')} maxLength={255} />
        </Field>
        <Field label="Email Address *" icon={Mail} error={err}>
          <input type="email" placeholder="you@gmail.com" value={email}
            onChange={e => { setEmail(e.target.value); setErr(''); }}
            className={inputCls(err)} maxLength={255} autoFocus />
        </Field>
        <button type="submit"
          className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-black uppercase tracking-wide flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-primary/25 transition-all text-sm">
          <MessageSquare size={18} />
          Start Chat
        </button>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Use the same email to resume your previous conversation anytime.
        </p>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONTACT FORM — one-off message (name, email, phone, subject, message)
───────────────────────────────────────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm]     = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required.';
    if (!form.email.trim())   e.email   = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.message.trim()) e.message = 'Message is required.';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await contactService.submit({
        name:    form.name.trim(),
        email:   form.email.trim().toLowerCase(),
        phone:   form.phone.trim() || null,
        subject: form.subject || null,
        message: form.message.trim(),
      });
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      toast.error(getErrMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-10 text-center space-y-5">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Message Sent!</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            We'll reply to <strong className="text-brand-primary">{form.email}</strong> within 24 hours.
          </p>
        </div>
        <button
          onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
          className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-black text-sm hover:shadow-lg transition-all">
          Send Another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Mail size={18} className="text-brand-primary" />
          Send a Message
        </h2>
        <p className="text-slate-400 text-xs mt-1">Fields marked * are required.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Your Name *" icon={User} error={errors.name}>
            <input type="text" placeholder="John Doe" value={form.name}
              onChange={e => set('name', e.target.value)} className={inputCls(errors.name)} maxLength={255} />
          </Field>
          <Field label="Email Address *" icon={Mail} error={errors.email}>
            <input type="email" placeholder="you@gmail.com" value={form.email}
              onChange={e => set('email', e.target.value)} className={inputCls(errors.email)} maxLength={255} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Phone Number" icon={Phone} error="">
            <input type="tel" placeholder="Your phone number" value={form.phone}
              onChange={e => set('phone', e.target.value)} className={inputCls('')} maxLength={30} />
          </Field>
          <Field label="Subject" icon={FileText} error="">
            <select value={form.subject} onChange={e => set('subject', e.target.value)} className={inputCls('')}>
              <option value="">Select a subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Message *" icon={MessageSquare} error={errors.message}>
          <textarea rows={5} placeholder="Write your message here..." value={form.message}
            onChange={e => set('message', e.target.value)}
            className={`${inputCls(errors.message)} resize-none`} />
          <p className="text-[10px] text-slate-400 text-right mt-1">{form.message.length} chars</p>
        </Field>
        <button type="submit" disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-black uppercase tracking-wide flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60 text-sm">
          {loading
            ? <><Loader2 size={18} className="animate-spin" /><span>Sending...</span></>
            : <><Send size={18} /><span>Send Message</span></>}
        </button>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          By submitting, you agree to our{' '}
          <a href="/terms" className="text-brand-primary hover:underline font-bold">Terms</a>.
        </p>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN CONTACT PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function Contact() {
  const [tab, setTab]           = useState('message');
  const [chatEmail, setChatEmail] = useState('');
  const [chatName, setChatName]   = useState('');
  const [inChat, setInChat]       = useState(false);

  const startChat = (email, name) => {
    setChatEmail(email);
    setChatName(name);
    setInChat(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 md:p-12 text-white overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-3">
          <div className="flex items-center gap-2 text-brand-secondary text-xs font-black uppercase tracking-widest">
            <Mail size={14} /><span>Get In Touch</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Contact <span className="text-brand-secondary">Us</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
            Send us a message or start a live chat using your email.
            Your chat history is saved and linked to your email address.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Contact Info</h3>
            {[
              { icon: Mail,   bg: 'bg-brand-primary/10',                        ic: 'text-brand-primary',  label: 'Email',         val: 'support@foryou.dev',  href: 'mailto:support@foryou.dev' },
              { icon: Clock,  bg: 'bg-amber-100 dark:bg-amber-900/30',          ic: 'text-amber-600',      label: 'Response Time', val: 'Within 24 hours',     href: null },
              { icon: MapPin, bg: 'bg-purple-100 dark:bg-purple-900/30',        ic: 'text-purple-600',     label: 'Location',      val: 'India 🇮🇳',            href: null },
            ].map(({ icon: Icon, bg, ic, label, val, href }) => (
              <div key={label} className="flex items-start gap-4">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={ic} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                  {href
                    ? <a href={href} className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-brand-primary transition-colors">{val}</a>
                    : <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{val}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab switcher — hidden when in chat */}
          {!inChat && (
            <div className="flex gap-2">
              <button onClick={() => setTab('message')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all
                  ${tab === 'message'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <Mail size={15} /> Send Message
              </button>
              <button onClick={() => setTab('chat')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all
                  ${tab === 'chat'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <MessageSquare size={15} /> Live Chat
              </button>
            </div>
          )}

          {/* Panel content */}
          {!inChat && tab === 'message' && <ContactForm />}
          {!inChat && tab === 'chat'    && <ChatEntry onStart={startChat} />}
          {inChat && (
            <ChatPanel
              email={chatEmail}
              name={chatName}
              onBack={() => { setInChat(false); setTab('chat'); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
