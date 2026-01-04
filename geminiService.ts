
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, Project } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `Eres un experto en Productividad y OKRs (Objectives and Key Results) con el estilo de Google y la filosofía de Stephen Covey. 
Tu misión es transformar proyectos estratégicos en Objetivos ambiciosos y Resultados Clave (KRs) medibles.

Reglas para los OKRs:
1. El Objetivo (Objective) debe ser cualitativo, inspirador y agresivo.
2. Los Resultados Clave (KRs) deben ser cuantificables, basados en resultados (no solo actividades) y llevar al cumplimiento del objetivo.
3. Cada KR debe tener una 'Guía de Ejecución' que explique el 'cómo' táctico siguiendo el Cuadrante II de Covey.`;

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
        contents: `Contexto: Misión ${state.mission.text}. Usuario: ${message}`,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
      });
      return response.text;
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        return "Error: Proyecto o API Key no encontrados. Por favor, reconecta tu clave API.";
      }
      return "Error de conexión con el Coach.";
    }
  });
}

export async function improveProjectObjective(title: string, description: string) {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Título: ${title}. Descripción actual: "${description}". 
        Actúa como un experto en OKRs de Google y Stephen Covey. 
        Refina este Objetivo de Cuadrante II para que sea más inspirador, cualitativo y claro. 
        Devuelve el resultado en formato JSON con los campos 'title' y 'description'.`,
        config: { 
            systemInstruction: SYSTEM_INSTRUCTION,
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
      console.error("AI Project Improvement error:", error);
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
        contents: `Actúa como un PM de Google. Define el OKR para este proyecto:
          PROYECTO: ${project.title}
          DESCRIPCIÓN: ${project.description}
          
          Genera 5 Resultados Clave (KRs) medibles. Cada KR debe ser una tarea de Cuadrante II que el usuario pueda agendar.`,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "El Resultado Clave (KR) redactado de forma medible (ej: 'Lograr X para la fecha Y')" },
                instruction: { type: Type.STRING, description: "Estrategia táctica de Cuadrante II para alcanzar este KR" }
              },
              required: ["title", "instruction"]
            }
          }
        }
      });
      return JSON.parse(response.text?.trim() || '[]');
    } catch (error: any) {
      console.error("Breakdown error:", error);
      throw error;
    }
  });
}

export async function analyzeAlignment(state: AppState) {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analiza la alineación de estas tareas con la misión y los roles usando mentalidad de OKRs: ${JSON.stringify(state.tasks)}`,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
      });
      return response.text;
    } catch (error: any) {
      console.error("Alignment analysis error:", error);
      return "No pude analizar la alineación en este momento.";
    }
  });
}

export async function optimizeWeek(state: AppState) {
  return withRetry(async () => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Optimiza la agenda semanal priorizando los KRs de los proyectos activos: ${JSON.stringify(state.tasks)}`,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
      });
      return response.text;
    } catch (error: any) {
      console.error("Optimization error:", error);
      return "No pude optimizar la agenda en este momento.";
    }
  });
}
