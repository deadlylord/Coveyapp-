
import React from 'react';
import { ViewType, SyncStatus, AppTheme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setView: (v: ViewType) => void;
  onOpenCoach: () => void;
  syncStatus: SyncStatus;
  onReset: () => void;
  theme: AppTheme;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, onOpenCoach, syncStatus, onReset, theme, toggleTheme }) => {
  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0A0F1E] text-white' : 'bg-[#F1F5F9] text-slate-900'}`}>
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[5%] left-[5%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[160px]"></div>
          <div className="absolute bottom-[5%] right-[5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[160px]"></div>
      </div>

      <header className={`px-6 pt-8 pb-3 flex justify-between items-center relative z-20 border-b transition-all duration-500 ${
        theme === 'dark' 
          ? 'border-white/5 bg-[#0A0F1E]/60 backdrop-blur-xl' 
          : 'border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm'
      }`}>
        <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[#BC00FF] shadow-[0_0_10px_#BC00FF] rounded-full"></div>
              <h1 className={`text-lg font-black tracking-tighter uppercase italic leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {activeView === 'PLANNER' && 'Agenda'}
                {activeView === 'MATRIX' && 'Enfoque'}
                {activeView === 'COMPASS' && 'Propósito'}
                {activeView === 'PROJECTS' && 'Negocios'}
                {activeView === 'METHODOLOGY' && 'Sistemas'}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-1 px-1">
              <span className="mono text-[6px] font-black text-slate-500 uppercase tracking-[0.3em]">
                {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sistema Activo'}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  syncStatus === 'synced' ? 'bg-emerald-400 shadow-[0_0_8px_#00FF88]' : 
                  syncStatus === 'syncing' ? 'bg-purple-400 shadow-[0_0_12px_#BC00FF] animate-pulse' :
                  syncStatus === 'local' ? 'bg-amber-400 shadow-[0_0_8px_orange]' : 
                  'bg-red-400'
              }`}></div>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-90"
            >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                )}
            </button>
            <button 
                onClick={onReset}
                className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-90 group"
            >
                <svg className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform duration-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round"/></svg>
            </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-y-auto scroll-hide pb-36 z-10">
        {children}
      </main>

      {/* Futuristic Navigation Bar - Increased Z-Index to 110 */}
      <nav className="fixed bottom-8 left-6 right-6 z-[110]">
          <div className="bg-[#131B2E] border border-white/10 rounded-[32px] p-2 flex justify-between items-center shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            <BottomNavItem 
                active={activeView === 'PLANNER'} 
                onClick={() => setView('PLANNER')} 
                icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                label="Agenda"
            />
            <BottomNavItem 
                active={activeView === 'PROJECTS'} 
                onClick={() => setView('PROJECTS')} 
                icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                label="Negocios"
            />
            
            <button 
                onClick={onOpenCoach}
                className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 text-[#BC00FF] hover:scale-110 active:scale-90"
                title="Abrir Core Assist"
            >
                <div className="drop-shadow-[0_0_8px_#BC00FF]">
                    <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="1.5" stroke="none" fill="currentColor" />
                        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(0 12 12)" />
                        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
                        <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" />
                    </svg>
                </div>
                <span className="mono text-[7px] font-black uppercase tracking-widest mt-1.5 opacity-80">Core</span>
            </button>

            <BottomNavItem 
                active={activeView === 'MATRIX'} 
                onClick={() => setView('MATRIX')} 
                icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                label="Enfoque"
            />
            <BottomNavItem 
                active={activeView === 'COMPASS'} 
                onClick={() => setView('COMPASS')} 
                icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A2 2 0 013 15.483V8.517a2 2 0 011.553-1.943L9 4m6 16l5.447-2.724A2 2 0 0021 15.483V8.517a2 2 0 00-1.553-1.943L15 4m-6 16V4m6 16V4" /></svg>}
                label="Núcleo"
            />
          </div>
      </nav>
    </div>
  );
};

const BottomNavItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
        active ? 'text-[#BC00FF]' : 'text-slate-600'
    }`}
  >
    <div className={`transition-transform ${active ? 'scale-110 drop-shadow-[0_0_8px_#BC00FF]' : 'scale-100'}`}>
        {icon}
    </div>
    <span className={`mono text-[7px] font-black uppercase tracking-widest mt-1.5 ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
  </button>
);

export default Layout;
