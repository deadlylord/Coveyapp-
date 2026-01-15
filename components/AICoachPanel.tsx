
import React, { useState, useRef, useEffect } from 'react';
import { AppState, CoachMode, Task, Project, Quadrant, ChatMessage } from '../types';
import { getCoachResponse } from '../geminiService';

interface AICoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  updateMode: (mode: CoachMode) => void;
  onAddTask: (task: Task) => void;
  onAddProject: (project: Project) => void;
  onAddMessage: (msg: ChatMessage) => void;
  onClearMessages: () => void;
}

const COACH_MODES: { id: CoachMode; label: string; icon: string; desc: string; colorClass: string; glowClass: string }[] = [
  { id: 'STRATEGIST', label: 'Estratega Maestro', icon: '💠', desc: 'Sincronización Q2', colorClass: 'text-cyan-400', glowClass: 'neon-border-blue' },
  { id: 'BUSINESS_OWNER', label: 'Empresario / Negocios', icon: '💼', desc: 'ROI & Escalabilidad', colorClass: 'text-amber-400', glowClass: 'neon-border-orange' },
  { id: 'ZEN_ENERGY', label: 'Bio-Hacker Vital', icon: '🌿', desc: 'Energía & Foco', colorClass: 'text-emerald-400', glowClass: 'neon-border-green' },
  { id: 'SOCRATIC', label: 'Oráculo de Claridad', icon: '⚖️', desc: 'Eliminar el Ruido', colorClass: 'text-purple-400', glowClass: 'neon-border-purple' }
];

const AICoachPanel: React.FC<AICoachPanelProps> = ({ 
  isOpen, 
  onClose, 
  state, 
  updateMode, 
  onAddTask, 
  onAddProject,
  onAddMessage,
  onClearMessages 
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [copyStatus, setCopyStatus] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeMode = COACH_MODES.find(m => m.id === state.coachMode) || COACH_MODES[0];
  const messages = state.coachMessages || [];

  useEffect(() => {
    if (messages.length === 0 && isOpen) {
        onAddMessage({ 
          role: 'coach', 
          text: `Core Assist Online. Sistema en modo **${activeMode.label}**. ¿En qué área de tu negocio o vida nos enfocamos hoy?`,
          timestamp: Date.now()
        });
    }
  }, [state.coachMode, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, pendingAction]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(index);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm("¿Confirmas la purga del historial de esta conversación?")) {
      onClearMessages();
    }
  };

  const executeAction = () => {
    if (!pendingAction) return;
    
    if (pendingAction.type === 'tarea') {
      const args = pendingAction.args;
      const newTask: Task = {
        id: 'ai_task_' + Date.now() + Math.random(),
        title: args.title,
        roleId: args.roleId || '1',
        quadrant: (args.quadrant as Quadrant) || 'II',
        day: args.day !== undefined ? args.day : null,
        time: args.time || undefined,
        weekOffset: 0,
        completed: false,
        isBigRock: args.quadrant === 'II',
        updatedAt: Date.now()
      };
      onAddTask(newTask);
    } else if (pendingAction.type === 'proyecto') {
      const args = pendingAction.args;
      const newProj: Project = {
        id: 'ai_proj_' + Date.now(),
        title: args.title,
        description: args.description,
        roleId: args.roleId || '2',
        targetSessions: 10,
        completedSessions: 0,
        steps: [],
        updatedAt: Date.now()
      };
      onAddProject(newProj);
    }

    onAddMessage({ role: 'coach', text: `¡Acción ejecutada! He creado el ${pendingAction.type} en tu sistema. ⚡`, timestamp: Date.now() });
    setPendingAction(null);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    onAddMessage({ role: 'user', text: userMsg, timestamp: Date.now() });
    setLoading(true);

    try {
      const response = await getCoachResponse(userMsg, state);
      
      if (response.functionCalls) {
        const call = response.functionCalls[0];
        if (call.name === 'crear_tarea') {
          setPendingAction({ type: 'tarea', args: call.args });
        } else if (call.name === 'crear_proyecto') {
          setPendingAction({ type: 'proyecto', args: call.args });
        }
      }

      const coachText = response.text || "Entendido. He procesado tu solicitud. 💠";
      onAddMessage({ role: 'coach', text: coachText, timestamp: Date.now() });
      
    } catch (err) {
      onAddMessage({ role: 'coach', text: 'Sincronización interrumpida. Verifica tu conexión neural.', timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: CoachMode) => {
    updateMode(mode);
    setShowModeSelector(false);
    const m = COACH_MODES.find(mod => mod.id === mode);
    onAddMessage({ 
      role: 'coach', 
      text: `Cambiando a protocolo: **${m?.label}**. Actualizando matriz de prioridades...`,
      timestamp: Date.now()
    });
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-black">$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
      
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return <div key={i} className="flex gap-2 mb-1 pl-2 text-[15px]">
          <span className="text-[#BC00FF]">⚡</span>
          <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^- |^• /, '') }} />
        </div>;
      }
      return <p key={i} className="mb-3 text-[15px]" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose}></div>
      
      <div className="relative w-full max-w-xl bg-[#0A0F1E] max-h-[90vh] rounded-[48px] shadow-[0_0_100px_rgba(188,0,255,0.2)] flex flex-col border border-white/10 animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
        
        <div className="p-8 border-b border-white/5 bg-[#131B2E] relative z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setShowModeSelector(!showModeSelector)}>
              <div className={`w-14 h-14 bg-black rounded-3xl flex items-center justify-center text-3xl border border-white/10 shadow-2xl transition-transform group-active:scale-95 ${activeMode.colorClass}`}>
                  {activeMode.icon}
              </div>
              <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-black text-xl uppercase italic tracking-tighter ${activeMode.colorClass}`}>{activeMode.label}</h3>
                    <svg className={`w-4 h-4 text-slate-500 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg>
                  </div>
                  <p className="mono text-[8px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Archivo de Memoria Activo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleClearHistory}
                className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-red-500/10 border border-white/5"
              >
                <svg className="w-6 h-6 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <button onClick={onClose} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {showModeSelector && (
            <div className="absolute top-full left-8 right-8 mt-4 bg-[#1A2235] rounded-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-5 animate-in slide-in-from-top-4 z-50">
                {COACH_MODES.map(m => (
                    <button 
                        key={m.id}
                        onClick={() => handleModeChange(m.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all mb-2 ${
                            state.coachMode === m.id ? 'bg-[#BC00FF]/15 border-[#BC00FF]/40' : 'hover:bg-white/5 border-white/5'
                        } border`}
                    >
                        <span className="text-2xl">{m.icon}</span>
                        <div className="text-left">
                            <h4 className={`text-xs font-black uppercase tracking-tight ${m.colorClass}`}>{m.label}</h4>
                            <p className="text-[10px] text-slate-500 font-bold">{m.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto scroll-hide space-y-8 bg-gradient-to-b from-transparent to-black/20">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 group/msg`}>
              <div className={`max-w-[90%] p-6 rounded-[32px] leading-relaxed shadow-2xl relative ${
                m.role === 'user' 
                ? 'bg-[#BC00FF] text-white font-bold border-r-4 border-white/20' 
                : 'bg-white/[0.04] text-slate-200 border border-white/10 backdrop-blur-md'
              }`}>
                {m.role === 'coach' ? formatText(m.text) : <p className="text-[15px]">{m.text}</p>}
                
                {m.role === 'coach' && (
                  <button 
                    onClick={() => handleCopy(m.text, i)}
                    className="absolute -top-3 -right-3 w-10 h-10 bg-[#131B2E] border border-white/10 rounded-xl flex items-center justify-center opacity-0 group-hover/msg:opacity-100 transition-all hover:bg-white/10"
                  >
                    {copyStatus === i ? (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {pendingAction && (
            <div className="flex justify-start animate-in zoom-in-95">
              <div className="bg-[#131B2E] p-6 rounded-[32px] border border-[#BC00FF]/40 shadow-[0_0_30px_rgba(188,0,255,0.1)] space-y-4 max-w-[85%]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#BC00FF]/20 rounded-xl flex items-center justify-center text-[#BC00FF]">
                    {pendingAction.type === 'tarea' ? '📌' : '📁'}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-widest">Confirmar {pendingAction.type}</h4>
                    <p className="text-[10px] text-slate-500 font-bold truncate">{pendingAction.args.title}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={executeAction} className="flex-1 bg-[#BC00FF] text-white py-3 rounded-xl text-[9px] font-black uppercase">Confirmar</button>
                  <button onClick={() => setPendingAction(null)} className="px-5 bg-white/5 text-slate-500 py-3 rounded-xl text-[9px] font-black uppercase">Ignorar</button>
                </div>
              </div>
            </div>
          )}

          {loading && (
              <div className="flex justify-start">
                  <div className="bg-white/5 p-5 rounded-[24px] flex gap-3 border border-white/5">
                      <div className="w-2 h-2 rounded-full animate-bounce bg-[#BC00FF]"></div>
                      <div className="w-2 h-2 rounded-full animate-bounce delay-150 bg-[#BC00FF]/60"></div>
                      <div className="w-2 h-2 rounded-full animate-bounce delay-300 bg-[#BC00FF]/30"></div>
                  </div>
              </div>
          )}
        </div>

        <div className="p-8 bg-[#0A0F1E] border-t border-white/5 pb-10">
          <form onSubmit={handleSend} className="relative flex items-center gap-4">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Haz una pregunta o pide una acción..."
              className="flex-1 p-5 bg-[#131B2E] border border-white/10 rounded-3xl outline-none focus:border-[#BC00FF] text-white font-bold text-base transition-all placeholder:text-slate-600"
            />
            <button className="w-16 h-16 bg-[#BC00FF] text-white rounded-3xl flex items-center justify-center shadow-[0_15px_30px_rgba(188,0,255,0.3)] active:scale-90 transition-all hover:brightness-110">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AICoachPanel;
