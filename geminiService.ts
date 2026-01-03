
import { GoogleGenAI } from "@google/genai";
import { AppState } from "./types";

const SYSTEM_INSTRUCTION = `Actúa como un Coach de Productividad Senior experto en la metodología de Stephen Covey ("Los 7 hábitos de la gente altamente efectiva").
Tu enfoque principal es ayudar al usuario a vivir en el CUADRANTE II (Importante pero NO Urgente).

Reglas de oro:
1. Sé motivador pero firme con las prioridades.
2. Si el usuario tiene muchas tareas en Q1 (Urgente), aconséjale cómo prevenir que vuelvan a ocurrir.
3. Si el usuario no tiene Piedras Grandes (Big Rocks), recuérdale que su frasco se está llenando de arena.
4. Usa siempre el contexto de sus ROLES y su MISIÓN para validar si una tarea es realmente importante.
5. Responde siempre en español de forma concisa y práctica.
6. Si te preguntan cómo usar la app, explícales que deben empezar por su Misión, luego Roles, luego identificar Piedras Grandes y finalmente agendar la Arena.`;

// Inicialización lazy para evitar que el ReferenceError de process.env bloquee la carga de la app
const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getCoachResponse(message: string, state: AppState) {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Contexto del Usuario:
      Misión: ${state.mission.text}
      Roles Actuales: ${state.roles.map(r => r.name).join(', ')}
      Tareas en Lista: ${state.tasks.map(t => `${t.title} [Cuadrante ${t.quadrant}]`).join(', ')}
      
      Pregunta del usuario: "${message}"
    `,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  return response.text;
}

export async function analyzeAlignment(state: AppState) {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analiza esta lista de tareas y verifica si se alinean con la misión y los roles.
      Misión: ${state.mission.text}
      Tareas: ${JSON.stringify(state.tasks)}
      Roles: ${JSON.stringify(state.roles)}
      Dame un puntaje de alineación del 1 al 10 y una recomendación crítica para mejorar el enfoque en el Cuadrante II.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text;
}

export async function optimizeWeek(state: AppState) {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Optimización de Semana: ${JSON.stringify(state.tasks)}. 
    Identifica qué tareas de Q1 podrían haberse evitado con planificación en Q2. 
    Sugiere 3 Piedras Grandes para la próxima semana basadas en sus roles: ${state.roles.map(r => r.name).join(', ')}.`,
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });
  return response.text;
}
