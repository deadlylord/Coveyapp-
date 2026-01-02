
import React, { useState } from 'react';
import { AppState, Role, ViewType } from '../types';
import { ROLE_COLORS } from '../constants';

interface CompassViewProps {
  state: AppState;
  updateMission: (text: string) => void;
  addRole: (role: Role) => void;
  deleteRole: (id: string) => void;
  updateRoleGoal: (id: string, goal: string) => void;
  setView: (v: ViewType) => void;
}

const CompassView: React.FC<CompassViewProps> = ({ state, updateMission, addRole, deleteRole, updateRoleGoal, setView }) => {
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(state.roles[0]?.id || null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    
    const icons = ['👤', '💼', '🏡', '🎨', '🧠', '🤝', '🏃', '📚', '🌟'];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    
    // Fix: Added missing createdAt and updatedAt properties to satisfy Role type
    const newRole: Role = {
      id: "role_" + Date.now().toString(),
      name: newRoleName.trim(),
      icon,
      goal: '',
      color: ROLE_COLORS[state.roles.length % ROLE_COLORS.length],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    addRole(newRole);
    setExpandedRoleId(newRole.id);
    setNewRoleName('');
    setIsAddingRole(false);
  };

  return (
    <div className="px-6 space-y-8 pb-10">
      <section className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-slate-800">Mi Misión</h2>
            <button className="bg-[#E2FFE9] text-[#4CAF50] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-[#CCF8D5]">
                <span className="text-lg">✨</span> Asistente IA
            </button>
        </div>
        <div className="relative">
            <textarea
                value={state.mission.text}
                onChange={(e) => updateMission(e.target.value)}
                placeholder="Redacta tu enunciado de misión personal aquí..."
                className="w-full h-48 p-8 bg-white border border-slate-100 rounded-[32px] text-lg font-medium leading-relaxed shadow-sm focus:shadow-md outline-none transition-all placeholder:text-slate-300"
            />
            <span className="absolute bottom-6 right-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Autoguardado</span>
        </div>
      </section>

      <section className="space-y-6">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Mis Roles</h2>
            <p className="text-sm text-slate-400 font-medium">¿Cuáles son los principales "sombreros" que usas en la vida?</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {state.roles.map((role) => (
            <div 
                key={role.id} 
                className={`transition-all duration-300 ${expandedRoleId === role.id ? 'col-span-2' : 'col-span-1'}`}
            >
                <div 
                    onClick={() => setExpandedRoleId(expandedRoleId === role.id ? null : role.id)}
                    className={`h-full p-6 rounded-[32px] border-2 cursor-pointer transition-all ${
                        expandedRoleId === role.id 
                        ? 'bg-[#F1F7FF] border-[#D6E7FF] shadow-lg shadow-blue-50' 
                        : 'bg-white border-slate-50'
                    }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                {role.icon}
                            </div>
                            <h3 className={`text-xl font-bold ${expandedRoleId === role.id ? 'text-blue-600' : 'text-slate-800'}`}>
                                {role.name}
                            </h3>
                        </div>
                        {expandedRoleId === role.id && (
                             <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                        )}
                    </div>

                    {expandedRoleId === role.id ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="bg-white/80 p-5 rounded-2xl border border-blue-100">
                                <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest block mb-2">Objetivo Clave</label>
                                <input 
                                    className="w-full bg-transparent outline-none font-medium text-slate-700 placeholder:text-slate-300 border-b border-blue-50 pb-2"
                                    placeholder="Ingresa el objetivo..."
                                    value={role.goal}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateRoleGoal(role.id, e.target.value)}
                                />
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteRole(role.id); }}
                                    className="text-[10px] font-bold text-red-400 uppercase tracking-widest"
                                >
                                    Eliminar Rol
                                </button>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Activo</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 font-medium line-clamp-1">{role.goal || 'Sin objetivo establecido...'}</p>
                    )}
                </div>
            </div>
          ))}

          {isAddingRole ? (
            <div className="col-span-1 bg-white border-2 border-[#D6E7FF] rounded-[32px] p-6 shadow-lg animate-in zoom-in-95">
              <form onSubmit={handleAddRole} className="space-y-3">
                <input 
                  autoFocus
                  className="w-full border-b-2 border-blue-100 py-2 outline-none font-bold text-slate-700"
                  placeholder="Nombre del rol..."
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold">GUARDAR</button>
                  <button type="button" onClick={() => setIsAddingRole(false)} className="px-3 bg-slate-100 text-slate-500 py-2 rounded-xl text-xs font-bold">X</button>
                </div>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingRole(true)}
              className="col-span-1 min-h-[140px] border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-6 gap-2 opacity-50 hover:opacity-100 transition-all focus:outline-none"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm pointer-events-none">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </div>
              <span className="text-sm font-bold text-slate-500 pointer-events-none">Añadir Rol</span>
            </button>
          )}
        </div>
      </section>

      <div className="pt-8">
        <button 
            onClick={() => setView('PLANNER')}
            className="w-full py-6 bg-[#00E676] text-[#1A1C1E] rounded-[32px] text-xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 transform transition-transform active:scale-95"
        >
            Ir a Planificación
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default CompassView;