
import React from 'react';
import { ViewType } from '../types';

interface MethodologyViewProps {
  setView: (v: ViewType) => void;
}

const MethodologyView: React.FC<MethodologyViewProps> = ({ setView }) => {
  const steps = [
    {
      title: "1. La Brújula Core",
      desc: "Define tu Misión. Es tu constitución personal que guía cada decisión cuando el ruido aumenta.",
      icon: "🧭",
      color: "bg-blue-50 text-blue-600",
      action: () => setView('COMPASS')
    },
    {
      title: "2. Alineación de Roles",
      desc: "Identifica tus áreas vitales: Líder, Personal, Vitalidad. Asigna objetivos claros a cada uno.",
      icon: "🎭",
      color: "bg-emerald-50 text-emerald-600",
      action: () => setView('COMPASS')
    },
    {
      title: "3. Hitos de Impacto",
      desc: "Tus 'Piedras Grandes'. Son tareas que generan el 80% de tus resultados pero no siempre son urgentes.",
      icon: "🪨",
      color: "bg-amber-50 text-amber-600",
      action: () => setView('PLANNER')
    },
    {
      title: "4. Gestión de la Arena",
      desc: "Lo urgente y ruidoso. Adminístralo, delégalo o elimínalo para que no desplace a lo importante.",
      icon: "⏳",
      color: "bg-slate-50 text-slate-500",
      action: () => setView('PLANNER')
    },
    {
      title: "5. Filtro de Enfoque",
      desc: "Clasifica tus tareas usando la Matriz Core para identificar dónde estás perdiendo energía.",
      icon: "🎯",
      color: "bg-indigo-50 text-indigo-600",
      action: () => setView('MATRIX')
    }
  ];

  return (
    <div className="px-6 space-y-8 pb-20">
      <section className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-100 relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2 font-serif italic">Core Assist Philosophy</h2>
            <p className="text-slate-300 text-sm leading-relaxed opacity-90">
                El alto rendimiento no se trata de hacer más cosas, sino de hacer las cosas correctas en el momento adecuado.
            </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </section>

      <div className="space-y-4">
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 px-2">Principios Centrales</h3>
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

      <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
          <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
              <span className="text-xl">✨</span> Nota de Core Assist
          </h4>
          <p className="text-xs text-indigo-600 leading-relaxed font-medium">
              "La eficiencia es hacer las cosas bien. La eficacia es hacer las cosas correctas." Usa el Coach Core para filtrar tus tareas cada mañana.
          </p>
      </div>
    </div>
  );
};

export default MethodologyView;
