
import React, { useState, useEffect } from 'react';
import { AppState, Task } from '../types';
import { DAYS_OF_WEEK } from '../constants';

interface PlannerViewProps {
  state: AppState;
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  moveTask: (id: string, day: number | undefined) => void;
  deleteTask: (id: string) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ state, addTask, toggleTask, moveTask, deleteTask }) => {
  const [selectedRoleId, setSelectedRoleId] = useState(state.roles[0]?.id || '');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingBigRock, setIsAddingBigRock] = useState(false);
  const [newBigRockTitle, setNewBigRockTitle] = useState('');
  
  useEffect(() => {
    if (state.roles.length > 0) {
      const exists = state.roles.find(r => r.id === selectedRoleId);
      if (!exists) {
        setSelectedRoleId(state.roles[0].id);
      }
    } else {
      setSelectedRoleId('');
    }
  }, [state.roles, selectedRoleId]);

  const currentRole = state.roles.find(r => r.id === selectedRoleId);
  const bigRocks = state.tasks.filter(t => t.isBigRock);

  const handleAddSimpleTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const roleId = selectedRoleId || (state.roles[0]?.id || '1');

    // Fix: Added missing updatedAt property to satisfy Task type
    const newTask: Task = {
      id: "task_" + Date.now().toString(),
      title: newTaskTitle.trim(),
      roleId: roleId,
      isBigRock: false,
      quadrant: 'I',
      completed: false,
      day: undefined,
      updatedAt: Date.now()
    };

    addTask(newTask);
    setNewTaskTitle('');
  };

  const handleAddBigRock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBigRockTitle.trim()) return;

    const roleId = selectedRoleId || (state.roles[0]?.id || '1');

    // Fix: Added missing updatedAt property to satisfy Task type
    const newTask: Task = {
      id: "rock_" + Date.now().toString(),
      title: newBigRockTitle.trim(),
      roleId: roleId,
      isBigRock: true,
      quadrant: 'II',
      completed: false,
      day: undefined,
      updatedAt: Date.now()
    };

    addTask(newTask);
    setNewBigRockTitle('');
    setIsAddingBigRock(false);
  };

  const tasksForDay = (idx: number) => state.tasks.filter(t => t.day === idx);
  const sandTasks = state.tasks.filter(t => t.day === undefined);

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

      <div className="px-6">
        <form onSubmit={handleAddSimpleTask} className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15.75 14.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM17.25 12.75a.75.75 0 100-1.5.75.75 0 000 1.5zM18 14.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
            </div>
            <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={currentRole ? `¿Qué es vital hoy para ${currentRole.name}?` : "Añade una tarea vital..."}
                className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-12 pr-16 shadow-sm focus:shadow-md outline-none transition-shadow font-medium text-slate-700"
            />
            <button 
                type="submit" 
                disabled={!newTaskTitle.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-400 text-white rounded-full flex items-center justify-center disabled:opacity-30 transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
            </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="px-6 flex justify-between items-center">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">
                Piedras Grandes <span className="ml-2 text-emerald-500 font-bold">{bigRocks.length}</span>
            </h3>
        </div>
        <div className="px-6 flex gap-4 overflow-x-auto scroll-hide">
            {bigRocks.map((rock, idx) => (
                <div 
                  key={rock.id} 
                  className={`min-w-[160px] bg-white rounded-[32px] shadow-sm border border-slate-50 flex flex-col p-4 transition-all ${rock.completed ? 'opacity-40 grayscale' : ''}`}
                >
                    <div 
                      onClick={() => toggleTask(rock.id)}
                      className="h-28 bg-slate-100 rounded-2xl mb-3 flex items-center justify-center text-4xl cursor-pointer hover:bg-slate-200 transition-colors"
                    >
                        {idx % 2 === 0 ? '🌲' : '🌟'}
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{rock.title}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <select 
                        value={rock.day === undefined ? "" : rock.day}
                        onChange={(e) => moveTask(rock.id, e.target.value === "" ? undefined : parseInt(e.target.value))}
                        className="text-[10px] bg-slate-50 rounded px-1 outline-none font-bold text-slate-400 cursor-pointer"
                      >
                        <option value="">Arena</option>
                        {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                      <button onClick={() => deleteTask(rock.id)} className="text-red-300 hover:text-red-500 transition-colors">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                </div>
            ))}
            
            {isAddingBigRock ? (
              <div className="min-w-[160px] bg-white border-2 border-emerald-100 rounded-[32px] p-4 flex flex-col justify-center animate-in zoom-in-95">
                <form onSubmit={handleAddBigRock} className="space-y-2">
                  <input 
                    autoFocus
                    className="w-full text-xs font-bold border-b border-emerald-100 py-1 outline-none"
                    placeholder="Nombre..."
                    value={newBigRockTitle}
                    onChange={(e) => setNewBigRockTitle(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <button type="submit" className="flex-1 bg-emerald-500 text-white text-[9px] font-black py-1 rounded-lg">AÑADIR</button>
                    <button type="button" onClick={() => setIsAddingBigRock(false)} className="px-2 bg-slate-100 text-slate-400 text-[9px] font-black py-1 rounded-lg">X</button>
                  </div>
                </form>
              </div>
            ) : (
              <button 
                  onClick={() => setIsAddingBigRock(true)}
                  className="min-w-[160px] border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-4 gap-2 opacity-50 hover:opacity-100 transition-all focus:outline-none"
              >
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Nueva Piedra</span>
              </button>
            )}
        </div>
      </div>

      <div className="px-6 space-y-6">
        {DAYS_OF_WEEK.map((dayName, idx) => (
          <div key={idx} className="space-y-4">
             <div className="flex items-end gap-3">
                <h2 className="text-3xl font-bold">{dayName}</h2>
                <span className="text-2xl text-slate-300 font-light mb-0.5">{16 + idx}</span>
            </div>

            <div className="space-y-3">
                {tasksForDay(idx).map(task => (
                  <div 
                    key={task.id} 
                    className={`p-5 rounded-[32px] flex items-center gap-4 shadow-sm border ${
                      task.isBigRock ? 'bg-[#4CAF50] text-white' : 'bg-white border-slate-100 text-slate-700'
                    } ${task.completed ? 'opacity-40 grayscale shadow-none' : ''}`}
                  >
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded-full cursor-pointer ${task.isBigRock ? 'accent-white' : 'accent-[#4CAF50]'}`}
                      />
                      <div className="flex-1">
                          <h4 className="font-bold text-base leading-tight">{task.title}</h4>
                      </div>
                      <button 
                        onClick={() => moveTask(task.id, undefined)}
                        className={`p-1 ${task.isBigRock ? 'hover:bg-white/20' : 'hover:bg-slate-100'} rounded`}
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6">
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-xl">🧊</div>
                    <div>
                        <h3 className="font-bold text-slate-800">La Arena</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sandTasks.length} Tareas</p>
                    </div>
                </div>
            </div>
            
            <div className="space-y-2">
                {sandTasks.map(task => (
                  <div key={task.id} className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between group transition-all hover:bg-white hover:shadow-sm">
                    <span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                    <div className="flex gap-2">
                       <select 
                        onChange={(e) => moveTask(task.id, parseInt(e.target.value))}
                        className="text-[10px] bg-white border border-slate-200 rounded px-1 outline-none opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold text-slate-400"
                       >
                         <option value="">Programar...</option>
                         {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                       </select>
                       <button onClick={() => toggleTask(task.id)} className="text-slate-300 hover:text-green-500">
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                       </button>
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