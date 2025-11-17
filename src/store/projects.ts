/* eslint-disable @typescript-eslint/no-unused-vars */
// src/store/projects.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Book } from "../types";
import { makeId } from "../types";
import { firestoreStorage } from "./firestoreStorage";
import { firestoreService } from "../services/firestore";

/**
 * Modelo clássico e coerente:
 * - Project descreve apenas o PROJETO (id, name, datas) e guarda o BOOK dentro de `book`.
 * - Stacks e versions referenciam SEMPRE objetos Book completos (em memória).
 * - Usa Firestore como storage principal com fallback para localStorage
 */

// Usar Firestore se disponível, caso contrário usar localStorage
const USE_FIRESTORE = import.meta.env.VITE_USE_FIRESTORE !== "false";

const storage = USE_FIRESTORE ? firestoreStorage : {
  getItem: async (name: string): Promise<string | null> => {
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    localStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name);
  },
};

/**
 * Modelo
 */

export interface Version {
  id: string;
  createdAt: Date;
  note?: string;
  book: Book;
}

export interface ReadingPosition {
  chapterIndex: number;
  pageNumber: number;
  timestamp: Date;
}

export interface Bookmark {
  id: string;
  chapterIndex: number;
  pageNumber: number;
  note?: string;
  createdAt: Date;
}

export interface Annotation {
  id: string;
  chapterIndex: number;
  paragraphIndex: number;
  startChar: number;
  endChar: number;
  text: string;
  note: string;
  createdAt: Date;
  color?: string;
}

export interface Comment {
  id: string;
  chapterIndex: number;
  paragraphIndex: number;
  text: string;
  createdAt: Date;
  author?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  book?: Book;

  // Status do livro
  finalized?: boolean;
  finalizedAt?: Date;

  // Leitura
  readingPosition?: ReadingPosition;
  bookmarks?: Bookmark[];
  readingHistory?: ReadingPosition[];
  
  // Anotações e comentários
  annotations?: Annotation[];
  comments?: Comment[];

  // Tags e categorias
  tags?: string[];
  category?: string;

  // Configurações de fonte por parágrafo (chapterIndex -> paragraphIndex -> useDraculaFont)
  paragraphFontSettings?: Record<string, Record<number, boolean>>;
  
  // Status de leitura
  isFavorite?: boolean;
  isRead?: boolean;
  isReading?: boolean;
  readAt?: Date;

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

  // Tags e categorias
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  setTags: (id: string, tags: string[]) => void;
  setCategory: (id: string, category: string) => void;

  // Finalização do livro
  finalizeBook: (id: string) => void;
  unfinalizeBook: (id: string) => void;

  // Leitura
  saveReadingPosition: (id: string, chapterIndex: number, pageNumber: number) => void;
  addBookmark: (id: string, chapterIndex: number, pageNumber: number, note?: string) => void;
  removeBookmark: (id: string, bookmarkId: string) => void;
  getLastReadingPosition: (id: string) => ReadingPosition | null;
  
  // Status de leitura
  toggleFavorite: (id: string) => void;
  markAsRead: (id: string) => void;
  markAsReading: (id: string) => void;
  unmarkRead: (id: string) => void;

  // Anotações
  addAnnotation: (id: string, annotation: Omit<Annotation, "id" | "createdAt">) => void;
  removeAnnotation: (id: string, annotationId: string) => void;
  updateAnnotation: (id: string, annotationId: string, note: string) => void;

  // Comentários
  addComment: (id: string, comment: Omit<Comment, "id" | "createdAt">) => void;
  removeComment: (id: string, commentId: string) => void;
  updateComment: (id: string, commentId: string, text: string) => void;

  // Atualizar projeto (para configurações gerais)
  updateProject: (id: string, updates: Partial<Project>) => void;
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

      // Tags e categorias
      addTag: (id, tag) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            const tags = [...(p.tags ?? [])];
            const tagLower = tag.trim().toLowerCase();
            if (!tags.some((t) => t.toLowerCase() === tagLower)) {
              tags.push(tag.trim());
            }
            return { ...p, tags, updatedAt: new Date() };
          }),
        })),

      removeTag: (id, tag) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            const tags = (p.tags ?? []).filter((t) => t.toLowerCase() !== tag.toLowerCase());
            return { ...p, tags: tags.length > 0 ? tags : undefined, updatedAt: new Date() };
          }),
        })),

      setTags: (id, tags) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            const cleanTags = tags.map((t) => t.trim()).filter(Boolean);
            return { ...p, tags: cleanTags.length > 0 ? cleanTags : undefined, updatedAt: new Date() };
          }),
        })),

      setCategory: (id, category) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return { ...p, category: category.trim() || undefined, updatedAt: new Date() };
          }),
        })),

      // Finalização do livro
      finalizeBook: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            if (!p.book) return p;
            return {
              ...p,
              finalized: true,
              finalizedAt: new Date(),
              updatedAt: new Date(),
            };
          }),
        })),

      unfinalizeBook: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              finalized: false,
              finalizedAt: undefined,
              updatedAt: new Date(),
            };
          }),
        })),

      // Leitura
      saveReadingPosition: (id, chapterIndex, pageNumber) =>
        set((state) => {
          const position: ReadingPosition = {
            chapterIndex,
            pageNumber,
            timestamp: new Date(),
          };
          return {
            projects: state.projects.map((p) => {
              if (p.id !== id) return p;
              const history = p.readingHistory || [];
              const newHistory = [...history, position].slice(-50); // Manter últimas 50 posições
              return {
                ...p,
                readingPosition: position,
                readingHistory: newHistory,
                updatedAt: new Date(),
              };
            }),
          };
        }),

      addBookmark: (id, chapterIndex, pageNumber, note) =>
        set((state) => {
          const bookmark: Bookmark = {
            id: makeId("bm"),
            chapterIndex,
            pageNumber,
            note,
            createdAt: new Date(),
          };
          return {
            projects: state.projects.map((p) => {
              if (p.id !== id) return p;
              const bookmarks = p.bookmarks || [];
              return {
                ...p,
                bookmarks: [...bookmarks, bookmark],
                updatedAt: new Date(),
              };
            }),
          };
        }),

      removeBookmark: (id, bookmarkId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            const bookmarks = (p.bookmarks || []).filter((b) => b.id !== bookmarkId);
            return {
              ...p,
              bookmarks: bookmarks.length > 0 ? bookmarks : undefined,
              updatedAt: new Date(),
            };
          }),
        })),

      getLastReadingPosition: (id) => {
        const state = _get();
        const proj = state.projects.find((p) => p.id === id);
        return proj?.readingPosition || null;
      },

      // Status de leitura
      toggleFavorite: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              isFavorite: !p.isFavorite,
              updatedAt: new Date(),
            };
          }),
        })),

      markAsRead: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              isRead: true,
              isReading: false,
              readAt: new Date(),
              updatedAt: new Date(),
            };
          }),
        })),

      markAsReading: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              isReading: true,
              isRead: false,
              updatedAt: new Date(),
            };
          }),
        })),

      unmarkRead: (id) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              isRead: false,
              isReading: false,
              readAt: undefined,
              updatedAt: new Date(),
            };
          }),
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        })),

      // Anotações
      addAnnotation: (id: string, annotation: Omit<Annotation, "id" | "createdAt">) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            const newAnnotation: Annotation = {
              ...annotation,
              id: makeId("ann"),
              createdAt: new Date(),
            };
            return {
              ...p,
              annotations: [...(p.annotations || []), newAnnotation],
              updatedAt: new Date(),
            };
          }),
        })),

      removeAnnotation: (id: string, annotationId: string) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              annotations: (p.annotations || []).filter((a) => a.id !== annotationId),
              updatedAt: new Date(),
            };
          }),
        })),

      updateAnnotation: (id: string, annotationId: string, note: string) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              annotations: (p.annotations || []).map((a) =>
                a.id === annotationId ? { ...a, note } : a
              ),
              updatedAt: new Date(),
            };
          }),
        })),

      // Comentários
      addComment: (id: string, comment: Omit<Comment, "id" | "createdAt">) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            const newComment: Comment = {
              ...comment,
              id: makeId("cmt"),
              createdAt: new Date(),
            };
            return {
              ...p,
              comments: [...(p.comments || []), newComment],
              updatedAt: new Date(),
            };
          }),
        })),

      removeComment: (id: string, commentId: string) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              comments: (p.comments || []).filter((c) => c.id !== commentId),
              updatedAt: new Date(),
            };
          }),
        })),

      updateComment: (id: string, commentId: string, text: string) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              comments: (p.comments || []).map((c) =>
                c.id === commentId ? { ...c, text } : c
              ),
              updatedAt: new Date(),
            };
          }),
        })),
    }),
    {
      name: "txt-book-projects",
      storage: storage as any,

      /**
       * Persistência: salvar APENAS o essencial (id, name, datas, book).
       * NÃO persistir undo/redo/versions para não estourar cota do localStorage.
       */
      partialize: (state): any => ({
        selectedId: state.selectedId,
        projects: state.projects.map((p) => ({
          id: p.id,
          name: p.name,
          createdAt:
            p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
          updatedAt:
            p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
          book: p.book ? JSON.parse(JSON.stringify(p.book)) : undefined,
          tags: p.tags,
          category: p.category,
          finalized: p.finalized,
          finalizedAt: p.finalizedAt instanceof Date ? p.finalizedAt.toISOString() : p.finalizedAt,
          readingPosition: p.readingPosition
            ? {
                ...p.readingPosition,
                timestamp:
                  p.readingPosition.timestamp instanceof Date
                    ? p.readingPosition.timestamp.toISOString()
                    : p.readingPosition.timestamp,
              }
            : undefined,
          bookmarks: p.bookmarks?.map((b) => ({
            ...b,
            createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
          })),
          readingHistory: p.readingHistory?.map((h) => ({
            ...h,
            timestamp: h.timestamp instanceof Date ? h.timestamp.toISOString() : h.timestamp,
          })),
          isFavorite: p.isFavorite,
          isRead: p.isRead,
          isReading: p.isReading,
          readAt: p.readAt instanceof Date ? p.readAt.toISOString() : p.readAt,
          annotations: p.annotations?.map((a) => ({
            ...a,
            createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
          })),
          comments: p.comments?.map((c) => ({
            ...c,
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
          })),
          paragraphFontSettings: p.paragraphFontSettings,
          // NÃO persistimos: undoStack, redoStack, versions
        })),
      }),

      /**
       * Hidratação: converter ISO de volta para Date e sincronizar com Firestore
       */
      onRehydrateStorage: () => async (state) => {
        if (!state) return;
        
        // Converter ISO strings para Date
        state.projects = state.projects.map((p) => ({
          ...p,
          createdAt:
            typeof p.createdAt === "string" ? new Date(p.createdAt) : p.createdAt,
          updatedAt:
            typeof p.updatedAt === "string" ? new Date(p.updatedAt) : p.updatedAt,
          finalizedAt:
            typeof p.finalizedAt === "string" ? new Date(p.finalizedAt) : p.finalizedAt,
          readingPosition: p.readingPosition
            ? {
                ...p.readingPosition,
                timestamp:
                  typeof p.readingPosition.timestamp === "string"
                    ? new Date(p.readingPosition.timestamp)
                    : p.readingPosition.timestamp,
              }
            : undefined,
          bookmarks: p.bookmarks?.map((b) => ({
            ...b,
            createdAt:
              typeof b.createdAt === "string" ? new Date(b.createdAt) : b.createdAt,
          })),
          readingHistory: p.readingHistory?.map((h) => ({
            ...h,
            timestamp:
              typeof h.timestamp === "string" ? new Date(h.timestamp) : h.timestamp,
          })),
          readAt:
            typeof p.readAt === "string" ? new Date(p.readAt) : p.readAt,
          annotations: p.annotations?.map((a) => ({
            ...a,
            createdAt:
              typeof a.createdAt === "string" ? new Date(a.createdAt) : a.createdAt,
          })),
          comments: p.comments?.map((c) => ({
            ...c,
            createdAt:
              typeof c.createdAt === "string" ? new Date(c.createdAt) : c.createdAt,
          })),
        }));
        
        // Sincronizar com Firestore se habilitado
        if (!USE_FIRESTORE) return;
        
        try {
          // Carregar projetos do Firestore
          const firestoreProjects = await firestoreService.getAllProjects();
          
          if (firestoreProjects.length > 0 || state.projects.length > 0) {
            // Sincronizar: mesclar projetos locais com os do Firestore
            const localProjects = state.projects || [];
            const mergedProjects = mergeProjects(localProjects, firestoreProjects);
            
            state.projects = mergedProjects;
            
            // Se não tiver selectedId e houver projetos, selecionar o primeiro
            if (!state.selectedId && mergedProjects.length > 0) {
              state.selectedId = mergedProjects[0].id;
            }
          }
        } catch (error) {
          console.error("Erro ao sincronizar com Firestore:", error);
          // Continuar com dados locais se Firestore falhar
        }
      },
    }
  )
);

// Função para mesclar projetos locais com os do Firestore
function mergeProjects(local: Project[], firestore: Project[]): Project[] {
  const merged: Project[] = [];
  const firestoreMap = new Map(firestore.map(p => [p.id, p]));
  const localMap = new Map(local.map(p => [p.id, p]));
  
  // Priorizar Firestore (mais recente), mas manter undo/redo stacks locais
  firestore.forEach(fsProject => {
    const localProject = localMap.get(fsProject.id);
    if (localProject) {
      // Mesclar: usar dados do Firestore mas manter stacks locais
      merged.push({
        ...fsProject,
        undoStack: localProject.undoStack || [],
        redoStack: localProject.redoStack || [],
        versions: localProject.versions || [],
      });
    } else {
      merged.push(fsProject);
    }
  });
  
  // Adicionar projetos locais que não estão no Firestore
  local.forEach(localProject => {
    if (!firestoreMap.has(localProject.id)) {
      merged.push(localProject);
      // Tentar salvar no Firestore (background)
      firestoreService.createProject(localProject).catch(console.error);
    }
  });
  
  // Ordenar por updatedAt (mais recente primeiro)
  return merged.sort((a, b) => {
    const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
    const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

// Sincronizar com Firestore após mudanças (apenas se usar Firestore)
if (USE_FIRESTORE && typeof window !== "undefined") {
  // Interceptar mudanças e sincronizar com Firestore
  useProjects.subscribe(async (state) => {
    // Debounce para evitar muitas chamadas
    clearTimeout((window as any).__firestoreSyncTimeout);
    (window as any).__firestoreSyncTimeout = setTimeout(async () => {
      try {
        // Salvar cada projeto individualmente no Firestore
        for (const project of state.projects) {
          try {
            const existing = await firestoreService.getProjectById(project.id);
            if (existing) {
              await firestoreService.updateProject(project.id, project);
            } else {
              await firestoreService.createProject(project);
            }
          } catch (error) {
            console.error(`Erro ao sincronizar projeto ${project.id}:`, error);
          }
        }
      } catch (error) {
        console.error("Erro ao sincronizar projetos com Firestore:", error);
      }
    }, 1000); // Aguardar 1 segundo após última mudança
  });
}
