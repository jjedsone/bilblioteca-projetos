// src/services/firestore.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Project } from "../store/projects";

const PROJECTS_COLLECTION = "projects";

// Converter Firestore Timestamp para Date
function convertTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Timestamp) return obj.toDate();
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

// Converter Date para Firestore Timestamp
function convertDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return Timestamp.fromDate(obj);
  if (Array.isArray(obj)) return obj.map(convertDates);
  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertDates(obj[key]);
    }
    return result;
  }
  return obj;
}

// API do Firestore
export const firestoreService = {
  // Listar todos os projetos
  getAllProjects: async (): Promise<Project[]> => {
    try {
      const projectsRef = collection(db, PROJECTS_COLLECTION);
      const q = query(projectsRef, orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const project = convertTimestamps(data) as Project;
        project.id = doc.id;
        projects.push(project);
      });
      
      return projects;
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      throw error;
    }
  },

  // Obter projeto por ID
  getProjectById: async (id: string): Promise<Project | null> => {
    try {
      const projectRef = doc(db, PROJECTS_COLLECTION, id);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        return null;
      }
      
      const data = projectSnap.data();
      const project = convertTimestamps(data) as Project;
      project.id = projectSnap.id;
      
      return project;
    } catch (error) {
      console.error("Erro ao buscar projeto:", error);
      throw error;
    }
  },

  // Criar novo projeto
  createProject: async (project: Project | Omit<Project, "id">): Promise<Project> => {
    try {
      const projectsRef = collection(db, PROJECTS_COLLECTION);
      
      // Se já tem ID, usar ele, senão criar novo documento
      const projectId = "id" in project ? project.id : undefined;
      const newDocRef = projectId ? doc(db, PROJECTS_COLLECTION, projectId) : doc(projectsRef);
      
      const projectData = convertDates({
        ...project,
        createdAt: project.createdAt || new Date(),
        updatedAt: project.updatedAt || new Date(),
      });
      
      // Remover id dos dados se estiver presente (Firestore gerencia)
      if ("id" in projectData) {
        delete (projectData as any).id;
      }
      
      await setDoc(newDocRef, projectData);
      
      return {
        ...project,
        id: newDocRef.id,
      } as Project;
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      throw error;
    }
  },

  // Atualizar projeto
  updateProject: async (id: string, updates: Partial<Project> | Project): Promise<void> => {
    try {
      const projectRef = doc(db, PROJECTS_COLLECTION, id);
      
      // Se for um Project completo, converter tudo, senão apenas o partial
      const updateData = convertDates({
        ...(typeof updates === "object" && "id" in updates ? { ...updates, id: undefined } : updates),
        updatedAt: new Date(),
      });
      
      // Remover id se estiver presente
      delete (updateData as any).id;
      
      await setDoc(projectRef, updateData, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      throw error;
    }
  },

  // Deletar projeto
  deleteProject: async (id: string): Promise<void> => {
    try {
      const projectRef = doc(db, PROJECTS_COLLECTION, id);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error("Erro ao deletar projeto:", error);
      throw error;
    }
  },
};

