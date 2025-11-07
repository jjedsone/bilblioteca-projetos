// src/components/MiniMap.tsx
import { useMemo } from "react";
import type { Book } from "../types";

interface MiniMapProps {
  book: Book;
  currentChapter: number;
  onChapterSelect: (index: number) => void;
}

export default function MiniMap({ book, currentChapter, onChapterSelect }: MiniMapProps) {
  const chaptersData = useMemo(() => {
    const totalWords = book.chapters.reduce(
      (acc, ch) => acc + ch.text.split(/\s+/).filter(Boolean).length,
      0
    );

    return book.chapters.map((chapter, index) => {
      const wordCount = chapter.text.split(/\s+/).filter(Boolean).length;
      const percentage = (wordCount / totalWords) * 100;
      return {
        index,
        title: chapter.title,
        wordCount,
        percentage,
      };
    });
  }, [book]);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "12px",
        maxHeight: "300px",
        overflowY: "auto",
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: "12px", fontSize: "14px" }}>🗺️ Mini Mapa</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {chaptersData.map((item) => (
          <div
            key={item.index}
            onClick={() => onChapterSelect(item.index)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              background: item.index === currentChapter ? "var(--primary-light)" : "transparent",
              border: item.index === currentChapter ? "1px solid var(--primary)" : "1px solid transparent",
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
            <div
              style={{
                width: `${item.percentage}%`,
                minWidth: "4px",
                height: "20px",
                background: item.index === currentChapter ? "var(--primary)" : "var(--border)",
                borderRadius: "2px",
                transition: "background 0.2s ease",
              }}
              title={`${item.percentage.toFixed(1)}% do livro`}
            />
            <span
              style={{
                fontSize: "11px",
                color: "var(--fg2)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
              }}
            >
              {item.index + 1}. {item.title}
            </span>
            <span style={{ fontSize: "10px", color: "var(--fg2)", whiteSpace: "nowrap" }}>
              {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

