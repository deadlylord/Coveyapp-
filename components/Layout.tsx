
import React, { useState, useEffect } from 'react';
import { ViewType, SyncStatus } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setView: (v: ViewType) => void;
  onOpenCoach: () => void;
  syncStatus: SyncStatus;
  onReset: () => void;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, onOpenCoach, syncStatus, onReset }) => {
  const [hasKey, setHasKey] = useState<boolean>(true);

  const getAIStudio = () => (window as any).aistudio as AIStudio | undefined;

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = getAIStudio();
      if (aistudio) {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
    // Re-comprobar periódicamente o al cambiar de vista para asegurar que la clave sigue activa
  }, [activeView]);

  const handleConnectKey = async () => {
    const aistudio = getAIStudio();
    if (aistudio) {
      await aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD] overflow-hidden text-[#1A1C1E]">
      <header className="px-6 pt-6 pb-2 flex justify-between items-start">
        <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
                {activeView === 'PLANNER' && 'Agenda Semanal'}
                {activeView === 'MATRIX' && 'Matriz de Tiempo'}
                {activeView === 'COMPASS' && 'Misión y Roles'}
                {activeView === 'PROJECTS' && 'Proyectos Q2'}
                {activeView === 'METHODOLOGY' && 'Guía Covey'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">v3.2 Stable</p>
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
            </div>
        </div>
        
        <div className="flex gap-2">
            {!hasKey ? (
                <button 
                  onClick={handleConnectKey}
                  className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-100 flex items-center gap-2 shadow-sm animate-pulse"
                >
                  ⚠️ Conectar AI
                </button>
            ) : (
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-2 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  AI Online
                </div>
            )}
            <button 
                onClick={() => { if(confirm("¿Reiniciar app?")) onReset(); }}
                className="p-2 text-slate-300 hover:text-slate-500 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" /></svg>
            </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-y-auto scroll-hide pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex justify-between items-center z-40 shadow-2xl">
        <BottomNavItem active={activeView === 'PLANNER'} onClick={() => setView('PLANNER')} label="Agenda" icon="📅" />
        <BottomNavItem active={activeView === 'PROJECTS'} onClick={() => setView('PROJECTS')} label="Proyectos" icon="🚀" />
        
        <button 
            onClick={onOpenCoach}
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl -mt-10 transform transition-all active:scale-95 hover:bg-indigo-700 ring-4 ring-white"
        >
            <span className="text-2xl">✨</span>
        </button>

        <BottomNavItem active={activeView === 'MATRIX'} onClick={() => setView('MATRIX')} label="Matriz" icon="🎯" />
        <BottomNavItem active={activeView === 'COMPASS'} onClick={() => setView('COMPASS')} label="Compás" icon="🧭" />
      </nav>
    </div>
  );
};

const BottomNavItem = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default Layout;
