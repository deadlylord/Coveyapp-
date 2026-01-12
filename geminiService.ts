
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppState, Project, CoachMode, Task, Quadrant } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Definición de Funciones para el Modelo
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
  const base = `Eres Core Assist (V6.5 NEURAL INTERFACE). Tu misión es optimizar la arquitectura de vida y negocio del usuario mediante principios de alto impacto.`;
  
  const modes: Record<CoachMode, string> = {
    STRATEGIST: `${base} 
      Modo: Estratega Core (Priorización Q2).
      Enfoque: Gestión del tiempo estratégica, alineación de valores y ejecución impecable.`,
    
    BUSINESS_OWNER: `${base} 
      Modo: Arquitecto de Negocios y ROI.
      Enfoque: Maximizar el retorno de inversión del tiempo. Escalamiento, delegación técnica y libertad financiera.
      Consejo: Sé extremadamente pragmático. Si una tarea no genera valor, sugiere eliminarla.`,
    
    ZEN_ENERGY: `${base} 
      Modo: Bio-Hacker de Alto Rendimiento.
      Enfoque: Gestión de la energía biológica sobre el tiempo. Foco cognitivo y vitalidad.`,
    
    SOCRATIC: `${base} 
      Modo: Oráculo de Lógica Socrática.
      Enfoque: Claridad radical a través de preguntas profundas. Eliminar el ruido mental.`,
  };

  const instructions = modes[mode] || modes.STRATEGIST;

  return `${instructions}

REGLA CRÍTICA DE FLUJO:
1. SIEMPRE debes responder con texto primero. Explica tu razonamiento, da el consejo o responde la pregunta.
2. Si el usuario te pide crear algo, o si consideras necesario crear una tarea/proyecto para su beneficio, utiliza las herramientas PROPORCIONADAS después de explicarlo en tu respuesta.
3. NUNCA envíes una respuesta vacía o solo herramientas. El usuario necesita tu guía textual.
4. Confirma en tu texto qué acciones has tomado (ej: "He agendado la tarea X en tu lista de hoy").

REGLAS DE FORMATO:
- Usa **negritas** para conceptos clave.
- Usa listas con guiones para estructurar ideas.
- Mantén un tono de alto nivel, profesional y motivador.`;
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status >= 500 || error.status === 429)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function getCoachResponse(message: string, state: AppState) {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Usuario: "${message}". 
Contexto Actual: 
- Nombre: ${state.userName}
- Roles: ${state.roles.map(r => `[ID:${r.id}] ${r.name}`).join(', ')}
- Tareas esta semana: ${state.tasks.filter(t => t.weekOffset === 0).length}
- Proyectos activos: ${state.projects.length}`,
        config: { 
          systemInstruction: getSystemInstruction(state.coachMode),
          temperature: 0.7,
          tools: [{ functionDeclarations: [createTaskTool, createProjectTool] }]
        }
      });
      return response;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw error;
    }
  });
}

export async function improveProjectObjective(title: string, description: string) {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Refina este Proyecto Estratégico para máxima claridad: Título: "${title}". Descripción: "${description}".`,
        config: { 
            systemInstruction: getSystemInstruction('BUSINESS_OWNER'),
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
      return JSON.parse(response.text?.trim() || '{}');
    } catch (error) {
      return { title, description };
    }
  });
}

export async function breakdownProject(project: Project) {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Desglosa este Proyecto en 5 OKRs: Proyecto: ${project.title}. Descripción: ${project.description}`,
        config: { 
          systemInstruction: getSystemInstruction('BUSINESS_OWNER'),
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                instruction: { type: Type.STRING }
              },
              required: ["title", "instruction"]
            }
          }
        }
      });
      return JSON.parse(response.text?.trim() || '[]');
    } catch (error: any) {
      throw error;
    }
  });
}
