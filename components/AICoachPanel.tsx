
import React, { useState, useRef, useEffect } from 'react';
import { AppState, CoachMode, Task, Project, Quadrant, ChatMessage } from '../types';
import { getCoachResponse, generateCoachVoice } from '../geminiService';

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

const COACH_MODES: { id: CoachMode; label: string; icon: string; desc: string; colorClass: string; voice: string }[] = [
  { id: 'STRATEGIST', label: 'Core Assist', icon: '💠', desc: 'Arquitecto Central', colorClass: 'text-cyan-400', voice: 'Zephyr' },
  { id: 'FINANCIAL', label: 'Asesor Financiero', icon: '📈', desc: 'Inversiones & ROI', colorClass: 'text-emerald-400', voice: 'Kore' },
  { id: 'BUSINESS_OWNER', label: 'Empresario / Negocios', icon: '💼', desc: 'Sistemas & Escala', colorClass: 'text-amber-400', voice: 'Puck' },
  { id: 'ZEN_ENERGY', label: 'Bio-Hacker Vital', icon: '🌿', desc: 'Energía & Foco', colorClass: 'text-rose-400', voice: 'Charon' },
  { id: 'SOCRATIC', label: 'Oráculo de Claridad', icon: '⚖️', desc: 'Eliminar Ruido', colorClass: 'text-purple-400', voice: 'Fenrir' }
];

// Helper functions for audio processing
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AICoachPanel: React.FC<AICoachPanelProps> = ({ 
  isOpen, onClose, state, updateMode, onAddTask, onAddProject, onAddMessage, onClearMessages 
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const activeMode = COACH_MODES.find(m => m.id === state.coachMode) || COACH_MODES[0];
  const messages = state.coachMessages[state.coachMode] || [];

  useEffect(() => {
    if (messages.length === 0 && isOpen) {
        onAddMessage(state.coachMode, { 
          role: 'coach', 
          text: `**Enlace Neuronal Establecido.**\n\nHola, **${state.userName}**. Es un placer saludarte de nuevo.\n\nHe activado el modo **${activeMode.label}**. Analizaré tu misión para darte el mejor briefing estratégico. ¿Qué área quieres potenciar hoy?`,
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
      if (response.text) onAddMessage(state.coachMode, { role: 'coach', text: response.text, timestamp: Date.now() });
      if (response.functionCalls && response.functionCalls.length > 0) setPendingActions(prev => [...prev, ...response.functionCalls!]);
      if (!response.text && (!response.functionCalls || response.functionCalls.length === 0)) {
        onAddMessage(state.coachMode, { role: 'coach', text: `Entendido, **${state.userName}**. Procesando directivas.`, timestamp: Date.now() });
      }
    } catch (err) {
      onAddMessage(state.coachMode, { role: 'coach', text: `Error de enlace, **${state.userName}**. ¿Repetimos la transmisión?`, timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  };

  const playVoice = async (text: string, msgTimestamp: number) => {
    if (playingId === msgTimestamp) return;
    setPlayingId(msgTimestamp);
    try {
      const base64Audio = await generateCoachVoice(text, activeMode.voice);
      if (!base64Audio) throw new Error("No audio data");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setPlayingId(null);
      source.start();
    } catch (err) {
      console.error("Playback failed:", err);
      setPlayingId(null);
    }
  };

  const executeAction = (action: any) => {
    if (action.name === 'crear_tarea') {
      const args = action.args as any;
      onAddTask({
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
      });
      onAddMessage(state.coachMode, { role: 'coach', text: `✅ Tarea "${args.title}" agendada.`, timestamp: Date.now() });
    }
    if (action.name === 'crear_proyecto') {
      const args = action.args as any;
      onAddProject({
        id: 'ai_proj_' + Date.now(),
        title: args.title,
        description: args.description,
        roleId: args.roleId || state.roles[0]?.id,
        area: args.area || 'GENERAL',
        targetSessions: 10,
        completedSessions: 0,
        steps: [],
        updatedAt: Date.now()
      });
      onAddMessage(state.coachMode, { role: 'coach', text: `🚀 Proyecto "${args.title}" vinculado.`, timestamp: Date.now() });
    }
    setPendingActions(prev => prev.filter(a => a !== action));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end md:justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-[#0A0F1E] h-[calc(100dvh-110px)] md:h-[85vh] mb-[110px] md:mb-0 rounded-t-[48px] md:rounded-[48px] shadow-2xl flex flex-col border border-white/10 animate-in slide-in-from-bottom-10 overflow-hidden">
        
        <div className="p-5 pt-8 md:pt-6 border-b border-white/5 bg-[#131B2E] relative z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowModeSelector(!showModeSelector)}>
              <div className={`w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center text-xl md:text-2xl border border-white/10 transition-transform ${activeMode.colorClass}`}>
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
            <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all active:scale-90">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {showModeSelector && (
            <div className="absolute top-full left-5 right-5 mt-3 bg-[#1A2235] border border-white/10 rounded-[28px] p-3 shadow-2xl animate-in zoom-in-95 fade-in z-30">
               {COACH_MODES.map((mode) => (
                <button key={mode.id} onClick={() => { updateMode(mode.id); setShowModeSelector(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${state.coachMode === mode.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                  <div className="text-xl">{mode.icon}</div>
                  <div className="flex-1 text-left">
                    <h4 className={`text-[10px] font-black uppercase tracking-tight ${mode.colorClass}`}>{mode.label}</h4>
                  </div>
                </button>
               ))}
            </div>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 p-6 md:p-8 overflow-y-auto scroll-hide space-y-8 relative z-10">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`relative max-w-[88%] p-6 rounded-[32px] text-base leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-[#BC00FF] text-white font-bold rounded-tr-none' : 'bg-white/[0.04] text-slate-200 border border-white/10 rounded-tl-none'
              }`}>
                {m.text}
                {m.role === 'coach' && (
                  <button 
                    onClick={() => playVoice(m.text, m.timestamp)}
                    disabled={playingId === m.timestamp}
                    className={`absolute bottom-[-14px] right-6 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 transition-all ${playingId === m.timestamp ? 'bg-[#BC00FF] text-white animate-pulse' : 'bg-[#131B2E] text-slate-400 hover:text-white'}`}
                  >
                    {playingId === m.timestamp ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {pendingActions.map((action, i) => (
            <div key={i} className="flex flex-col items-start p-6 rounded-[32px] bg-amber-500/10 border border-amber-500/30">
                <h4 className="text-sm font-black text-white uppercase italic mb-4">{action.name === 'crear_tarea' ? `Tarea: ${action.args.title}` : `Proyecto: ${action.args.title}`}</h4>
                <div className="flex gap-2 w-full">
                    <button onClick={() => executeAction(action)} className="flex-1 py-3 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase">Autorizar</button>
                    <button onClick={() => setPendingActions(prev => prev.filter(a => a !== action))} className="px-4 py-3 bg-white/5 text-slate-500 rounded-xl text-[10px] font-black uppercase">X</button>
                </div>
            </div>
          ))}
          {loading && <div className="text-[#BC00FF] mono text-[9px] font-black uppercase px-4 animate-pulse">Sincronizando con Core...</div>}
          <div className="h-20"></div>
        </div>

        <div className="px-6 py-6 bg-[#0A0F1E] border-t border-white/5 relative z-20">
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`¿Qué ejecutamos hoy?`} className="flex-1 p-5 bg-[#131B2E] border border-white/10 rounded-3xl outline-none focus:border-[#BC00FF] text-white text-base" />
            <button className="w-14 h-14 bg-[#BC00FF] text-white rounded-[22px] flex items-center justify-center shadow-xl active:scale-90 transition-all"><svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AICoachPanel;
