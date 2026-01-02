
import React from 'react';
import { ViewType, SyncStatus } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setView: (v: ViewType) => void;
  onOpenCoach: () => void;
  syncStatus: SyncStatus;
  onReset: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, onOpenCoach, syncStatus, onReset }) => {
  const getStatusDisplay = () => {
    switch(syncStatus) {
      case 'synced': return { label: 'SINCRONIZADO', color: 'text-emerald-500 bg-emerald-50', icon: 'M5 13l4 4L19 7', tip: 'Tus datos están seguros en la nube.' };
      case 'local': return { label: 'DATOS LOCALES', color: 'text-amber-500 bg-amber-50', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', tip: 'Permisos de nube restringidos. Guardando solo en este dispositivo.' };
      case 'error': return { label: 'ERROR NUBE', color: 'text-rose-500 bg-rose-50', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', tip: 'Error de conexión. Verifica tu internet.' };
      default: return { label: 'CONECTANDO', color: 'text-slate-400 bg-slate-50', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', tip: 'Estableciendo conexión con la base de datos...' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD] overflow-hidden text-[#1A1C1E]">
      <header className="px-6 pt-6 pb-2 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">
                {activeView === 'PLANNER' && 'Planeación Semanal'}
                {activeView === 'MATRIX' && 'Matriz de Prioridades'}
                {activeView === 'COMPASS' && 'Misión y Roles'}
                {activeView === 'METHODOLOGY' && 'Método Covey'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">COVEY COMPASS v2.1</p>
              <button 
                className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 transition-all duration-500 cursor-help ${status.color}`}
                title={status.tip}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={status.icon} /></svg>
                {status.label}
              </button>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={onReset}
              title="Restablecer Datos"
              className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button 
              onClick={() => setView('METHODOLOGY')}
              className={`p-2.5 bg-white rounded-xl shadow-sm border transition-colors ${activeView === 'METHODOLOGY' ? 'border-indigo-500 text-indigo-500' : 'border-slate-100 text-slate-400'}`}
              title="Guía Metodológica"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-y-auto scroll-hide pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex justify-between items-center z-40 shadow-2xl">
        <BottomNavItem active={activeView === 'PLANNER'} onClick={() => setView('PLANNER')} label="Inicio" icon={<HomeIcon />} />
        <BottomNavItem active={activeView === 'MATRIX'} onClick={() => setView('MATRIX')} label="Matriz" icon={<GridIcon />} />
        
        <button 
            onClick={onOpenCoach}
            title="Abrir Coach"
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl -mt-10 transform transition-all active:scale-95 hover:bg-indigo-700 hover:shadow-indigo-200 ring-4 ring-white"
        >
            <SparklesIcon />
        </button>

        <BottomNavItem active={activeView === 'COMPASS'} onClick={() => setView('COMPASS')} label="Roles" icon={<RolesIcon />} />
        <BottomNavItem active={activeView === 'METHODOLOGY'} onClick={() => setView('METHODOLOGY')} label="Ayuda" icon={<BookIcon />} />
      </nav>
    </div>
  );
};

const BottomNavItem = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <div className="w-6 h-6">{icon}</div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const HomeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.719c-1.035 0-1.875-.84-1.875-1.875v-6.198c.03-.028.06-.056.091-.086L12 5.432z" /></svg>;
const GridIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" /></svg>;
const RolesIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>;
const BookIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" /></svg>;
const SparklesIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.63a.75.75 0 010 1.298l-9.75 5.63a.75.75 0 01-.712 0l-9.75-5.63a.75.75 0 010-1.298l9.75-5.63z" /><path d="M12.75 12.75v8.5a.75.75 0 01-1.5 0v-8.5a.75.75 0 011.5 0zM18.75 15.75a.75.75 0 010 1.5H5.25a.75.75 0 010-1.5h13.5z" opacity="0.3" /><path d="M21 12.75l-4.242 4.242a.75.75 0 11-1.06-1.06l3.181-3.182-3.182-3.182a.75.75 0 111.06-1.06l4.243 4.242zM3 12.75l4.242-4.242a.75.75 0 111.06 1.06l-3.181 3.182 3.182 3.182a.75.75 0 11-1.06 1.06L3 12.75z" /><path d="M12 6.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM12 11.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z" /></svg>;

export default Layout;
