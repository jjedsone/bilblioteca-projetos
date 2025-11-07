// src/components/FocusMode.tsx
import { useEffect, useState } from "react";
import type { Book, Chapter } from "../types";

interface FocusModeProps {
  book: Book;
  chapter: Chapter;
  chapterIndex: number;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export default function FocusMode({
  book,
  chapter,
  chapterIndex,
  onClose,
  onNavigate,
  canGoPrev,
  canGoNext,
}: FocusModeProps) {
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight] = useState(2);
  const [maxWidth, setMaxWidth] = useState(800);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && canGoPrev) {
        onNavigate("prev");
      } else if (e.key === "ArrowRight" && canGoNext) {
        onNavigate("next");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "=") {
        e.preventDefault();
        setFontSize((f) => Math.min(f + 2, 32));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setFontSize((f) => Math.max(f - 2, 12));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onNavigate, canGoPrev, canGoNext]);

  const paragraphs = chapter.text.split(/\n{2,}/).filter(Boolean);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--bg)",
        zIndex: 9999,
        overflow: "auto",
        padding: "40px 20px",
      }}
    >
      {/* Barra de controle */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10000,
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="btn" onClick={onClose} title="Fechar (ESC)">
            ✕ Sair
          </button>
          <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />
          <span style={{ fontSize: "14px", color: "var(--fg2)" }}>
            {chapterIndex + 1} / {book.chapters.length}
          </span>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: "12px", color: "var(--fg2)" }}>
              Fonte:
              <input
                type="range"
                min="12"
                max="32"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ marginLeft: 8, width: 100 }}
              />
              <span style={{ marginLeft: 8, fontSize: "12px" }}>{fontSize}px</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: "12px", color: "var(--fg2)" }}>
              Largura:
              <input
                type="range"
                min="600"
                max="1200"
                step="50"
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                style={{ marginLeft: 8, width: 100 }}
              />
              <span style={{ marginLeft: 8, fontSize: "12px" }}>{maxWidth}px</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn"
              onClick={() => onNavigate("prev")}
              disabled={!canGoPrev}
              title="Capítulo anterior (←)"
            >
              ◀ Anterior
            </button>
            <button
              className="btn"
              onClick={() => onNavigate("next")}
              disabled={!canGoNext}
              title="Próximo capítulo (→)"
            >
              Próximo ▶
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div
        style={{
          maxWidth: `${maxWidth}px`,
          margin: "80px auto 40px",
          padding: "0 20px",
        }}
      >
        <h1
          style={{
            fontSize: `${fontSize * 1.8}px`,
            marginBottom: "24px",
            color: "var(--fg)",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {book.title}
        </h1>

        <h2
          style={{
            fontSize: `${fontSize * 1.3}px`,
            marginBottom: "32px",
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          {chapterIndex + 1}. {chapter.title}
        </h2>

        <div
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            color: "var(--fg)",
          }}
        >
          {paragraphs.map((para, idx) => (
            <p
              key={idx}
              style={{
                marginBottom: `${fontSize * 0.8}px`,
                textAlign: "justify",
              }}
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Atalhos de teclado */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "12px",
          fontSize: "12px",
          color: "var(--fg2)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "8px", color: "var(--fg)" }}>
          Atalhos:
        </div>
        <div>ESC - Sair</div>
        <div>← → - Navegar capítulos</div>
        <div>Ctrl + / - - Aumentar fonte</div>
        <div>Ctrl + - - Diminuir fonte</div>
      </div>
    </div>
  );
}

