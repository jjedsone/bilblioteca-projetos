// src/components/AdvancedSearch.tsx
import { useState, useCallback } from "react";
import type { Book } from "../types";

interface AdvancedSearchProps {
  book: Book;
  onSearch: (results: SearchResult[]) => void;
  onClose: () => void;
}

interface SearchResult {
  chapterIndex: number;
  chapterTitle: string;
  paragraphIndex: number;
  text: string;
  matchText: string;
}

export default function AdvancedSearch({ book, onSearch, onClose }: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"exact" | "fuzzy" | "regex">("exact");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [searchIn, setSearchIn] = useState<"all" | "titles" | "content">("all");

  const performSearch = useCallback(() => {
    if (!query.trim()) {
      onSearch([]);
      return;
    }

    const results: SearchResult[] = [];
    const flags = caseSensitive ? "g" : "gi";

    book.chapters.forEach((chapter, chapterIndex) => {
      const paragraphs = chapter.text.split(/\n{2,}/).filter(Boolean);

      // Buscar em títulos
      if (searchIn === "all" || searchIn === "titles") {
        const titleMatch = caseSensitive
          ? chapter.title.includes(query)
          : chapter.title.toLowerCase().includes(query.toLowerCase());
        if (titleMatch) {
          results.push({
            chapterIndex,
            chapterTitle: chapter.title,
            paragraphIndex: -1,
            text: chapter.title,
            matchText: chapter.title.replace(
              new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, flags),
              '<mark style="background: var(--warning); padding: 2px 4px;">$1</mark>'
            ),
          });
        }
      }

      // Buscar em conteúdo
      if (searchIn === "all" || searchIn === "content") {
        paragraphs.forEach((paragraph, paragraphIndex) => {
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
            const matchText = paragraph.replace(
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
          }
        });
      }
    });

    onSearch(results);
  }, [query, searchType, caseSensitive, searchIn, book, onSearch]);

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

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Diferenciar maiúsculas/minúsculas
        </label>

        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button className="btn primary" onClick={performSearch} style={{ flex: 1 }}>
            🔍 Buscar
          </button>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

