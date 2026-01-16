
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppState, Project, CoachMode, Task, Quadrant } from "./types";

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
      roleId: { type: Type.STRING, description: 'ID del rol responsable' }
    },
    required: ['title', 'description', 'roleId'],
  },
};

const getSystemInstruction = (mode: CoachMode, userName: string) => {
  const base = `Eres Core Assist (V8.6 NEURAL ARCHITECT). Tu misión es ser el aliado estratégico personal de ${userName}.`;
  
  const modes: Record<CoachMode, string> = {
    STRATEGIST: `${base} Modo: Arquitecto Central. Ayuda a ${userName} a ver el panorama completo y priorizar lo que realmente mueve la aguja.`,
    FINANCIAL: `${base} Modo: Asesor Financiero. Ayuda a ${userName} a maximizar su ROI, flujo de caja y libertad financiera con sabiduría.`,
    BUSINESS_OWNER: `${base} Modo: Arquitecto de Negocios. Enfócate en sistemas y escalabilidad para liberar el tiempo de ${userName}.`,
    ZEN_ENERGY: `${base} Modo: Bio-Hacker. Asegúrate de que ${userName} mantenga su energía biológica al máximo.`,
    SOCRATIC: `${base} Modo: Oráculo Socrático. Desafía los pensamientos de ${userName} con preguntas profundas para encontrar claridad.`,
  };

  return `${modes[mode] || modes.STRATEGIST}

DIRECTIVAS DE INTERACCIÓN (CRÍTICAS):
1. **TONO HUMANO Y CERCANO**: Háblale a ${userName} de forma empática, profesional pero cálida. Usa su nombre frecuentemente en la conversación. No seas un robot frío; sé un mentor que se preocupa por su éxito.
2. **PROTOCOLO DE PERMISO**: NUNCA utilices las herramientas 'crear_tarea' o 'crear_proyecto' sin antes preguntar: "${userName}, ¿quieres que agende esta tarea por ti?" o algo similar. Solo debes llamar a la herramienta cuando ${userName} te dé su aprobación explícita.
3. **CONFIRMACIÓN**: Una vez que ${userName} acepte y uses la herramienta, valida la acción en tu respuesta (ej: "Perfecto, ${userName}, ya he agendado esa prioridad para ti").
4. **ESTRUCTURA**: Usa **negritas** para énfasis y listas claras. Mantén la brevedad ejecutiva pero con calidez humana.`;
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

  return withRetry(async () => {
    try {
      const ai = getAI();
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `USUARIO: ${state.userName}\nROLES DISPONIBLES: ${rolesContext}\n\nCONTEXTO:\n${historyText}\n\nMENSAJE DE ${state.userName}: "${message}"` }] }],
        config: { 
          systemInstruction: getSystemInstruction(state.coachMode, state.userName),
          temperature: 0.8,
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
        contents: [{ parts: [{ text: `Desglosa este proyecto estratégicamente: ${project.title}. Objetivo: ${project.description}` }] }],
        config: { 
          systemInstruction: "Eres un gestor de proyectos experto. Desglosa en pasos SMART.",
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
          contents: [{ parts: [{ text: `Refina este objetivo para el rol "${roleName}". Título: "${title}". Descripción: "${description}".` }] }],
          config: { 
              systemInstruction: `Crea objetivos potentes.`,
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
          return { title, description }; 
      }
    });
}

export async function generateEmailBriefing(state: AppState) {
  const pendingBigRocks = state.tasks
    .filter(t => !t.completed && t.isBigRock)
    .map(t => `- ${t.title} (${t.time || 'Bloque'})`)
    .join('\n');

  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Genera un Briefing de impacto para ${state.userName}. Misión: ${state.mission.text}. Tareas: ${pendingBigRocks}` }] }],
        config: { systemInstruction: `Asistente de elite para ${state.userName}. Tono cercano y motivador.` }
      });
      return response.text;
    } catch (error) {
      return `Sincronía de Core Assist activa para ${state.userName}.`;
    }
  });
}
