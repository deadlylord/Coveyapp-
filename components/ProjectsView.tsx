
import React, { useState } from 'react';
import { AppState, Project, Task, ProjectStep } from '../types';
import { breakdownProject, improveProjectObjective } from '../geminiService';
import { DAYS_OF_WEEK } from '../constants';

interface ProjectsViewProps {
  state: AppState;
  addProject: (p: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTask: (t: Task) => void;
  scheduleProjectTask: (projectId: string, stepId: string, task: Task) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ state, addProject, updateProject, deleteProject, addTask, scheduleProjectTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [improvingProject, setImprovingProject] = useState(false);
  const [schedulingStep, setSchedulingStep] = useState<{ projectId: string, stepId: string } | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  
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

  const handleImprove = async (isNew: boolean, projectId?: string) => {
    const currentProj = isNew ? null : state.projects.find(p => p.id === projectId);
    const currentTitle = isNew ? formData.title : currentProj?.title;
    const currentDesc = isNew ? formData.description : currentProj?.description;
    const currentRoleId = isNew ? formData.roleId : currentProj?.roleId;

    const role = state.roles.find(r => r.id === currentRoleId);
    const roleName = role?.name || "General";

    if (!currentTitle?.trim()) {
        alert("Introduce un título básico primero.");
        return;
    }

    setImprovingProject(true);
    try {
      const improved = await improveProjectObjective(currentTitle, currentDesc || '', roleName);
      if (isNew) {
        setFormData(prev => ({ ...prev, title: improved.title, description: improved.description }));
      } else if (projectId) {
        updateProject(projectId, { title: improved.title, description: improved.description });
      }
    } catch (error) {
      console.error("Neural Error:", error);
    } finally {
      setImprovingProject(false);
    }
  };

  const handleBreakdown = async (project: Project) => {
    setLoadingId(project.id);
    try {
      const result = await breakdownProject(project);
      const projectSteps: ProjectStep[] = result.steps.map((s: any, i: number) => ({
        id: `step_${project.id}_${i}_${Date.now()}`,
        text: s.title,
        instruction: s.instruction,
        estimatedTime: s.estimatedTime,
        completed: false
      }));
      updateProject(project.id, { 
        steps: projectSteps, 
        estimatedTotalWeeks: result.estimatedTotalWeeks,
        estimatedTotalHours: result.estimatedTotalHours
      });
    } catch (error: any) { alert("Error en el sistema neural."); } finally { setLoadingId(null); }
  };

  const confirmSchedule = (project: Project, step: ProjectStep) => {
    const taskId = `task_step_${step.id}_${Date.now()}`;
    const selectedDay = scheduleConfig.day === 'arena' ? null : parseInt(scheduleConfig.day);
    let duration = 30;
    if (step.estimatedTime) {
        const match = step.estimatedTime.match(/(\d+)/);
        if (match) {
            duration = parseInt(match[1]);
            if (step.estimatedTime.toLowerCase().includes('h')) duration *= 60;
        }
    }
    const newTask: Task = {
        id: taskId,
        title: `${project.title} | ${step.text}`,
        description: step.instruction,
        roleId: project.roleId,
        projectId: project.id,
        isBigRock: true,
        duration: duration,
        weekOffset: scheduleConfig.weekOffset,
        day: selectedDay,
        quadrant: 'II',
        completed: false,
        updatedAt: Date.now()
    };
    scheduleProjectTask(project.id, step.id, newTask);
    setSchedulingStep(null);
  };

  return (
    <div className="px-6 space-y-8 pb-32">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">Proyectos</h2>
            <p className="mono text-[8px] font-bold text-purple-400 uppercase tracking-[0.3em] mt-2">Arquitectura de Negocios</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-[#BC00FF] text-white rounded-[20px] shadow-[0_0_15px_#BC00FF]/40 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#131B2E] p-8 rounded-[32px] border border-white/10 shadow-2xl animate-in zoom-in-95 space-y-6 relative overflow-hidden">
          {improvingProject && (
            <div className="absolute inset-0 z-50 bg-[#0A0F1E]/60 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-t-2 border-[#BC00FF] rounded-full animate-spin"></div>
              <span className="mono text-[8px] font-black text-[#BC00FF] uppercase tracking-widest">Refinando Objetivo...</span>
            </div>
          )}
          
          <div className="space-y-1">
            <label className="mono text-[7px] font-black text-slate-500 uppercase ml-2 tracking-widest">Esfera de Responsabilidad</label>
            <select 
              value={formData.roleId}
              onChange={e => setFormData({...formData, roleId: e.target.value})}
              className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-sm text-white outline-none focus:border-[#BC00FF]"
            >
              {state.roles.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input 
              placeholder="Título del Proyecto..." 
              className="flex-1 bg-transparent text-2xl font-black outline-none border-b border-white/10 pb-4 focus:border-[#BC00FF] text-white uppercase italic"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
            <button 
                onClick={() => handleImprove(true)}
                className="p-3 bg-[#BC00FF]/10 text-[#BC00FF] rounded-2xl border border-[#BC00FF]/20 hover:bg-[#BC00FF]/20 transition-all"
                title="Mejorar con IA según Rol"
            >
                <span className="text-xl">✨</span>
            </button>
          </div>

          <textarea 
            placeholder="Definición de impacto (qué quieres lograr y por qué)..."
            className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-sm outline-none text-slate-300 min-h-[100px] focus:border-[#BC00FF]/50"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
          <div className="flex gap-3">
            <button onClick={handleCreate} className="flex-1 bg-[#BC00FF] text-white py-4 rounded-2xl font-black uppercase text-xs">Vincular</button>
            <button onClick={() => setIsAdding(false)} className="px-6 bg-white/5 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs">X</button>
          </div>
        </div>
      )}

      {/* Modal de Agendamiento */}
      {schedulingStep && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
              <div className="bg-[#131B2E] w-full max-w-sm rounded-[32px] p-8 border border-white/10 space-y-6">
                  <h3 className="text-xl font-black uppercase italic text-white tracking-tighter">Agenda Estratégica</h3>
                  <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
                        <button onClick={() => setScheduleConfig(c => ({...c, weekOffset: Math.max(0, c.weekOffset - 1)}))} className="w-10 h-10 flex items-center justify-center text-white bg-white/5 rounded-xl">-</button>
                        <div className="flex-1 text-center">
                            <span className="text-white font-black text-lg">+{scheduleConfig.weekOffset}</span>
                        </div>
                        <button onClick={() => setScheduleConfig(c => ({...c, weekOffset: Math.min(12, c.weekOffset + 1)}))} className="w-10 h-10 flex items-center justify-center text-white bg-white/5 rounded-xl">+</button>
                      </div>
                      <select 
                        className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white font-bold"
                        value={scheduleConfig.day}
                        onChange={e => setScheduleConfig({...scheduleConfig, day: e.target.value})}
                      >
                          <option value="arena">Arena</option>
                          {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                  </div>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => {
                            const project = state.projects.find(p => p.id === schedulingStep.projectId);
                            const step = project?.steps.find(s => s.id === schedulingStep.stepId);
                            if(project && step) confirmSchedule(project, step);
                        }}
                        className="flex-1 bg-[#BC00FF] text-white py-4 rounded-2xl font-black uppercase text-xs"
                      >Confirmar</button>
                      <button onClick={() => setSchedulingStep(null)} className="px-6 bg-white/5 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs">X</button>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {state.projects.map(project => {
          const role = state.roles.find(r => r.id === project.roleId);
          return (
            <div key={project.id} className="bg-[#131B2E] p-6 rounded-[32px] border border-white/5 space-y-6 shadow-xl relative group overflow-hidden">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{role?.icon}</span>
                            <span className="mono text-[8px] font-black uppercase text-purple-400 tracking-[0.3em]">{role?.name}</span>
                        </div>
                        {editingProject === project.id ? (
                            <div className="space-y-4 relative">
                                {improvingProject && (
                                  <div className="absolute inset-0 z-10 bg-[#131B2E]/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                    <div className="w-6 h-6 border-t-2 border-[#BC00FF] rounded-full animate-spin"></div>
                                  </div>
                                )}
                                
                                <div className="space-y-1">
                                    <label className="mono text-[7px] font-black text-slate-600 uppercase ml-2 tracking-widest">Esfera de Responsabilidad</label>
                                    <select 
                                        value={project.roleId}
                                        onChange={e => updateProject(project.id, { roleId: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-[#BC00FF]"
                                    >
                                        {state.roles.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                  <input 
                                      className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-black uppercase italic tracking-tighter outline-none focus:border-[#BC00FF]"
                                      value={project.title}
                                      onChange={(e) => updateProject(project.id, { title: e.target.value })}
                                  />
                                  <button onClick={() => handleImprove(false, project.id)} className="p-2 bg-[#BC00FF]/10 text-[#BC00FF] rounded-xl border border-[#BC00FF]/20">✨</button>
                                </div>
                                
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-slate-300 min-h-[80px] outline-none focus:border-[#BC00FF]"
                                    value={project.description}
                                    onChange={(e) => updateProject(project.id, { description: e.target.value })}
                                />
                                
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingProject(null)} className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Sincronizar</button>
                                  <button onClick={() => setEditingProject(null)} className="px-4 bg-white/5 text-slate-500 py-2 rounded-lg text-[9px] font-black uppercase">X</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => setEditingProject(project.id)} className="cursor-pointer">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white hover:text-[#BC00FF] transition-colors">{project.title}</h3>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{project.description}</p>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => { if(confirm("¿Purgar proyecto y desvincular OKRs?")) deleteProject(project.id); }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500/40 hover:text-red-500 transition-all ml-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                    </button>
                </div>

                {project.estimatedTotalWeeks && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-cyan-500/5 border border-cyan-500/20 p-3 rounded-2xl flex flex-col items-center">
                            <span className="mono text-[7px] font-black text-cyan-400 uppercase tracking-widest mb-1">Timeline Neural</span>
                            <span className="text-xl font-black text-white">{project.estimatedTotalWeeks} <small className="text-[10px] opacity-50 uppercase">Sem</small></span>
                        </div>
                        <div className="bg-[#BC00FF]/5 border border-[#BC00FF]/20 p-3 rounded-2xl flex flex-col items-center">
                            <span className="mono text-[7px] font-black text-purple-400 uppercase tracking-widest mb-1">Esfuerzo Sugerido</span>
                            <span className="text-xl font-black text-white">{project.estimatedTotalHours}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {project.steps.map((step) => (
                        <div key={step.id} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-start justify-between gap-4 group/step hover:bg-white/[0.05] transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-slate-200">{step.text}</h4>
                                    {step.estimatedTime && <span className="mono text-[8px] font-black uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/10">IA: {step.estimatedTime}</span>}
                                </div>
                                <p className="text-[9px] text-slate-500 italic line-clamp-1">{step.instruction}</p>
                            </div>
                            <div className="flex gap-2">
                                {!step.taskId ? (
                                    <button onClick={() => setSchedulingStep({ projectId: project.id, stepId: step.id })} className="bg-[#BC00FF] text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all">Agendar</button>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                      <span className="text-emerald-500 text-[10px]">✓</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => handleBreakdown(project)}
                        disabled={loadingId === project.id}
                        className="w-full py-4 bg-[#BC00FF]/10 border border-[#BC00FF]/20 text-[#BC00FF] rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30 hover:bg-[#BC00FF]/20 active:scale-95"
                    >
                        {loadingId === project.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 border-2 border-[#BC00FF] border-t-transparent rounded-full animate-spin"></div>
                            <span>Estimando Estructura...</span>
                          </div>
                        ) : project.steps.length === 0 ? 'Desglosar con IA 💠' : 'Regenerar OKRs y Timeline'}
                    </button>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsView;
