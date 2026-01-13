
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import CompassView from './components/CompassView';
import PlannerView from './components/PlannerView';
import MatrixView from './components/MatrixView';
import ProjectsView from './components/ProjectsView';
import MethodologyView from './components/MethodologyView';
import AICoachPanel from './components/AICoachPanel';
import AuthView from './components/AuthView';
import { AppState, ViewType, Task, Role, Quadrant, SyncStatus, Project, CoachMode, ChatMessage } from './types';
import { saveUserData, loadUserData, auth, onAuthStateChanged, signOut } from './firebase';

const INITIAL_STATE: AppState = {
  userName: "Operativo",
  coachMode: "STRATEGIST",
  mission: { text: "Vivir con integridad y priorizar el impacto estratégico.", updatedAt: Date.now() },
  roles: [
    { id: '1', name: 'Individual', icon: '🧠', goal: 'Optimizar energía biológica.', color: 'bg-emerald-500', createdAt: Date.now(), updatedAt: Date.now() },
    { id: '2', name: 'Empresario', icon: '💼', goal: 'Escalar sistemas de negocio y ROI.', color: 'bg-blue-500', createdAt: Date.now(), updatedAt: Date.now() },
  ],
  tasks: [],
  projects: [],
  coachMessages: [],
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('PLANNER');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');

  useEffect(() => {
    // Safety Timeout: Evita el "Blue Screen of Death" si Firebase es bloqueado por extensiones (ERR_BLOCKED_BY_CLIENT)
    const safetyTimer = setTimeout(() => {
        if (!isAppReady) {
            console.warn("Firebase Init Timeout: Forzando carga de app en modo local (posible bloqueo de red).");
            setIsAppReady(true);
            setSyncStatus('error');
        }
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(safetyTimer); // Cancelamos el timeout de seguridad si Firebase responde
      
      if (currentUser) {
        setSyncStatus('loading');
        try {
            const cloudData = await loadUserData(currentUser.uid);
            if (cloudData) {
                setState(cloudData as AppState);
            } else {
                // Si falla el guardado inicial (bloqueo), no importa, ya tenemos INITIAL_STATE
                saveUserData(currentUser.uid, INITIAL_STATE).catch(e => console.warn("Save Init Failed:", e));
            }
            setUser(currentUser);
            setSyncStatus('synced');
        } catch (e) {
            console.error("Error crítico cargando datos:", e);
            setSyncStatus('error');
            // Mantenemos el estado inicial en caso de error
        }
      } else {
        setUser(null);
        setState(INITIAL_STATE);
        setSyncStatus('local');
      }
      setIsAppReady(true);
    }, (error) => {
        // En caso de que onAuthStateChanged falle directamente (raro, pero posible con bloqueos agresivos)
        console.error("Auth Observer Error:", error);
        clearTimeout(safetyTimer);
        setIsAppReady(true);
        setSyncStatus('error');
    });

    return () => {
        unsubscribe();
        clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (!user || syncStatus === 'loading' || syncStatus === 'error') return;
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

  if (!isAppReady) return <div className="h-screen w-screen bg-[#0A0F1E] flex flex-col items-center justify-center space-y-6"><div className="w-20 h-20 border-t-2 border-[#BC00FF] rounded-full animate-spin"></div></div>;

  if (!user) return <AuthView />;

  return (
    <Layout activeView={activeView} setView={setActiveView} onOpenCoach={() => setIsCoachOpen(!isCoachOpen)} syncStatus={syncStatus} onReset={() => window.location.reload()}>
      {activeView === 'COMPASS' && (
        <CompassView state={state} userEmail={user.email} onLogout={handleLogout} updateMission={(text) => updateState(prev => ({...prev, mission: {text, updatedAt: Date.now()}}))} updateUserName={(name) => updateState(prev => ({ ...prev, userName: name }))} addRole={(role) => updateState(prev => ({...prev, roles: [...prev.roles, role]}))} deleteRole={(id) => updateState(prev => ({...prev, roles: prev.roles.filter(r => r.id !== id)}))} updateRole={(id, updates) => updateState(prev => ({...prev, roles: prev.roles.map(r => r.id === id ? {...r, ...updates, updatedAt: Date.now()} : r)}))} updateRoleGoal={(id, goal) => updateState(prev => ({...prev, roles: prev.roles.map(r => r.id === id ? {...r, goal, updatedAt: Date.now()} : r)}))} setView={setActiveView} syncStatus={syncStatus} />
      )}
      {activeView === 'PLANNER' && <PlannerView state={state} addTask={addTask} updateTask={updateTask} toggleTask={toggleTask} moveTask={moveTask} deleteTask={deleteTask} currentWeekOffset={currentWeekOffset} setCurrentWeekOffset={setCurrentWeekOffset} />}
      {activeView === 'MATRIX' && <MatrixView state={state} updateQuadrant={updateQuadrant} addTask={addTask} updateTask={updateTask} toggleTask={toggleTask} moveTask={moveTask} currentWeekOffset={currentWeekOffset} setCurrentWeekOffset={setCurrentWeekOffset} />}
      {activeView === 'PROJECTS' && <ProjectsView state={state} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addTask={addTask} scheduleProjectTask={scheduleProjectTask} />}
      {activeView === 'METHODOLOGY' && <MethodologyView setView={setActiveView} />}
      <AICoachPanel isOpen={isCoachOpen} onClose={() => setIsCoachOpen(false)} state={state} updateMode={(mode) => updateState(prev => ({ ...prev, coachMode: mode }))} onAddTask={addTask} onAddProject={addProject} onAddMessage={(msg) => updateState(prev => ({ ...prev, coachMessages: [...prev.coachMessages, msg] }))} onClearMessages={() => updateState(prev => ({ ...prev, coachMessages: [] }))} />
    </Layout>
  );
};

export default App;
