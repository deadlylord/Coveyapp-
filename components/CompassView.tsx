
import React, { useState } from 'react';
import { AppState, Role, ViewType } from '../types';

interface CompassViewProps {
  state: AppState;
  updateMission: (text: string) => void;
  updateUserName: (name: string) => void;
  addRole: (role: Role) => void;
  deleteRole: (id: string) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  updateRoleGoal: (id: string, goal: string) => void;
  setView: (v: ViewType) => void;
}

const CompassView: React.FC<CompassViewProps> = ({ state, updateMission, updateUserName, addRole, deleteRole, updateRole, updateRoleGoal, setView }) => {
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(state.roles[0]?.id || null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const newRole: Role = {
      id: "role_" + Date.now().toString(),
      name: newRoleName.trim(),
      icon: '🎭',
      goal: '',
      color: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    addRole(newRole);
    setNewRoleName('');
    setIsAddingRole(false);
  };

  return (
    <div className="px-6 space-y-10 pb-20">
      {/* Identity Header */}
      <section className="bg-[#131B2E] p-8 rounded-[32px] border border-white/5 space-y-4 shadow-xl">
          <label className="mono text-[7px] font-black uppercase text-purple-400 tracking-[0.4em]">Identidad del Usuario</label>
          <input 
            type="text"
            value={state.userName}
            onChange={(e) => updateUserName(e.target.value)}
            placeholder="Introduce tu identificador..."
            className="w-full text-3xl font-black bg-transparent outline-none border-b border-white/5 focus:border-[#BC00FF] pb-2 text-white italic tracking-tighter uppercase"
          />
      </section>

      {/* Mission Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
            <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Misión Central</h2>
                <p className="mono text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Directiva de Vida Principal</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">📜</div>
        </div>
        <div className="relative group">
            <textarea
                value={state.mission.text}
                onChange={(e) => updateMission(e.target.value)}
                className="w-full h-56 p-8 bg-white/[0.02] border border-white/5 rounded-[40px] text-lg font-medium leading-relaxed shadow-2xl outline-none focus:border-[#BC00FF]/30 transition-all text-slate-300 placeholder:text-slate-800"
                placeholder="Define tu propósito inmutable..."
            />
            <div className="absolute bottom-6 right-8 mono text-[6px] font-black text-slate-600 uppercase tracking-[0.5em]">Constitución Neural</div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="space-y-6">
        <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Esferas Vitales</h2>
            <p className="mono text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">División de Roles Core</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {state.roles.map((role) => (
            <div 
                key={role.id} 
                className={`bg-[#131B2E] p-6 rounded-[28px] border border-white/5 transition-all duration-500 ${expandedRoleId === role.id ? 'border-[#BC00FF]/40 shadow-[0_0_30px_rgba(188,0,255,0.1)]' : 'opacity-60 cursor-pointer'}`}
                onClick={() => setExpandedRoleId(expandedRoleId === role.id ? null : role.id)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center text-2xl">
                        {role.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white italic">{role.name}</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Descriptor de Rol</p>
                    </div>
                </div>

                {expandedRoleId === role.id && (
                    <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-1 bg-black/40 p-4 rounded-2xl border border-white/5">
                                <label className="mono text-[7px] font-black uppercase text-slate-500 tracking-widest block mb-1.5 text-center">Icono</label>
                                <input 
                                    className="w-full bg-transparent text-center text-xl outline-none border-none p-0"
                                    value={role.icon}
                                    onChange={(e) => updateRole(role.id, { icon: e.target.value })}
                                />
                            </div>
                            <div className="col-span-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                                <label className="mono text-[7px] font-black uppercase text-purple-400 tracking-widest block mb-1.5">Nombre del Rol</label>
                                <input 
                                    className="w-full bg-transparent outline-none font-bold text-white uppercase italic tracking-tight text-lg border-none p-0"
                                    value={role.name}
                                    onChange={(e) => updateRole(role.id, { name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                            <label className="mono text-[7px] font-black uppercase text-purple-400 tracking-widest block mb-2">Meta Estratégica</label>
                            <textarea 
                                className="w-full bg-transparent outline-none font-medium text-slate-200 placeholder:text-slate-700 text-sm leading-relaxed min-h-[80px] border-none p-0"
                                placeholder="Define el éxito de este rol..."
                                value={role.goal}
                                onChange={(e) => updateRoleGoal(role.id, e.target.value)}
                            />
                        </div>

                        <div className="flex justify-between items-center px-1">
                            <button onClick={(e) => { e.stopPropagation(); deleteRole(role.id); }} className="text-[8px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors">Purificar Rol</button>
                            <span className="mono text-[6px] text-slate-700 uppercase tracking-widest">Editando Protocolo</span>
                        </div>
                    </div>
                )}
            </div>
          ))}

          {isAddingRole ? (
            <form onSubmit={handleAddRole} className="bg-[#131B2E] p-6 rounded-[28px] border border-[#BC00FF]/40 animate-in zoom-in-95 space-y-4 shadow-xl">
                <input 
                    autoFocus
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white text-sm outline-none focus:border-[#BC00FF]"
                    placeholder="Identificador del Rol..."
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                />
                <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-[#BC00FF] text-white py-3 rounded-xl text-[9px] font-black uppercase">Vincular</button>
                    <button type="button" onClick={() => setIsAddingRole(false)} className="px-6 bg-white/5 text-slate-500 py-3 rounded-xl text-[9px] font-black uppercase">Anular</button>
                </div>
            </form>
          ) : (
            <button 
                onClick={() => setIsAddingRole(true)}
                className="w-full py-10 border-2 border-dashed border-white/5 rounded-[28px] flex flex-col items-center justify-center gap-3 opacity-30 hover:opacity-100 hover:bg-white/5 transition-all"
            >
                <span className="text-3xl">➕</span>
                <span className="mono text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Expandir Estructura</span>
            </button>
          )}
        </div>
      </section>

      <div className="pt-8">
        <button 
            onClick={() => setView('PLANNER')}
            className="w-full py-6 bg-[#BC00FF] text-white rounded-[32px] text-xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(188,0,255,0.2)] transform transition-transform active:scale-95"
        >
            Iniciar Protocolo de Acción
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default CompassView;
