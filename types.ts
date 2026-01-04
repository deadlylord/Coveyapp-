
export type Role = {
  id: string;
  name: string;
  icon: string;
  goal: string;
  color: string;
  createdAt: number;
  updatedAt: number;
};

export type Quadrant = 'I' | 'II' | 'III' | 'IV';

export type Task = {
  id: string;
  title: string;
  description?: string; 
  time?: string;
  roleId: string;
  projectId?: string;
  isBigRock: boolean;
  day: number | null; // Cambiado a null para consistencia
  weekOffset: number; 
  quadrant: Quadrant;
  completed: boolean;
  updatedAt: number;
};

export type ProjectStep = {
  id: string;
  text: string;
  instruction?: string;
  completed: boolean;
  taskId?: string; 
};

export type Project = {
  id: string;
  title: string;
  roleId: string;
  description: string;
  targetSessions: number;
  completedSessions: number;
  steps: ProjectStep[];
  updatedAt: number;
};

export type Mission = {
  text: string;
  updatedAt: number;
};

export type AppState = {
  mission: Mission;
  roles: Role[];
  tasks: Task[];
  projects: Project[];
};

export type ViewType = 'COMPASS' | 'PLANNER' | 'MATRIX' | 'COACH' | 'METHODOLOGY' | 'PROJECTS';

export type SyncStatus = 'synced' | 'local' | 'loading' | 'error';
