
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
  duration?: number;
  timerStartedAt?: number | null;
  timerElapsed?: number;
  roleId: string;
  projectId?: string;
  isBigRock: boolean;
  day: number | null; 
  weekOffset: number; 
  quadrant: Quadrant;
  completed: boolean;
  updatedAt: number;
};

export type ProjectStep = {
  id: string;
  text: string;
  instruction?: string;
  estimatedTime?: string; 
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
  estimatedTotalWeeks?: number; 
  estimatedTotalHours?: string; 
  updatedAt: number;
};

export type Mission = {
  text: string;
  updatedAt: number;
};

export type ChatMessage = {
  role: 'coach' | 'user';
  text: string;
  timestamp: number;
};

export type CoachMode = 'STRATEGIST' | 'FINANCIAL' | 'SOCRATIC' | 'BUSINESS_OWNER' | 'ZEN_ENERGY';

export type AppTheme = 'dark' | 'light';

export type AppState = {
  userName: string;
  cloudId?: string;
  coachMode: CoachMode;
  theme?: AppTheme;
  mission: Mission;
  roles: Role[];
  tasks: Task[];
  projects: Project[];
  coachMessages: Record<string, ChatMessage[]>; // Segmentado por CoachMode
  notificationsEnabled?: boolean;
  emailRelayEnabled?: boolean;
  emailRelayAddress?: string;
  version?: number;
};

export type ViewType = 'COMPASS' | 'PLANNER' | 'MATRIX' | 'COACH' | 'METHODOLOGY' | 'PROJECTS';

export type SyncStatus = 'synced' | 'local' | 'loading' | 'error' | 'syncing';
