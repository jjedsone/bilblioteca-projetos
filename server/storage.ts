// server/storage.ts
import { promises as fs } from "fs";
import { join } from "path";
import type { Project } from "./types.js";
import { firestoreStorage } from "./firestore.js";

const DATA_DIR = join(process.cwd(), "server", "data");
const PROJECTS_FILE = join(DATA_DIR, "projects.json");

// Usar Firestore se disponível, caso contrário usar JSON
const USE_FIRESTORE = process.env.USE_FIRESTORE !== "false";

// Carregar projetos do Firestore ou arquivo JSON
export async function loadProjects(): Promise<Project[]> {
  if (USE_FIRESTORE) {
    try {
      return await firestoreStorage.loadProjects();
    } catch (error) {
      console.warn("Erro ao carregar do Firestore, tentando JSON:", error);
      // Fallback para JSON se Firestore falhar
      return loadProjectsJSON();
    }
  }
  return loadProjectsJSON();
}

// Salvar projetos no Firestore ou arquivo JSON
export async function saveProjects(projects: Project[]): Promise<void> {
  if (USE_FIRESTORE) {
    try {
      // Firestore gerencia cada documento separadamente
      // Então não precisamos sobrescrever tudo
      return;
    } catch (error) {
      console.warn("Erro ao salvar no Firestore, tentando JSON:", error);
      // Fallback para JSON se Firestore falhar
      return saveProjectsJSON(projects);
    }
  }
  return saveProjectsJSON(projects);
}

// Funções de fallback para JSON
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadProjectsJSON(): Promise<Project[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf-8");
    const projects = JSON.parse(data) as Project[];
    return projects.map(reviveDates);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function saveProjectsJSON(projects: Project[]): Promise<void> {
  await ensureDataDir();
  const data = JSON.stringify(projects, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2);
  await fs.writeFile(PROJECTS_FILE, data, "utf-8");
}

function reviveDates(project: any): Project {
  const revive = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(revive);
    }
    if (obj && typeof obj === "object") {
      const result: any = {};
      for (const key in obj) {
        const value = obj[key];
        if (
          (key === "createdAt" ||
            key === "updatedAt" ||
            key === "finalizedAt" ||
            key === "readAt" ||
            key === "timestamp" ||
            key.endsWith("At")) &&
          typeof value === "string"
        ) {
          result[key] = new Date(value);
        } else {
          result[key] = revive(value);
        }
      }
      return result;
    }
    return obj;
  };
  return revive(project) as Project;
}

