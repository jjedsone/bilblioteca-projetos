// src/components/ChapterIndex.tsx
import { useMemo } from "react";
import type { Book } from "../types";

interface ChapterIndexProps {
  book: Book;
  currentChapter: number;
  onChapterSelect: (index: number) => void;
}

export default function ChapterIndex({ book, currentChapter, onChapterSelect }: ChapterIndexProps) {
  const indexItems = useMemo(() => {
    return book.chapters.map((chapter, index) => {
      const wordCount = chapter.text.split(/\s+/).filter(Boolean).length;
      const estimatedPages = Math.ceil(wordCount / 250);
      return {
        index,
        title: chapter.title,
        wordCount,
        estimatedPages,
      };
    });
  }, [book]);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px",
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>📑 Índice do Livro</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {indexItems.map((item) => (
          <button
            key={item.index}
            onClick={() => onChapterSelect(item.index)}
            style={{
              background: item.index === currentChapter ? "var(--primary)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "10px 12px",
              textAlign: "left",
              cursor: "pointer",
              color: item.index === currentChapter ? "#fff" : "var(--fg)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (item.index !== currentChapter) {
                e.currentTarget.style.background = "var(--surface2)";
              }
            }}
            onMouseLeave={(e) => {
              if (item.index !== currentChapter) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>
              {item.index + 1}. {item.title}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              {item.wordCount.toLocaleString()} palavras • ~{item.estimatedPages} páginas
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

