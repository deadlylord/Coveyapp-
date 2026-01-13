
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppState, Project, CoachMode, Task, Quadrant } from "./types";

// Inicialización resiliente
const getAI = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
      console.error("CRITICAL: process.env.API_KEY is missing from environment.");
      throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

const createTaskTool: FunctionDeclaration = {
  name: 'crear_tarea',
  parameters: {
    type: Type.OBJECT,
    description: 'Crea una nueva tarea en la agenda del usuario.',
    properties: {
      title: { type: Type.STRING, description: 'Título de la tarea' },
      roleId: { type: Type.STRING, description: 'ID del rol asociado' },
      quadrant: { type: Type.STRING, description: 'Cuadrante de Eisenhower: I, II, III o IV' },
      day: { type: Type.NUMBER, description: 'Día de la semana (0=Lun, 6=Dom). null para Arena.' },
      time: { type: Type.STRING, description: 'Hora en formato HH:MM opcional' }
    },
    required: ['title', 'roleId', 'quadrant'],
  },
};

const createProjectTool: FunctionDeclaration = {
  name: 'crear_proyecto',
  parameters: {
    type: Type.OBJECT,
    description: 'Crea un nuevo proyecto estratégico con descripción.',
    properties: {
      title: { type: Type.STRING, description: 'Nombre del proyecto' },
      description: { type: Type.STRING, description: 'Objetivo y alcance' },
      roleId: { type: Type.STRING, description: 'ID del rol responsable' }
    },
    required: ['title', 'description', 'roleId'],
  },
};

const getSystemInstruction = (mode: CoachMode) => {
  const base = `Eres Core Assist (V7.0 NEURAL ARCHITECT). Tu misión es optimizar la arquitectura de vida y negocio del usuario mediante principios de alto impacto.`;
  const modes: Record<CoachMode, string> = {
    STRATEGIST: `${base} Modo: Estratega Core. Prioriza Q2 y eficiencia operativa.`,
    BUSINESS_OWNER: `${base} Modo: Arquitecto de Negocios. Enfócate en ROI, escalabilidad y delegación.`,
    ZEN_ENERGY: `${base} Modo: Bio-Hacker. Prioriza la energía y el foco cognitivo.`,
    SOCRATIC: `${base} Modo: Oráculo Socrático. Claridad mediante preguntas críticas.`,
  };
  return `${modes[mode] || modes.STRATEGIST}

REGLAS DE CONTEXTO:
- Tienes acceso al historial de logros del usuario.
- Eres experto en estimación de proyectos. Analiza la complejidad y sugiere duración en SEMANAS.
- Sé directo. Formato Markdown para textos descriptivos.`;
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try { return await fn(); } catch (error: any) {
    if (error.message === "MISSING_API_KEY") throw error;
    
    if (retries > 0 && (error.status >= 500 || error.status === 429)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function getCoachResponse(message: string, state: AppState) {
  const completedTasks = state.tasks
    .filter(t => t.completed)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 10)
    .map(t => `- ${t.title}`)
    .join('\n');

  return withRetry(async () => {
    try {
      const ai = getAI();
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Usuario: "${message}". Contexto: Roles: ${state.roles.map(r => r.name).join(', ')}. Logros: ${completedTasks}`,
        config: { 
          systemInstruction: getSystemInstruction(state.coachMode),
          temperature: 0.7,
          tools: [{ functionDeclarations: [createTaskTool, createProjectTool] }]
        }
      });
    } catch (error: any) { 
        throw error;
    }
  });
}

export async function breakdownProject(project: Project) {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analiza y desglosa: Proyecto: ${project.title}. Descripción: ${project.description}`,
        config: { 
          systemInstruction: getSystemInstruction('BUSINESS_OWNER'),
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedTotalWeeks: { type: Type.INTEGER, description: "Número de semanas recomendadas para completar" },
              estimatedTotalHours: { type: Type.STRING, description: "Esfuerzo total estimado (ej: 40h)" },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    instruction: { type: Type.STRING },
                    estimatedTime: { type: Type.STRING }
                  },
                  required: ["title", "instruction", "estimatedTime"]
                }
              }
            },
            required: ["estimatedTotalWeeks", "estimatedTotalHours", "steps"]
          }
        }
      });
      return JSON.parse(response.text?.trim() || '{}');
    } catch (error: any) { 
        throw error;
    }
  });
}

export async function improveProjectObjective(title: string, description: string) {
    return withRetry(async () => {
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Optimiza: Título: "${title}". Descripción: "${description}".`,
          config: { 
              systemInstruction: getSystemInstruction('BUSINESS_OWNER'),
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: { title: { type: Type.STRING }, description: { type: Type.STRING } },
                  required: ["title", "description"]
              }
          }
        });
        return JSON.parse(response.text?.trim() || '{}');
      } catch (error) { return { title, description }; }
    });
}
