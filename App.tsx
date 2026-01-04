
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import Layout from './components/Layout';
import CompassView from './components/CompassView';
import PlannerView from './components/PlannerView';
import MatrixView from './components/MatrixView';
import MethodologyView from './components/MethodologyView';
import ProjectsView from './components/ProjectsView';
import AICoachPanel from './components/AICoachPanel';
import { AppState, ViewType, Task, Role, Quadrant, SyncStatus, Project } from './types';
import { db } from './firebase';

const INITIAL_STATE: AppState = {
  mission: { text: "Vivir con integridad y priorizar lo importante sobre lo urgente.", updatedAt: Date.now() },
  roles: [
    { id: '1', name: 'Padre/Madre', icon: '👨', goal: 'Nutrir a mi familia.', color: 'bg-emerald-50 text-emerald-600', createdAt: Date.now(), updatedAt: Date.now() },
    { id: '2', name: 'Profesional', icon: '💼', goal: 'Excelencia en el trabajo.', color: 'bg-blue-50 text-blue-600', createdAt: Date.now(), updatedAt: Date.now() },
  ],
  tasks: [],
  projects: []
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('PLANNER');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  
  const cloudDisabled = useRef(!db);
  const hasReceivedFirstCloudUpdate = useRef(false);

  const getDeviceId = useCallback(() => {
    let id = localStorage.getItem('covey_device_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now();
      localStorage.setItem('covey_device_id', id);
    }
    return id;
  }, []);

  const deviceId = getDeviceId();

  const saveToCloud = async (newState: AppState) => {
    if (cloudDisabled.current || !db) return;
    try {
      const cleanData = JSON.parse(JSON.stringify(newState));
      await setDoc(doc(db, "users", deviceId), cleanData);
      setSyncStatus('synced');
    } catch (e) {
        console.error("Save Error:", e);
        setSyncStatus('error');
    }
  };

  useEffect(() => {
    if (cloudDisabled.current || !db) {
        setSyncStatus('local');
        setIsLoaded(true);
        return;
    }

    const docRef = doc(db, "users", deviceId);
    const unsub = onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
      if (docSnap.metadata.hasPendingWrites) return;

      if (docSnap.exists()) {
        const cloudData = docSnap.data() as AppState;
        setState(cloudData);
        setSyncStatus('synced');
        hasReceivedFirstCloudUpdate.current = true;
      } else if (!hasReceivedFirstCloudUpdate.current) {
        saveToCloud(INITIAL_STATE);
        hasReceivedFirstCloudUpdate.current = true;
      }
      setIsLoaded(true);
    }, (error) => {
      setSyncStatus('error');
      setIsLoaded(true);
    });

    return () => unsub();
  }, [deviceId]);

  const updateStateAndCloud = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
        const newState = updater(prev);
        setTimeout(() => saveToCloud(newState), 10);
        return newState;
    });
  };

  const addTask = (task: Task) => updateStateAndCloud(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  const toggleTask = (id: string) => updateStateAndCloud(prev => ({ 
    ...prev, 
    tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t) 
  }));
  const deleteTask = (id: string) => updateStateAndCloud(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  
  const moveTask = (id: string, day: number | null, weekOffset?: number, time?: string) => updateStateAndCloud(prev => ({ 
    ...prev, 
    tasks: prev.tasks.map(t => t.id === id ? { 
        ...t, 
        day: day, 
        weekOffset: weekOffset !== undefined ? weekOffset : t.weekOffset, 
        time: time !== undefined ? time : t.time,
        updatedAt: Date.now() 
    } : t) 
  }));

  const updateQuadrant = (id: string, quadrant: Quadrant) => updateStateAndCloud(prev => ({ 
    ...prev, 
    tasks: prev.tasks.map(t => t.id === id ? { 
        ...t, 
        quadrant, 
        isBigRock: quadrant === 'II' ? true : t.isBigRock,
        updatedAt: Date.now() 
    } : t) 
  }));
  
  const updateMission = (text: string) => updateStateAndCloud(prev => ({ ...prev, mission: { text, updatedAt: Date.now() } }));
  const addRole = (role: Role) => updateStateAndCloud(prev => ({ ...prev, roles: [...prev.roles, role] }));
  
  const deleteRole = (id: string) => {
    updateStateAndCloud(prev => {
      if (prev.roles.length <= 1) return prev;
      return {
        ...prev,
        roles: prev.roles.filter(r => r.id !== id),
        tasks: prev.tasks.filter(t => t.roleId !== id),
        projects: prev.projects.filter(p => p.roleId !== id)
      };
    });
  };

  const updateRole = (id: string, updates: Partial<Role>) => updateStateAndCloud(prev => ({
    ...prev,
    roles: prev.roles.map(r => r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r)
  }));
  
  const updateRoleGoal = (id: string, goal: string) => updateRole(id, { goal });
  
  const addProject = (project: Project) => updateStateAndCloud(prev => ({ ...prev, projects: [...prev.projects, project] }));
  const updateProject = (id: string, updates: Partial<Project>) => updateStateAndCloud(prev => ({
    ...prev,
    projects: prev.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p)
  }));

  const scheduleProjectTask = (projectId: string, stepId: string, task: Task) => {
    updateStateAndCloud(prev => {
        const newTasks = [...prev.tasks, task];
        const newProjects = prev.projects.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    steps: p.steps.map(s => s.id === stepId ? { ...s, taskId: task.id } : s),
                    updatedAt: Date.now()
                };
            }
            return p;
        });
        return { ...prev, tasks: newTasks, projects: newProjects };
    });
  };

  if (!isLoaded) {
    return (
        <div className="h-screen w-screen bg-[#FDFDFD] flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800">Covey Compass</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Cargando tus datos...</p>
            </div>
        </div>
    );
  }

  return (
    <Layout 
      activeView={activeView} 
      setView={setActiveView} 
      onOpenCoach={() => setIsCoachOpen(true)}
      syncStatus={syncStatus}
      onReset={() => {
          localStorage.removeItem('covey_device_id');
          window.location.reload();
      }}
    >
      {activeView === 'COMPASS' && (
        <CompassView 
          state={state} 
          updateMission={updateMission} 
          addRole={addRole} 
          deleteRole={deleteRole} 
          updateRole={updateRole}
          updateRoleGoal={updateRoleGoal} 
          setView={setActiveView} 
        />
      )}
      {activeView === 'PLANNER' && (
        <PlannerView 
          state={state} 
          addTask={addTask} 
          toggleTask={toggleTask} 
          moveTask={moveTask} 
          deleteTask={deleteTask}
          currentWeekOffset={currentWeekOffset}
          setCurrentWeekOffset={setCurrentWeekOffset}
        />
      )}
      {activeView === 'MATRIX' && (
        <MatrixView 
          state={state} 
          updateQuadrant={updateQuadrant} 
          addTask={addTask} 
          toggleTask={toggleTask}
          currentWeekOffset={currentWeekOffset}
          setCurrentWeekOffset={setCurrentWeekOffset}
        />
      )}
      {activeView === 'PROJECTS' && <ProjectsView state={state} addProject={addProject} updateProject={updateProject} addTask={addTask} scheduleProjectTask={scheduleProjectTask} />}
      {activeView === 'METHODOLOGY' && <MethodologyView setView={setActiveView} />}
      <AICoachPanel isOpen={isCoachOpen} onClose={() => setIsCoachOpen(false)} state={state} />
    </Layout>
  );
};

export default App;
