/**
 * AiChat.jsx — Premium AI Chat
 * Providers: GPT-OSS (key1), Llama 4 (key2), Qwen Reasoning (key3)
 * Features: image attach, voice input/output, code highlight, dark mode
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, Trash2, Loader2, User, Sparkles, Copy, Check,
  ChevronDown, Zap, Code2, Cpu, Mic, MicOff, Volume2,
  Square, Settings2, X, Paperclip, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const LS_KEY   = 'foryou_ai_chat_v3';

const PROVIDERS = [
  {
    id: 'groq1', label: 'GPT-OSS', short: 'GPT-OSS',
    key: () => import.meta.env.VITE_GROQ_API_KEY,
    grad: 'from-indigo-500 to-violet-600', dot: 'bg-indigo-400',
    models: [
      { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', tag: '120B', desc: '500 t/s · powerful' },
      { id: 'openai/gpt-oss-20b',  label: 'GPT-OSS 20B',  tag: '20B',  desc: '1000 t/s · fastest' },
    ],
  },
  {
    id: 'groq2', label: 'Llama', short: 'Llama',
    key: () => import.meta.env.VITE_GROQ_API_KEY,
    grad: 'from-violet-600 to-fuchsia-600', dot: 'bg-violet-400',
    models: [
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout', tag: 'Scout', desc: '750 t/s · vision' },
      { id: 'llama-3.3-70b-versatile',                   label: 'Llama 3.3 70B', tag: '70B',   desc: '280 t/s · smart'  },
    ],
  },
];

const VOICE_LANGS = [
  { code: 'en-US', label: 'English',    flag: '🇺🇸' },
  { code: 'te-IN', label: 'Telugu',     flag: '🇮🇳' },
  { code: 'hi-IN', label: 'Hindi',      flag: '🇮🇳' },
  { code: 'en-GB', label: 'English UK', flag: '🇬🇧' },
];

const SUGGESTIONS = [
  { icon: '🚀', text: 'How do I deploy a FastAPI backend?' },
  { icon: '🐍', text: 'Write a Python script to connect to MySQL' },
  { icon: '📡', text: 'Explain REST API best practices' },
  { icon: '⚛️', text: 'How to use React hooks effectively?' },
  { icon: '🐳', text: 'What is Docker and how do I use it?' },
  { icon: '🗄️', text: 'Help me design a database schema' },
];

const SYSTEM_PROMPT = `You are a helpful AI assistant on the ForYou platform.
Rules:
1. Only provide code when explicitly asked.
2. For general questions answer in plain text.
3. When code IS requested use fenced code blocks with language tag.
4. Be concise and practical.`;

const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let _id = 0;
const uid = () => ++_id;

function stripMd(text) {
  return text.replace(/```[\s\S]*?```/g,' code block ').replace(/`[^`]+`/g,'')
    .replace(/[#*_~>]/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
    .replace(/[-|+=#~(){}[\]\\/<>@^%$&]/g,' ').replace(/\s+/g,' ').trim();
}

function parseParts(text) {
  const parts=[], re=/```(\w+)?\n?([\s\S]*?)```/g; let last=0, m;
  while((m=re.exec(text))!==null){
    if(m.index>last) parts.push({type:'text',content:text.slice(last,m.index)});
    parts.push({type:'code',lang:m[1]||'text',content:m[2].trim()});
    last=m.index+m[0].length;
  }
  if(last<text.length) parts.push({type:'text',content:text.slice(last)});
  return parts;
}

function VoiceWave() {
  return (
    <div className="flex items-end gap-[3px] h-5">
      {[3,5,8,11,8,5,3,5,8].map((h,i)=>(
        <div key={i} className="w-[3px] bg-red-400 rounded-full voice-bar"
          style={{height:`${h}px`,animationDelay:`${i*0.07}s`}}/>
      ))}
    </div>
  );
}

function CodeBlock({lang,content}){
  const [copied,setCopied]=useState(false);
  return(
    <div className="rounded-2xl overflow-hidden border border-slate-700/50 my-3 shadow-lg">
      <div className="bg-slate-800/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"/>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"/>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"/>
          </div>
          <Code2 size={11} className="text-slate-500"/>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{lang}</span>
        </div>
        <button onClick={async ()=>{
          try {
            // Try modern Clipboard API first
            if (navigator.clipboard?.writeText) {
              await navigator.clipboard.writeText(content);
              setCopied(true);
              setTimeout(()=>setCopied(false),2000);
            } else {
              // Fallback for older browsers or non-secure contexts
              const textarea = document.createElement('textarea');
              textarea.value = content;
              textarea.style.position = 'fixed';
              textarea.style.left = '-999999px';
              document.body.appendChild(textarea);
              textarea.select();
              const success = document.execCommand('copy');
              document.body.removeChild(textarea);
              if (success) {
                setCopied(true);
                setTimeout(()=>setCopied(false),2000);
              } else {
                toast.error('Failed to copy. Try manually selecting the text.');
              }
            }
          } catch {
            toast.error('Failed to copy. Make sure site is using HTTPS or localhost.');
          }
        }}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition-all">
          {copied?<Check size={11} className="text-green-400"/>:<Copy size={11}/>}
          <span>{copied?'Copied!':'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter language={lang} style={vscDarkPlus}
        customStyle={{margin:0,padding:'1.25rem',fontSize:'0.8rem',background:'#0a0f1e',lineHeight:'1.7'}}
        showLineNumbers lineNumberStyle={{color:'#2d3748',fontSize:'0.7rem',minWidth:'2.5rem'}}>
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

function MessageBubble({msg,onSpeak,speakingId}){
  const isUser=msg.role==='user';
  const isSpeaking=speakingId===msg.id;
  const parts=isUser?null:parseParts(msg.content);
  return(
    <div className={`flex gap-3 msg-enter ${isUser?'flex-row-reverse':'flex-row'}`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-lg
        ${isUser?`bg-gradient-to-br ${msg.grad||'from-indigo-500 to-violet-600'} text-white`
        :'bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 text-sky-400'}`}>
        {isUser?<User size={15}/>:<Bot size={15}/>}
      </div>
      <div className={`max-w-[82%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed group relative
        ${isUser?`bg-gradient-to-br ${msg.grad||'from-indigo-500 to-violet-600'} text-white rounded-tr-sm shadow-xl`
        :'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-sm shadow-lg backdrop-blur-sm'}`}>
        {msg.image&&<img src={msg.image} alt="attached" className="rounded-xl mb-2 max-h-48 object-cover w-full"/>}
        {isUser?(
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        ):(
          <div className="space-y-1">
            {parts.map((p,i)=>p.type==='code'
              ?<CodeBlock key={i} lang={p.lang} content={p.content}/>
              :<p key={i} className="whitespace-pre-wrap break-words leading-relaxed text-slate-200">{p.content}</p>
            )}
          </div>
        )}
        <div className={`flex items-center gap-2 mt-2.5 ${isUser?'justify-end':'justify-between'}`}>
          {!isUser&&(
            <div className="flex items-center gap-2">
              {msg.modelLabel&&<span className="text-[9px] font-mono text-slate-600 bg-slate-700/60 px-2 py-0.5 rounded-full border border-slate-700/50">{msg.modelLabel}</span>}
              <button onClick={()=>onSpeak(msg)} title={isSpeaking?'Stop':'Read aloud'}
                className={`p-1.5 rounded-lg transition-all ${isSpeaking?'text-sky-400 bg-sky-400/20 border border-sky-400/30':'text-slate-600 hover:text-sky-400 hover:bg-slate-700/80 opacity-0 group-hover:opacity-100'}`}>
                {isSpeaking?<Square size={10}/>:<Volume2 size={10}/>}
              </button>
            </div>
          )}
          <span className={`text-[9px] font-mono ${isUser?'text-white/40':'text-slate-600'}`}>{msg.time}</span>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator(){
  return(
    <div className="flex gap-3 msg-enter">
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center shrink-0">
        <Bot size={15} className="text-sky-400"/>
      </div>
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg">
        <div className="flex gap-1.5 items-center h-4">
          {[0,1,2].map(i=>(
            <div key={i} className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.18}s`}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AiChat(){
  const [messages,setMessages]=useState(()=>{try{return JSON.parse(localStorage.getItem(LS_KEY))||[];}catch{return [];}});
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const [providerId,setProviderId]=useState('groq1');
  const [modelId,setModelId]=useState(PROVIDERS[0].models[0].id);
  const [showPicker,setShowPicker]=useState(false);
  const [showVoicePanel,setShowVoicePanel]=useState(false);
  const [attachedImage,setAttachedImage]=useState(null); // base64 or url
  const [attachPreview,setAttachPreview]=useState(null);

  // Voice
  const [isListening,setIsListening]=useState(false);
  const [transcript,setTranscript]=useState('');
  const [voiceLang,setVoiceLang]=useState('en-US');
  const recognitionRef=useRef(null);

  // TTS
  const [ttsEnabled,setTtsEnabled]=useState(false);
  const [speakingId,setSpeakingId]=useState(null);
  const [ttsRate, _setTtsRate]=useState(1.0);
  const [ttsPitch, _setTtsPitch]=useState(1.0);
  const [ttsLang, _setTtsLang]=useState('en-US');

  const bottomRef=useRef(null);
  const textareaRef=useRef(null);
  const fileInputRef=useRef(null);

  const provider=PROVIDERS.find(p=>p.id===providerId)||PROVIDERS[0];
  const model=provider.models.find(m=>m.id===modelId)||provider.models[0];
  const voiceLangObj=VOICE_LANGS.find(l=>l.code===voiceLang);

  useEffect(()=>{try{localStorage.setItem(LS_KEY,JSON.stringify(messages));}catch(e){void e;}},[messages]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages,loading]);
  useEffect(()=>{
    const h=e=>{if(!e.target.closest('[data-dropdown]')){setShowPicker(false);setShowVoicePanel(false);}};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);
  useEffect(()=>()=>{recognitionRef.current?.stop();window.speechSynthesis?.cancel();},[]);

  const switchProvider=pid=>{
    const p=PROVIDERS.find(x=>x.id===pid);
    if(!p)return;
    setProviderId(pid);
    setModelId(p.models[0].id);
    setShowPicker(false);
  };

  // Image attach handler
  const handleImageAttach=e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(!file.type.startsWith('image/')){toast.error('Only image files supported');return;}
    if(file.size>4*1024*1024){toast.error('Image must be under 4MB');return;}
    const reader=new FileReader();
    reader.onload=ev=>{
      setAttachedImage(ev.target.result);
      setAttachPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value='';
  };

  const removeAttach=()=>{setAttachedImage(null);setAttachPreview(null);};

  const toggleListening=useCallback(()=>{
    if(!SpeechAPI){toast.error('Speech not supported. Use Chrome/Edge.');return;}
    if(isListening){recognitionRef.current?.stop();return;}
    const rec=new SpeechAPI();
    rec.continuous=true;rec.interimResults=true;rec.lang=voiceLang;
    recognitionRef.current=rec;
    rec.onstart=()=>setIsListening(true);
    rec.onend=()=>{setIsListening(false);setTranscript('');};
    rec.onerror=e=>{setIsListening(false);setTranscript('');if(e.error!=='aborted')toast.error(`Mic: ${e.error}`);};
    rec.onresult=e=>{
      let interim='',final='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const t=e.results[i][0].transcript;
        e.results[i].isFinal?(final+=t):(interim+=t);
      }
      if(final){setInput(prev=>(prev+' '+final).trim());setTranscript('');}
      else setTranscript(interim);
    };
    rec.start();
    toast.success(`Listening in ${voiceLangObj?.label}`,{icon:'🎤'});
  },[isListening,voiceLang,voiceLangObj]);

  const stopListening=useCallback(()=>{recognitionRef.current?.stop();setIsListening(false);setTranscript('');},[]);

  const speakMsg=useCallback((msg)=>{
    if(!window.speechSynthesis){toast.error('TTS not supported.');return;}
    if(speakingId===msg.id){window.speechSynthesis.cancel();setSpeakingId(null);return;}
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(stripMd(msg.content));
    utt.rate=ttsRate;utt.pitch=ttsPitch;utt.lang=ttsLang;
    const voices=window.speechSynthesis.getVoices();
    const femaleKw=['female','woman','zira','hazel','samantha','karen','victoria','aria','jenny','sonia'];
    const isFemale=v=>femaleKw.some(k=>v.name.toLowerCase().includes(k));
    const lv=voices.filter(v=>v.lang===ttsLang);
    const pick=lv.find(isFemale)||lv[0]||voices.find(v=>v.lang.startsWith('en'));
    if(pick)utt.voice=pick;
    utt.onstart=()=>setSpeakingId(msg.id);
    utt.onend=()=>setSpeakingId(null);
    utt.onerror=()=>setSpeakingId(null);
    window.speechSynthesis.speak(utt);
  },[speakingId,ttsRate,ttsPitch,ttsLang]);

  const stopSpeaking=()=>{window.speechSynthesis?.cancel();setSpeakingId(null);};

  // Try providers in order when token limit hit
  const sendWithFallback=async(history,modelToUse,providerToUse,attempt=0)=>{
    const key=providerToUse.key();
    if(!key)throw new Error(`No API key for ${providerToUse.label}`);
    const isDeepSeek=modelToUse.id.includes('deepseek');
    const isQwen=modelToUse.id.includes('qwen');
    const body={
      model:modelToUse.id,
      messages:[{role:'system',content:SYSTEM_PROMPT},...history.map(m=>({role:m.role,content:m.content}))],
      temperature:(isDeepSeek||isQwen)?0.6:0.7,
      max_tokens:(isDeepSeek||isQwen)?4096:2048,
      ...(isQwen?{top_p:0.95}:{}),
    };
    const res=await fetch(GROQ_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
      body:JSON.stringify(body),
    });
    if(!res.ok){
      const err=await res.json().catch(()=>({}));
      const msg=err.error?.message||`HTTP ${res.status}`;
      // Token limit — try next provider
      if((res.status===429||msg.toLowerCase().includes('token'))&&attempt<PROVIDERS.length-1){
        const nextProv=PROVIDERS[(PROVIDERS.findIndex(p=>p.id===providerToUse.id)+1)%PROVIDERS.length];
        toast(`Switching to ${nextProv.label}…`,{icon:'🔄'});
        return sendWithFallback(history,nextProv.models[0],nextProv,attempt+1);
      }
      throw new Error(msg);
    }
    const data=await res.json();
    return data.choices?.[0]?.message?.content||'No response.';
  };

  const sendMessage=async(text)=>{
    const userText=(text??input).trim();
    if(!userText&&!attachedImage||loading)return;
    if(isListening)stopListening();
    const userMsg={
      id:uid(),role:'user',
      content:userText||(attachedImage?'[Image attached]':''),
      image:attachedImage||null,
      time:nowTime(),grad:provider.grad,
    };
    const history=[...messages,userMsg];
    setMessages(history);
    setInput('');
    setAttachedImage(null);setAttachPreview(null);
    if(textareaRef.current)textareaRef.current.style.height='auto';
    setLoading(true);
    try{
      const reply=await sendWithFallback(history,model,provider);
      const aiMsg={id:uid(),role:'assistant',content:reply,time:nowTime(),modelLabel:model.label};
      setMessages(prev=>[...prev,aiMsg]);
      if(ttsEnabled)setTimeout(()=>speakMsg(aiMsg),300);
    }catch(err){
      toast.error(err.message||'Request failed');
      setMessages(prev=>[...prev,{id:uid(),role:'assistant',content:`⚠️ **Error:** ${err.message}\n\nTry a different model.`,time:nowTime()}]);
    }finally{
      setLoading(false);
      setTimeout(()=>textareaRef.current?.focus(),80);
    }
  };

  const handleKey=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}};
  const clearChat=()=>{stopSpeaking();setMessages([]);localStorage.removeItem(LS_KEY);toast.success('Chat cleared');};

  return(
    <div className="max-w-4xl mx-auto flex flex-col gap-3" style={{height:'calc(100vh - 8rem)'}}>

      {/* HEADER */}
      <div className={`bg-gradient-to-r ${provider.grad} rounded-2xl px-5 py-4 flex items-center justify-between relative shrink-0 shadow-2xl`}>
        <div className="absolute inset-0 bg-black/25 rounded-2xl pointer-events-none"/>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"/>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/25 shadow-lg">
            <Sparkles size={18} className="text-white"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">AI Assistant</h1>
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 text-white/80 px-2 py-0.5 rounded-full border border-white/20">{model.tag}</span>
            </div>
            <p className="text-white/55 text-[10px] font-bold uppercase tracking-widest">{provider.label} · {model.label}</p>
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          {messages.length>0&&(
            <button onClick={clearChat} className="p-2 bg-white/15 hover:bg-red-500/30 border border-white/20 rounded-xl text-white/70 hover:text-red-300 transition-all backdrop-blur-sm" title="Clear chat">
              <Trash2 size={14}/>
            </button>
          )}
        </div>
      </div>

      {/* PROVIDER TABS */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {PROVIDERS.map(p=>(
          <button key={p.id} onClick={()=>switchProvider(p.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all
              ${providerId===p.id?`bg-gradient-to-r ${p.grad} text-white shadow-lg`:'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <Zap size={11}/>{p.short}
          </button>
        ))}
        <div className="flex-1"/>
        {/* Voice settings */}
        <div className="relative" data-dropdown>
          <button onClick={()=>{setShowVoicePanel(o=>!o);setShowPicker(false);}}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all
              ${ttsEnabled?'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400':'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <Settings2 size={13}/><span className="hidden sm:inline">Voice</span>
            <ChevronDown size={11} className={`transition-transform duration-200 ${showVoicePanel?'rotate-180':''}`}/>
          </button>
          {showVoicePanel&&(
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-5 space-y-4" style={{width:'300px'}}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Voice Settings</p>
                <button onClick={()=>setShowVoicePanel(false)} className="text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={14}/></button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Auto-read replies</div>
                  <div className="text-[10px] text-slate-400">AI speaks responses aloud</div>
                </div>
                <button onClick={()=>setTtsEnabled(o=>!o)}
                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${ttsEnabled?'bg-emerald-500':'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all duration-200 ${ttsEnabled?'left-6':'left-0.5'}`}/>
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Mic size={10}/> Speak Language</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {VOICE_LANGS.map(l=>(
                    <button key={l.code} onClick={()=>setVoiceLang(l.code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border
                        ${voiceLang===l.code?'bg-indigo-600 text-white border-indigo-600':'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                      <span>{l.flag}</span><span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {speakingId&&(
                <button onClick={stopSpeaking} className="w-full py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-red-100 transition-all">
                  <Square size={12}/> Stop Speaking
                </button>
              )}
            </div>
          )}
        </div>
        {/* Mic */}
        <button onClick={isListening?stopListening:toggleListening} disabled={!SpeechAPI}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all
            ${isListening?'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse':'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'}`}>
          {isListening?<MicOff size={13}/>:<Mic size={13}/>}
          <span className="hidden sm:inline">{isListening?'Stop':voiceLangObj?.flag}</span>
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 bg-[#060d1f] rounded-2xl p-4 relative z-0">
        {messages.length===0&&(
          <div className="h-full flex flex-col items-center justify-center gap-6 py-8">
            <div className={`w-16 h-16 bg-gradient-to-br ${provider.grad} rounded-2xl flex items-center justify-center shadow-2xl`}>
              <Sparkles size={28} className="text-white"/>
            </div>
            <div className="text-center">
              <h2 className="text-white font-black text-lg">Ask me anything</h2>
              <p className="text-slate-500 text-xs mt-1">Using {provider.label} · {model.label}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s=>(
                <button key={s.text} onClick={()=>sendMessage(s.text)}
                  className="flex items-center gap-2.5 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all group">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors leading-snug">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg=><MessageBubble key={msg.id} msg={msg} onSpeak={speakMsg} speakingId={speakingId}/>)}
        {loading&&<TypingIndicator/>}
        {transcript&&(
          <div className="flex justify-end">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <VoiceWave/>
              <span className="text-slate-400 text-xs italic">{transcript}</span>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* INPUT */}
      <div className="shrink-0 bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl overflow-visible shadow-2xl relative z-10">
        {/* Image preview */}
        {attachPreview&&(
          <div className="px-4 pt-3 flex items-center gap-3">
            <div className="relative">
              <img src={attachPreview} alt="attach" className="h-16 w-16 object-cover rounded-xl border border-slate-700"/>
              <button onClick={removeAttach} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                <X size={10}/>
              </button>
            </div>
            <span className="text-xs text-slate-400 font-bold">Image attached</span>
          </div>
        )}
        <div className="flex items-end gap-2 p-3">
          {/* Attach image */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageAttach}/>
          <button onClick={()=>fileInputRef.current?.click()}
            className={`p-2.5 rounded-xl border transition-all shrink-0 ${attachedImage?'bg-brand-primary/20 border-brand-primary/40 text-brand-primary':'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}
            title="Attach image">
            <Paperclip size={16}/>
          </button>

          {/* Model picker — opens upward, never clipped */}
          <div className="relative shrink-0" data-dropdown>
            <button onClick={()=>{setShowPicker(o=>!o);setShowVoicePanel(false);}}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all text-xs font-bold"
              title="Select model">
              <Cpu size={14}/>
              <span className="hidden sm:inline max-w-[80px] truncate">{model.label}</span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${showPicker?'rotate-180':''}`}/>
            </button>
            {showPicker&&(
              <div className="absolute left-0 bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[200] w-72 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Select Provider & Model</p>
                </div>
                {PROVIDERS.map(prov=>(
                  <div key={prov.id} className="border-b border-slate-800/60 last:border-0">
                    <div className="px-4 py-2 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${prov.dot}`}/>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{prov.label}</span>
                    </div>
                    {prov.models.map(m=>(
                      <button key={m.id}
                        onClick={()=>{setProviderId(prov.id);setModelId(m.id);setShowPicker(false);}}
                        className={`w-full flex items-center justify-between px-5 py-2.5 text-xs font-bold transition-all
                          ${modelId===m.id&&providerId===prov.id?'text-sky-400 bg-slate-800':'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                        <div>
                          <div>{m.label}</div>
                          <div className="text-[9px] text-slate-600 font-normal">{m.desc}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase
                          ${modelId===m.id&&providerId===prov.id?'bg-sky-400/20 text-sky-400 border border-sky-400/30':'bg-slate-700/80 text-slate-500'}`}>
                          {m.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <textarea ref={textareaRef} value={input} onChange={e=>{setInput(e.target.value);const el=e.target;el.style.height='auto';el.style.height=Math.min(el.scrollHeight,140)+'px';}}
            onKeyDown={handleKey} placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
            rows={1} className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-600 text-sm resize-none outline-none py-2 px-1 custom-scrollbar leading-relaxed"/>
          <button onClick={()=>sendMessage()} disabled={loading||(!input.trim()&&!attachedImage)}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${loading||(!input.trim()&&!attachedImage)?'bg-slate-800 text-slate-600 cursor-not-allowed':`bg-gradient-to-br ${provider.grad} text-white shadow-lg hover:scale-105 active:scale-95`}`}>
            {loading?<Loader2 size={16} className="animate-spin"/>:<Send size={16}/>}
          </button>
        </div>
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-600 font-mono">{provider.label} · {model.label}</span>
          <span className="text-[10px] text-slate-700">Token limit → auto-switches provider</span>
        </div>
      </div>
    </div>
  );
}
