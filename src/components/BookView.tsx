// src/components/BookView.tsx
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { Book, Chapter } from "../types";
import { makeId } from "../types";
import ChapterList from "./ChapterList";
import SearchBar from "./SearchBar";
import FocusMode from "./FocusMode";
import BookPageView from "./BookPageView";
import ChapterIndex from "./ChapterIndex";
import MiniMap from "./MiniMap";
import AdvancedSearch, { type AdvancedSearchResult } from "./AdvancedSearch";
import AnnotationsManager from "./AnnotationsManager";
import CommentsManager from "./CommentsManager";
import AIAssistant from "./AIAssistant";
import GrammarSuggestions from "./GrammarSuggestions";
import { useProjects } from "../store/projects";
import { useTheme } from "../store/theme";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { exportChapterToPDF, exportChapterToMarkdown, exportChapterToHTML } from "../utils/exportChapter";
import { renderDraculaSyntaxHTML } from "../utils/draculaSyntax";
import DOMPurify from "dompurify";

// ===== Helpers =====
const splitParas = (text: string): string[] =>
  text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

const joinParas = (paras: string[]): string =>
  paras.join("\n\n");

const sanitizeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const RICH_ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "br", "span", "div", "p"];
const sanitizeRichHTML = (html: string): string =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: RICH_ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  });

const resolveRichParagraphs = (chapter: Chapter): string[] => {
  const chapterParas = splitParas(chapter.text);
  if (chapter.richParagraphs && chapter.richParagraphs.length === chapterParas.length) {
    return chapter.richParagraphs.slice();
  }
  return chapterParas.map((p) => sanitizeRichHTML(sanitizeHtml(p)));
};

// ===== Component =====
interface BookViewProps {
  book: Book;
}

export default function BookView({ book }: BookViewProps) {
  const [current, setCurrent] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [bookPageView, setBookPageView] = useState(false);
  const [singlePage, setSinglePage] = useState(false);
  const [showIndex, setShowIndex] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchResults, setAdvancedSearchResults] = useState<AdvancedSearchResult[]>([]);
  const [useDraculaFont, setUseDraculaFont] = useState(false);
  const { projects, selectedId, setBook, updateProject } = useProjects();
  const { theme } = useTheme();

  const proj = projects.find(p => p.id === selectedId);
  const ch = book.chapters[current];
  const paras = splitParas(ch.text);
  const richParas = useMemo(() => resolveRichParagraphs(ch), [ch]);
  const paragraphRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);
  const [searchHighlight, setSearchHighlight] = useState<{ chapterIndex: number; paragraphIndex: number } | null>(null);
  useEffect(() => {
    if (searchHighlight && searchHighlight.chapterIndex !== current) {
      setSearchHighlight(null);
    }
  }, [current, searchHighlight]);

  useEffect(() => {
    if (searchHighlight && searchHighlight.chapterIndex === current) {
      const el = paragraphRefs.current[searchHighlight.paragraphIndex];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [searchHighlight, current]);

  const getCurrentRichParas = useCallback((): string[] => richParas.slice(), [richParas]);

  const handleSelectSearchResult = useCallback(
    (result: AdvancedSearchResult) => {
      setShowAdvancedSearch(false);
      setCurrent(result.chapterIndex);
      setTimeout(() => {
        if (result.paragraphIndex >= 0) {
          setSearchHighlight({
            chapterIndex: result.chapterIndex,
            paragraphIndex: result.paragraphIndex,
          });
        } else {
          setSearchHighlight(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 0);
    },
    []
  );

  const handleToolbarAction = useCallback(
    (command: "bold" | "italic" | "underline" | "removeFormat") => {
      if (activeParagraph === null) return;
      const el = paragraphRefs.current[activeParagraph];
      if (!el) return;
      el.focus();
      try {
        document.execCommand(command === "removeFormat" ? "removeFormat" : command, false);
        const syntheticEvent = new Event("input", { bubbles: true });
        el.dispatchEvent(syntheticEvent);
      } catch (error) {
        console.warn("Formato não suportado:", error);
      }
    },
    [activeParagraph]
  );

  // Função para verificar se um parágrafo tem fonte Dracula ativa
  const getParagraphDraculaFont = (paragraphIndex: number): boolean => {
    if (!proj?.paragraphFontSettings) return false;
    const chapterKey = current.toString();
    return proj.paragraphFontSettings[chapterKey]?.[paragraphIndex] || false;
  };

  // Função para alternar fonte Dracula de um parágrafo
  const toggleParagraphDraculaFont = (paragraphIndex: number) => {
    if (!proj) return;
    const chapterKey = current.toString();
    const currentSettings = proj.paragraphFontSettings || {};
    const chapterSettings = currentSettings[chapterKey] || {};
    const newValue = !chapterSettings[paragraphIndex];
    
    updateProject(proj.id, {
      paragraphFontSettings: {
        ...currentSettings,
        [chapterKey]: {
          ...chapterSettings,
          [paragraphIndex]: newValue,
        },
      },
    });
  };

  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: "f",
      ctrl: true,
      action: () => setFocusMode(true),
      description: "Abrir modo foco",
    },
    {
      key: "ArrowUp",
      action: () => setCurrent((c) => Math.max(0, c - 1)),
      description: "Capítulo anterior",
    },
    {
      key: "ArrowDown",
      action: () => setCurrent((c) => Math.min(book.chapters.length - 1, c + 1)),
      description: "Próximo capítulo",
    },
  ]);

  const handleRename = useCallback(() => {
    if (!proj) return;
    const title = prompt("Novo título do capítulo:", ch.title);
    if (title == null) return;

    const updated: Book = {
      ...book,
      chapters: book.chapters.map((c, i) =>
        i === current ? { ...c, title: title.trim() || c.title } : c
      ),
    };
    setBook(proj.id, updated);
  }, [proj, ch.title, book, current, setBook]);

  const handleMergeWithPrevious = useCallback(() => {
    if (!proj) return;
    if (current === 0) {
      alert("Não há capítulo anterior.");
      return;
    }
    const prev = book.chapters[current - 1];
    const merged: Chapter = {
      ...prev,
      text: joinParas(splitParas(prev.text).concat(paras)),
      richParagraphs: resolveRichParagraphs(prev).concat(getCurrentRichParas()),
    };
    const chapters = [...book.chapters];
    chapters[current - 1] = merged;
    chapters.splice(current, 1);
    setBook(proj.id, { ...book, chapters });
    setCurrent(current - 1);
  }, [proj, current, book, paras, setBook, getCurrentRichParas]);

  const handleMergeWithNext = useCallback(() => {
    if (!proj) return;
    if (current >= book.chapters.length - 1) {
      alert("Não há capítulo seguinte.");
      return;
    }
    const next = book.chapters[current + 1];
    const merged: Chapter = {
      ...ch,
      text: joinParas(paras.concat(splitParas(next.text))),
      richParagraphs: getCurrentRichParas().concat(resolveRichParagraphs(next)),
    };
    const chapters = [...book.chapters];
    chapters[current] = merged;
    chapters.splice(current + 1, 1);
    setBook(proj.id, { ...book, chapters });
  }, [proj, current, book, ch, paras, setBook, getCurrentRichParas]);

  if (focusMode) {
    return (
      <FocusMode
        book={book}
        chapter={ch}
        chapterIndex={current}
        onClose={() => setFocusMode(false)}
        onNavigate={(direction) => {
          if (direction === "prev" && current > 0) {
            setCurrent(current - 1);
          } else if (direction === "next" && current < book.chapters.length - 1) {
            setCurrent(current + 1);
          }
        }}
        canGoPrev={current > 0}
        canGoNext={current < book.chapters.length - 1}
      />
    );
  }

  if (bookPageView) {
    return (
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 12px" }}>
          <button
            className="btn"
            onClick={() => setBookPageView(false)}
            title="Voltar para visualização normal"
          >
            ← Voltar
          </button>
          <h2 style={{ margin: 0, color: "var(--accent)" }}>📖 Visualização de Livro</h2>
        </div>
        <BookPageView
          book={book}
          currentChapter={current}
          onChapterChange={setCurrent}
          singlePage={singlePage}
          onSinglePageChange={setSinglePage}
          projectId={proj?.id || ""}
        />
      </div>
    );
  }

  return (
    <div className="content">
      <ChapterList book={book} current={current} onSelect={setCurrent} />

      <div className="reader">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1>{book.title}</h1>
              <h2>{current + 1}. {ch.title}</h2>
            </div>
            <SearchBar book={book} />
          </div>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              className="btn"
              onClick={() => setShowIndex(!showIndex)}
              title="Mostrar/ocultar índice"
            >
              {showIndex ? "📑 Ocultar Índice" : "📑 Índice"}
            </button>
            <button
              className="btn"
              onClick={() => setShowMiniMap(!showMiniMap)}
              title="Mostrar/ocultar mini mapa"
            >
              {showMiniMap ? "🗺️ Ocultar Mapa" : "🗺️ Mini Mapa"}
            </button>
            <button
              className="btn"
              onClick={() => exportChapterToPDF(ch, book.title)}
              title="Exportar capítulo como PDF"
            >
              📄 Exportar Capítulo (PDF)
            </button>
            <button
              className="btn"
              onClick={() => exportChapterToMarkdown(ch, book.title)}
              title="Exportar capítulo como Markdown"
            >
              📝 Exportar Capítulo (MD)
            </button>
            <button
              className="btn"
              onClick={() => exportChapterToHTML(ch, book.title)}
              title="Exportar capítulo como HTML"
            >
              🌐 Exportar Capítulo (HTML)
            </button>
            <button
              className="btn"
              onClick={() => setShowAdvancedSearch(true)}
              title="Busca avançada com filtros"
            >
              🔍 Busca Avançada
            </button>
            <button
              className={`btn ${useDraculaFont ? "primary" : ""}`}
              onClick={() => setUseDraculaFont(!useDraculaFont)}
              title="Usar fonte do tema Dracula (Fira Code/JetBrains Mono)"
            >
              {useDraculaFont ? "🔤 Fonte Dracula (Ativa)" : "🔤 Fonte Dracula"}
            </button>
          </div>
          
          {(showIndex || showMiniMap) && (
            <div style={{ display: "grid", gridTemplateColumns: showIndex && showMiniMap ? "1fr 1fr" : "1fr", gap: 12 }}>
              {showIndex && (
                <ChapterIndex
                  book={book}
                  currentChapter={current}
                  onChapterSelect={(index) => {
                    setCurrent(index);
                    setShowIndex(false);
                  }}
                />
              )}
              {showMiniMap && (
                <MiniMap
                  book={book}
                  currentChapter={current}
                  onChapterSelect={(index) => {
                    setCurrent(index);
                    setShowMiniMap(false);
                  }}
                />
              )}
            </div>
          )}
        </div>

        <div className="buttonGroup">
          <button className="btn" onClick={handleRename} title="Renomear este capítulo">✏️ Renomear</button>
          <button className="btn" onClick={handleMergeWithPrevious} title="Mesclar com capítulo anterior">⬆️ Mesclar anterior</button>
          <button className="btn" onClick={handleMergeWithNext} title="Mesclar com próximo capítulo">⬇️ Mesclar próximo</button>
          <button 
            className="btn success" 
            onClick={() => setBookPageView(true)}
            title="Visualização tipo livro físico"
          >
            📖 Visualização Livro
          </button>
          <button 
            className="btn primary" 
            onClick={() => setFocusMode(true)}
            title="Modo foco (Ctrl+F)"
          >
            🎯 Modo Foco
          </button>
        </div>

        {advancedSearchResults.length > 0 && (
          <div
            style={{
              marginBottom: "16px",
              padding: "16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                <span role="img" aria-label="Resultados">
                  📌
                </span>
                {advancedSearchResults.length} resultado
                {advancedSearchResults.length === 1 ? "" : "s"} encontrados
              </div>
              <button
                className="btn"
                onClick={() => {
                  setAdvancedSearchResults([]);
                  setSearchHighlight(null);
                }}
              >
                Limpar resultados
              </button>
            </div>
            <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {advancedSearchResults.map((result, idx) => (
                <button
                  key={`${result.chapterIndex}-${result.paragraphIndex}-${idx}`}
                  className="btn"
                  style={{
                    justifyContent: "flex-start",
                    textAlign: "left",
                    lineHeight: 1.4,
                    padding: "10px 12px",
                    borderColor: "var(--border)",
                    background: "var(--surface2)",
                  }}
                  onClick={() => handleSelectSearchResult(result)}
                >
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>
                    Cap. {result.chapterIndex + 1} — {result.chapterTitle}
                    {result.paragraphIndex >= 0 && ` • Parágrafo ${result.paragraphIndex + 1}`}
                  </div>
                  <div style={{ fontSize: "13px" }} dangerouslySetInnerHTML={{ __html: result.matchText }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor de parágrafos (fonte de verdade = ch.text) */}
        <div className="paragraphEditor">
          <div style={{ color: "#93a3b5", marginBottom: 6 }}>
            Clique em um parágrafo para editar. Use os botões para adicionar/remover.
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button
              className="btn"
              onClick={() => handleToolbarAction("bold")}
              disabled={activeParagraph === null}
              title="Negrito (Ctrl+B)"
            >
              <strong>Negrito</strong>
            </button>
            <button
              className="btn"
              onClick={() => handleToolbarAction("italic")}
              disabled={activeParagraph === null}
              title="Itálico (Ctrl+I)"
            >
              <em>Itálico</em>
            </button>
            <button
              className="btn"
              onClick={() => handleToolbarAction("underline")}
              disabled={activeParagraph === null}
              title="Sublinhado (Ctrl+U)"
            >
              <span style={{ textDecoration: "underline" }}>Sublinhado</span>
            </button>
            <button
              className="btn"
              onClick={() => handleToolbarAction("removeFormat")}
              disabled={activeParagraph === null}
              title="Remover formatação"
            >
              Limpar
            </button>
          </div>

          {paras.map((p, idx) => {
            const shouldUseDracula = useDraculaFont || getParagraphDraculaFont(idx);
            const displayHTML = shouldUseDracula
              ? renderDraculaSyntaxHTML(p)
              : richParas[idx] || sanitizeHtml(p);

            return (
              <div key={idx} style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                    alignItems: "start",
                    marginBottom: 8,
                  }}
                >
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="paragraph"
                    ref={(el) => {
                      paragraphRefs.current[idx] = el;
                    }}
                    onFocus={() => setActiveParagraph(idx)}
                    onBlur={() => {
                      if (activeParagraph === idx) {
                        setActiveParagraph(null);
                      }
                    }}
                    style={{
                      fontFamily: (useDraculaFont || getParagraphDraculaFont(idx))
                        ? (theme.name === "dracula" && theme.font 
                            ? theme.font 
                            : "'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace")
                        : "inherit",
                      fontSize: (useDraculaFont || getParagraphDraculaFont(idx)) ? "14px" : "inherit",
                      lineHeight: (useDraculaFont || getParagraphDraculaFont(idx)) ? "1.6" : "inherit",
                      letterSpacing: (useDraculaFont || getParagraphDraculaFont(idx)) ? "0.02em" : "inherit",
                    boxShadow:
                      searchHighlight &&
                      searchHighlight.chapterIndex === current &&
                      searchHighlight.paragraphIndex === idx
                        ? "0 0 0 2px rgba(37, 99, 235, 0.5)"
                        : undefined,
                    background:
                      searchHighlight &&
                      searchHighlight.chapterIndex === current &&
                      searchHighlight.paragraphIndex === idx
                        ? "rgba(37, 99, 235, 0.12)"
                        : "inherit",
                    }}
                    onInput={(e) => {
                      if (!proj) return;
                      const el = e.currentTarget as HTMLDivElement;
                      const newParas = [...paras];
                      newParas[idx] = el.innerText;
                      const newRich = getCurrentRichParas();
                      newRich[idx] = sanitizeRichHTML(el.innerHTML);
                      const updated: Book = {
                        ...book,
                        chapters: book.chapters.map((c, i) =>
                          i === current
                            ? { ...c, text: joinParas(newParas), richParagraphs: newRich }
                            : c
                        ),
                      };
                      setBook(proj.id, updated);
                    }}
                    dangerouslySetInnerHTML={{ __html: displayHTML }}
                  />

                  <div style={{ display: "flex", gap: 6 }}>
                  {/* + Parágrafo */}
                  <button
                    className="btn"
                    onClick={() => {
                      if (!proj) return;
                      const newParas = [...paras];
                      newParas.splice(idx + 1, 0, "");
                      const newRich = getCurrentRichParas();
                      newRich.splice(idx + 1, 0, "");
                      const updated: Book = {
                        ...book,
                        chapters: book.chapters.map((c, i) =>
                          i === current
                            ? { ...c, text: joinParas(newParas), richParagraphs: newRich }
                            : c
                        ),
                      };
                      setBook(proj.id, updated);
                    }}
                  >
                    + Parágrafo
                  </button>

                  {/* Dividir aqui */}
                  <button
                    className="btn"
                    onClick={() => {
                      if (!proj) return;

                      const before = paras.slice(0, idx + 1);
                      const after = paras.slice(idx + 1);
                      if (after.length === 0) {
                        alert("Nada para mover para o novo capítulo.");
                        return;
                      }
                      const currentRich = getCurrentRichParas();
                      const beforeRich = currentRich.slice(0, idx + 1);
                      const afterRich = currentRich.slice(idx + 1);

                      const newTitle =
                        prompt("Título do novo capítulo:", ch.title + " (continuação)") ||
                        ch.title + " (continuação)";

                      const newChapter: Chapter = {
                        id: makeId("ch"),
                        title: newTitle,
                        text: joinParas(after),
                        richParagraphs: afterRich,
                      };

                      const chapters = [...book.chapters];
                      chapters[current] = {
                        ...ch,
                        text: joinParas(before),
                        richParagraphs: beforeRich,
                      };
                      chapters.splice(current + 1, 0, newChapter);

                      setBook(proj.id, { ...book, chapters });
                    }}
                  >
                    Dividir aqui
                  </button>

                  {/* Fonte Dracula por parágrafo */}
                  <button
                    className={`btn ${getParagraphDraculaFont(idx) ? "primary" : ""}`}
                    onClick={() => toggleParagraphDraculaFont(idx)}
                    title={getParagraphDraculaFont(idx) ? "Desativar fonte Dracula neste parágrafo" : "Ativar fonte Dracula neste parágrafo"}
                  >
                    {getParagraphDraculaFont(idx) ? "🔤 Dracula (Ativa)" : "🔤 Dracula"}
                  </button>

                  {/* Remover parágrafo */}
                  <button
                    className="btn"
                    onClick={() => {
                      if (!proj) return;
                      const newParas = [...paras];
                      newParas.splice(idx, 1);
                      const newRich = getCurrentRichParas();
                      newRich.splice(idx, 1);
                      const updated: Book = {
                        ...book,
                        chapters: book.chapters.map((c, i) =>
                          i === current
                            ? { ...c, text: joinParas(newParas), richParagraphs: newRich }
                            : c
                        ),
                      };
                      setBook(proj.id, updated);
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
              
              {/* Anotações e Comentários para este parágrafo */}
              <div style={{ marginTop: "12px", padding: "12px", background: "var(--surface2)", borderRadius: "6px" }}>
                <GrammarSuggestions text={paras[idx]} />
                <AnnotationsManager
                  currentChapter={current}
                  currentParagraph={idx}
                />
                <CommentsManager
                  currentChapter={current}
                  currentParagraph={idx}
                />
              </div>
            </div>
            );
          })}
        </div>
        
        {showAdvancedSearch && (
          <AdvancedSearch
            book={book}
            onSearch={(results) => {
              setAdvancedSearchResults(results);
              setShowAdvancedSearch(false);
            }}
            onClose={() => {
              setShowAdvancedSearch(false);
            }}
            annotations={proj?.annotations}
            comments={proj?.comments}
            paragraphFontSettings={proj?.paragraphFontSettings}
            globalDraculaEnabled={useDraculaFont}
          />
        )}

        {/* Assistente IA */}
        <AIAssistant
          book={book}
          currentChapter={ch}
        />

        {/* Leitura */}
        {paras.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}

        <div className="navigation">
          <button
            className="btn"
            disabled={current === 0}
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
          >
            ◀ Anterior
          </button>
          <button
            className="btn"
            disabled={current >= book.chapters.length - 1}
            onClick={() => setCurrent(c => Math.min(book.chapters.length - 1, c + 1))}
          >
            Próximo ▶
          </button>
        </div>
      </div>
    </div>
  );
}
