import React, { useState } from 'react';
import { AppState, Project, Task, ProjectStep } from '../types';
import { breakdownProject, improveProjectObjective } from '../geminiService';
import { DAYS_OF_WEEK } from '../constants';

interface ProjectsViewProps {
  state: AppState;
  addProject: (p: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addTask: (t: Task) => void;
  scheduleProjectTask: (projectId: string, stepId: string, task: Task) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ state, addProject, updateProject, addTask, scheduleProjectTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [improvingProject, setImprovingProject] = useState(false);
  const [schedulingStep, setSchedulingStep] = useState<{ projectId: string, stepId: string } | null>(null);
  const [editingStep, setEditingStep] = useState<{ projectId: string, stepId: string } | null>(null);
  
  const [scheduleConfig, setScheduleConfig] = useState<{ weekOffset: number, day: string }>({ weekOffset: 0, day: 'arena' });
  const [formData, setFormData] = useState({ title: '', description: '', roleId: state.roles[0]?.id || '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    const newProj: Project = {
      id: 'proj_' + Date.now(),
      title: formData.title,
      description: formData.description,
      roleId: formData.roleId,
      targetSessions: 10,
      completedSessions: 0,
      steps: [],
      updatedAt: Date.now()
    };
    addProject(newProj);
    setIsAdding(false);
    setFormData({ title: '', description: '', roleId: state.roles[0]?.id || '' });
  };

  const handleImproveObjective = async () => {
    if (!formData.title.trim()) return;
    setImprovingProject(true);
    try {
        const refined = await improveProjectObjective(formData.title, formData.description);
        setFormData({
            ...formData,
            title: refined.title || formData.title,
            description: refined.description || formData.description
        });
    } catch (error) { console.error(error); } finally { setImprovingProject(false); }
  };

  const handleBreakdown = async (project: Project) => {
    setLoadingId(project.id);
    try {
      const steps = await breakdownProject(project);
      const projectSteps: ProjectStep[] = steps.map((s: any, i: number) => ({
        id: `step_${project.id}_${i}_${Date.now()}`,
        text: s.title,
        instruction: s.instruction,
        completed: false
      }));
      updateProject(project.id, { steps: projectSteps });
    } catch (error: any) { alert("Error en el sistema neural."); } finally { setLoadingId(null); }
  };

  const confirmSchedule = (project: Project, step: ProjectStep) => {
    const taskId = `task_step_${step.id}_${Date.now()}`;
    const selectedDay = scheduleConfig.day === 'arena' ? null : parseInt(scheduleConfig.day);

    const newTask: Task = {
        id: taskId,
        title: `${project.title} | ${step.text}`,
        description: step.instruction,
        roleId: project.roleId,
        projectId: project.id,
        isBigRock: true,
        weekOffset: scheduleConfig.weekOffset,
        day: selectedDay,
        quadrant: 'II',
        completed: false,
        updatedAt: Date.now()
    };
    
    scheduleProjectTask(project.id, step.id, newTask);
    setSchedulingStep(null);
  };

  const updateStepData = (projectId: string, stepId: string, updates: Partial<ProjectStep>) => {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    const newSteps = project.steps.map(s => s.id === stepId ? { ...s, ...updates } : s);
    updateProject(projectId, { steps: newSteps });
  };

  const addNewStep = (projectId: string) => {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;
      const newStep: ProjectStep = {
          id: `step_man_${Date.now()}`,
          text: 'Nuevo Resultado Clave',
          instruction: 'Describe la acción específica...',
          completed: false
      };
      updateProject(projectId, { steps: [...project.steps, newStep] });
  };

  return (
    <div className="px-6 space-y-8 pb-32">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white">Proyectos</h2>
            <p className="mono text-[8px] font-bold text-purple-400 uppercase tracking-[0.3em] mt-1">Estructura de OKRs Neurales</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-[#BC00FF] text-white rounded-[20px] shadow-[0_0_15px_rgba(188,0,255,0.4)] flex items-center justify-center hover:scale-105 transition-transform"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#131B2E] p-8 rounded-[32px] border border-white/10 shadow-2xl animate-in zoom-in-95 space-y-6">
          <div className="flex justify-between items-center mb-4">
              <h3 className="mono text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Nueva Iniciativa</h3>
              <button 
                type="button" 
                onClick={handleImproveObjective}
                className="bg-[#BC00FF]/10 text-[#BC00FF] px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-[#BC00FF]/20 hover:bg-[#BC00FF]/20 transition-all"
              >
                  {improvingProject ? 'Refinando...' : '✨ Optimizar Objetivo'}
              </button>
          </div>
          <div className="space-y-4">
              <input 
                placeholder="Título del Proyecto..." 
                className="w-full bg-transparent text-2xl font-black outline-none border-b border-white/10 pb-4 focus:border-[#BC00FF] transition-all text-white uppercase italic tracking-tight"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
              <textarea 
                placeholder="Definición de impacto y éxito..."
                className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-sm outline-none focus:border-[#BC00FF]/30 text-slate-300 min-h-[100px]"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <select 
                className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-xs font-black uppercase text-purple-400 outline-none"
                value={formData.roleId}
                onChange={e => setFormData({...formData, roleId: e.target.value})}
              >
                {state.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={handleCreate} className="flex-1 bg-[#BC00FF] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Vincular Proyecto</button>
                <button onClick={() => setIsAdding(false)} className="px-6 bg-white/5 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest">X</button>
              </div>
          </div>
        </div>
      )}

      {/* Scheduling Modal */}
      {schedulingStep && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#131B2E] w-full max-w-sm rounded-[32px] p-8 border border-white/10 space-y-6">
                  <h3 className="text-xl font-black uppercase italic text-white tracking-tighter">Programar OKR</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="mono text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Sincronización Semanal</label>
                          <select 
                            className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white font-bold"
                            value={scheduleConfig.weekOffset}
                            onChange={e => setScheduleConfig({...scheduleConfig, weekOffset: parseInt(e.target.value)})}
                          >
                              <option value="0">Semana Actual</option>
                              <option value="1">Semana +1</option>
                              <option value="2">Semana +2</option>
                          </select>
                      </div>
                      <div>
                          <label className="mono text-[8px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Día de Ejecución</label>
                          <select 
                            className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white font-bold"
                            value={scheduleConfig.day}
                            onChange={e => setScheduleConfig({...scheduleConfig, day: e.target.value})}
                          >
                              <option value="arena">Arena Neural (Sin día)</option>
                              {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                          </select>
                      </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => {
                            const project = state.projects.find(p => p.id === schedulingStep.projectId);
                            const step = project?.steps.find(s => s.id === schedulingStep.stepId);
                            if(project && step) confirmSchedule(project, step);
                        }}
                        className="flex-1 bg-[#BC00FF] text-white py-4 rounded-2xl font-black uppercase text-xs"
                      >
                          Confirmar
                      </button>
                      <button onClick={() => setSchedulingStep(null)} className="px-6 bg-white/5 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs">X</button>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {state.projects.map(project => {
          const role = state.roles.find(r => r.id === project.roleId);
          return (
            <div key={project.id} className="bg-[#131B2E] p-6 rounded-[32px] border border-white/5 space-y-6 group shadow-lg">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{role?.icon}</span>
                            <span className="mono text-[8px] font-black uppercase text-purple-400 tracking-[0.3em]">{role?.name}</span>
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-tight">{project.title}</h3>
                        <p className="text-xs text-slate-400 mt-3 leading-relaxed">{project.description}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {project.steps.map((step) => (
                        <div key={step.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 group/step hover:border-white/10 transition-all">
                            {editingStep?.stepId === step.id ? (
                                <div className="space-y-3 animate-in zoom-in-95">
                                    <input 
                                        className="w-full bg-black/40 border border-[#BC00FF]/30 p-3 rounded-xl text-sm font-bold text-white outline-none"
                                        value={step.text}
                                        onChange={e => updateStepData(project.id, step.id, { text: e.target.value })}
                                    />
                                    <textarea 
                                        className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-[10px] text-slate-300 outline-none"
                                        value={step.instruction}
                                        onChange={e => updateStepData(project.id, step.id, { instruction: e.target.value })}
                                    />
                                    <button onClick={() => setEditingStep(null)} className="w-full bg-[#BC00FF] py-2 rounded-xl text-[8px] font-black uppercase">Guardar Cambios</button>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 cursor-pointer" onClick={() => setEditingStep({ projectId: project.id, stepId: step.id })}>
                                        <h4 className="text-sm font-bold text-slate-200 leading-tight">{step.text}</h4>
                                        <p className="text-[9px] text-slate-500 mt-1 line-clamp-1 italic">{step.instruction}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {!step.taskId && (
                                            <button 
                                                onClick={() => setSchedulingStep({ projectId: project.id, stepId: step.id })}
                                                className="bg-[#BC00FF] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-purple-500/20"
                                            >
                                                Agendar
                                            </button>
                                        )}
                                        {step.taskId && <span className="mono text-[7px] text-emerald-400 font-bold uppercase mt-2">Sincronizado</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleBreakdown(project)}
                            disabled={loadingId === project.id}
                            className="flex-1 py-4 bg-[#BC00FF]/10 border border-[#BC00FF]/20 text-[#BC00FF] rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#BC00FF] hover:text-white transition-all disabled:opacity-30"
                        >
                            {loadingId === project.id ? 'Sincronizando...' : project.steps.length === 0 ? 'Desglosar OKRs 💠' : 'Regenerar OKRs'}
                        </button>
                        <button 
                            onClick={() => addNewStep(project.id)}
                            className="px-6 py-4 bg-white/5 border border-white/5 text-slate-400 rounded-2xl text-[9px] font-black uppercase hover:bg-white/10"
                        >
                            + Paso
                        </button>
                    </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsView;