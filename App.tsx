
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import CompassView from './components/CompassView';
import PlannerView from './components/PlannerView';
import MatrixView from './components/MatrixView';
import ProjectsView from './components/ProjectsView';
import MethodologyView from './components/MethodologyView';
import AICoachPanel from './components/AICoachPanel';
import AuthView from './components/AuthView';
import { AppState, ViewType, Task, Role, Quadrant, SyncStatus, Project, CoachMode, AppTheme, ChatMessage } from './types';
import { saveUserData, loadUserData, auth, onAuthStateChanged, signOut } from './firebase';

const MOTIVATIONAL_PHRASES = [
  "La disciplina es el puente entre las metas y los logros.",
  "No te detengas cuando estés cansado, detente cuando hayas terminado.",
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "Tu futuro se crea por lo que haces hoy, no mañana.",
  "La excelencia no es un acto, sino un hábito.",
  "Si quieres algo que nunca has tenido, debes hacer algo que nunca has hecho."
];

const INITIAL_STATE: AppState = {
  userName: "Operativo",
  coachMode: "STRATEGIST",
  theme: "dark",
  mission: { text: "Vivir con integridad y priorizar el impacto estratégico.", updatedAt: Date.now() },
  roles: [
    { id: '1', name: 'Individual', icon: '🧠', goal: 'Optimizar energía biológica.', color: 'bg-emerald-500', createdAt: Date.now(), updatedAt: Date.now() },
    { id: '2', name: 'Empresario', icon: '💼', goal: 'Escalar sistemas de negocio y ROI.', color: 'bg-blue-500', createdAt: Date.now(), updatedAt: Date.now() },
  ],
  tasks: [],
  projects: [],
  coachMessages: {}, 
  notificationsEnabled: false,
  emailRelayEnabled: false,
  emailRelayAddress: "",
  version: 8.9
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('PLANNER');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [loadingPhrase] = useState(() => MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setSyncStatus('loading');
        const cloudData = await loadUserData(currentUser.uid);
        if (cloudData) {
            const data = cloudData as AppState;
            if (!data.coachMessages || typeof data.coachMessages !== 'object') {
                data.coachMessages = {};
            }
            setState({ ...INITIAL_STATE, ...data } as AppState);
        }
        else await saveUserData(currentUser.uid, INITIAL_STATE);
        setUser(currentUser);
        setSyncStatus('synced');
      } else {
        setUser(null);
        setState(INITIAL_STATE);
        setSyncStatus('local');
      }
      setIsAppReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!state.notificationsEnabled && !state.emailRelayEnabled) return;

    const checkTasksInterval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayIdx = (now.getDay() + 6) % 7;

      const upcomingTask = state.tasks.find(t => 
        !t.completed && 
        t.day === todayIdx && 
        t.weekOffset === 0 && 
        t.time === currentTimeStr
      );

      if (upcomingTask) {
        if (state.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
          new Notification(`Core Assist: Objetivo Activo`, {
            body: `Iniciando: ${upcomingTask.title}`,
            icon: "https://cdn-icons-png.flaticon.com/512/8618/8618881.png"
          });
        }
      }
    }, 60000);

    return () => clearInterval(checkTasksInterval);
  }, [state.tasks, state.notificationsEnabled, state.emailRelayEnabled, state.emailRelayAddress]);

  useEffect(() => {
    if (state.theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [state.theme]);

  useEffect(() => {
    if (!user || syncStatus === 'loading') return;
    const timer = setTimeout(async () => {
      setSyncStatus('syncing');
      const success = await saveUserData(user.uid, state);
      setSyncStatus(success ? 'synced' : 'error');
    }, 1500);
    return () => clearTimeout(timer);
  }, [state, user]);

  const updateState = (updater: (prev: AppState) => AppState) => setState(prev => updater(prev));

  const handleLogout = async () => { if (confirm("¿Cerrar sesión?")) await signOut(auth); };

  const addTask = (task: Task) => updateState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  const updateTask = (id: string, updates: Partial<Task>) => updateState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t) }));
  const toggleTask = (id: string) => updateState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t) }));
  const deleteTask = (id: string) => updateState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const moveTask = (id: string, day: number | null, weekOffset?: number) => updateState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, day, weekOffset: weekOffset !== undefined ? weekOffset : t.weekOffset, updatedAt: Date.now() } : t) }));
  const updateQuadrant = (id: string, quadrant: Quadrant) => updateState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, quadrant, isBigRock: quadrant === 'II', updatedAt: Date.now() } : t) }));
  const addProject = (project: Project) => updateState(prev => ({ ...prev, projects: [...prev.projects, project] }));
  const updateProject = (id: string, updates: Partial<Project>) => updateState(prev => ({ ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p) }));
  const deleteProject = (id: string) => updateState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id), tasks: prev.tasks.filter(t => t.projectId !== id) }));
  const scheduleProjectTask = (projectId: string, stepId: string, task: Task) => { updateState(prev => ({ ...prev, tasks: [...prev.tasks, task], projects: prev.projects.map(p => p.id === projectId ? { ...p, steps: p.steps.map(s => s.id === stepId ? { ...s, taskId: task.id } : s), updatedAt: Date.now() } : p) })); };

  if (!isAppReady) return (
    <div className="h-screen w-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-10 flex flex-col items-center">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Core Assist</h1>
        <div className="w-12 h-1 bg-[#BC00FF] rounded-full shadow-[0_0_15px_#BC00FF]"></div>
      </div>
      <div className="w-20 h-20 border-t-2 border-[#BC00FF] rounded-full animate-spin mb-10"></div>
      <p className="mono text-[10px] font-black text-[#BC00FF] uppercase tracking-[0.3em] max-w-xs animate-pulse">
        {loadingPhrase}
      </p>
    </div>
  );

  if (!user) return <AuthView />;

  return (
    <>
      <Layout 
        activeView={activeView} 
        setView={setActiveView} 
        onOpenCoach={() => setIsCoachOpen(!isCoachOpen)} 
        syncStatus={syncStatus} 
        onReset={() => window.location.reload()}
        theme={state.theme || 'dark'}
        toggleTheme={() => updateState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))}
      >
        {activeView === 'COMPASS' && (
          <CompassView 
            state={state} 
            userEmail={user.email} 
            onLogout={handleLogout} 
            onPurgeExecution={() => updateState(prev => ({ ...prev, tasks: [], projects: [] }))}
            updateMission={(text) => updateState(prev => ({...prev, mission: {text, updatedAt: Date.now()}}))} 
            updateUserName={(name) => updateState(prev => ({ ...prev, userName: name }))} 
            addRole={(role) => updateState(prev => ({...prev, roles: [...prev.roles, role]}))} 
            deleteRole={(id) => updateState(prev => ({...prev, roles: prev.roles.filter(r => r.id !== id)}))} 
            updateRole={(id, updates) => updateState(prev => ({...prev, roles: prev.roles.map(r => r.id === id ? {...r, ...updates, updatedAt: Date.now()} : r)}))} 
            updateRoleGoal={(id, goal) => updateState(prev => ({...prev, roles: prev.roles.map(r => r.id === id ? {...r, goal, updatedAt: Date.now()} : r)}))} 
            setView={setActiveView} 
            syncStatus={syncStatus}
            updateNotifications={(enabled) => updateState(prev => ({ ...prev, notificationsEnabled: enabled }))}
            updateEmailRelay={(enabled, address) => updateState(prev => ({ ...prev, emailRelayEnabled: enabled, emailRelayAddress: address }))}
          />
        )}
        {activeView === 'PLANNER' && <PlannerView state={state} addTask={addTask} updateTask={updateTask} toggleTask={toggleTask} moveTask={moveTask} deleteTask={deleteTask} currentWeekOffset={currentWeekOffset} setCurrentWeekOffset={setCurrentWeekOffset} />}
        {activeView === 'MATRIX' && <MatrixView state={state} updateQuadrant={updateQuadrant} addTask={addTask} updateTask={updateTask} toggleTask={toggleTask} moveTask={moveTask} currentWeekOffset={currentWeekOffset} setCurrentWeekOffset={setCurrentWeekOffset} />}
        {activeView === 'PROJECTS' && <ProjectsView state={state} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addTask={addTask} scheduleProjectTask={scheduleProjectTask} />}
        {activeView === 'METHODOLOGY' && <MethodologyView setView={setActiveView} />}
      </Layout>

      <AICoachPanel 
        isOpen={isCoachOpen} 
        onClose={() => setIsCoachOpen(false)} 
        state={state} 
        updateMode={(mode) => updateState(prev => ({ ...prev, coachMode: mode }))} 
        onAddTask={addTask} 
        onAddProject={addProject} 
        onAddMessage={(mode, msg) => updateState(prev => ({ 
            ...prev, 
            coachMessages: {
                ...prev.coachMessages,
                [mode]: [...(prev.coachMessages[mode] || []), msg]
            } 
        }))} 
        onClearMessages={(mode) => updateState(prev => ({ 
            ...prev, 
            coachMessages: {
                ...prev.coachMessages,
                [mode]: []
            } 
        }))} 
      />
    </>
  );
};

export default App;
