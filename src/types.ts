/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types.ts

export type Annotation = {
  id: string;
  chapterIndex: number;
  paragraphIndex: number;
  startChar: number;
  endChar: number;
  text: string;
  note: string;
  createdAt: Date;
  color?: string;
};

export type Comment = {
  id: string;
  chapterIndex: number;
  paragraphIndex: number;
  text: string;
  createdAt: Date;
  author?: string;
};

export type Chapter = {
  id: string;
  title: string;
  /** Fonte de verdade: texto plano do capítulo (um bloco). */
  text: string;
  /** Derivado de `text` quando necessário (UI/export) */
  paragraphs?: string[];
};

export type Book = {
  id: string;
  title: string;
  chapters: Chapter[];

  // Opcionais usados em outros componentes
  coverDataUrl?: string;      // CoverManager
  author?: string;            // MetadataManager
  subject?: string;           // MetadataManager
  keywords?: string[];        // MetadataManager
  originalFilename?: string;  // Importer
};

export type VersionSnapshot = {
  id: string;
  /** Pode vir string do storage; hidrate com new Date(...) */
  createdAt: Date;
  note?: string;
  book: Book;
};

export type Project = {
  id: string;
  name: string;               // nome "interno" do projeto
  title: string;              // título exibido do livro
  chapters: Chapter[];
  coverDataUrl?: string;

  createdAt: Date;
  updatedAt: Date;

  // Tags e categorias
  tags?: string[];            // Tags para organização
  category?: string;           // Categoria principal

  // Agregados
  book?: Book;
  versions?: VersionSnapshot[];

  // Histórico (pode ser pesado; considere limitar tamanho)
  undoStack?: Book[];
  redoStack?: Book[];
};

/** IDs mais robustos; usa crypto.randomUUID quando disponível. */
export function makeId(prefix = "id"): string {
  const core =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 9);
  return `${prefix}-${core}`;
}

/** Utilitário opcional: hidratar datas ao carregar do storage */
export function reviveDates<T>(obj: T): T {
  const isIso = (v: unknown) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v);
  const walk = (v: any): any => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out: any = {};
      for (const k in v) {
        const val = v[k];
        out[k] = isIso(val) ? new Date(val as string) : walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(obj);
}
