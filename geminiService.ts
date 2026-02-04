
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { AppState, Project, CoachMode, Task, Quadrant, BusinessArea } from "./types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
      throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

const extractJSON = (text: string) => {
    try {
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
    description: 'Crea una nueva tarea en la agenda del usuario.',
    properties: {
      title: { type: Type.STRING, description: 'Título de la tarea' },
      roleId: { type: Type.STRING, description: 'ID del rol asociado' },
      quadrant: { type: Type.STRING, description: 'Cuadrante: I, II, III o IV' },
      day: { type: Type.NUMBER, description: 'Día de la semana (0=Lun, 6=Dom). null para Arena.' },
      time: { type: Type.STRING, description: 'Hora HH:MM' }
    },
    required: ['title', 'roleId', 'quadrant'],
  },
};

const createProjectTool: FunctionDeclaration = {
  name: 'crear_proyecto',
  parameters: {
    type: Type.OBJECT,
    description: 'Crea un nuevo proyecto estratégico.',
    properties: {
      title: { type: Type.STRING, description: 'Nombre del proyecto' },
      description: { type: Type.STRING, description: 'Objetivo y alcance' },
      roleId: { type: Type.STRING, description: 'ID del rol responsable' },
      area: { type: Type.STRING, description: 'Área: FINANCE, MARKETING, ACCOUNTING, OPERATIONS, SALES, GENERAL' }
    },
    required: ['title', 'description', 'roleId', 'area'],
  },
};

const getSystemInstruction = (mode: CoachMode, userName: string) => {
  const base = `Eres Core Assist (V8.9 NEURAL ARCHITECT). Tu misión es ser el aliado estratégico personal de ${userName}.`;
  
  const modes: Record<CoachMode, string> = {
    STRATEGIST: `${base} Modo: Arquitecto Central. Ayuda a ${userName} a ver el panorama completo y priorizar lo que realmente mueve la aguja. Analiza cada ángulo antes de actuar.`,
    FINANCIAL: `${base} Modo: Asesor Financiero. Ayuda a ${userName} a maximizar su ROI, flujo de caja y libertad financiera con sabiduría profunda. No tomes decisiones ligeras.`,
    BUSINESS_OWNER: `${base} Modo: Arquitecto de Negocios. Enfócate en sistemas y escalabilidad. Cuestiona los procesos actuales para liberar el tiempo de ${userName}.`,
    ZEN_ENERGY: `${base} Modo: Bio-Hacker. Asegúrate de que ${userName} mantenga su energía biológica al máximo. Investiga sus hábitos antes de proponer cambios.`,
    SOCRATIC: `${base} Modo: Oráculo de Claridad. Tu enfoque es la Ley del Control y la planificación por diseño a través de preguntas profundas.`,
  };

  const modeInstruction = modes[mode] || modes.STRATEGIST;

  return `${modeInstruction}

DIRECTIVAS DE INTERACCIÓN CRÍTICAS (PROTOCOLO V8.9):
1. **ANÁLISIS EXHAUSTIVO**: Tus respuestas deben ser ricas en contenido, estratégicas y pedagógicas. No te limites a respuestas cortas. Explica el "por qué" detrás de tus sugerencias.
2. **PROTOCOLO SOCRÁTICO**: Si el usuario pide algo vago, NO uses las herramientas de creación inmediatamente. Realiza preguntas inteligentes para definir el Rol, el Área y el impacto.
3. **Voz Neural**: Tus palabras serán escuchadas. Mantén un discurso claro, inspirador y profesional.
4. **HISTORIAL Y CONTEXTO**: Tienes acceso a todos los proyectos para realizar análisis cruzados.
5. **TONO HUMANO**: Empático, profesional y extremadamente inteligente.`;
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
  const currentHistory = state.coachMessages[state.coachMode] || [];
  const historyText = currentHistory.map(m => `${m.role === 'user' ? 'Usuario' : 'Core'}: ${m.text}`).join('\n');
  const rolesContext = state.roles.map(r => `ID: ${r.id}, Nombre: ${r.name}`).join(' | ');
  const projectHistory = state.projects.map(p => `PROYECTO [${p.area}]: ${p.title} - ${p.description}`).join('\n');
  const taskHistory = state.tasks.filter(t => t.completed).slice(-15).map(t => `- ${t.title}`).join('\n');

  return withRetry(async () => {
    try {
      const ai = getAI();
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `USUARIO: ${state.userName}
ROLES DISPONIBLES: ${rolesContext}
HISTORIAL PROYECTOS: ${projectHistory}
TAREAS RECIENTES: ${taskHistory}
CONTEXTO CHAT: ${historyText}
MENSAJE DE ${state.userName}: "${message}"
INSTRUCCIÓN: Respuesta detallada. Pregunta antes de actuar si hay dudas.` }] }],
        config: { 
          systemInstruction: getSystemInstruction(state.coachMode, state.userName),
          temperature: 0.85,
          tools: [{ functionDeclarations: [createTaskTool, createProjectTool] }]
        }
      });
    } catch (error: any) { throw error; }
  });
}

/**
 * Generates audio speech for a given text response.
 */
export async function generateCoachVoice(text: string, voiceName: string = 'Kore') {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error: any) {
      console.error("Neural Voice Error:", error);
      throw error;
    }
  });
}

export async function breakdownProject(project: Project) {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Desglosa este proyecto: ${project.title}.` }] }],
        config: { 
          systemInstruction: `Gestor de proyectos experto en ${project.area}.`,
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

export async function improveProjectObjective(title: string, description: string, roleName: string, area: BusinessArea) {
    return withRetry(async () => {
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ parts: [{ text: `Refina objetivo: ${title}` }] }],
          config: { 
              systemInstruction: `Experto en objetivos estratégicos.`,
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
      } catch (error) { return { title, description }; }
    });
}

export async function generateEmailBriefing(state: AppState) {
  const pendingBigRocks = state.tasks.filter(t => !t.completed && t.isBigRock).map(t => `- ${t.title}`).join('\n');
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Genera briefing.` }] }],
        config: { systemInstruction: `Tono motivador.` }
      });
      return response.text;
    } catch (error) { return `Sync activo.`; }
  });
}
