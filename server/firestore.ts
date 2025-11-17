// server/firestore.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Project } from "./types.js";

// Inicializar Firebase Admin apenas uma vez
if (getApps().length === 0) {
  // Se não tiver service account, usar Application Default Credentials
  // Para produção, configure GOOGLE_APPLICATION_CREDENTIALS
  try {
    initializeApp({
      projectId: "biblioteca-86363",
    });
  } catch (error) {
    console.warn("Firebase Admin não configurado. Usando storage JSON como fallback.");
  }
}

const db = getFirestore();

// Converter Firestore Timestamp para Date
function convertTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj.toDate && typeof obj.toDate === "function") return obj.toDate();
  if (Array.isArray(obj)) return obj.map(convertTimestamps);
  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertTimestamps(obj[key]);
    }
    return result;
  }
  return obj;
}

export const firestoreStorage = {
  // Carregar todos os projetos
  loadProjects: async (): Promise<Project[]> => {
    try {
      const snapshot = await db.collection("projects").orderBy("updatedAt", "desc").get();
      const projects: Project[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const project = convertTimestamps(data) as Project;
        project.id = doc.id;
        projects.push(project);
      });
      
      return projects;
    } catch (error) {
      console.error("Erro ao carregar projetos do Firestore:", error);
      // Fallback para JSON se Firestore não estiver disponível
      throw error;
    }
  },

  // Salvar projetos
  saveProjects: async (projects: Project[]): Promise<void> => {
    try {
      const batch = db.batch();
      
      // Limpar todos os documentos existentes primeiro
      const snapshot = await db.collection("projects").get();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Adicionar todos os projetos
      projects.forEach((project) => {
        const { id, ...data } = project;
        const projectRef = db.collection("projects").doc(id);
        batch.set(projectRef, data);
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Erro ao salvar projetos no Firestore:", error);
      throw error;
    }
  },

  // Adicionar projeto
  addProject: async (project: Project): Promise<void> => {
    try {
      const { id, ...data } = project;
      await db.collection("projects").doc(id).set(data);
    } catch (error) {
      console.error("Erro ao adicionar projeto no Firestore:", error);
      throw error;
    }
  },

  // Atualizar projeto
  updateProject: async (id: string, updates: Partial<Project>): Promise<void> => {
    try {
      await db.collection("projects").doc(id).update({
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Erro ao atualizar projeto no Firestore:", error);
      throw error;
    }
  },

  // Deletar projeto
  deleteProject: async (id: string): Promise<void> => {
    try {
      await db.collection("projects").doc(id).delete();
    } catch (error) {
      console.error("Erro ao deletar projeto do Firestore:", error);
      throw error;
    }
  },
};

