// src/components/BookView.tsx
import { useState, useCallback } from "react";
import type { Book, Chapter } from "../types";
import { makeId } from "../types";
import ChapterList from "./ChapterList";
import { useProjects } from "../store/projects";

// ===== Helpers =====
const splitParas = (text: string): string[] =>
  text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

const joinParas = (paras: string[]): string =>
  paras.join("\n\n");

const sanitizeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ===== Component =====
interface BookViewProps {
  book: Book;
}

export default function BookView({ book }: BookViewProps) {
  const [current, setCurrent] = useState(0);
  const { projects, selectedId, setBook } = useProjects();

  const proj = projects.find(p => p.id === selectedId);
  const ch = book.chapters[current];
  const paras = splitParas(ch.text);

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
    };
    const chapters = [...book.chapters];
    chapters[current - 1] = merged;
    chapters.splice(current, 1);
    setBook(proj.id, { ...book, chapters });
    setCurrent(current - 1);
  }, [proj, current, book, paras, setBook]);

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
    };
    const chapters = [...book.chapters];
    chapters[current] = merged;
    chapters.splice(current + 1, 1);
    setBook(proj.id, { ...book, chapters });
  }, [proj, current, book, ch, paras, setBook]);

  return (
    <div className="content">
      <ChapterList book={book} current={current} onSelect={setCurrent} />

      <div className="reader">
        <h1>{book.title}</h1>
        <h2>{current + 1}. {ch.title}</h2>

        <div className="buttonGroup">
          <button className="btn" onClick={handleRename}>Renomear capítulo</button>
          <button className="btn" onClick={handleMergeWithPrevious}>Mesclar com anterior</button>
          <button className="btn" onClick={handleMergeWithNext}>Mesclar com próximo</button>
        </div>

        {/* Editor de parágrafos (fonte de verdade = ch.text) */}
        <div className="paragraphEditor">
          <div style={{ color: "#93a3b5", marginBottom: 6 }}>
            Clique em um parágrafo para editar. Use os botões para adicionar/remover.
          </div>

          {paras.map((p, idx) => (
            <div
              key={idx}
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
                onInput={(e) => {
                  if (!proj) return;
                  const el = e.currentTarget as HTMLDivElement;
                  const newParas = [...paras];
                  newParas[idx] = el.innerText;
                  const updated: Book = {
                    ...book,
                    chapters: book.chapters.map((c, i) =>
                      i === current ? { ...c, text: joinParas(newParas) } : c
                    ),
                  };
                  setBook(proj.id, updated);
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(p) }}
              />

              <div style={{ display: "flex", gap: 6 }}>
                {/* + Parágrafo */}
                <button
                  className="btn"
                  onClick={() => {
                    if (!proj) return;
                    const newParas = [...paras];
                    newParas.splice(idx + 1, 0, "");
                    const updated: Book = {
                      ...book,
                      chapters: book.chapters.map((c, i) =>
                        i === current ? { ...c, text: joinParas(newParas) } : c
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

                    const newTitle =
                      prompt("Título do novo capítulo:", ch.title + " (continuação)") ||
                      ch.title + " (continuação)";

                    const newChapter: Chapter = {
                      id: makeId("ch"),
                      title: newTitle,
                      text: joinParas(after),
                    };

                    const chapters = [...book.chapters];
                    chapters[current] = { ...ch, text: joinParas(before) };
                    chapters.splice(current + 1, 0, newChapter);

                    setBook(proj.id, { ...book, chapters });
                  }}
                >
                  Dividir aqui
                </button>

                {/* Remover parágrafo */}
                <button
                  className="btn"
                  onClick={() => {
                    if (!proj) return;
                    const newParas = [...paras];
                    newParas.splice(idx, 1);
                    const updated: Book = {
                      ...book,
                      chapters: book.chapters.map((c, i) =>
                        i === current ? { ...c, text: joinParas(newParas) } : c
                      ),
                    };
                    setBook(proj.id, updated);
                  }}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>

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
