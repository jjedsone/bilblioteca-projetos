// src/components/AdvancedSearch.tsx
import { useState, useCallback, useMemo } from "react";
import type { Book, Annotation, Comment } from "../types";

interface AdvancedSearchProps {
  book: Book;
  onSearch: (results: AdvancedSearchResult[]) => void;
  onClose: () => void;
  annotations?: Annotation[];
  comments?: Comment[];
  paragraphFontSettings?: Record<string, Record<number, boolean>>;
  globalDraculaEnabled?: boolean;
}

export interface AdvancedSearchResult {
  chapterIndex: number;
  chapterTitle: string;
  paragraphIndex: number;
  text: string;
  matchText: string;
}

export default function AdvancedSearch({
  book,
  onSearch,
  onClose,
  annotations,
  comments,
  paragraphFontSettings,
  globalDraculaEnabled = false,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"exact" | "fuzzy" | "regex">("exact");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [searchIn, setSearchIn] = useState<"all" | "titles" | "content">("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [onlyAnnotated, setOnlyAnnotated] = useState(false);
  const [onlyCommented, setOnlyCommented] = useState(false);
  const [onlyDracula, setOnlyDracula] = useState(false);
  const [minChars, setMinChars] = useState(0);
  const [maxResults, setMaxResults] = useState(200);

  const chapterOptions = useMemo(
    () =>
      book.chapters.map((chapter, index) => ({
        label: `${index + 1}. ${chapter.title || "Sem título"}`,
        value: index.toString(),
      })),
    [book.chapters]
  );

  const annotationSet = useMemo(() => {
    if (!annotations?.length) return new Set<string>();
    const set = new Set<string>();
    annotations.forEach((ann) => {
      set.add(`${ann.chapterIndex}-${ann.paragraphIndex}`);
    });
    return set;
  }, [annotations]);

  const commentSet = useMemo(() => {
    if (!comments?.length) return new Set<string>();
    const set = new Set<string>();
    comments.forEach((comment) => {
      set.add(`${comment.chapterIndex}-${comment.paragraphIndex}`);
    });
    return set;
  }, [comments]);

  const draculaSet = useMemo(() => {
    const set = new Set<string>();
    if (globalDraculaEnabled) {
      // Todos os parágrafos herdam Dracula global
      book.chapters.forEach((chapter, chapterIndex) => {
        const paragraphs = chapter.text.split(/\n{2,}/).filter(Boolean);
        paragraphs.forEach((_p, paragraphIndex) => {
          set.add(`${chapterIndex}-${paragraphIndex}`);
        });
      });
    }
    if (paragraphFontSettings) {
      Object.entries(paragraphFontSettings).forEach(([chapterKey, paragraphMap]) => {
        Object.entries(paragraphMap).forEach(([paragraphIndex, enabled]) => {
          if (enabled) {
            set.add(`${chapterKey}-${paragraphIndex}`);
          }
        });
      });
    }
    return set;
  }, [paragraphFontSettings, globalDraculaEnabled, book.chapters]);

  const [resultCount, setResultCount] = useState(0);

  const performSearch = useCallback(() => {
    if (!query.trim()) {
      onSearch([]);
      setResultCount(0);
      return;
    }

    const results: AdvancedSearchResult[] = [];
    const flags = caseSensitive ? "g" : "gi";
    const limit = Number.isFinite(maxResults) && maxResults > 0 ? maxResults : Infinity;
    const minCharacters = Math.max(0, Math.floor(minChars));
    const escapeHtml = (value: string): string =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    book.chapters.forEach((chapter, chapterIndex) => {
      if (selectedChapter !== "all" && Number(selectedChapter) !== chapterIndex) {
        return;
      }
      const paragraphs = chapter.text.split(/\n{2,}/).filter(Boolean);

      // Buscar em títulos
      if (searchIn === "all" || searchIn === "titles") {
        const titleMatch = caseSensitive
          ? chapter.title.includes(query)
          : chapter.title.toLowerCase().includes(query.toLowerCase());
        if (titleMatch) {
          const safeTitle = escapeHtml(chapter.title);
          results.push({
            chapterIndex,
            chapterTitle: chapter.title,
            paragraphIndex: -1,
            text: chapter.title,
            matchText: safeTitle.replace(
              new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, flags),
              '<mark style="background: var(--warning); padding: 2px 4px;">$1</mark>'
            ),
          });
        }
      }

      // Buscar em conteúdo
      if (searchIn === "all" || searchIn === "content") {
        paragraphs.forEach((paragraph, paragraphIndex) => {
          if (paragraph.length < minCharacters) {
            return;
          }

          const idKey = `${chapterIndex}-${paragraphIndex}`;
          if (onlyAnnotated && !annotationSet.has(idKey)) return;
          if (onlyCommented && !commentSet.has(idKey)) return;
          if (onlyDracula && !draculaSet.has(idKey)) return;

          let regex: RegExp | undefined = undefined;
          let matched = false;

          if (searchType === "exact") {
            regex = new RegExp(
              `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
              flags
            );
            matched = regex.test(paragraph);
          } else if (searchType === "fuzzy") {
            // Busca aproximada: permite diferenças de 1-2 caracteres
            const queryLower = query.toLowerCase();
            const paraLower = paragraph.toLowerCase();
            matched = paraLower.includes(queryLower) || 
                     queryLower.split("").some((_, i) => {
                       const variant = queryLower.slice(0, i) + queryLower.slice(i + 1);
                       return paraLower.includes(variant);
                     });
          } else {
            // Regex
            try {
              regex = new RegExp(query, flags);
              matched = regex.test(paragraph);
            } catch {
              matched = false;
              regex = undefined;
            }
          }

          if (matched) {
            if (!regex) {
              regex = new RegExp(
                `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                flags
              );
            }
            const safeParagraph = escapeHtml(paragraph);
            const matchText = safeParagraph.replace(
              regex,
              '<mark style="background: var(--warning); padding: 2px 4px;">$1</mark>'
            );
            results.push({
              chapterIndex,
              chapterTitle: chapter.title,
              paragraphIndex,
              text: paragraph.substring(0, 200) + (paragraph.length > 200 ? "..." : ""),
              matchText,
            });
            if (results.length >= limit) {
              return;
            }
          }
        });
      }
    });

    onSearch(results);
    setResultCount(results.length);
  }, [
    query,
    searchType,
    caseSensitive,
    searchIn,
    book,
    onSearch,
    selectedChapter,
    annotationSet,
    onlyAnnotated,
    commentSet,
    onlyCommented,
    draculaSet,
    onlyDracula,
    globalDraculaEnabled,
    maxResults,
    minChars,
  ]);

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "24px",
        minWidth: "500px",
        maxWidth: "90vw",
        maxHeight: "80vh",
        overflowY: "auto",
        zIndex: 10000,
        boxShadow: "var(--shadow-xl)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0 }}>🔍 Busca Avançada</h3>
        <button className="btn" onClick={onClose} style={{ padding: "4px 8px" }}>
          ✕
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
            Buscar:
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                performSearch();
              }
            }}
            placeholder="Digite sua busca..."
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              background: "var(--surface2)",
              color: "var(--fg)",
            }}
            autoFocus
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
            Tipo de busca:
          </label>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              background: "var(--surface2)",
              color: "var(--fg)",
            }}
          >
            <option value="exact">Exata</option>
            <option value="fuzzy">Aproximada (Fuzzy)</option>
            <option value="regex">Expressão Regular</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
            Buscar em:
          </label>
          <select
            value={searchIn}
            onChange={(e) => setSearchIn(e.target.value as any)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              background: "var(--surface2)",
              color: "var(--fg)",
            }}
          >
            <option value="all">Tudo (títulos e conteúdo)</option>
            <option value="titles">Apenas títulos</option>
            <option value="content">Apenas conteúdo</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
            Capítulo:
          </label>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              background: "var(--surface2)",
              color: "var(--fg)",
            }}
          >
            <option value="all">Todos os capítulos</option>
            {chapterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Diferenciar maiúsculas/minúsculas
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={onlyAnnotated}
              onChange={(e) => setOnlyAnnotated(e.target.checked)}
            />
            Apenas com anotações
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={onlyCommented}
              onChange={(e) => setOnlyCommented(e.target.checked)}
            />
            Apenas com comentários
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={onlyDracula}
              onChange={(e) => setOnlyDracula(e.target.checked)}
            />
            Apenas fonte Dracula
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
              Mínimo de caracteres:
            </label>
            <input
              type="number"
              min={0}
              value={minChars}
              onChange={(e) => setMinChars(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                background: "var(--surface2)",
                color: "var(--fg)",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
              Limite de resultados:
            </label>
            <input
              type="number"
              min={1}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                background: "var(--surface2)",
                color: "var(--fg)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button className="btn primary" onClick={performSearch} style={{ flex: 1 }}>
            🔍 Buscar
          </button>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
        </div>

        {resultCount > 0 && (
          <div style={{ fontSize: "12px", opacity: 0.7 }}>
            {resultCount} resultado{resultCount === 1 ? "" : "s"} encontrado{resultCount === 1 ? "" : "s"}.
          </div>
        )}
      </div>
    </div>
  );
}

