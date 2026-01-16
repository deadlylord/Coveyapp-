
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
  onAddMessage: (mode: CoachMode, msg: ChatMessage) => void;
  onClearMessages: (mode: CoachMode) => void;
}

const COACH_MODES: { id: CoachMode; label: string; icon: string; desc: string; colorClass: string; glowClass: string }[] = [
  { id: 'STRATEGIST', label: 'Core Assist', icon: '💠', desc: 'Arquitecto Central', colorClass: 'text-cyan-400', glowClass: 'shadow-cyan-500/20' },
  { id: 'FINANCIAL', label: 'Asesor Financiero', icon: '📈', desc: 'Inversiones & ROI', colorClass: 'text-emerald-400', glowClass: 'shadow-emerald-500/20' },
  { id: 'BUSINESS_OWNER', label: 'Empresario / Negocios', icon: '💼', desc: 'Sistemas & Escala', colorClass: 'text-amber-400', glowClass: 'shadow-amber-500/20' },
  { id: 'ZEN_ENERGY', label: 'Bio-Hacker Vital', icon: '🌿', desc: 'Energía & Foco', colorClass: 'text-rose-400', glowClass: 'shadow-rose-500/20' },
  { id: 'SOCRATIC', label: 'Oráculo de Claridad', icon: '⚖️', desc: 'Eliminar Ruido', colorClass: 'text-purple-400', glowClass: 'shadow-purple-500/20' }
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
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeMode = COACH_MODES.find(m => m.id === state.coachMode) || COACH_MODES[0];
  const messages = state.coachMessages[state.coachMode] || [];

  useEffect(() => {
    if (messages.length === 0 && isOpen) {
        onAddMessage(state.coachMode, { 
          role: 'coach', 
          text: `**Enlace Neuronal Establecido.**\n\nHola, **${state.userName}**. Es un placer saludarte de nuevo.\n\nHe activado el modo **${activeMode.label}**. He estado analizando tu misión central y tus roles activos... ¿En qué área estratégica o financiera quieres que enfoquemos hoy nuestra atención?`,
          timestamp: Date.now()
        });
    }
  }, [state.coachMode, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, pendingActions]);

  const handleSend = async (e?: React.FormEvent, customMsg?: string) => {
    e?.preventDefault();
    const msgToSend = customMsg || input.trim();
    if (!msgToSend || loading) return;
    
    if (!customMsg) setInput('');
    onAddMessage(state.coachMode, { role: 'user', text: msgToSend, timestamp: Date.now() });
    setLoading(true);
    
    try {
      const response = await getCoachResponse(msgToSend, state);
      
      if (response.text) {
        onAddMessage(state.coachMode, { role: 'coach', text: response.text, timestamp: Date.now() });
      }

      if (response.functionCalls && response.functionCalls.length > 0) {
        setPendingActions(prev => [...prev, ...response.functionCalls!]);
      }

      if (!response.text && (!response.functionCalls || response.functionCalls.length === 0)) {
        onAddMessage(state.coachMode, { role: 'coach', text: `Entendido, **${state.userName}**. Quedo a la espera de tus instrucciones.`, timestamp: Date.now() });
      }

    } catch (err) {
      onAddMessage(state.coachMode, { role: 'coach', text: `Lo siento mucho, **${state.userName}**, ha ocurrido un error en la conexión. ¿Podrías intentar enviarlo de nuevo?`, timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  };

  const executeAction = (action: any) => {
    if (action.name === 'crear_tarea') {
      const args = action.args as any;
      const newTask: Task = {
        id: 'ai_task_' + Date.now(),
        title: args.title,
        roleId: args.roleId || state.roles[0]?.id,
        quadrant: (args.quadrant as Quadrant) || 'II',
        isBigRock: args.quadrant === 'II',
        day: args.day !== undefined ? args.day : null,
        time: args.time,
        weekOffset: 0,
        completed: false,
        updatedAt: Date.now()
      };
      onAddTask(newTask);
      onAddMessage(state.coachMode, { 
        role: 'coach', 
        text: `✅ **Confirmado, ${state.userName}**: He agendado la tarea "${args.title}" tal como me pediste. Ya puedes verla en tu planificación.`,
        timestamp: Date.now() 
      });
    }

    if (action.name === 'crear_proyecto') {
      const args = action.args as any;
      const newProject: Project = {
        id: 'ai_proj_' + Date.now(),
        title: args.title,
        description: args.description,
        roleId: args.roleId || state.roles[0]?.id,
        targetSessions: 10,
        completedSessions: 0,
        steps: [],
        updatedAt: Date.now()
      };
      onAddProject(newProject);
      onAddMessage(state.coachMode, { 
        role: 'coach', 
        text: `🚀 **Hecho, ${state.userName}**: El nuevo proyecto "${args.title}" ha sido vinculado a tu arquitectura. ¡Excelente iniciativa!`,
        timestamp: Date.now() 
      });
    }

    setPendingActions(prev => prev.filter(a => a !== action));
  };

  const cancelAction = (action: any) => {
    setPendingActions(prev => prev.filter(a => a !== action));
  };

  const handleSelectMode = (mode: CoachMode) => {
    updateMode(mode);
    setShowModeSelector(false);
    setPendingActions([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end md:justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-[#0A0F1E] h-[95vh] md:h-[85vh] rounded-t-[48px] md:rounded-[48px] shadow-2xl flex flex-col border border-white/10 animate-in slide-in-from-bottom-10 overflow-hidden">
        
        {/* Cabecera del Panel */}
        <div className="p-5 pt-8 md:pt-6 border-b border-white/5 bg-[#131B2E] relative z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowModeSelector(!showModeSelector)}>
              <div className={`w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center text-xl md:text-2xl border border-white/10 transition-transform group-active:scale-90 ${activeMode.colorClass}`}>
                  {activeMode.icon}
              </div>
              <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-black text-base md:text-lg uppercase italic tracking-tighter ${activeMode.colorClass}`}>{activeMode.label}</h3>
                    <svg className={`w-3 h-3 text-slate-500 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="mono text-[7px] text-slate-500 font-bold uppercase tracking-widest">{activeMode.desc}</p>
                  </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => { if(confirm(`¿Deseas purgar el historial con ${activeMode.label}?`)) { onClearMessages(state.coachMode); setPendingActions([]); } }}
                    className="w-10 h-10 bg-white/5 hover:bg-red-500/10 rounded-xl flex items-center justify-center transition-all group"
                    title="Limpiar Chat"
                >
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all active:scale-90">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
          </div>

          {showModeSelector && (
            <div className="absolute top-full left-5 right-5 mt-3 bg-[#1A2235] border border-white/10 rounded-[28px] p-3 shadow-2xl animate-in zoom-in-95 fade-in z-30">
               <div className="space-y-1.5">
                  {COACH_MODES.map((mode) => (
                    <button 
                      key={mode.id}
                      onClick={() => handleSelectMode(mode.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        state.coachMode === mode.id ? 'bg-white/10 ring-1 ring-white/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="text-xl">{mode.icon}</div>
                      <div className="flex-1">
                        <h4 className={`text-[10px] font-black uppercase tracking-tight ${mode.colorClass}`}>{mode.label}</h4>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">{mode.desc}</p>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Área de Mensajes */}
        <div ref={scrollRef} className="flex-1 p-6 md:p-8 overflow-y-auto scroll-hide space-y-8 relative z-10">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[88%] p-6 rounded-[32px] text-base leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' 
                  ? 'bg-[#BC00FF] text-white font-bold shadow-lg shadow-[#BC00FF]/20 rounded-tr-none' 
                  : 'bg-white/[0.04] text-slate-200 border border-white/10 rounded-tl-none shadow-sm'
              }`}>
                {m.text.split('\n').map((line, idx) => {
                    let processed = line;
                    if (processed.includes('**')) {
                        const parts = processed.split('**');
                        return <p key={idx} className="mb-2">
                            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-black">{part}</strong> : part)}
                        </p>;
                    }
                    if (processed.trim().startsWith('- ') || processed.trim().startsWith('• ')) {
                        return <li key={idx} className="ml-4 mb-2 list-disc">{processed.replace(/^[-•]\s*/, '')}</li>;
                    }
                    return <p key={idx} className={processed.trim() === '' ? 'h-4' : 'mb-2'}>{processed}</p>;
                })}
              </div>
            </div>
          ))}

          {/* Tarjetas de Confirmación de Acciones IA */}
          {pendingActions.map((action, i) => (
            <div key={`pending-${i}`} className="flex flex-col items-start animate-in slide-in-from-left-4">
                <div className="max-w-[88%] p-6 rounded-[32px] bg-amber-500/10 border border-amber-500/30 text-slate-200 rounded-tl-none shadow-lg">
                    <p className="mono text-[8px] font-black uppercase text-amber-500 tracking-widest mb-3">Confirmación de Acción</p>
                    <h4 className="text-sm font-black text-white uppercase italic mb-2">
                        {action.name === 'crear_tarea' ? `Agendar Tarea: ${action.args.title}` : `Nuevo Proyecto: ${action.args.title}`}
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-6 leading-relaxed">
                        {state.userName}, ¿me autorizas a integrar esto en tu sistema ahora mismo?
                    </p>
                    <div className="flex gap-2">
                        <button 
                          onClick={() => executeAction(action)}
                          className="flex-1 py-3 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                        >Autorizar</button>
                        <button 
                          onClick={() => cancelAction(action)}
                          className="px-4 py-3 bg-white/5 border border-white/10 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white"
                        >Cancelar</button>
                    </div>
                </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 px-4">
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#BC00FF] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[#BC00FF] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#BC00FF] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[#BC00FF] mono text-[9px] font-black uppercase tracking-widest">Sincronizando con Core...</span>
            </div>
          )}
          <div className="h-40"></div>
        </div>

        {/* Input - AJUSTADO PARA EVITAR SOLAPAMIENTO */}
        <div 
          className="px-6 pt-6 bg-[#0A0F1E] border-t border-white/5 relative z-20"
          style={{ 
            paddingBottom: 'calc(env(safe-area-inset-bottom, 24px) + 2rem)' 
          }}
        >
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`¿Qué ejecutamos hoy, ${state.userName}?`}
                  className="w-full p-5 md:p-6 bg-[#131B2E] border border-white/10 rounded-3xl outline-none focus:border-[#BC00FF] text-white text-base shadow-inner transition-all placeholder:text-slate-600"
                />
            </div>
            <button className="w-14 h-14 md:w-16 md:h-16 bg-[#BC00FF] text-white rounded-[22px] flex items-center justify-center shadow-xl shadow-[#BC00FF]/30 active:scale-90 transition-all group">
              <svg className="w-7 h-7 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AICoachPanel;
