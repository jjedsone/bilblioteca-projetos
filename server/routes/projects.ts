// server/routes/projects.ts
import { Router } from "express";
import { loadProjects, saveProjects } from "../storage.js";
import { firestoreStorage } from "../firestore.js";
import type { Project, CreateProjectRequest, UpdateProjectRequest } from "../types.js";

const router = Router();

// Gerar ID único
function makeId(prefix = "proj"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// GET /api/projects - Listar todos os projetos
router.get("/", async (req, res) => {
  try {
    const projects = await loadProjects();
    res.json(projects);
  } catch (error) {
    console.error("Erro ao carregar projetos:", error);
    res.status(500).json({ error: "Erro ao carregar projetos" });
  }
});

// GET /api/projects/:id - Obter um projeto específico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await loadProjects();
    const project = projects.find((p) => p.id === id);

    if (!project) {
      return res.status(404).json({ error: "Projeto não encontrado" });
    }

    res.json(project);
  } catch (error) {
    console.error("Erro ao buscar projeto:", error);
    res.status(500).json({ error: "Erro ao buscar projeto" });
  }
});

// POST /api/projects - Criar novo projeto
router.post("/", async (req, res) => {
  try {
    const { name }: CreateProjectRequest = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Nome do projeto é obrigatório" });
    }

    const now = new Date();

    const newProject: Project = {
      id: makeId("proj"),
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
    };

    // Salvar no Firestore
    try {
      await firestoreStorage.addProject(newProject);
    } catch (error) {
      // Fallback para JSON se Firestore falhar
      const projects = await loadProjects();
      projects.push(newProject);
      await saveProjects(projects);
    }

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    res.status(500).json({ error: "Erro ao criar projeto" });
  }
});

// PUT /api/projects/:id - Atualizar projeto
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateProjectRequest = req.body;

    // Atualizar no Firestore
    try {
      await firestoreStorage.updateProject(id, updates);
      const project = await firestoreStorage.loadProjects().then(projects => 
        projects.find(p => p.id === id)
      );
      if (!project) {
        return res.status(404).json({ error: "Projeto não encontrado" });
      }
      res.json(project);
    } catch (error) {
      // Fallback para JSON se Firestore falhar
      const projects = await loadProjects();
      const index = projects.findIndex((p) => p.id === id);

      if (index === -1) {
        return res.status(404).json({ error: "Projeto não encontrado" });
      }

      const project = projects[index];
      const updatedProject: Project = {
        ...project,
        ...updates,
        updatedAt: new Date(),
      };

      projects[index] = updatedProject;
      await saveProjects(projects);

      res.json(updatedProject);
    }
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    res.status(500).json({ error: "Erro ao atualizar projeto" });
  }
});

// DELETE /api/projects/:id - Deletar projeto
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Deletar do Firestore
    try {
      await firestoreStorage.deleteProject(id);
      res.json({ message: "Projeto deletado com sucesso" });
    } catch (error) {
      // Fallback para JSON se Firestore falhar
      const projects = await loadProjects();
      const filtered = projects.filter((p) => p.id !== id);

      if (filtered.length === projects.length) {
        return res.status(404).json({ error: "Projeto não encontrado" });
      }

      await saveProjects(filtered);
      res.json({ message: "Projeto deletado com sucesso" });
    }
  } catch (error) {
    console.error("Erro ao deletar projeto:", error);
    res.status(500).json({ error: "Erro ao deletar projeto" });
  }
});

export default router;

