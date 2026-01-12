
import React, { useState } from 'react';
import { AppState, Task } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface PlannerViewProps {
  state: AppState;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  moveTask: (id: string, day: number | null, weekOffset?: number, time?: string) => void;
  deleteTask: (id: string) => void;
  currentWeekOffset: number;
  setCurrentWeekOffset: (val: number | ((prev: number) => number)) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ state, addTask, updateTask, toggleTask, moveTask, deleteTask, currentWeekOffset, setCurrentWeekOffset }) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const getDayInfo = (dayIdx: number) => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    firstDayOfWeek.setDate(diff + (currentWeekOffset * 7) + dayIdx);
    return {
      date: firstDayOfWeek.getDate(),
      month: firstDayOfWeek.toLocaleString('es-ES', { month: 'short' }),
      full: firstDayOfWeek
    };
  };

  const handleAddSimpleTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: "task_" + Date.now().toString(),
      title: newTaskTitle.trim(),
      time: newTaskTime || undefined,
      roleId: selectedAddRole,
      isBigRock: false,
      weekOffset: currentWeekOffset,
      quadrant: 'I',
      completed: false,
      day: null, 
      updatedAt: Date.now()
    };
    addTask(newTask);
    setNewTaskTitle('');
    setNewTaskTime('');
  };

  const [selectedAddRole, setSelectedAddRole] = useState(state.roles[0]?.id || '1');

  const tasksForDay = (idx: number) => 
    state.tasks
      .filter(t => t.day === idx && t.weekOffset === currentWeekOffset)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  
  const sandTasks = state.tasks.filter(t => 
    (t.day === null || t.day === undefined) && 
    t.weekOffset === currentWeekOffset
  );

  const activeRole = state.roles.find(r => r.id === selectedRoleId);

  const handleRoleToggle = (roleId: string) => {
    if (selectedRoleId === roleId) setSelectedRoleId(null);
    else setSelectedRoleId(roleId);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="px-6 flex gap-3 overflow-x-auto scroll-hide">
        {state.roles.map(role => (
          <button 
            key={role.id}
            onClick={() => handleRoleToggle(role.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl whitespace-nowrap transition-all border ${
                selectedRoleId === role.id 
                ? 'bg-[#BC00FF]/20 text-[#BC00FF] border-[#BC00FF]/50 shadow-[0_0_20px_rgba(188,0,255,0.3)]' 
                : 'bg-white/5 text-slate-500 border-white/5 opacity-60 hover:opacity-100'
            }`}
          >
            <span className="text-xl">{role.icon}</span>
            <span className="text-xs font-black uppercase tracking-tight">{role.name}</span>
          </button>
        ))}
      </div>

      <div className="px-6 flex items-center justify-between">
          <button onClick={() => setCurrentWeekOffset(prev => prev - 1)} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-center">
              <h3 className="mono text-[8px] font-black uppercase tracking-[0.4em] text-purple-400">Visión Global {currentWeekOffset !== 0 && `(Semana ${currentWeekOffset})`}</h3>
              <p className="text-lg font-black text-white mt-0.5 tracking-tighter uppercase italic">{getDayInfo(0).date} {getDayInfo(0).month} — {getDayInfo(6).date} {getDayInfo(6).month}</p>
          </div>
          <button onClick={() => setCurrentWeekOffset(prev => prev + 1)} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
      </div>

      {/* Input de Captura Rápida con Selector de Rol */}
      <div className="px-6">
        <div className="space-y-3">
            <form onSubmit={handleAddSimpleTask} className="bg-[#131B2E] p-1.5 flex items-center shadow-2xl rounded-3xl border border-[#BC00FF]/20">
                <input 
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="bg-black/40 text-purple-400 text-[10px] font-black p-3 rounded-2xl outline-none ml-2 border border-white/10 uppercase"
                />
                <input 
                    type="text" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Capturar en la arena..."
                    className="flex-1 px-4 py-3 bg-transparent outline-none font-medium text-slate-200 placeholder:text-slate-600 text-sm"
                />
                <button 
                    type="submit" 
                    disabled={!newTaskTitle.trim()}
                    className="w-12 h-12 bg-[#BC00FF] text-white rounded-2xl flex items-center justify-center disabled:opacity-20 mr-1 shadow-lg active:scale-90 transition-all"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
                </button>
            </form>
            <div className="flex gap-2 overflow-x-auto scroll-hide px-1">
                <span className="mono text-[7px] font-black text-slate-600 uppercase pt-2.5 shrink-0">Vincular Rol:</span>
                {state.roles.map(r => (
                    <button 
                        key={r.id}
                        onClick={() => setSelectedAddRole(r.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[9px] font-black uppercase ${
                            selectedAddRole === r.id ? 'bg-[#BC00FF]/20 border-[#BC00FF]/50 text-white' : 'bg-white/5 border-white/5 text-slate-500'
                        }`}
                    >
                        <span>{r.icon}</span>
                        <span>{r.name}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>

      <section className="px-6 space-y-4">
        <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            <h2 className="text-xl font-black uppercase tracking-tighter italic text-amber-500/80">Arena Neural</h2>
        </div>
        {sandTasks.length === 0 ? (
          <p className="text-[10px] mono text-slate-700 uppercase px-2 italic">Despejado</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sandTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                roles={state.roles}
                isHighlighted={!selectedRoleId || task.roleId === selectedRoleId}
                isDimmed={selectedRoleId !== null && task.roleId !== selectedRoleId}
                isExpanded={expandedTaskId === task.id} 
                onToggle={() => toggleTask(task.id)} 
                onExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} 
                onMove={(d) => moveTask(task.id, d, currentWeekOffset)} 
                onUpdate={(upd) => updateTask(task.id, upd)} 
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="px-6 space-y-10">
        {DAYS_OF_WEEK.map((dayName, idx) => {
          const info = getDayInfo(idx);
          const isToday = currentWeekOffset === 0 && new Date().getDay() === (idx + 1 === 7 ? 0 : idx + 1);
          const dayTasks = tasksForDay(idx);
          
          return (
            <div key={idx} className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className={`w-1 h-5 rounded-full ${isToday ? 'bg-[#BC00FF] shadow-[0_0_10px_#BC00FF]' : 'bg-slate-800'}`}></div>
                  <h2 className={`text-xl font-black uppercase tracking-tighter italic ${isToday ? 'text-white' : 'text-slate-500'}`}>{dayName}</h2>
                  <span className={`mono text-xs font-bold ${isToday ? 'text-purple-400' : 'text-slate-700'}`}>{info.date} {info.month}</span>
              </div>
              <div className="space-y-3">
                  {dayTasks.length === 0 ? (
                    <p className="mono text-[7px] text-slate-800 uppercase px-4 py-2 italic tracking-widest">Sin registros</p>
                  ) : dayTasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        roles={state.roles}
                        isHighlighted={!selectedRoleId || task.roleId === selectedRoleId}
                        isDimmed={selectedRoleId !== null && task.roleId !== selectedRoleId}
                        isExpanded={expandedTaskId === task.id} 
                        onToggle={() => toggleTask(task.id)} 
                        onExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} 
                        onMove={(d) => moveTask(task.id, d, currentWeekOffset)} 
                        onUpdate={(upd) => updateTask(task.id, upd)} 
                        onDelete={() => deleteTask(task.id)}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskCard = ({ task, roles, isHighlighted, isDimmed, isExpanded, onToggle, onExpand, onMove, onUpdate, onDelete }: any) => {
    const role = roles.find((r: any) => r.id === task.roleId);
    
    return (
        <div className={`bg-[#131B2E] rounded-[24px] overflow-hidden border transition-all duration-300 relative ${
            isHighlighted && !isDimmed ? 'border-white/10 shadow-xl' : 'border-white/5'
        } ${isDimmed ? 'opacity-20 desaturate-[0.8]' : 'opacity-100'} ${task.completed ? 'opacity-30' : ''}`}>
            
            {/* Indicador de Rol Lateral */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#BC00FF] opacity-30 shadow-[0_0_10px_#BC00FF]"></div>

            <div className="p-4 flex items-center gap-4">
                <button 
                    onClick={onToggle}
                    className={`shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-[#BC00FF] border-[#BC00FF]' : 'border-white/10 hover:border-[#BC00FF]/50'}`}
                >
                    {task.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>}
                </button>
                
                <div className="flex-1 min-w-0" onClick={onExpand}>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 rounded-full border border-white/5">
                            <span className="text-[10px]">{role?.icon}</span>
                            <span className="mono text-[7px] font-black uppercase text-purple-400 tracking-widest">{role?.name}</span>
                        </div>
                        {task.time && <span className="mono text-[8px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{task.time}</span>}
                    </div>
                    <h4 className="font-bold text-sm text-slate-200 leading-snug">{task.title}</h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <select 
                        value={task.day === null ? 'arena' : task.day}
                        onChange={(e) => onMove(e.target.value === 'arena' ? null : parseInt(e.target.value))}
                        className="bg-black/50 text-[8px] font-black uppercase text-slate-500 border border-white/5 rounded-lg px-2 py-2 outline-none appearance-none"
                    >
                        <option value="arena">Arena</option>
                        {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                </div>
            </div>
            {isExpanded && (
                <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 border-t border-white/5 pt-4">
                    <div className="space-y-2">
                        <label className="mono text-[7px] font-black uppercase text-purple-400 tracking-widest">Contexto Neural</label>
                        <textarea 
                            className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-xs text-slate-300 min-h-[100px] outline-none focus:border-[#BC00FF]/30"
                            placeholder="Añadir detalles críticos o contexto..."
                            value={task.description || ''}
                            onChange={(e) => onUpdate({ description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mono text-[7px] font-black uppercase text-slate-500 tracking-widest block mb-1.5">Impacto Q</label>
                            <select 
                                className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-xs text-white outline-none"
                                value={task.quadrant}
                                onChange={(e) => onUpdate({ quadrant: e.target.value as any, isBigRock: e.target.value === 'II' })}
                            >
                                <option value="I">Q1 Crítico</option>
                                <option value="II">Q2 Estratégico</option>
                                <option value="III">Q3 Delegar</option>
                                <option value="IV">Q4 Eliminar</option>
                            </select>
                        </div>
                        <div>
                            <label className="mono text-[7px] font-black uppercase text-slate-500 tracking-widest block mb-1.5">Reasignar Rol</label>
                            <select 
                                className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-xs text-white outline-none"
                                value={task.roleId}
                                onChange={(e) => onUpdate({ roleId: e.target.value })}
                            >
                                {roles.map((r: any) => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button onClick={onDelete} className="text-[9px] font-black uppercase text-red-500/50 hover:text-red-500 transition-colors">Eliminar Tarea</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlannerView;
