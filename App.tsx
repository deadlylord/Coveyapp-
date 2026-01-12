
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import CompassView from './components/CompassView';
import PlannerView from './components/PlannerView';
import MatrixView from './components/MatrixView';
import MethodologyView from './components/MethodologyView';
import ProjectsView from './components/ProjectsView';
import AICoachPanel from './components/AICoachPanel';
import { AppState, ViewType, Task, Role, Quadrant, SyncStatus, Project, CoachMode, ChatMessage } from './types';

const LOCAL_STORAGE_KEY = 'core_assist_local_v7';
const CURRENT_VERSION = 7;

const INITIAL_STATE: AppState = {
  userName: "",
  coachMode: "STRATEGIST",
  mission: { text: "Vivir con integridad y priorizar el impacto estratégico.", updatedAt: Date.now() },
  roles: [
    { id: '1', name: 'Individual', icon: '🧠', goal: 'Optimizar energía biológica.', color: 'bg-emerald-500', createdAt: Date.now(), updatedAt: Date.now() },
    { id: '2', name: 'Empresario', icon: '💼', goal: 'Escalar sistemas de negocio y ROI.', color: 'bg-blue-500', createdAt: Date.now(), updatedAt: Date.now() },
  ],
  tasks: [],
  projects: [],
  coachMessages: [],
  version: CURRENT_VERSION
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('PLANNER');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  
  // Carga inicial desde LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error("Error al cargar datos locales:", e);
        setState(INITIAL_STATE);
      }
    }
    setIsLoaded(true);
    setSyncStatus('local');
  }, []);

  // Función de guardado persistente
  const saveToLocal = (newState: AppState) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
  };

  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
        const newState = updater(prev);
        saveToLocal(newState);
        return newState;
    });
  };

  // Handlers de Estado
  const updateUserName = (name: string) => updateState(prev => ({ ...prev, userName: name }));
  const updateCoachMode = (mode: CoachMode) => updateState(prev => ({ ...prev, coachMode: mode }));
  const addCoachMessage = (msg: ChatMessage) => updateState(prev => ({ ...prev, coachMessages: [...(prev.coachMessages || []), msg] }));
  const clearCoachMessages = () => updateState(prev => ({ ...prev, coachMessages: [] }));
  const addTask = (task: Task) => updateState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  const updateTask = (id: string, updates: Partial<Task>) => updateState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t) }));
  const toggleTask = (id: string) => updateState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t) }));
  const deleteTask = (id: string) => updateState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const moveTask = (id: string, day: number | null, weekOffset?: number, time?: string) => updateState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, day, weekOffset: weekOffset !== undefined ? weekOffset : t.weekOffset, time: time !== undefined ? time : t.time, updatedAt: Date.now() } : t) }));
  const updateQuadrant = (id: string, quadrant: Quadrant) => updateState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, quadrant, isBigRock: quadrant === 'II' ? true : t.isBigRock, updatedAt: Date.now() } : t) }));
  const updateMission = (text: string) => updateState(prev => ({ ...prev, mission: { text, updatedAt: Date.now() } }));
  const addRole = (role: Role) => updateState(prev => ({ ...prev, roles: [...prev.roles, role] }));
  const deleteRole = (id: string) => updateState(prev => ({ ...prev, roles: prev.roles.filter(r => r.id !== id), tasks: prev.tasks.filter(t => t.roleId !== id), projects: prev.projects.filter(p => p.roleId !== id) }));
  const updateRole = (id: string, updates: Partial<Role>) => updateState(prev => ({ ...prev, roles: prev.roles.map(r => r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r) }));
  const addProject = (project: Project) => updateState(prev => ({ ...prev, projects: [...prev.projects, project] }));
  const updateProject = (id: string, updates: Partial<Project>) => updateState(prev => ({ ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p) }));
  const scheduleProjectTask = (projectId: string, stepId: string, task: Task) => { updateState(prev => ({ ...prev, tasks: [...prev.tasks, task], projects: prev.projects.map(p => p.id === projectId ? { ...p, steps: p.steps.map(s => s.id === stepId ? { ...s, taskId: task.id } : s), updatedAt: Date.now() } : p) })); };

  if (!isLoaded) {
    return (
        <div className="h-screen w-screen bg-[#0A0F1E] flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 border-t-2 border-[#BC00FF] rounded-full animate-spin shadow-[0_0_20px_rgba(188,0,255,0.6)]"></div>
            <div className="text-center px-6">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Core Assist</h2>
                <div className="flex items-center gap-2 justify-center mt-3">
                    <span className="mono text-[10px] text-purple-400 font-bold uppercase tracking-[0.4em]">Local Interface Ready</span>
                </div>
            </div>
        </div>
    );
  }

  if (!state.userName) {
    return (
      <div className="h-screen w-screen bg-[#0A0F1E] flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
              <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-[#BC00FF]/10 rounded-full blur-[120px] animate-pulse"></div>
          </div>
          <div className="relative z-10 w-full max-w-md bg-[#131B2E] p-10 rounded-[48px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] space-y-8 animate-in zoom-in-95 duration-700">
              <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-black rounded-3xl mx-auto flex items-center justify-center border border-white/10 mb-6 shadow-2xl">
                      <span className="text-4xl">🤖</span>
                  </div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Local Booting</h2>
                  <p className="mono text-[8px] font-bold text-slate-500 uppercase tracking-[0.4em]">Sin Dependencias de Nube</p>
              </div>
              <div className="space-y-4">
                  <label className="mono text-[8px] font-black uppercase text-purple-400 tracking-widest px-1">Tu Identificador</label>
                  <input autoFocus type="text" placeholder="Introduce tu alias..." className="w-full p-5 bg-black/40 border border-white/10 rounded-3xl outline-none focus:border-[#BC00FF] text-white font-bold text-lg transition-all" onKeyDown={(e) => { if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value; if (val.trim()) updateUserName(val.trim()); } }} />
                  <p className="text-[10px] text-slate-500 text-center italic px-4">Tus datos se guardan exclusivamente en este navegador (LocalStorage).</p>
              </div>
              <button onClick={() => { const input = document.querySelector('input') as HTMLInputElement; if (input.value.trim()) updateUserName(input.value.trim()); }} className="w-full py-5 bg-[#BC00FF] text-white rounded-3xl font-black uppercase tracking-widest italic shadow-[0_15px_30px_rgba(188,0,255,0.3)] active:scale-95 transition-all">Iniciar Protocolo</button>
          </div>
      </div>
    );
  }

  return (
    <Layout 
      activeView={activeView} 
      setView={setActiveView} 
      onOpenCoach={() => setIsCoachOpen(!isCoachOpen)} 
      syncStatus={syncStatus}
      onReset={() => { if(confirm("¿Confirmar purga total del almacenamiento local? Esta acción es irreversible.")) { localStorage.clear(); window.location.reload(); } }}
    >
      {activeView === 'COMPASS' && <CompassView state={state} updateMission={updateMission} updateUserName={updateUserName} addRole={addRole} deleteRole={deleteRole} updateRole={updateRole} updateRoleGoal={(id, goal) => updateRole(id, { goal })} setView={setActiveView} />}
      {activeView === 'PLANNER' && <PlannerView state={state} addTask={addTask} updateTask={updateTask} toggleTask={toggleTask} moveTask={moveTask} deleteTask={deleteTask} currentWeekOffset={currentWeekOffset} setCurrentWeekOffset={setCurrentWeekOffset} />}
      {activeView === 'MATRIX' && <MatrixView state={state} updateQuadrant={updateQuadrant} addTask={addTask} updateTask={updateTask} toggleTask={toggleTask} moveTask={moveTask} currentWeekOffset={currentWeekOffset} setCurrentWeekOffset={setCurrentWeekOffset} />}
      {activeView === 'PROJECTS' && <ProjectsView state={state} addProject={addProject} updateProject={updateProject} addTask={addTask} scheduleProjectTask={scheduleProjectTask} />}
      {activeView === 'METHODOLOGY' && <MethodologyView setView={setActiveView} />}
      <AICoachPanel isOpen={isCoachOpen} onClose={() => setIsCoachOpen(false)} state={state} updateMode={updateCoachMode} onAddTask={addTask} onAddProject={addProject} onAddMessage={addCoachMessage} onClearMessages={clearCoachMessages} />
    </Layout>
  );
};

export default App;
