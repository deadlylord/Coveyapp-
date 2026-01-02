
import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { getCoachResponse, analyzeAlignment, optimizeWeek } from '../geminiService';

interface AICoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
}

const AICoachPanel: React.FC<AICoachPanelProps> = ({ isOpen, onClose, state }) => {
  const [messages, setMessages] = useState<{ role: 'coach' | 'user'; text: string }[]>([
    { role: 'coach', text: 'Hola, soy tu coach Covey. ¿Cómo va tu enfoque en las Piedras Grandes hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await getCoachResponse(userMsg, state);
      setMessages(prev => [...prev, { role: 'coach', text: response || 'No pude procesar eso, lo siento.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'coach', text: 'Hubo un problema de conexión con la IA. ¿Has verificado tu clave API?' }]);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action: () => Promise<string | undefined>, label: string) => {
      setMessages(prev => [...prev, { role: 'user', text: label }]);
      setLoading(true);
      try {
          const res = await action();
          setMessages(prev => [...prev, { role: 'coach', text: res || 'He completado mi análisis.' }]);
      } catch {
          setMessages(prev => [...prev, { role: 'coach', text: 'Algo salió mal en el análisis.' }]);
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shadow-inner backdrop-blur-sm">
                ✨
            </div>
            <div>
                <h3 className="font-bold text-lg leading-none mb-1">Coach Covey</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] opacity-80 font-black uppercase tracking-widest">En Línea</span>
                </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto scroll-hide space-y-6 bg-[#F8F9FD]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-4 rounded-[28px] text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
              <div className="flex justify-start animate-in fade-in">
                  <div className="bg-white p-4 rounded-3xl rounded-tl-none flex gap-1.5 shadow-sm border border-slate-50">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-300"></span>
                  </div>
              </div>
          )}
        </div>

        <div className="p-5 bg-white border-t border-slate-100 pb-10">
          <div className="flex gap-2 mb-4">
              <button 
                onClick={() => runAction(() => analyzeAlignment(state), "Analiza mi alineación.")}
                className="flex-1 text-[10px] font-black uppercase tracking-wider py-3.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95"
              >
                  Alineación
              </button>
              <button 
                onClick={() => runAction(() => optimizeWeek(state), "Optimiza mi semana.")}
                className="flex-1 text-[10px] font-black uppercase tracking-wider py-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-all active:scale-95"
              >
                  Optimizar
              </button>
          </div>
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a tu mentor..."
              className="flex-1 p-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white text-sm transition-all"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center" disabled={loading}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AICoachPanel;
