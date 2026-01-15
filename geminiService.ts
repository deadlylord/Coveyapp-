
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppState, Project, CoachMode, Task, Quadrant } from "./types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
      throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

// Utilidad para extraer JSON robusto de la respuesta
const extractJSON = (text: string) => {
    try {
        // Limpiar el texto de posibles bloques de código markdown
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        if (start === -1 || end === -1) return JSON.parse(cleanText);
        const jsonStr = cleanText.substring(start, end + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", text);
        return {};
    }
};

const createTaskTool: FunctionDeclaration = {
  name: 'crear_tarea',
  parameters: {
    type: Type.OBJECT,
    description: 'Sugiere crear una nueva tarea en la agenda del usuario.',
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
    description: 'Sugiere crear un nuevo proyecto estratégico.',
    properties: {
      title: { type: Type.STRING, description: 'Nombre del proyecto' },
      description: { type: Type.STRING, description: 'Objetivo y alcance' },
      roleId: { type: Type.STRING, description: 'ID del rol responsable' }
    },
    required: ['title', 'description', 'roleId'],
  },
};

const getSystemInstruction = (mode: CoachMode) => {
  const base = `Eres Core Assist (V8.0 NEURAL ARCHITECT). Tu misión es optimizar la arquitectura de vida y negocio mediante el principio 80/20.`;
  const modes: Record<CoachMode, string> = {
    STRATEGIST: `${base} Modo: Estratega Core. Prioriza Q2 y eficiencia operativa.`,
    BUSINESS_OWNER: `${base} Modo: Arquitecto de Negocios. Enfócate en ROI, escalabilidad y delegación.`,
    ZEN_ENERGY: `${base} Modo: Bio-Hacker. Prioriza la energía y el foco cognitivo.`,
    SOCRATIC: `${base} Modo: Oráculo Socrático. Claridad mediante preguntas críticas.`,
  };
  return `${modes[mode] || modes.STRATEGIST}

REGLAS DE ORO:
1. SIEMPRE pida confirmación antes de llamar a herramientas de creación. Di algo como "¿Deseas que agende esta tarea por ti?".
2. Solo usa las herramientas si el usuario lo solicita explícitamente o confirma tu sugerencia.
3. Sé directo. Formato Markdown.`;
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try { return await fn(); } catch (error: any) {
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
        contents: [{ parts: [{ text: `Usuario: "${message}". Contexto: Roles: ${state.roles.map(r => r.name).join(', ')}. Logros: ${completedTasks}` }] }],
        config: { 
          systemInstruction: getSystemInstruction(state.coachMode),
          temperature: 0.7,
          tools: [{ functionDeclarations: [createTaskTool, createProjectTool] }]
        }
      });
    } catch (error: any) { throw error; }
  });
}

export async function breakdownProject(project: Project) {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Analiza y desglosa este proyecto en pasos lógicos. Proyecto: ${project.title}. Descripción: ${project.description}` }] }],
        config: { 
          systemInstruction: "Eres un gestor de proyectos experto. Desglosa el proyecto en pasos accionables SMART.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedTotalWeeks: { type: Type.INTEGER },
              estimatedTotalHours: { type: Type.STRING },
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
      return extractJSON(response.text || '{}');
    } catch (error: any) { throw error; }
  });
}

export async function improveProjectObjective(title: string, description: string, roleName: string) {
    return withRetry(async () => {
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ parts: [{ text: `Optimiza este objetivo de proyecto para el rol: "${roleName}". Título: "${title}". Descripción: "${description}".` }] }],
          config: { 
              systemInstruction: `Refina objetivos para que sean de alto impacto.`,
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: { 
                      title: { type: Type.STRING }, 
                      description: { type: Type.STRING } 
                  },
                  required: ["title", "description"]
              }
          }
        });
        return extractJSON(response.text || '{}');
      } catch (error) { 
          console.error("Error in improveProjectObjective:", error);
          return { title, description }; 
      }
    });
}
