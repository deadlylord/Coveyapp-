
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
          text: `Core Assist Online. Sistema en modo **${activeMode.label}**. ¿En qué área nos enfocamos hoy?`,
          timestamp: Date.now()
        });
    }
  }, [state.coachMode, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, pendingAction]);

  const handleClearHistory = () => {
    if (confirm("¿Confirmas la purga del historial?")) onClearMessages();
  };

  const executeAction = () => {
    if (!pendingAction) return;
    const args = pendingAction.args;
    if (pendingAction.type === 'tarea') {
      const newTask: Task = {
        id: 'ai_task_' + Date.now(),
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
    }
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
        if (call.name === 'crear_tarea') setPendingAction({ type: 'tarea', args: call.args });
      }
      onAddMessage({ role: 'coach', text: response.text || "Procesado. 💠", timestamp: Date.now() });
    } catch (err) {
      onAddMessage({ role: 'coach', text: 'Error de conexión neural.', timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in" onClick={onClose}></div>
      
      <div className="relative w-full max-w-xl bg-[#0A0F1E] h-[85vh] rounded-[48px] shadow-2xl flex flex-col border border-white/10 animate-in zoom-in-95 overflow-hidden">
        
        <div className="p-6 border-b border-white/5 bg-[#131B2E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowModeSelector(!showModeSelector)}>
              <div className={`w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-2xl border border-white/10 ${activeMode.colorClass}`}>
                  {activeMode.icon}
              </div>
              <div>
                  <h3 className={`font-black text-lg uppercase italic tracking-tighter ${activeMode.colorClass}`}>{activeMode.label}</h3>
                  <p className="mono text-[7px] text-slate-500 font-bold uppercase">Archivo Activo</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto scroll-hide space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-5 rounded-[28px] text-sm ${
                m.role === 'user' ? 'bg-[#BC00FF] text-white font-bold' : 'bg-white/[0.04] text-slate-200 border border-white/10'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-[#BC00FF] mono text-[8px] animate-pulse uppercase">Transmitiendo...</div>}
          <div className="h-10"></div> {/* Espacio extra al final del scroll */}
        </div>

        <div className="p-6 bg-[#0A0F1E] border-t border-white/5 pb-12"> {/* pb-12 para alejarlo de la nav bar */}
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta algo..."
              className="flex-1 p-4 bg-[#131B2E] border border-white/10 rounded-2xl outline-none focus:border-[#BC00FF] text-white text-sm"
            />
            <button className="w-12 h-12 bg-[#BC00FF] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AICoachPanel;
