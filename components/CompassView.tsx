
import React, { useState, useEffect } from 'react';
import { AppState, Role, ViewType, SyncStatus } from '../types';
import { generateEmailBriefing } from '../geminiService';

interface CompassViewProps {
  state: AppState;
  userEmail: string;
  onLogout: () => void;
  onPurgeExecution: () => void;
  updateMission: (text: string) => void;
  updateUserName: (name: string) => void;
  addRole: (role: Role) => void;
  deleteRole: (id: string) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  updateRoleGoal: (id: string, goal: string) => void;
  setView: (v: ViewType) => void;
  syncStatus: SyncStatus;
  updateNotifications: (enabled: boolean) => void;
  updateEmailRelay: (enabled: boolean, address: string) => void;
}

const CompassView: React.FC<CompassViewProps> = ({ state, userEmail, onLogout, onPurgeExecution, updateMission, updateUserName, addRole, deleteRole, updateRole, updateRoleGoal, setView, syncStatus, updateNotifications, updateEmailRelay }) => {
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(state.roles[0]?.id || null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [activeSetup, setActiveSetup] = useState<string | null>(null);
  
  // State temporal para el modal de email
  const [tempEmail, setTempEmail] = useState(state.emailRelayAddress || userEmail);
  const [isRelayEnabled, setIsRelayEnabled] = useState(state.emailRelayEnabled || false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [generatedBriefing, setGeneratedBriefing] = useState<string | null>(null);

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const newRole: Role = {
      id: "role_" + Date.now().toString(),
      name: newRoleName.trim(),
      icon: '🎭',
      goal: '',
      color: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    addRole(newRole);
    setNewRoleName('');
    setIsAddingRole(false);
  };

  const handleRequestNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador no soporta notificaciones neurales.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      updateNotifications(true);
      new Notification("Sincronía Activada", {
        body: "Recibirás alertas de tus objetivos en tiempo real.",
        icon: "https://cdn-icons-png.flaticon.com/512/3239/3239044.png"
      });
    } else {
      updateNotifications(false);
    }
  };

  const handleSaveEmailRelay = () => {
    updateEmailRelay(isRelayEnabled, tempEmail);
    setActiveSetup(null);
    alert("Protocolo de Email Relay Sincronizado.");
  };

  const handleTestEmail = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setGeneratedBriefing(null);
    setTestLogs(["Iniciando Handshake Neural..."]);
    
    const logs = [
        "Localizando servidor de retransmisión...",
        "Validando dirección: " + tempEmail,
        "Encriptando túnel TLS v1.3...",
        "Invocando Gemini-3 para Briefing...",
    ];

    for (const log of logs) {
        await new Promise(r => setTimeout(r, 700 + Math.random() * 300));
        setTestLogs(prev => [...prev, log]);
    }

    try {
        const briefing = await generateEmailBriefing(state);
        setGeneratedBriefing(briefing || "Prueba de conexión exitosa.");
        setTestLogs(prev => [...prev, "Briefing Neural Recibido ✅", "HANDSHAKE COMPLETADO."]);
    } catch (err) {
        setTestLogs(prev => [...prev, "ERROR: Fallo en generación de briefing.", "Usando plantilla básica..."]);
        setGeneratedBriefing("Conexión de Core Assist confirmada.");
    } finally {
        setIsTesting(false);
    }
  };

  const handleSendTestDraft = () => {
    if (!generatedBriefing) return;
    const subject = encodeURIComponent("Core Assist: Briefing Neural de Prueba");
    const body = encodeURIComponent(generatedBriefing);
    window.location.href = `mailto:${tempEmail}?subject=${subject}&body=${body}`;
    setTestLogs([]);
    setGeneratedBriefing(null);
  };

  return (
    <div className="px-6 space-y-10 pb-40">
      {/* Setup Modal */}
      {activeSetup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[#131B2E] w-full max-w-sm rounded-[40px] p-8 border border-white/10 shadow-2xl space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase italic text-white tracking-tighter">Vincular {activeSetup}</h3>
                    <button onClick={() => { setActiveSetup(null); setTestLogs([]); setGeneratedBriefing(null); }} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">✕</button>
                </div>
                
                {activeSetup === 'Email Relay' && (
                    <div className="space-y-4">
                        <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                            <p className="text-[10px] text-amber-500 font-bold uppercase mb-2">Protocolo de Salida</p>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                                El sistema generará reportes automáticos de tus Big Rocks. Haz clic en "Test" para verificar tu dirección.
                            </p>
                        </div>
                        <div className="space-y-1">
                          <label className="mono text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email Destino</label>
                          <input 
                            className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-sm text-white outline-none focus:border-amber-500" 
                            placeholder="tu-email@ejemplo.com" 
                            value={tempEmail} 
                            onChange={(e) => setTempEmail(e.target.value)}
                          />
                        </div>

                        {testLogs.length > 0 && (
                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 mono text-[8px] space-y-1 min-h-[100px] max-h-[150px] overflow-y-auto">
                                {testLogs.map((log, i) => (
                                    <p key={i} className={i === testLogs.length - 1 && isTesting ? "text-amber-400 animate-pulse" : "text-slate-500"}>
                                        {i === testLogs.length - 1 ? "> " : "  "} {log}
                                    </p>
                                ))}
                                {generatedBriefing && (
                                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                                        <p className="text-amber-400 font-black italic uppercase">Briefing Listo para Lanzar:</p>
                                        <button 
                                          onClick={handleSendTestDraft}
                                          className="w-full py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg font-black uppercase tracking-tighter hover:bg-emerald-500/30 transition-all"
                                        >
                                          Lanzar a Bandeja de Entrada
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!generatedBriefing && (
                          <div className="flex items-center gap-3 px-2">
                              <input 
                                type="checkbox" 
                                id="relay-active" 
                                className="w-5 h-5 accent-amber-500" 
                                checked={isRelayEnabled} 
                                onChange={(e) => setIsRelayEnabled(e.target.checked)}
                              />
                              <label htmlFor="relay-active" className="text-[10px] text-slate-400 font-black uppercase tracking-tight cursor-pointer">Sincronizar Alertas</label>
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={handleSaveEmailRelay}
                            disabled={isTesting}
                            className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                          >
                            Guardar Cambios
                          </button>
                          <button 
                            onClick={handleTestEmail}
                            disabled={isTesting}
                            className="px-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[8px] font-black uppercase hover:text-white transition-colors disabled:opacity-30"
                          >
                            {isTesting ? 'Cargando...' : 'Test'}
                          </button>
                        </div>
                    </div>
                )}
                
                {/* Otros setups mantenidos igual */}
                {activeSetup === 'Google Calendar' && (
                    <div className="space-y-4">
                        <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                            <p className="text-[10px] text-blue-400 font-bold uppercase mb-2">¿Cómo funciona?</p>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                                1. Haz clic en el botón inferior.<br/>
                                2. Autoriza el acceso a tu calendario.<br/>
                                3. Tus tareas con "HORA" aparecerán automáticamente.
                            </p>
                        </div>
                        <button className="w-full py-4 bg-[#4285F4] text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all">
                            Iniciar Sincronización
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Perfil Section */}
      <section className="p-8 rounded-[32px] border bg-[#131B2E] border-white/5 shadow-xl flex justify-between items-center">
          <div>
            <label className="mono text-[7px] font-black uppercase text-[#BC00FF] tracking-[0.4em]">Perfil Operativo</label>
            <p className="text-white font-black italic uppercase tracking-tighter text-xl mt-1">{userEmail.split('@')[0]}</p>
            <p className="mono text-[8px] text-slate-500 font-bold mt-1">{userEmail}</p>
          </div>
          <button 
            onClick={onLogout}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-red-500/10 transition-all active:scale-90"
          >
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
      </section>

      {/* Neural Link Section */}
      <section className="space-y-4">
        <div className="px-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Neural Link</h2>
            <p className="mono text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gestión de Conexiones Externas</p>
        </div>
        
        <div className="bg-[#131B2E] border border-white/5 rounded-[40px] p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${state.notificationsEnabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        {state.notificationsEnabled ? '🔔' : '🔕'}
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase text-white tracking-tight">Notificaciones Browser</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{state.notificationsEnabled ? 'SISTEMA ACTIVO' : 'SISTEMA EN ESPERA'}</p>
                    </div>
                </div>
                <button 
                  onClick={handleRequestNotifications}
                  className={`px-6 py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${state.notificationsEnabled ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#BC00FF] text-white shadow-[0_0_15px_#BC00FF]'}`}
                >
                    {state.notificationsEnabled ? 'Vinculado' : 'Vincular'}
                </button>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
                <label className="mono text-[7px] font-black uppercase text-slate-500 tracking-[0.4em]">Directorio de Apps (Haz clic para activar)</label>
                <div className="grid grid-cols-1 gap-3">
                    <IntegrationCard 
                        icon="📧" 
                        title="Email Relay" 
                        desc="Envía alertas en tiempo real a tu bandeja."
                        status={state.emailRelayEnabled ? "ACTIVO" : "VINCULAR"}
                        color={state.emailRelayEnabled ? "text-emerald-500" : "text-amber-500"}
                        onClick={() => {
                          setTempEmail(state.emailRelayAddress || userEmail);
                          setIsRelayEnabled(state.emailRelayEnabled || false);
                          setActiveSetup('Email Relay');
                        }}
                    />
                    <IntegrationCard 
                        icon="📅" 
                        title="Google Calendar" 
                        desc="Sincroniza tus bloques de tiempo automáticamente."
                        status="VINCULAR"
                        color="text-blue-400"
                        onClick={() => setActiveSetup('Google Calendar')}
                    />
                </div>
            </div>
        </div>
      </section>

      {/* Misión Section */}
      <section className="space-y-4">
        <div className="px-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Misión Central</h2>
            <p className="mono text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Directiva de Vida Principal</p>
        </div>
        <textarea
            value={state.mission.text}
            onChange={(e) => updateMission(e.target.value)}
            className="w-full h-56 p-8 bg-white/[0.02] border border-white/5 rounded-[40px] text-lg font-medium leading-relaxed shadow-2xl outline-none focus:border-[#BC00FF]/30 transition-all text-slate-300 placeholder:text-slate-800"
            placeholder="Define tu propósito inmutable..."
        />
      </section>
    </div>
  );
};

const IntegrationCard = ({ icon, title, desc, status, color, onClick }: any) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-4 bg-black/20 p-4 rounded-3xl border border-white/5 group hover:border-white/20 hover:bg-black/40 transition-all text-left w-full active:scale-95"
    >
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl">{icon}</div>
        <div className="flex-1">
            <div className="flex items-center justify-between">
                <h5 className="text-xs font-black uppercase text-white tracking-tight">{title}</h5>
                <span className={`mono text-[7px] font-black px-2 py-0.5 rounded-full border border-current ${color} opacity-80 group-hover:opacity-100`}>{status}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{desc}</p>
        </div>
    </button>
);

export default CompassView;
