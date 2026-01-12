
import React, { useState } from 'react';
import { AppState, Task, Quadrant, Role } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface MatrixViewProps {
  state: AppState;
  updateQuadrant: (taskId: string, q: Quadrant) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  moveTask: (id: string, day: number | null, weekOffset?: number) => void;
  currentWeekOffset: number;
  setCurrentWeekOffset: (val: number | ((prev: number) => number)) => void;
}

const MatrixView: React.FC<MatrixViewProps> = ({ state, updateQuadrant, addTask, updateTask, toggleTask, moveTask, currentWeekOffset, setCurrentWeekOffset }) => {
  const [addingInQuadrant, setAddingInQuadrant] = useState<Quadrant | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [selectedAddRoleId, setSelectedAddRoleId] = useState(state.roles[0]?.id || '');
  
  const quadrants: Quadrant[] = ['I', 'II', 'III', 'IV'];

  const quadrantMeta = {
    'I': { title: 'Urgente / Crítico', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    'II': { title: 'Impacto / Valor', color: 'text-[#BC00FF]', bg: 'bg-[#BC00FF]/10', border: 'border-[#BC00FF]/20' },
    'III': { title: 'Delegar / Ruido', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'IV': { title: 'Desperdicio', color: 'text-slate-600', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !addingInQuadrant) return;
    addTask({
      id: "matrix_" + Date.now().toString(),
      title: newGoalTitle.trim(),
      roleId: selectedAddRoleId || state.roles[0]?.id || '1',
      isBigRock: addingInQuadrant === 'II', 
      weekOffset: currentWeekOffset,
      quadrant: addingInQuadrant,
      completed: false,
      day: null,
      updatedAt: Date.now()
    });
    setNewGoalTitle('');
    setAddingInQuadrant(null);
  };

  const tasksForWeek = state.tasks.filter(t => t.weekOffset === currentWeekOffset);

  return (
    <div className="px-6 space-y-8 pb-32">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Matriz Core</h2>
            <p className="mono text-[8px] font-bold text-purple-400 uppercase tracking-[0.3em] mt-2">Priorización por Roles Estratégicos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quadrants.map(q => (
          <div 
            key={q} 
            className={`min-h-[350px] p-6 rounded-[32px] border flex flex-col transition-all duration-500 bg-[#131B2E] ${
                addingInQuadrant === q ? 'border-[#BC00FF] shadow-[0_0_30px_rgba(188,0,255,0.15)] scale-[1.02]' : 'border-white/5 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${quadrantMeta[q].bg} flex items-center justify-center font-black ${quadrantMeta[q].color} border ${quadrantMeta[q].border}`}>
                    {q}
                  </div>
                  <div>
                    <h3 className={`mono text-[10px] font-black uppercase tracking-widest ${quadrantMeta[q].color}`}>{quadrantMeta[q].title}</h3>
                    <p className="text-[7px] mono text-slate-500 uppercase tracking-widest">Cuadrante Estratégico</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAddingInQuadrant(addingInQuadrant === q ? null : q)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${addingInQuadrant === q ? 'bg-[#BC00FF] text-white shadow-[0_0_15px_#BC00FF]' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>

            {addingInQuadrant === q && (
                <form onSubmit={handleAddGoal} className="mb-6 space-y-3 animate-in slide-in-from-top-4 duration-300">
                    <input 
                        autoFocus
                        value={newGoalTitle}
                        onChange={e => setNewGoalTitle(e.target.value)}
                        placeholder="Nueva meta de impacto..."
                        className="w-full bg-black/40 border border-[#BC00FF]/30 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#BC00FF]"
                    />
                    <div className="flex gap-2">
                        <select 
                            value={selectedAddRoleId}
                            onChange={e => setSelectedAddRoleId(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 p-4 rounded-2xl text-[10px] font-black uppercase text-purple-400 outline-none"
                        >
                            {state.roles.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                        </select>
                        <button type="submit" className="px-6 bg-[#BC00FF] text-white rounded-2xl font-black uppercase text-[10px]">Añadir</button>
                    </div>
                </form>
            )}

            <div className="space-y-3 flex-1 overflow-y-auto scroll-hide">
                {tasksForWeek.filter(t => t.quadrant === q).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                        <span className="text-4xl mb-2">⚡</span>
                        <p className="mono text-[8px] font-black uppercase tracking-widest">Zona Despejada</p>
                    </div>
                ) : (
                    tasksForWeek.filter(t => t.quadrant === q).map(task => {
                        const role = state.roles.find(r => r.id === task.roleId);
                        return (
                            <div 
                              key={task.id} 
                              className={`bg-white/[0.03] p-4 rounded-2xl border border-white/5 transition-all ${task.completed ? 'opacity-30 desaturate-0' : 'hover:border-white/10 shadow-sm'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <button 
                                        onClick={() => toggleTask(task.id)}
                                        className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${task.completed ? 'bg-[#BC00FF] border-[#BC00FF]' : 'border-white/20 hover:border-[#BC00FF]/50'}`}
                                    >
                                        {task.completed && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-full border border-white/5">
                                                <span className="text-[10px]">{role?.icon}</span>
                                                <span className="mono text-[7px] font-black uppercase text-slate-400 tracking-wider truncate max-w-[80px]">{role?.name}</span>
                                            </div>
                                            {task.day !== null && (
                                                <span className="mono text-[7px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/10">
                                                    {DAYS_OF_WEEK[task.day]}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm font-bold text-slate-200 leading-snug ${task.completed ? 'line-through text-slate-500' : ''}`}>
                                            {task.title}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <select 
                                            value={task.quadrant}
                                            onChange={(e) => updateQuadrant(task.id, e.target.value as Quadrant)}
                                            className="bg-black/40 text-[7px] font-black uppercase text-slate-500 border border-white/5 rounded-lg px-2 py-1 outline-none appearance-none hover:text-[#BC00FF]"
                                        >
                                            {quadrants.map(quad => <option key={quad} value={quad}>Q{quad}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatrixView;
