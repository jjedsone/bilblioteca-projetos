// src/services/api.ts
import type { Project } from "../store/projects";
import type { Book } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5174/api";

// Tipos para requisições
export interface CreateProjectRequest {
  name: string;
}

export interface UpdateProjectRequest {
  name?: string;
  book?: Book;
  finalized?: boolean;
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  isRead?: boolean;
  isReading?: boolean;
}

// Função helper para fazer requisições
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API de Projetos
export const apiProjects = {
  // Listar todos os projetos
  getAll: async (): Promise<Project[]> => {
    return request<Project[]>("/projects");
  },

  // Obter projeto por ID
  getById: async (id: string): Promise<Project> => {
    return request<Project>(`/projects/${id}`);
  },

  // Criar novo projeto
  create: async (data: CreateProjectRequest): Promise<Project> => {
    return request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Atualizar projeto
  update: async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    return request<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Deletar projeto
  delete: async (id: string): Promise<void> => {
    await request(`/projects/${id}`, {
      method: "DELETE",
    });
  },
};

// API de Saúde
export const apiHealth = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    return request<{ status: string; timestamp: string }>("/health");
  },
};

