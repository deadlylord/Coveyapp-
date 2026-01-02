
import React from 'react';
import { ViewType } from '../types';

interface MethodologyViewProps {
  setView: (v: ViewType) => void;
}

const MethodologyView: React.FC<MethodologyViewProps> = ({ setView }) => {
  const steps = [
    {
      title: "1. La Brújula (Misión)",
      desc: "No puedes planificar tu semana si no sabes hacia dónde vas. Tu enunciado de misión es tu constitución personal.",
      icon: "🧭",
      color: "bg-blue-50 text-blue-600",
      action: () => setView('COMPASS')
    },
    {
      title: "2. Equilibrio de Roles",
      desc: "Eres más que un empleado. Define tus roles: Padre, Amigo, Atleta, Creador. Dale a cada uno su espacio.",
      icon: "🎭",
      color: "bg-emerald-50 text-emerald-600",
      action: () => setView('COMPASS')
    },
    {
      title: "3. Piedras Grandes",
      desc: "Las 'Piedras Grandes' son tareas de Cuadrante II: Importantes pero NO urgentes. Si no las pones primero, el frasco se llenará de arena.",
      icon: "🪨",
      color: "bg-amber-50 text-amber-600",
      action: () => setView('PLANNER')
    },
    {
      title: "4. La Arena",
      desc: "Son las tareas pequeñas, urgencias o interrupciones. Déjalas para el final o delégalas. Nunca dejes que la arena desplace a las piedras.",
      icon: "⏳",
      color: "bg-slate-50 text-slate-500",
      action: () => setView('PLANNER')
    },
    {
      title: "5. Cuadrante II (Enfoque)",
      desc: "Usa la Matriz para identificar qué tareas te están robando tiempo. El éxito está en maximizar Q2 y minimizar Q1.",
      icon: "🎯",
      color: "bg-indigo-50 text-indigo-600",
      action: () => setView('MATRIX')
    }
  ];

  return (
    <div className="px-6 space-y-8 pb-20">
      <section className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2 font-serif italic">Primero lo Primero</h2>
            <p className="text-indigo-100 text-sm leading-relaxed opacity-90">
                La mayoría de las personas dedican su tiempo a lo "Urgente" (Q1) descuidando lo "Importante" (Q2). Esta app te ayuda a invertir ese flujo.
            </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </section>

      <div className="space-y-4">
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 px-2">Guía paso a paso</h3>
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            onClick={step.action}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex gap-4 items-start cursor-pointer hover:shadow-md transition-shadow active:scale-95 transform duration-200"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${step.color}`}>
                {step.icon}
            </div>
            <div>
                <h4 className="font-bold text-slate-800 text-lg">{step.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed mt-1">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-100 p-6 rounded-[32px] border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-xl">✨</span> Tip de Coach Covey
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
              "La clave no es priorizar lo que está en tu agenda, sino agendar tus prioridades". Pregúntame en el botón central si tienes dudas sobre una tarea.
          </p>
      </div>
    </div>
  );
};

export default MethodologyView;
