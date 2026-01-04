
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
  const [scheduleConfig, setScheduleConfig] = useState<{ weekOffset: number, day: string }>({ weekOffset: 0, day: '0' });
  
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    roleId: state.roles[0]?.id || '' 
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleId) {
        alert("Por favor, selecciona un Rol para este proyecto.");
        return;
    }
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
    } catch (error) {
        console.error("Improvement error:", error);
    } finally {
        setImprovingProject(false);
    }
  };

  const handleRefineExisting = async (project: Project) => {
    setLoadingId(project.id);
    try {
        const refined = await improveProjectObjective(project.title, project.description);
        updateProject(project.id, {
            title: refined.title,
            description: refined.description
        });
    } catch (error) {
        console.error("Refinement error:", error);
    } finally {
        setLoadingId(null);
    }
  };

  const handleBreakdown = async (project: Project) => {
    setLoadingId(project.id);
    try {
      const steps = await breakdownProject(project);
      const projectSteps: ProjectStep[] = steps.map((s: any, i: number) => ({
        id: `step_${project.id}_${i}`,
        text: s.title,
        instruction: s.instruction,
        completed: false
      }));
      updateProject(project.id, { steps: projectSteps });
    } catch (error: any) {
      alert("Error al generar OKRs con IA. Revisa tu conexión y clave API.");
    } finally {
      setLoadingId(null);
    }
  };

  const confirmSchedule = (project: Project, step: ProjectStep) => {
    const taskId = `task_step_${step.id}_${Date.now()}`;
    const selectedDay = scheduleConfig.day === 'arena' ? null : parseInt(scheduleConfig.day);

    const newTask: Task = {
        id: taskId,
        title: `${project.title} (KR): ${step.text}`,
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
    const dayText = selectedDay !== null ? DAYS_OF_WEEK[selectedDay] : 'Bandeja de Arena';
    alert(`KR Agendado: ${dayText}`);
  };

  return (
    <div className="px-6 space-y-6 pb-32">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Proyectos Q2</h2>
            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mt-1">Metodología OKR de Google</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-[32px] border border-indigo-100 shadow-xl space-y-4 animate-in zoom-in-95">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vincular a Rol</label>
                <button 
                  type="button" 
                  onClick={handleImproveObjective}
                  disabled={improvingProject || !formData.title}
                  className={`bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-indigo-100 transition-all ${improvingProject ? 'animate-pulse' : ''}`}
                >
                    {improvingProject ? '✨ Refinando...' : '✨ IA Mejorar Objetivo'}
                </button>
            </div>
            <div className="flex gap-2 overflow-x-auto py-1 scroll-hide">
                {state.roles.map(role => (
                    <button
                        key={role.id}
                        type="button"
                        onClick={() => setFormData({...formData, roleId: role.id})}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
                            formData.roleId === role.id ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}
                    >
                        <span>{role.icon}</span>
                        <span className="text-xs font-bold">{role.name}</span>
                    </button>
                ))}
            </div>
          </div>

          <input 
            placeholder="¿Cuál es tu Objetivo inspirador?" 
            className="w-full text-lg font-bold outline-none border-b border-slate-100 pb-2 focus:border-indigo-300 transition-colors"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            required
          />
          <textarea 
            placeholder="Define el éxito de este OKR..."
            className="w-full text-sm outline-none bg-slate-50 p-4 rounded-2xl min-h-[100px] border border-transparent focus:border-indigo-100 transition-all"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100">Crear Objetivo</button>
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {state.projects.map(project => {
          const role = state.roles.find(r => r.id === project.roleId);
          return (
            <div key={project.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{role?.icon}</span>
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{role?.name}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 leading-tight">Obj: {project.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{project.description}</p>
                </div>
                <button 
                  onClick={() => handleRefineExisting(project)}
                  disabled={loadingId === project.id}
                  className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                  title="Refinar con IA"
                >
                  <span className="text-lg">✨</span>
                </button>
              </div>

              {project.steps.length === 0 ? (
                <button 
                  onClick={() => handleBreakdown(project)}
                  disabled={loadingId === project.id}
                  className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {loadingId === project.id ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                      Diseñando KRs con IA...
                    </span>
                  ) : (
                    <>
                      <span className="text-lg">📊</span>
                      Generar OKRs (Google Style)
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Resultados Clave (KRs):</p>
                  {project.steps.map((step, idx) => (
                    <div key={step.id} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-transparent hover:border-indigo-100 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">KR {idx + 1}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-700 leading-tight">{step.text}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 italic">{step.instruction}</p>
                        </div>
                        {step.taskId ? (
                            <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                Agendado
                            </div>
                        ) : (
                            <button 
                                onClick={() => setSchedulingStep({ projectId: project.id, stepId: step.id })}
                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all shrink-0"
                            >
                                Agendar
                            </button>
                        )}
                      </div>

                      {schedulingStep?.stepId === step.id && (
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xl animate-in slide-in-from-top-2 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Semana</label>
                                    <select 
                                        className="w-full text-xs font-bold p-2 bg-slate-50 rounded-lg outline-none border border-slate-100"
                                        value={scheduleConfig.weekOffset}
                                        onChange={(e) => setScheduleConfig({...scheduleConfig, weekOffset: parseInt(e.target.value)})}
                                    >
                                        <option value="0">Esta Semana</option>
                                        <option value="1">Próxima Semana</option>
                                        <option value="2">En 2 Semanas</option>
                                        <option value="3">En 3 Semanas</option>
                                        <option value="-1">Semana Pasada</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Día</label>
                                    <select 
                                        className="w-full text-xs font-bold p-2 bg-slate-50 rounded-lg outline-none border border-slate-100"
                                        value={scheduleConfig.day}
                                        onChange={(e) => setScheduleConfig({...scheduleConfig, day: e.target.value})}
                                    >
                                        <option value="arena">🏖️ Arena</option>
                                        {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i.toString()}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => confirmSchedule(project, step)}
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
                                >
                                    Agendar KR
                                </button>
                                <button onClick={() => setSchedulingStep(null)} className="px-4 bg-slate-100 text-slate-500 py-3 rounded-xl text-[10px] font-black uppercase">X</button>
                            </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsView;
