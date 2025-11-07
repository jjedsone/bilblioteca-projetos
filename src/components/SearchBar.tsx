// src/components/SearchBar.tsx
import { useState, useCallback, useEffect } from "react";
import type { Book, Chapter } from "../types";

interface SearchBarProps {
  book: Book;
  onSearchResult?: (results: SearchResult[]) => void;
}

export interface SearchResult {
  chapterIndex: number;
  chapter: Chapter;
  matches: Array<{
    paragraphIndex: number;
    text: string;
    matchText: string;
  }>;
}

export default function SearchBar({ book, onSearchResult }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const search = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        onSearchResult?.([]);
        return;
      }

      const queryLower = searchQuery.toLowerCase();
      const searchResults: SearchResult[] = [];

      book.chapters.forEach((chapter, chapterIndex) => {
        const paragraphs = chapter.text.split(/\n{2,}/).filter(Boolean);
        const matches: SearchResult["matches"] = [];

        paragraphs.forEach((paragraph, paragraphIndex) => {
          const paragraphLower = paragraph.toLowerCase();
          if (paragraphLower.includes(queryLower)) {
            // Encontra todas as ocorrências
            const regex = new RegExp(
              `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
              "gi"
            );
            const matchText = paragraph.replace(
              regex,
              (match) => `<mark style="background: var(--warning); color: var(--bg); padding: 2px 4px; border-radius: 3px;">${match}</mark>`
            );

            matches.push({
              paragraphIndex,
              text: paragraph.substring(0, 200) + (paragraph.length > 200 ? "..." : ""),
              matchText,
            });
          }
        });

        if (matches.length > 0) {
          searchResults.push({
            chapterIndex,
            chapter,
            matches,
          });
        }
      });

      setResults(searchResults);
      onSearchResult?.(searchResults);
    },
    [book, onSearchResult]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => {
          document.getElementById("search-input")?.focus();
        }, 0);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
        setResults([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        className="btn"
        onClick={() => setIsOpen(true)}
        title="Buscar (Ctrl+F)"
        style={{ fontSize: "13px" }}
      >
        🔍 Buscar
      </button>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          padding: "4px 8px",
        }}
      >
        <input
          id="search-input"
          type="text"
          placeholder="Buscar no livro..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--fg)",
            fontSize: "13px",
            width: "200px",
            outline: "none",
          }}
          autoFocus
        />
        <span style={{ fontSize: "12px", color: "var(--fg2)" }}>
          {results.length > 0 ? `${results.reduce((acc, r) => acc + r.matches.length, 0)} resultados` : query ? "Sem resultados" : ""}
        </span>
        <button
          className="btn"
          onClick={() => {
            setIsOpen(false);
            setQuery("");
            setResults([]);
          }}
          style={{ padding: "2px 6px", fontSize: "12px" }}
        >
          ✕
        </button>
      </div>

      {results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "8px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {results.map((result, idx) => (
            <div
              key={idx}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: "var(--accent)",
                  marginBottom: "4px",
                }}
              >
                Cap. {result.chapterIndex + 1}: {result.chapter.title}
              </div>
              {result.matches.slice(0, 2).map((match, midx) => (
                <div
                  key={midx}
                  style={{
                    fontSize: "12px",
                    color: "var(--fg2)",
                    marginTop: "4px",
                    lineHeight: "1.4",
                  }}
                  dangerouslySetInnerHTML={{ __html: match.matchText }}
                />
              ))}
              {result.matches.length > 2 && (
                <div style={{ fontSize: "11px", color: "var(--fg2)", marginTop: "4px" }}>
                  +{result.matches.length - 2} mais...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

