
import React, { useState } from 'react';
import { AppState, Task, Quadrant } from '../types';
import { QUADRANTS } from '../constants';

interface MatrixViewProps {
  state: AppState;
  updateQuadrant: (taskId: string, q: Quadrant) => void;
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  currentWeekOffset: number;
  setCurrentWeekOffset: (val: number | ((prev: number) => number)) => void;
}

const MatrixView: React.FC<MatrixViewProps> = ({ state, updateQuadrant, addTask, toggleTask, currentWeekOffset, setCurrentWeekOffset }) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [addingInQuadrant, setAddingInQuadrant] = useState<Quadrant | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  
  const quadrants: Quadrant[] = ['I', 'II', 'III', 'IV'];

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !addingInQuadrant) return;

    const roleId = state.roles.length > 0 ? state.roles[0].id : '1';

    const newTask: Task = {
      id: "matrix_" + Date.now().toString(),
      title: newGoalTitle.trim(),
      roleId: roleId,
      isBigRock: addingInQuadrant === 'II', 
      weekOffset: currentWeekOffset,
      quadrant: addingInQuadrant,
      completed: false,
      day: null, // Explícitamente null para que aparezca en la Arena del Planner
      updatedAt: Date.now()
    };

    addTask(newTask);
    setNewGoalTitle('');
    setAddingInQuadrant(null);
  };

  const tasksForWeek = state.tasks.filter(t => t.weekOffset === currentWeekOffset);

  return (
    <div className="px-6 space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
          <button onClick={() => setCurrentWeekOffset(prev => prev - 1)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-center">
            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest block">Categorizando</span>
            <span className="text-xs font-bold text-slate-700">
                {currentWeekOffset === 0 ? 'Esta Semana' : currentWeekOffset === 1 ? 'Próxima Semana' : currentWeekOffset === -1 ? 'Semana Pasada' : `Semana ${currentWeekOffset}`}
            </span>
          </div>
          <button onClick={() => setCurrentWeekOffset(prev => prev + 1)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
      </div>

      <div className="flex bg-[#F1F3F5] p-1.5 rounded-2xl w-full">
        <button onClick={() => setViewMode('matrix')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'matrix' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Matriz</button>
        <button onClick={() => setViewMode('list')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Lista</button>
      </div>

      {viewMode === 'matrix' ? (
        <div className="grid grid-cols-2 gap-4 pb-10">
          {quadrants.map(q => (
            <div key={q} className={`min-h-[200px] p-4 rounded-[32px] border-2 flex flex-col transition-all ${QUADRANTS[q].color}`}>
              <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs">{QUADRANTS[q].icon}</span>
                  <h3 className="text-[10px] font-black uppercase tracking-wider">{QUADRANTS[q].title}</h3>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto scroll-hide">
                  {tasksForWeek.filter(t => t.quadrant === q).map(task => (
                      <div key={task.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-50 animate-in fade-in zoom-in-95">
                          <p className={`text-[10px] font-bold text-slate-800 leading-tight ${task.completed ? 'line-through opacity-40' : ''}`}>{task.title}</p>
                          {task.isBigRock && <div className="text-[8px] text-emerald-500 font-black uppercase mt-1">ROCK</div>}
                      </div>
                  ))}
                  
                  {addingInQuadrant === q ? (
                    <div className="bg-white p-2 rounded-2xl border-2 border-current shadow-lg animate-in zoom-in-95">
                      <form onSubmit={handleAddGoal}>
                        <input autoFocus className="w-full text-[10px] font-bold p-1 outline-none text-slate-800" placeholder="Título..." value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} />
                        <button type="submit" className="w-full bg-current text-white text-[9px] font-black py-1 rounded mt-1">AÑADIR</button>
                      </form>
                    </div>
                  ) : (
                    <button onClick={() => setAddingInQuadrant(q)} className="w-full py-3 border-2 border-dashed border-current/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center opacity-60 hover:opacity-100 focus:outline-none">+</button>
                  )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 pb-10">
          {quadrants.map(q => (
            <div key={q} className="space-y-2">
               <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest px-2">{QUADRANTS[q].title}</h4>
               <div className="space-y-2">
                 {tasksForWeek.filter(t => t.quadrant === q).map(task => (
                   <div key={task.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="w-4 h-4 accent-indigo-600" />
                        <span className={`text-sm font-bold ${task.completed ? 'line-through text-slate-300' : 'text-slate-700'}`}>{task.title}</span>
                      </div>
                      <select value={task.quadrant} onChange={(e) => updateQuadrant(task.id, e.target.value as Quadrant)} className="text-[10px] font-bold bg-slate-50 rounded p-1 text-slate-500">
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
