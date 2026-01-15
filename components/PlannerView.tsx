
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Task, Quadrant, Role } from '../types';
import { DAYS_OF_WEEK } from '../constants';

const NeuralFeedback = {
  play: (type: 'pickup' | 'drop' | 'delete' | 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'pickup') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      } else if (type === 'drop') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      } else if (type === 'delete') {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => ctx.close(), 500);
    } catch (e) {}
  }
};

const MOTIVATIONAL_PHRASES = [
  "La disciplina es el puente entre las metas y los logros.",
  "No te detengas cuando estés cansado, detente cuando hayas terminado.",
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "Tu futuro se crea por lo que haces hoy, no mañana.",
  "La excelencia no es un acto, sino un hábito."
];

interface PlannerViewProps {
  state: AppState;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  moveTask: (id: string, day: number | null, weekOffset?: number) => void;
  deleteTask: (id: string) => void;
  currentWeekOffset: number;
  setCurrentWeekOffset: (val: number | ((prev: number) => number)) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ state, addTask, updateTask, toggleTask, moveTask, deleteTask, currentWeekOffset, setCurrentWeekOffset }) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [timeMode, setTimeMode] = useState<'CLOCK' | 'BLOCK'>('CLOCK');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | 'arena' | null>(null);
  const [selectedAddRole, setSelectedAddRole] = useState(state.roles[0]?.id || '1');
  const [phrase] = useState(() => MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]);

  const todayIndex = (new Date().getDay() + 6) % 7;

  const getDayInfo = (dayIdx: number) => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    firstDayOfWeek.setDate(diff + (currentWeekOffset * 7) + dayIdx);
    return {
      date: firstDayOfWeek.getDate(),
      month: firstDayOfWeek.toLocaleString('es-ES', { month: 'short' })
    };
  };

  const handleAddSimpleTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: "task_" + Date.now().toString(),
      title: newTaskTitle.trim(),
      time: newTaskTime || undefined,
      duration: 30,
      timerElapsed: 0,
      roleId: selectedAddRole,
      isBigRock: false,
      weekOffset: currentWeekOffset,
      quadrant: 'II',
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
  
  const sandTasks = state.tasks.filter(t => (t.day === null || t.day === undefined) && t.weekOffset === currentWeekOffset);

  const handleDragOver = (e: React.DragEvent, target: number | 'arena') => {
    e.preventDefault();
    if (dragOverDay !== target) setDragOverDay(target);
  };

  const handleDrop = (e: React.DragEvent, target: number | 'arena') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setDragOverDay(null);
    if (taskId) {
      moveTask(taskId, target === 'arena' ? null : target, currentWeekOffset);
      NeuralFeedback.play('drop');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="px-6 pt-4 animate-entry">
          <div className="bg-[#BC00FF]/10 border border-[#BC00FF]/20 p-6 rounded-[32px] backdrop-blur-md">
              <div className="flex items-start gap-4">
                  <span className="text-2xl">✨</span>
                  <p className="text-sm font-black italic uppercase tracking-tight leading-snug text-white/90">
                      "{phrase}"
                  </p>
              </div>
          </div>
      </div>

      <div className="px-6 flex gap-3 overflow-x-auto scroll-hide">
        {state.roles.map(role => (
          <button 
            key={role.id}
            onClick={() => setSelectedRoleId(selectedRoleId === role.id ? null : role.id)}
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

      <div className="px-6">
        <form onSubmit={handleAddSimpleTask} className="bg-[#131B2E] p-1.5 flex items-center shadow-2xl rounded-3xl border border-[#BC00FF]/20">
            <div className="flex bg-black/40 rounded-2xl ml-1 p-1">
              <button type="button" onClick={() => setTimeMode('CLOCK')} className={`px-3 py-2 rounded-xl ${timeMode === 'CLOCK' ? 'bg-[#BC00FF] text-white' : 'text-slate-600'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
              <button type="button" onClick={() => setTimeMode('BLOCK')} className={`px-3 py-2 rounded-xl ${timeMode === 'BLOCK' ? 'bg-[#BC00FF] text-white' : 'text-slate-600'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
            </div>
            <input 
                type={timeMode === 'CLOCK' ? "time" : "text"}
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                placeholder={timeMode === 'BLOCK' ? "BLOQUE" : ""}
                className="w-24 bg-transparent text-purple-400 text-[10px] font-black p-3 outline-none"
            />
            <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Capturar en la arena..."
                className="flex-1 px-4 py-3 bg-transparent outline-none font-medium text-slate-200 text-sm"
            />
            <button type="submit" className="w-12 h-12 bg-[#BC00FF] text-white rounded-2xl flex items-center justify-center mr-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
            </button>
        </form>
      </div>

      <section 
        className={`mx-6 p-4 rounded-[32px] border-2 border-dashed transition-all ${dragOverDay === 'arena' ? 'border-[#BC00FF] bg-[#BC00FF]/10' : 'border-white/5'}`}
        onDragOver={(e) => handleDragOver(e, 'arena')}
        onDrop={(e) => handleDrop(e, 'arena')}
      >
        <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            <h2 className="text-xl font-black uppercase tracking-tighter italic text-amber-500/80">Arena Neural</h2>
        </div>
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
              onUpdate={(upd) => updateTask(task.id, upd)} 
              onDelete={() => { NeuralFeedback.play('delete'); deleteTask(task.id); }}
              onMoveToArena={() => moveTask(task.id, null, currentWeekOffset)}
            />
          ))}
        </div>
      </section>

      <div className="px-6 space-y-10">
        {DAYS_OF_WEEK.map((dayName, idx) => {
          const isToday = currentWeekOffset === 0 && idx === todayIndex;
          return (
            <div 
                key={idx} 
                className={`space-y-4 p-5 rounded-[36px] border-2 transition-all duration-500 ${
                  isToday 
                    ? 'border-[#BC00FF]/40 bg-[#131B2E] shadow-[0_20px_50px_rgba(188,0,255,0.1)]' 
                    : dragOverDay === idx 
                      ? 'border-[#BC00FF] bg-[#BC00FF]/10' 
                      : 'border-transparent'
                }`}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
            >
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className={`w-1 h-6 rounded-full ${isToday ? 'bg-[#BC00FF] shadow-[0_0_10px_#BC00FF]' : 'bg-slate-800'}`}></div>
                      <h2 className={`text-xl font-black uppercase tracking-tighter italic ${isToday ? 'text-white' : 'text-slate-500'}`}>{dayName}</h2>
                      <span className={`mono text-xs font-bold ${isToday ? 'text-purple-400' : 'text-slate-700'}`}>{getDayInfo(idx).date} {getDayInfo(idx).month}</span>
                  </div>
              </div>
              <div className="space-y-3">
                  {tasksForDay(idx).map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        roles={state.roles}
                        isHighlighted={!selectedRoleId || task.roleId === selectedRoleId}
                        isDimmed={selectedRoleId !== null && task.roleId !== selectedRoleId}
                        isExpanded={expandedTaskId === task.id} 
                        onToggle={() => toggleTask(task.id)} 
                        onExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} 
                        onUpdate={(upd) => updateTask(task.id, upd)} 
                        onDelete={() => { NeuralFeedback.play('delete'); deleteTask(task.id); }}
                        onMoveToArena={() => moveTask(task.id, null, currentWeekOffset)}
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

const TaskCard = ({ task, roles, isHighlighted, isDimmed, isExpanded, onToggle, onExpand, onUpdate, onDelete, onMoveToArena }: any) => {
    const [isSparking, setIsSparking] = useState(false);
    const role = roles.find((r: any) => r.id === task.roleId);
    const [timeLeft, setTimeLeft] = useState(task.duration || 30);
    const [isRunning, setIsRunning] = useState(false);
    const [timeSelectorMode, setTimeSelectorMode] = useState<'HORA' | 'BLOQUE'>(task.time?.includes(':') ? 'HORA' : 'BLOQUE');

    useEffect(() => {
        let interval: any;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 1 / 60));
            }, 1000);
        } else if (timeLeft <= 0) {
            setIsRunning(false);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const formatCountdown = (minutes: number) => {
        const mins = Math.floor(minutes);
        const secs = Math.floor((minutes - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleToggleInternal = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!task.completed) {
            setIsSparking(true);
            NeuralFeedback.play('success');
            setTimeout(() => setIsSparking(false), 500);
        }
        onToggle();
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', task.id);
        NeuralFeedback.play('pickup');
    };

    return (
        <div 
            draggable="true"
            onDragStart={handleDragStart}
            className={`bg-[#131B2E] rounded-[24px] overflow-hidden border transition-all duration-300 relative cursor-grab active:cursor-grabbing ${
                isHighlighted && !isDimmed ? 'border-white/10 shadow-xl' : 'border-white/5 opacity-20'
            } ${task.completed ? 'opacity-30' : ''} ${isSparking ? 'animate-spark z-50' : ''}`}
        >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#BC00FF] opacity-30"></div>
            
            <div className="p-4 flex items-center gap-4" onClick={onExpand}>
                <button 
                    onClick={handleToggleInternal}
                    className={`shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-[#BC00FF] border-[#BC00FF]' : 'border-white/10 hover:border-[#BC00FF]/50'}`}
                >
                    {task.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>}
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px]">{role?.icon}</span>
                        <span className="mono text-[7px] font-black uppercase text-purple-400 tracking-widest">{role?.name}</span>
                        <div className="flex-1"></div>
                        <span className="mono text-[8px] font-black text-slate-500">{formatCountdown(timeLeft)}</span>
                    </div>
                    <h4 className={`font-bold text-sm text-slate-200 truncate ${task.completed ? 'line-through text-slate-500' : ''}`}>{task.title}</h4>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsRunning(!isRunning); }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isRunning ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white/5 text-emerald-400 border border-white/10'}`}
                >
                  {isRunning ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                </button>
            </div>
            
            {isExpanded && (
                <div className="px-6 pb-8 pt-4 border-t border-white/5 space-y-8 animate-in slide-in-from-top-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="mono text-[7px] font-black uppercase text-slate-500 tracking-[0.2em]">Sincronía Temporal</label>
                            <div className="flex bg-black/40 rounded-lg p-0.5">
                                <button onClick={() => setTimeSelectorMode('HORA')} className={`px-3 py-1 text-[8px] font-black rounded-md ${timeSelectorMode === 'HORA' ? 'bg-[#BC00FF] text-white' : 'text-slate-600'}`}>HORA</button>
                                <button onClick={() => setTimeSelectorMode('BLOQUE')} className={`px-3 py-1 text-[8px] font-black rounded-md ${timeSelectorMode === 'BLOQUE' ? 'bg-[#BC00FF] text-white' : 'text-slate-600'}`}>BLOQUE</button>
                            </div>
                        </div>
                        <input 
                            type={timeSelectorMode === 'HORA' ? "time" : "text"}
                            value={task.time || ''}
                            onChange={(e) => onUpdate({ time: e.target.value })}
                            placeholder="Ej: Enfoque, Mañana, Deep Work..."
                            className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-xs text-slate-300 outline-none focus:border-[#BC00FF]/30"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="mono text-[7px] font-black uppercase text-slate-500 tracking-[0.2em]">Cronometría (Minutos)</label>
                        <div className="flex gap-2">
                            <select 
                                value={Math.floor(task.duration || 30)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  onUpdate({ duration: val });
                                  setTimeLeft(val);
                                }}
                                className="flex-1 bg-black/40 border border-white/5 p-4 rounded-2xl text-xs text-slate-300 outline-none appearance-none"
                            >
                                <option value="15">15m</option>
                                <option value="30">30m</option>
                                <option value="45">45m</option>
                                <option value="60">60m</option>
                                <option value="90">90m</option>
                                <option value="120">120m</option>
                            </select>
                            <button onClick={() => setTimeLeft(task.duration || 30)} className="px-6 bg-white/5 text-slate-500 rounded-2xl text-[8px] font-black uppercase border border-white/5">Reset</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="mono text-[7px] font-black uppercase text-slate-500 tracking-[0.2em]">Impacto Eisenhower</label>
                        <select 
                            value={task.quadrant}
                            onChange={(e) => onUpdate({ quadrant: e.target.value as Quadrant })}
                            className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-xs text-slate-300 outline-none appearance-none"
                        >
                            <option value="I">Q1 Crítico / Urgente</option>
                            <option value="II">Q2 Estratégico / Valor</option>
                            <option value="III">Q3 Delegable / Ruido</option>
                            <option value="IV">Q4 Eliminar / Distracción</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="mono text-[7px] font-black uppercase text-slate-500 tracking-[0.2em]">Esfera de Rol</label>
                        <select 
                            value={task.roleId}
                            onChange={(e) => onUpdate({ roleId: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-xs text-slate-300 outline-none appearance-none"
                        >
                            {roles.map((r: Role) => (
                                <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="mono text-[7px] font-black uppercase text-slate-500 tracking-[0.2em]">Contexto Neural</label>
                        <textarea 
                            className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-xs text-slate-300 min-h-[100px] outline-none focus:border-[#BC00FF]/30"
                            placeholder="Notas estratégicas..."
                            value={task.description || ''}
                            onChange={(e) => onUpdate({ description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/5">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMoveToArena(); }}
                            className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl text-[8px] font-black uppercase tracking-widest border border-white/5"
                        >
                            Mover a Arena
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-2xl text-[8px] font-black uppercase tracking-widest border border-red-500/20"
                        >
                            Purgar Tarea
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlannerView;
