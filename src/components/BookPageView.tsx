// src/components/BookPageView.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import type { Book } from "../types";
import { useProjects } from "../store/projects";

interface BookPageViewProps {
  book: Book;
  currentChapter: number;
  onChapterChange: (index: number) => void;
  singlePage?: boolean;
  onSinglePageChange?: (single: boolean) => void;
  projectId: string;
}

type PaperStyle = "classic" | "modern" | "parchment" | "sepia";
type PageColor = "white" | "beige" | "sepia" | "cream";

export default function BookPageView({
  book,
  currentChapter,
  onChapterChange,
  singlePage = false,
  onSinglePageChange,
  projectId,
}: BookPageViewProps) {
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight] = useState(1.8);
  const [pageNumber, setPageNumber] = useState(1);
  const [isNightMode, setIsNightMode] = useState(false);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>("classic");
  const [pageColor, setPageColor] = useState<PageColor>("white");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showProgress] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);
  const flipTimeoutRef = useRef<number | null>(null);

  const { projects, saveReadingPosition, addBookmark, removeBookmark, getLastReadingPosition } = useProjects();
  const proj = projects.find((p) => p.id === projectId);
  const currentBookmarks = proj?.bookmarks || [];

  const chapter = book.chapters[currentChapter];
  const paragraphs = chapter.text.split(/\n{2,}/).filter(Boolean);

  // Dividir parágrafos em páginas
  const pages = useMemo(() => {
    const wordsPerPage = singlePage ? 400 : 300; // Palavras por página
    const pages: string[][] = [];
    let currentPage: string[] = [];
    let wordCount = 0;

    paragraphs.forEach((para) => {
      const words = para.split(/\s+/).length;
      if (wordCount + words > wordsPerPage && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [para];
        wordCount = words;
      } else {
        currentPage.push(para);
        wordCount += words;
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  }, [paragraphs, singlePage, currentChapter]);

  // Resetar página ao mudar capítulo ou restaurar posição salva
  useEffect(() => {
    const savedPosition = getLastReadingPosition(projectId);
    if (savedPosition && savedPosition.chapterIndex === currentChapter) {
      setPageNumber(savedPosition.pageNumber);
    } else {
      setPageNumber(1);
    }
  }, [currentChapter, projectId, getLastReadingPosition]);

  // Salvar posição automaticamente
  useEffect(() => {
    if (proj) {
      saveReadingPosition(projectId, currentChapter, pageNumber);
    }
  }, [currentChapter, pageNumber, projectId, saveReadingPosition, proj]);

  // Cores e estilos de papel
  const getPageColors = () => {
    if (isNightMode) {
      return {
        background: "#1a1a1a",
        text: "#e0e0e0",
        border: "#333",
      };
    }

    const colors = {
      white: { background: "#fefefe", text: "#1a1a1a", border: "#e0e0e0" },
      beige: { background: "#f5f5dc", text: "#2c2c2c", border: "#d4d4a0" },
      sepia: { background: "#f4e4bc", text: "#3d2817", border: "#d4b896" },
      cream: { background: "#fffef0", text: "#2c2c2c", border: "#e8e6d9" },
    };

    return colors[pageColor];
  };

  const pageColors = getPageColors();

  // Estilos de papel
  const getPaperTexture = () => {
    if (paperStyle === "parchment") {
      return `
        radial-gradient(circle at 20% 30%, rgba(139, 115, 85, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(139, 115, 85, 0.1) 0%, transparent 50%),
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,0,0,0.03) 2px,
          rgba(0,0,0,0.03) 4px
        )
      `;
    }
    if (paperStyle === "modern") {
      return "none";
    }
    return `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.02) 2px,
        rgba(0,0,0,0.02) 4px
      )
    `;
  };

  const handleAddBookmark = () => {
    const note = prompt("Adicionar nota ao marcador (opcional):");
    addBookmark(projectId, currentChapter, pageNumber, note || undefined);
    alert("Marcador adicionado!");
  };

  const handleGoToBookmark = (bookmark: typeof currentBookmarks[0]) => {
    onChapterChange(bookmark.chapterIndex);
    setPageNumber(bookmark.pageNumber);
    setShowBookmarks(false);
  };

  const totalPages = pages.length;

  // Calcular progresso
  const totalChapters = book.chapters.length;
  const currentProgress = ((currentChapter + 1) / totalChapters) * 100;
  const chapterProgress = totalPages > 0 ? ((pageNumber / totalPages) * 100) : 0;

  // Calcular tempo de leitura restante
  const totalWords = useMemo(() => {
    return book.chapters.reduce((acc, ch) => {
      return acc + ch.text.split(/\s+/).filter(Boolean).length;
    }, 0);
  }, [book]);

  const currentPageContent = pages[pageNumber - 1] || [];
  const nextPageContent = pages[pageNumber] || [];

  const wordsRead = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentChapter; i++) {
      count += book.chapters[i].text.split(/\s+/).filter(Boolean).length;
    }
    // Adicionar palavras da página atual
    const currentWords = currentPageContent.join(" ").split(/\s+/).filter(Boolean).length;
    count += currentWords;
    return count;
  }, [book, currentChapter, currentPageContent]);

  const wordsRemaining = totalWords - wordsRead;
  const readingSpeed = 200; // palavras por minuto
  const minutesRemaining = Math.ceil(wordsRemaining / readingSpeed);
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const minsRemaining = minutesRemaining % 60;

  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) {
        window.clearTimeout(flipTimeoutRef.current);
      }
    };
  }, []);

  const triggerFlip = (direction: "next" | "prev", onComplete: () => void) => {
    if (isFlipping) return;

    if (flipTimeoutRef.current) {
      window.clearTimeout(flipTimeoutRef.current);
    }

    setFlipDirection(direction);
    setIsFlipping(true);

    flipTimeoutRef.current = window.setTimeout(() => {
      onComplete();
      setIsFlipping(false);
      setFlipDirection(null);
    }, 600);
  };

  const goToNextPage = () => {
    if (isFlipping) return;
    if (pageNumber < totalPages) {
      triggerFlip("next", () => setPageNumber((prev) => prev + 1));
    } else if (currentChapter < book.chapters.length - 1) {
      triggerFlip("next", () => {
        onChapterChange(currentChapter + 1);
        setPageNumber(1);
      });
    }
  };

  const goToPreviousPage = () => {
    if (isFlipping) return;
    if (pageNumber > 1) {
      triggerFlip("prev", () => setPageNumber((prev) => Math.max(1, prev - 1)));
    } else if (currentChapter > 0) {
      triggerFlip("prev", () => {
        onChapterChange(currentChapter - 1);
        setPageNumber(1);
      });
    }
  };

  const renderPage = (
    content: string[],
    options: { isLeft?: boolean; pageNum?: number; className?: string } = {}
  ) => {
    const { isLeft = false, pageNum = pageNumber, className } = options;
    const hasBookmark = currentBookmarks.some(
      (b) => b.chapterIndex === currentChapter && b.pageNumber === pageNum
    );

    return (
      <div
        className={`book-page ${className ?? ""}`.trim()}
        style={{
          position: "relative",
          width: singlePage ? "100%" : "48%",
          minHeight: "600px",
          background: pageColors.background,
          padding: "60px 50px",
          boxShadow: isLeft
            ? isNightMode
              ? "inset -2px 0 10px rgba(255,255,255,0.05), -5px 0 20px rgba(0,0,0,0.5)"
              : "inset -2px 0 10px rgba(0,0,0,0.1), -5px 0 20px rgba(0,0,0,0.2)"
            : isNightMode
            ? "inset 2px 0 10px rgba(255,255,255,0.05), 5px 0 20px rgba(0,0,0,0.5)"
            : "inset 2px 0 10px rgba(0,0,0,0.1), 5px 0 20px rgba(0,0,0,0.2)",
          border: `1px solid ${pageColors.border}`,
          borderRadius: isLeft ? "8px 0 0 8px" : "0 8px 8px 0",
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        {/* Efeito de textura de papel */}
        {paperStyle !== "modern" && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: getPaperTexture(),
              pointerEvents: "none",
              opacity: isNightMode ? 0.2 : 0.5,
            }}
          />
        )}

        {/* Marcador visual */}
        {hasBookmark && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "30px",
              height: "30px",
              background: "#ffd700",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(255,215,0,0.5)",
              zIndex: 10,
            }}
            title="Marcador"
          >
            📑
          </div>
        )}

        {/* Conteúdo da página */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            color: pageColors.text,
            textAlign: "justify",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
        {content.map((para, idx) => (
          <p
            key={idx}
            style={{
              marginBottom: `${fontSize * 0.8}px`,
              textIndent: `${fontSize * 1.5}px`,
              marginTop: idx === 0 ? 0 : `${fontSize * 0.5}px`,
            }}
          >
            {para}
          </p>
        ))}

          {/* Número da página */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              [isLeft ? "left" : "right"]: "50px",
              fontSize: `${fontSize * 0.7}px`,
              color: isNightMode ? "#666" : "#999",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {pageNum}
          </div>
        </div>

        {/* Sombra interna */}
        <div
          style={{
            position: "absolute",
            top: 0,
            [isLeft ? "right" : "left"]: 0,
            width: "20px",
            height: "100%",
            background: isNightMode
              ? `linear-gradient(to ${isLeft ? "left" : "right"}, rgba(255,255,255,0.05), transparent)`
              : `linear-gradient(to ${isLeft ? "left" : "right"}, rgba(0,0,0,0.1), transparent)`,
            pointerEvents: "none",
          }}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        padding: "40px 20px",
        background: isNightMode ? "#0a0a0a" : "#f5f5f0",
        minHeight: "100%",
        transition: "background-color 0.3s ease",
      }}
    >
      {/* Controles */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          maxWidth: singlePage ? "800px" : "1400px",
          padding: "0 20px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="btn"
            onClick={goToPreviousPage}
            disabled={(pageNumber === 1 && currentChapter === 0) || isFlipping}
            title="Página anterior"
          >
            ← Anterior
          </button>
          <span style={{ fontSize: "14px", color: isNightMode ? "#999" : "#666" }}>
            Página {pageNumber} de {totalPages} • Cap. {currentChapter + 1}/{book.chapters.length}
            {minutesRemaining > 0 && (
              <span style={{ marginLeft: "12px", opacity: 0.8 }}>
                ⏱️ {hoursRemaining > 0 ? `${hoursRemaining}h ` : ""}{minsRemaining}min restantes
              </span>
            )}
          </span>
          <button
            className="btn"
            onClick={goToNextPage}
            disabled={(pageNumber === totalPages && currentChapter === book.chapters.length - 1) || isFlipping}
            title="Próxima página"
          >
            Próxima →
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {onSinglePageChange && (
          <button
              className={`btn ${singlePage ? "primary" : ""}`}
              onClick={() => onSinglePageChange(!singlePage)}
              title={singlePage ? "Modo 2 páginas" : "Modo 1 página"}
            >
              {singlePage ? "📄 1 Página" : "📖 2 Páginas"}
            </button>
          )}
          <button
            className={`btn ${isNightMode ? "primary" : ""}`}
            onClick={() => setIsNightMode(!isNightMode)}
            title="Modo noturno"
          >
            {isNightMode ? "☀️ Claro" : "🌙 Escuro"}
          </button>
          <button
            className="btn"
            onClick={handleAddBookmark}
            title="Adicionar marcador"
          >
            📑 Marcador
          </button>
          <button
            className="btn"
            onClick={() => setShowBookmarks(!showBookmarks)}
            title="Ver marcadores"
          >
            📚 Marcadores ({currentBookmarks.length})
          </button>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <label style={{ fontSize: "12px", color: isNightMode ? "#999" : "#666" }}>Fonte:</label>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: "100px" }}
            />
            <span style={{ fontSize: "12px", color: isNightMode ? "#999" : "#666", minWidth: "30px" }}>{fontSize}px</span>
          </div>
          <select
            value={paperStyle}
            onChange={(e) => setPaperStyle(e.target.value as PaperStyle)}
            className="btn"
            style={{ padding: "6px 12px", fontSize: "12px" }}
            title="Estilo de papel"
          >
            <option value="classic">📄 Clássico</option>
            <option value="modern">✨ Moderno</option>
            <option value="parchment">📜 Pergaminho</option>
          </select>
          {!isNightMode && (
            <select
              value={pageColor}
              onChange={(e) => setPageColor(e.target.value as PageColor)}
              className="btn"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              title="Cor da página"
            >
              <option value="white">⚪ Branco</option>
              <option value="beige">🟤 Bege</option>
              <option value="sepia">🟫 Sépia</option>
              <option value="cream">🟡 Creme</option>
            </select>
          )}
        </div>
      </div>

      {/* Páginas do livro */}
      <div
        style={{
          display: "flex",
          gap: singlePage ? "0" : "20px",
          justifyContent: "center",
          width: "100%",
          maxWidth: singlePage ? "800px" : "1400px",
          perspective: "1500px",
        }}
      >
        {singlePage ? (
          renderPage(currentPageContent, {
            pageNum: pageNumber,
            className:
              isFlipping && flipDirection
                ? flipDirection === "next"
                  ? "page-flip-next"
                  : "page-flip-prev"
                : undefined,
          })
        ) : (
          <>
            {renderPage(currentPageContent, {
              isLeft: true,
              pageNum: pageNumber,
              className:
                isFlipping && flipDirection === "prev"
                  ? "page-flip-prev"
                  : undefined,
            })}
            {renderPage(nextPageContent, {
              isLeft: false,
              pageNum: pageNumber + 1,
              className:
                isFlipping && flipDirection === "next"
                  ? "page-flip-next"
                  : undefined,
            })}
          </>
        )}
      </div>

      {/* Barra de progresso */}
      {showProgress && (
        <div
          style={{
            maxWidth: singlePage ? "800px" : "1400px",
            width: "100%",
            padding: "20px",
            background: isNightMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
            borderRadius: "8px",
            marginTop: "20px",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", color: isNightMode ? "#999" : "#666" }}>
                Progresso do Capítulo
              </span>
              <span style={{ fontSize: "12px", color: isNightMode ? "#999" : "#666" }}>
                {Math.round(chapterProgress)}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: isNightMode ? "#333" : "#e0e0e0",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${chapterProgress}%`,
                  height: "100%",
                  background: "var(--gradient-primary)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", color: isNightMode ? "#999" : "#666" }}>
                Progresso do Livro
              </span>
              <span style={{ fontSize: "12px", color: isNightMode ? "#999" : "#666" }}>
                {Math.round(currentProgress)}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: isNightMode ? "#333" : "#e0e0e0",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${currentProgress}%`,
                  height: "100%",
                  background: "var(--gradient-accent)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de marcadores */}
      {showBookmarks && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setShowBookmarks(false)}
        >
          <div
            style={{
              background: isNightMode ? "#1a1a1a" : "#fff",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: isNightMode ? "#fff" : "#333" }}>Marcadores</h3>
              <button className="btn" onClick={() => setShowBookmarks(false)}>✕</button>
            </div>
            {currentBookmarks.length === 0 ? (
              <p style={{ color: isNightMode ? "#999" : "#666", textAlign: "center", padding: "20px" }}>
                Nenhum marcador salvo
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {currentBookmarks.map((bookmark) => {
                  const ch = book.chapters[bookmark.chapterIndex];
                  return (
                    <div
                      key={bookmark.id}
                      style={{
                        padding: "12px",
                        background: isNightMode ? "#2a2a2a" : "#f5f5f5",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: isNightMode ? "#fff" : "#333", marginBottom: "4px" }}>
                          Cap. {bookmark.chapterIndex + 1}: {ch?.title || "Sem título"}
                        </div>
                        <div style={{ fontSize: "12px", color: isNightMode ? "#999" : "#666" }}>
                          Página {bookmark.pageNumber}
                          {bookmark.note && ` • ${bookmark.note}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn primary"
                          onClick={() => handleGoToBookmark(bookmark)}
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                        >
                          Ir
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => {
                            removeBookmark(projectId, bookmark.id);
                          }}
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informações do capítulo */}
      <div
        style={{
          maxWidth: singlePage ? "800px" : "1400px",
          width: "100%",
          padding: "20px",
          background: isNightMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
          borderRadius: "8px",
          marginTop: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: isNightMode ? "#fff" : "#333", fontSize: "18px" }}>
          {currentChapter + 1}. {chapter.title}
        </h3>
        <p style={{ margin: 0, color: isNightMode ? "#999" : "#666", fontSize: "14px" }}>
          {book.title} {book.author && `• ${book.author}`}
        </p>
      </div>
    </div>
  );
}

