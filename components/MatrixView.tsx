
import React, { useState } from 'react';
import { AppState, Task, Quadrant } from '../types';
import { QUADRANTS } from '../constants';

interface MatrixViewProps {
  state: AppState;
  updateQuadrant: (taskId: string, q: Quadrant) => void;
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
}

const MatrixView: React.FC<MatrixViewProps> = ({ state, updateQuadrant, addTask, toggleTask }) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [addingInQuadrant, setAddingInQuadrant] = useState<Quadrant | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  
  const quadrants: Quadrant[] = ['I', 'II', 'III', 'IV'];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !addingInQuadrant) return;

    const roleId = state.roles.length > 0 ? state.roles[0].id : '1';

    // Fix: Added missing updatedAt property to satisfy Task type
    const newTask: Task = {
      id: "matrix_" + Date.now().toString(),
      title: newGoalTitle.trim(),
      roleId: roleId,
      isBigRock: addingInQuadrant === 'II',
      quadrant: addingInQuadrant,
      completed: false,
      day: undefined,
      updatedAt: Date.now()
    };

    addTask(newTask);
    setNewGoalTitle('');
    setAddingInQuadrant(null);
  };

  return (
    <div className="px-6 space-y-6">
      <div className="flex bg-[#F1F3F5] p-1.5 rounded-2xl w-full">
        <button 
            onClick={() => setViewMode('matrix')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'matrix' ? 'bg-white shadow-sm text-[#4CAF50]' : 'text-slate-500'}`}
        >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Vista Matriz
        </button>
        <button 
            onClick={() => setViewMode('list')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#4CAF50]' : 'text-slate-500'}`}
        >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
            Vista Lista
        </button>
      </div>

      <div className="bg-[#E2FFE9] p-5 rounded-[32px] flex items-start gap-4 border border-[#CCF8D5]">
        <div className="bg-white/60 p-2.5 rounded-2xl text-2xl">✨</div>
        <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#2D3436]">Enfoque Semanal</h4>
            <p className="text-xs text-[#2D3436]/70 leading-relaxed font-medium">
                Tienes {state.tasks.filter(t => t.quadrant === 'I').length} tareas críticas. No olvides tus Piedras Grandes de Q2.
            </p>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <div className="grid grid-cols-2 gap-4 pb-10">
          {quadrants.map(q => (
            <div key={q} className={`min-h-[220px] p-4 rounded-[32px] border-2 flex flex-col transition-all ${QUADRANTS[q].color}`}>
              <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      <h3 className="text-[10px] font-black uppercase tracking-wider">{QUADRANTS[q].title}</h3>
                  </div>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto scroll-hide">
                  {state.tasks.filter(t => t.quadrant === q).map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => toggleTask(task.id)}
                        className={`bg-white p-3 rounded-2xl shadow-sm border border-slate-50 relative group cursor-pointer transition-all hover:shadow-md ${task.completed ? 'opacity-40 grayscale' : ''}`}
                      >
                          <p className={`text-[11px] font-bold text-slate-800 leading-tight mb-1 ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
                          {task.isBigRock && (
                              <div className="flex items-center gap-1 text-[9px] text-indigo-500 font-bold uppercase">
                                  ROCK
                              </div>
                          )}
                      </div>
                  ))}
                  
                  {addingInQuadrant === q ? (
                    <div className="bg-white p-2 rounded-2xl border-2 border-current shadow-lg animate-in fade-in zoom-in-95 duration-200">
                      <form onSubmit={handleAddGoal}>
                        <input 
                          autoFocus
                          className="w-full text-[10px] font-bold p-1 outline-none text-slate-800"
                          placeholder="Título..."
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                        />
                        <div className="flex gap-1 mt-1">
                          <button type="submit" className="flex-1 bg-current text-white text-[9px] font-black py-1 rounded">OK</button>
                          <button type="button" onClick={() => setAddingInQuadrant(null)} className="px-2 bg-slate-100 text-slate-400 text-[9px] font-black py-1 rounded">X</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setAddingInQuadrant(q)}
                      className="w-full py-3 border-2 border-dashed border-current/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-all focus:outline-none"
                    >
                        <svg className="w-3 h-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Añadir Meta
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 pb-10">
          {quadrants.map(q => (
            <div key={q} className="space-y-2">
               <div className="flex items-center gap-2 px-2">
                 <span className="text-sm">{QUADRANTS[q].icon}</span>
                 <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest">{QUADRANTS[q].title}</h4>
               </div>
               <div className="space-y-2">
                 {state.tasks.filter(t => t.quadrant === q).map(task => (
                   <div key={task.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm transition-all hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={task.completed} 
                          onChange={() => toggleTask(task.id)}
                          className="w-4 h-4 accent-[#4CAF50] cursor-pointer"
                        />
                        <span className={`text-sm font-bold ${task.completed ? 'line-through text-slate-300' : 'text-slate-700'}`}>{task.title}</span>
                      </div>
                      <select 
                        value={task.quadrant} 
                        onChange={(e) => updateQuadrant(task.id, e.target.value as Quadrant)}
                        className="text-[10px] font-bold bg-slate-100 border-none outline-none rounded p-1 text-slate-500 cursor-pointer"
                      >
                        {quadrants.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatrixView;