// src/components/BookStats.tsx
import { useMemo, useState } from "react";
import type { Book } from "../types";

interface BookStatsProps {
  book: Book;
}

export default function BookStats({ book }: BookStatsProps) {
  const stats = useMemo(() => {
    const totalWords = book.chapters.reduce((acc, ch) => {
      return acc + ch.text.split(/\s+/).filter(Boolean).length;
    }, 0);

    const totalChars = book.chapters.reduce((acc, ch) => acc + ch.text.length, 0);
    const totalCharsNoSpaces = book.chapters.reduce(
      (acc, ch) => acc + ch.text.replace(/\s/g, "").length,
      0
    );

    const avgWordsPerChapter = Math.round(totalWords / book.chapters.length) || 0;
    const avgCharsPerChapter = Math.round(totalChars / book.chapters.length) || 0;

    // Estimativa de páginas (assumindo ~250 palavras por página)
    const estimatedPages = Math.round(totalWords / 250) || 1;

    // Tempo estimado de leitura (assumindo ~200 palavras por minuto)
    const readingTimeMinutes = Math.round(totalWords / 200) || 1;

    // Análise de vocabulário - palavras mais usadas
    const wordCount: Record<string, number> = {};
    book.chapters.forEach((ch) => {
      const words = ch.text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3); // Filtrar palavras muito curtas
      
      words.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    const topWords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    // Distribuição de capítulos (tamanho)
    const chapterSizes = book.chapters.map((ch) => ({
      title: ch.title,
      words: ch.text.split(/\s+/).filter(Boolean).length,
    }));

    const maxChapterSize = Math.max(...chapterSizes.map((c) => c.words), 1);
    const minChapterSize = Math.min(...chapterSizes.map((c) => c.words), 0);

    return {
      chapters: book.chapters.length,
      totalWords,
      totalChars,
      totalCharsNoSpaces,
      avgWordsPerChapter,
      avgCharsPerChapter,
      estimatedPages,
      readingTimeMinutes,
      topWords,
      chapterSizes,
      maxChapterSize,
      minChapterSize,
    };
  }, [book]);

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3>📊 Estatísticas</h3>
        <button
          className="btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ fontSize: "12px", padding: "6px 12px" }}
        >
          {showAdvanced ? "▼ Ocultar" : "▶ Ver mais"}
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
        }}
      >
        <StatItem label="Capítulos" value={stats.chapters.toString()} />
        <StatItem label="Palavras" value={stats.totalWords.toLocaleString()} />
        <StatItem label="Caracteres" value={stats.totalChars.toLocaleString()} />
        <StatItem label="Páginas (est.)" value={stats.estimatedPages.toString()} />
        <StatItem
          label="Leitura (est.)"
          value={`${stats.readingTimeMinutes} min`}
        />
        <StatItem
          label="Média/Capítulo"
          value={`${stats.avgWordsPerChapter} palavras`}
        />
      </div>

      {showAdvanced && (
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
          {/* Palavras mais usadas */}
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "var(--accent)", fontSize: "16px" }}>
              📝 Palavras Mais Usadas
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {stats.topWords.map(({ word, count }, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--surface2)",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--fg)" }}>{word}</span>
                  <span style={{ fontSize: "12px", color: "var(--fg2)" }}>{count}x</span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribuição de capítulos */}
          <div>
            <h4 style={{ margin: "0 0 12px 0", color: "var(--accent)", fontSize: "16px" }}>
              📊 Distribuição de Capítulos
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {stats.chapterSizes.map((chapter, idx) => {
                const percentage = (chapter.words / stats.maxChapterSize) * 100;
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--fg2)" }}>
                      <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {idx + 1}. {chapter.title}
                      </span>
                      <span>{chapter.words.toLocaleString()} palavras</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "var(--surface2)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: "100%",
                          background: "var(--gradient-primary)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--surface2)",
        padding: "8px 12px",
        borderRadius: "6px",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: "12px", color: "var(--fg2)", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--accent)" }}>
        {value}
      </div>
    </div>
  );
}

