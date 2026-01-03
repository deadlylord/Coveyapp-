
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import Layout from './components/Layout';
import CompassView from './components/CompassView';
import PlannerView from './components/PlannerView';
import MatrixView from './components/MatrixView';
import MethodologyView from './components/MethodologyView';
import AICoachPanel from './components/AICoachPanel';
import { AppState, ViewType, Task, Role, Quadrant, SyncStatus } from './types';
import { db } from './firebase';

const STORAGE_KEY = 'covey_compass_v5_local';

const INITIAL_STATE: AppState = {
  mission: { text: "Vivir con integridad, innovar cada día y priorizar las relaciones de alta calidad que nutren el alma.", updatedAt: Date.now() },
  roles: [
    { id: '1', name: 'Padre/Madre', icon: '👨‍👩‍👧', goal: 'Nutrir y guiar a mis hijos cada día con amor.', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', createdAt: Date.now(), updatedAt: Date.now() },
    { id: '2', name: 'Desarrollador', icon: '👨‍💻', goal: 'Construir software limpio, escalable y centrado en el usuario.', color: 'bg-blue-50 text-blue-600 border-blue-100', createdAt: Date.now(), updatedAt: Date.now() },
    { id: '3', name: 'Personal / Salud', icon: '🏃', goal: '30m de cardio diario y alimentación consciente.', color: 'bg-rose-50 text-rose-600 border-rose-100', createdAt: Date.now(), updatedAt: Date.now() },
  ],
  tasks: [
    { id: 't1', title: 'Planificación de Metas Q3', roleId: '2', isBigRock: true, quadrant: 'II', completed: false, updatedAt: Date.now() },
  ]
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      return INITIAL_STATE;
    }
  });
  
  const [activeView, setActiveView] = useState<ViewType>('PLANNER');
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const cloudDisabled = useRef(!db);

  const getDeviceId = useCallback(() => {
    let id = localStorage.getItem('covey_device_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('covey_device_id', id);
    }
    return id;
  }, []);

  const deviceId = getDeviceId();

  // Timeout de seguridad preventivo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (syncStatus === 'loading') {
        setSyncStatus(db ? 'error' : 'local');
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [syncStatus]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (cloudDisabled.current || !db) {
        setSyncStatus('local');
        return;
    }

    let unsub = () => {};
    try {
      unsub = onSnapshot(doc(db, "users", deviceId), (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as AppState;
          if (JSON.stringify(cloudData) !== JSON.stringify(state)) {
             setState(cloudData);
          }
          setSyncStatus('synced');
        } else {
          saveToCloud(state);
        }
      }, (error) => {
        console.warn("Sync error:", error.code);
        setSyncStatus('local');
        cloudDisabled.current = true;
      });
    } catch (e) {
      setSyncStatus('local');
    }

    return () => unsub();
  }, [deviceId]);

  const sanitizeForFirestore = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj, (key, value) => 
      value === undefined ? null : value
    ));
  };

  const saveToCloud = async (newState: AppState) => {
    if (cloudDisabled.current || !db) return;
    try {
      const cleanData = sanitizeForFirestore({ ...newState, lastSync: Date.now() });
      await setDoc(doc(db, "users", deviceId), cleanData);
      setSyncStatus('synced');
    } catch (e: any) {
        setSyncStatus('local');
    }
  };

  const updateStateAndSync = (newState: AppState) => {
    setState(newState);
    saveToCloud(newState);
  };

  const updateMission = (text: string) => {
    updateStateAndSync({ ...state, mission: { text, updatedAt: Date.now() } });
  };

  const addRole = (role: Role) => {
    updateStateAndSync({ ...state, roles: [...state.roles, { ...role, updatedAt: Date.now() }] });
  };

  const updateRoleGoal = (roleId: string, goal: string) => {
    updateStateAndSync({
      ...state,
      roles: state.roles.map(r => r.id === roleId ? { ...r, goal, updatedAt: Date.now() } : r)
    });
  };

  const deleteRole = (id: string) => {
    updateStateAndSync({ 
        ...state, 
        roles: state.roles.filter(r => r.id !== id),
        tasks: state.tasks.filter(t => t.roleId !== id)
    });
  };

  const addTask = (task: Task) => {
    updateStateAndSync({ ...state, tasks: [...state.tasks, { ...task, updatedAt: Date.now() }] });
  };

  const toggleTask = (id: string) => {
    updateStateAndSync({
      ...state,
      tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t)
    });
  };

  const deleteTask = (id: string) => {
    updateStateAndSync({
      ...state,
      tasks: state.tasks.filter(t => t.id !== id)
    });
  };

  const moveTask = (id: string, day: number | undefined) => {
    updateStateAndSync({
      ...state,
      tasks: state.tasks.map(t => t.id === id ? { ...t, day, updatedAt: Date.now() } : t)
    });
  };

  const updateQuadrant = (id: string, quadrant: Quadrant) => {
    updateStateAndSync({
      ...state,
      tasks: state.tasks.map(t => t.id === id ? { ...t, quadrant, updatedAt: Date.now() } : t)
    });
  };

  const resetState = () => {
    if (confirm("¿Limpiar todos los datos locales y de la nube?")) {
      updateStateAndSync(INITIAL_STATE);
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      setView={setActiveView} 
      onOpenCoach={() => setIsCoachOpen(true)}
      syncStatus={syncStatus}
      onReset={resetState}
    >
      {activeView === 'COMPASS' && (
        <CompassView 
          state={state} 
          updateMission={updateMission} 
          addRole={addRole} 
          deleteRole={deleteRole}
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
        />
      )}
      {activeView === 'MATRIX' && (
        <MatrixView 
          state={state} 
          updateQuadrant={updateQuadrant}
          addTask={addTask}
          toggleTask={toggleTask}
        />
      )}
      {activeView === 'METHODOLOGY' && (
        <MethodologyView setView={setActiveView} />
      )}
      
      <AICoachPanel 
        isOpen={isCoachOpen} 
        onClose={() => setIsCoachOpen(false)} 
        state={state} 
      />
    </Layout>
  );
};

export default App;
