
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
  roleId: string;
  isBigRock: boolean;
  day?: number; // 0-6 (Mon-Sun)
  quadrant: Quadrant;
  completed: boolean;
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
};

export type ViewType = 'COMPASS' | 'PLANNER' | 'MATRIX' | 'COACH' | 'METHODOLOGY';

export type SyncStatus = 'synced' | 'local' | 'loading' | 'error';
