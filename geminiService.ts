
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
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
  const base = `Eres Core Assist (V8.8 NEURAL ARCHITECT). Tu misión es ser el aliado estratégico personal de ${userName}.`;
  
  const modes: Record<CoachMode, string> = {
    STRATEGIST: `${base} Modo: Arquitecto Central. Ayuda a ${userName} a ver el panorama completo y priorizar lo que realmente mueve la aguja. Analiza cada ángulo antes de actuar.`,
    FINANCIAL: `${base} Modo: Asesor Financiero. Ayuda a ${userName} a maximizar su ROI, flujo de caja y libertad financiera con sabiduría profunda. No tomes decisiones ligeras.`,
    BUSINESS_OWNER: `${base} Modo: Arquitecto de Negocios. Enfócate en sistemas y escalabilidad. Cuestiona los procesos actuales para liberar el tiempo de ${userName}.`,
    ZEN_ENERGY: `${base} Modo: Bio-Hacker. Asegúrate de que ${userName} mantenga su energía biológica al máximo. Investiga sus hábitos antes de proponer cambios.`,
    SOCRATIC: `${base} Modo: Oráculo de Claridad. Tu enfoque es la Ley del Control y la planificación por diseño a través de preguntas profundas.`,
  };

  const modeInstruction = modes[mode] || modes.STRATEGIST;

  return `${modeInstruction}

DIRECTIVAS DE INTERACCIÓN CRÍTICAS (PROTOCOLO V8.8):
1. **ANÁLISIS EXHAUSTIVO**: Tus respuestas deben ser ricas en contenido, estratégicas y pedagógicas. No te limites a respuestas cortas. Explica el "por qué" detrás de tus sugerencias.
2. **PROTOCOLO SOCRÁTICO**: Si el usuario pide algo vago (ej: "ayúdame con marketing"), NO uses las herramientas de creación inmediatamente. En su lugar, realiza preguntas inteligentes para definir el Rol, el Área, el objetivo SMART y el impacto esperado.
3. **CURADORÍA DE ACCIONES**: Solo propón el uso de herramientas de creación (\`crear_tarea\`, \`crear_proyecto\`) cuando tengas claridad absoluta. Si falta información, PRIORIZA EL DIÁLOGO.
4. **HISTORIAL Y CONTEXTO**: Tienes acceso a todos los proyectos. Si el usuario menciona un tema, revisa cómo afecta a cada área y cita proyectos previos si son relevantes.
5. **VISIÓN INTEGRAL**: Considera el impacto cruzado (ej: cómo una campaña de marketing afecta el flujo de caja en finanzas).
6. **TONO HUMANO**: Empático, profesional, cálido y extremadamente inteligente.`;
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
  
  // Historical context of projects and tasks
  const projectHistory = state.projects.map(p => `PROYECTO [${p.area}]: ${p.title} - ${p.description} (${p.steps.length} pasos)`).join('\n');
  const taskHistory = state.tasks.filter(t => t.completed).slice(-15).map(t => `- ${t.title}`).join('\n');

  return withRetry(async () => {
    try {
      const ai = getAI();
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `USUARIO: ${state.userName}
ROLES DISPONIBLES: ${rolesContext}

CONOCIMIENTO HISTÓRICO PROYECTOS:
${projectHistory}

TAREAS COMPLETADAS RECIENTEMENTE:
${taskHistory}

CONTEXTO CHAT:
${historyText}

MENSAJE DE ${state.userName}: "${message}"

INSTRUCCIÓN ADICIONAL: Genera una respuesta detallada y estratégica. Si necesitas más datos para ser preciso, pregunta antes de sugerir acciones.` }] }],
        config: { 
          systemInstruction: getSystemInstruction(state.coachMode, state.userName),
          temperature: 0.85,
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
        contents: [{ parts: [{ text: `Desglosa este proyecto del área ${project.area}: ${project.title}. Objetivo: ${project.description}` }] }],
        config: { 
          systemInstruction: `Eres un gestor de proyectos experto especializado en ${project.area}. Desglosa en pasos SMART.`,
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
          contents: [{ parts: [{ text: `Refina este objetivo para el rol "${roleName}" en el área de "${area}". Título: "${title}". Descripción: "${description}".` }] }],
          config: { 
              systemInstruction: `Crea objetivos potentes y estratégicos específicos para el área de negocio indicada.`,
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
