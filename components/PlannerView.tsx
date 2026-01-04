
import React, { useState } from 'react';
import { AppState, Task } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface PlannerViewProps {
  state: AppState;
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  moveTask: (id: string, day: number | null, weekOffset?: number, time?: string) => void;
  deleteTask: (id: string) => void;
  currentWeekOffset: number;
  setCurrentWeekOffset: (val: number | ((prev: number) => number)) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ state, addTask, toggleTask, moveTask, deleteTask, currentWeekOffset, setCurrentWeekOffset }) => {
  const [selectedRoleId, setSelectedRoleId] = useState(state.roles[0]?.id || '');
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
    const roleId = selectedRoleId || (state.roles[0]?.id || '1');
    const newTask: Task = {
      id: "task_" + Date.now().toString(),
      title: newTaskTitle.trim(),
      time: newTaskTime || undefined,
      roleId: roleId,
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

  const tasksForDay = (idx: number) => 
    state.tasks
      .filter(t => t.day === idx && t.weekOffset === currentWeekOffset)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  
  // FILTRO ARENA: Captura todo lo que no tenga día asignado en la semana actual
  const sandTasks = state.tasks.filter(t => 
    (t.day === null || t.day === undefined) && 
    t.weekOffset === currentWeekOffset
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="px-6 flex gap-3 overflow-x-auto scroll-hide">
        {state.roles.map(role => (
          <button 
            key={role.id}
            onClick={() => setSelectedRoleId(role.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap transition-all border ${
                selectedRoleId === role.id ? 'bg-[#1A1C1E] text-white shadow-lg border-transparent' : 'bg-white text-slate-600 border-slate-100'
            }`}
          >
            <span className="text-lg">{role.icon}</span>
            <span className="text-sm font-bold">{role.name}</span>
          </button>
        ))}
      </div>

      <div className="px-6 flex items-center justify-between">
          <button onClick={() => setCurrentWeekOffset(prev => prev - 1)} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
          <div className="text-center">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-500">
                {currentWeekOffset === 0 ? 'Esta Semana' : currentWeekOffset === 1 ? 'Próxima Semana' : currentWeekOffset === -1 ? 'Semana Pasada' : `Semana ${currentWeekOffset}`}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{getDayInfo(0).date} {getDayInfo(0).month} - {getDayInfo(6).date} {getDayInfo(6).month}</p>
          </div>
          <button onClick={() => setCurrentWeekOffset(prev => prev + 1)} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" strokeWidth="2.5" /></svg></button>
      </div>

      <div className="px-6">
        <form onSubmit={handleAddSimpleTask} className="bg-white border border-slate-100 rounded-[32px] p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <input 
                type="time"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="bg-slate-50 text-slate-500 text-xs font-bold p-3 rounded-2xl outline-none ml-2 border border-slate-100"
            />
            <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={`Añadir a la arena...`}
                className="flex-1 px-4 py-3 outline-none font-medium text-slate-700"
            />
            <button 
                type="submit" 
                disabled={!newTaskTitle.trim()}
                className="w-10 h-10 bg-emerald-400 text-white rounded-full flex items-center justify-center disabled:opacity-30 mr-1"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
            </button>
        </form>
      </div>

      <div className="px-6 space-y-8">
        {DAYS_OF_WEEK.map((dayName, idx) => {
          const info = getDayInfo(idx);
          const isToday = currentWeekOffset === 0 && new Date().getDay() === (idx + 1 === 7 ? 0 : idx + 1);
          
          return (
            <div key={idx} className="space-y-4">
               <div className="flex items-end gap-3">
                  <h2 className={`text-3xl font-bold ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>{dayName}</h2>
                  <span className={`text-2xl font-light mb-0.5 ${isToday ? 'text-indigo-300' : 'text-slate-300'}`}>{info.date}</span>
              </div>

              <div className="space-y-3">
                  {tasksForDay(idx).length === 0 && (
                      <div className="py-4 px-6 border border-dashed border-slate-100 rounded-[32px] text-center">
                          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Sin tareas</p>
                      </div>
                  )}
                  {tasksForDay(idx).map(task => (
                    <div 
                      key={task.id} 
                      className={`rounded-[32px] overflow-hidden flex flex-col shadow-sm border ${
                        task.isBigRock ? 'bg-[#4CAF50] text-white border-transparent' : 'bg-white border-slate-100 text-slate-700'
                      } ${task.completed ? 'opacity-40 grayscale' : ''}`}
                    >
                        <div className="p-5 flex items-center gap-4">
                          <input 
                              type="checkbox" 
                              checked={task.completed} 
                              onChange={() => toggleTask(task.id)}
                              className={`w-5 h-5 rounded-full cursor-pointer ${task.isBigRock ? 'accent-white' : 'accent-[#4CAF50]'}`}
                          />
                          <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {task.time && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${task.isBigRock ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{task.time}</span>}
                                <h4 className="font-bold text-base leading-tight">{task.title}</h4>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {task.projectId && <span className="text-[8px] bg-black/10 px-1.5 py-0.5 rounded-full font-black uppercase">Proyecto</span>}
                                {task.description && <span onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className="text-[9px] font-black uppercase opacity-70 cursor-pointer">🔽 Guía</span>}
                              </div>
                          </div>
                          
                          <select 
                              value={idx}
                              onChange={(e) => {
                                  const val = e.target.value;
                                  moveTask(task.id, val === 'arena' ? null : parseInt(val), currentWeekOffset);
                              }}
                              className={`text-[10px] font-black uppercase rounded-lg px-2 py-1.5 outline-none border ${
                                  task.isBigRock ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}
                          >
                              {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                              <option value="arena">🏖️ Arena</option>
                          </select>
                        </div>

                        {expandedTaskId === task.id && task.description && (
                            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2">
                                <div className={`p-5 rounded-2xl text-[11px] font-medium ${task.isBigRock ? 'bg-white/20' : 'bg-slate-50 text-slate-600'}`}>
                                    {task.description}
                                </div>
                            </div>
                        )}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6">
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col gap-4 shadow-sm">
            <div className="text-center">
                <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Bandeja de Arena</h3>
                <p className="text-[9px] text-slate-300 uppercase font-bold mt-1">Asigna un día a tus Piedras Grandes (Q2)</p>
            </div>
            <div className="space-y-3">
                {sandTasks.length === 0 && (
                    <div className="text-center py-4 opacity-30">
                        <p className="text-xs font-bold italic">La arena está vacía por ahora...</p>
                    </div>
                )}
                {sandTasks.map(task => (
                  <div key={task.id} className={`p-5 rounded-2xl flex flex-col gap-2 border shadow-sm ${task.isBigRock ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-transparent'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            {task.isBigRock && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter mb-0.5">PIEDRA GRANDE (Q2)</span>}
                            <span className={`text-sm font-bold text-slate-700`}>{task.title}</span>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="time" 
                                className="text-[10px] bg-white border border-slate-200 rounded-lg px-1.5 py-1 font-bold text-slate-400"
                                onChange={(e) => moveTask(task.id, null, currentWeekOffset, e.target.value)}
                                value={task.time || ''}
                            />
                            <select 
                                value="arena"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val !== 'arena') moveTask(task.id, parseInt(val), currentWeekOffset, task.time);
                                }}
                                className="text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none font-bold text-indigo-500"
                            >
                                <option value="arena">🏖️ Programar</option>
                                {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i.toString()}>{d}</option>)}
                            </select>
                            <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-300 hover:text-red-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    </div>
                  </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerView;
