/* eslint-disable @typescript-eslint/no-unused-vars */
// src/store/projects.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Book } from "../types";
import { makeId } from "../types";
import localforage from "localforage";

/**
 * Modelo clássico e coerente:
 * - Project descreve apenas o PROJETO (id, name, datas) e guarda o BOOK dentro de `book`.
 * - Stacks e versions referenciam SEMPRE objetos Book completos (em memória).
 */
localforage.config({
  name: "txt-book",
  storeName: "projects", // nome da store interna
  description: "Projetos e livros do app TXT→Livro",
});

/**
 * Modelo
 */

export interface Version {
  id: string;
  createdAt: Date;
  note?: string;
  book: Book;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  book?: Book;

  // Histórico/versões (snapshots de Book) — mantidos em memória
  undoStack?: Book[];
  redoStack?: Book[];
  versions?: Version[];
}

type State = {
  projects: Project[];
  selectedId: string | null;
};

type Actions = {
  // Histórico
  undo: (id: string) => void;
  redo: (id: string) => void;
  saveVersion: (id: string, note?: string) => void;
  restoreVersion: (id: string, versionId: string) => void;

  // CRUD de projeto
  addProject: (name: string) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;

  // seleção de projeto (duas assinaturas por compatibilidade)
  selectProject: (id: string) => void;
  setSelectedId: (id: string | null) => void;

  // Conteúdo do livro dentro do projeto
  setBook: (id: string, book: Book) => void;
};

const UNDO_MAX = 20; // limite de histórico em memória

export const useProjects = create<State & Actions>()(
  persist(
    (set, _get) => ({
      projects: [],
      selectedId: null,

      addProject: (name: string) =>
        set((state) => {
          const now = new Date();
          const proj: Project = {
            id: makeId("proj"),
            name: name.trim() || "Sem título",
            createdAt: now,
            updatedAt: now,
            undoStack: [],
            redoStack: [],
            versions: [],
          };
          return { projects: [proj, ...state.projects], selectedId: proj.id };
        }),

      renameProject: (id, name) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, name: name.trim() || p.name, updatedAt: new Date() }
              : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => {
          const left = state.projects.filter((p) => p.id !== id);
          const selectedId =
            state.selectedId === id ? left[0]?.id ?? null : state.selectedId;
          return { projects: left, selectedId };
        }),

      // mantém a API antiga
      selectProject: (id) => set({ selectedId: id }),

      // nova ação, usada pela Library
      setSelectedId: (id) => set({ selectedId: id }),

      setBook: (id, book) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;

            // prepara pilhas
            const undo = [...(p.undoStack ?? [])];
            const redo: Book[] = []; // limpa redo ao inserir novo estado

            if (p.book) {
              // snapshot profundo para histórico
              undo.push(JSON.parse(JSON.stringify(p.book)));
              // limita tamanho do histórico em memória
              if (undo.length > UNDO_MAX) undo.splice(0, undo.length - UNDO_MAX);
            }

            return {
              ...p,
              book: JSON.parse(JSON.stringify(book)),
              undoStack: undo,
              redoStack: redo,
              updatedAt: new Date(),
            };
          }),
        })),

      undo: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;

            const undo = [...(p.undoStack ?? [])];
            const redo = [...(p.redoStack ?? [])];

            if (!p.book || undo.length === 0) return p;

            const prev = undo.pop()!;
            // snapshot atual vai para redo
            redo.push(JSON.parse(JSON.stringify(p.book)));
            if (redo.length > UNDO_MAX) redo.splice(0, redo.length - UNDO_MAX);

            return {
              ...p,
              book: prev,
              undoStack: undo,
              redoStack: redo,
              updatedAt: new Date(),
            };
          }),
        })),

      redo: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;

            const undo = [...(p.undoStack ?? [])];
            const redo = [...(p.redoStack ?? [])];

            if (!p.book || redo.length === 0) return p;

            const next = redo.pop()!;
            // snapshot atual vai para undo
            undo.push(JSON.parse(JSON.stringify(p.book)));
            if (undo.length > UNDO_MAX) undo.splice(0, undo.length - UNDO_MAX);

            return {
              ...p,
              book: next,
              undoStack: undo,
              redoStack: redo,
              updatedAt: new Date(),
            };
          }),
        })),

      saveVersion: (id, note) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            if (!p.book) return p;

            const versions = [...(p.versions ?? [])];
            versions.unshift({
              id: makeId("ver"),
              createdAt: new Date(),
              note,
              book: JSON.parse(JSON.stringify(p.book)),
            });
            // (opcional) limite de versões em memória:
            if (versions.length > 50) versions.pop();

            return { ...p, versions };
          }),
        })),

      restoreVersion: (id, versionId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;

            const v = (p.versions ?? []).find((v) => v.id === versionId);
            if (!v) return p;

            const undo = [...(p.undoStack ?? [])];
            if (p.book) {
              undo.push(JSON.parse(JSON.stringify(p.book)));
              if (undo.length > UNDO_MAX) undo.splice(0, undo.length - UNDO_MAX);
            }

            return {
              ...p,
              book: JSON.parse(JSON.stringify(v.book)),
              undoStack: undo,
              updatedAt: new Date(),
            };
          }),
        })),
    }),
    {
      name: "txt-book-projects",

      /**
       * Persistência: salvar APENAS o essencial (id, name, datas, book).
       * NÃO persistir undo/redo/versions para não estourar cota do localStorage.
       */
      partialize: (state) => ({
        selectedId: state.selectedId,
        projects: state.projects.map((p) => ({
          id: p.id,
          name: p.name,
          createdAt:
            p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
          updatedAt:
            p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
          book: p.book ? JSON.parse(JSON.stringify(p.book)) : undefined,
          // NÃO persistimos: undoStack, redoStack, versions
        })),
      }),

      /**
       * Hidratação: converter ISO de volta para Date
       */
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.projects = state.projects.map((p) => ({
          ...p,
          createdAt:
            typeof p.createdAt === "string" ? new Date(p.createdAt) : p.createdAt,
          updatedAt:
            typeof p.updatedAt === "string" ? new Date(p.updatedAt) : p.updatedAt,
        }));
      },
    }
  )
);
