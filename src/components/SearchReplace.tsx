// src/SearchReplace.tsx
import { useMemo, useState } from "react";
import { useProjects } from "../store/projects";
import type { Book } from "../types";

function buildRegex(pattern: string, useRegex: boolean, caseSensitive: boolean): RegExp | null {
  try {
    if (!useRegex) {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(escaped, caseSensitive ? "g" : "gi");
    }
    return new RegExp(pattern, caseSensitive ? "g" : "gi");
  } catch {
    return null;
  }
}

export default function SearchReplace() {
  const { projects, selectedId, setBook } = useProjects();
  const proj = projects.find((p) => p.id === selectedId);
  const [query, setQuery] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [scope, setScope] = useState<"chapter" | "book">("chapter");
  const [info, setInfo] = useState("");

  const book = proj?.book;
  const regex = useMemo(
    () => buildRegex(query, useRegex, caseSensitive),
    [query, useRegex, caseSensitive]
  );

  if (!book) return null;

  interface WindowWithChapterIndex extends Window {
    __currentChapterIndex?: number;
  }
  const win = window as WindowWithChapterIndex;

  const chaptersInScope =
    scope === "book"
      ? book.chapters
      : [book.chapters[win.__currentChapterIndex ?? 0]];

  const countMatches = () => {
    if (!regex) {
      setInfo("Expressão inválida.");
      return;
    }
    let count = 0;
    for (const ch of chaptersInScope) {
      const m = ch.text.match(regex);
      if (m) count += m.length;
    }
    setInfo(`Encontradas ${count} ocorrência(s).`);
  };

  const replaceAll = () => {
    if (!regex) {
      setInfo("Expressão inválida.");
      return;
    }
    const updated: Book = JSON.parse(JSON.stringify(book));
    if (scope === "book") {
      updated.chapters = updated.chapters.map((c) => ({
        ...c,
        text: c.text.replace(regex!, replaceWith),
      }));
    } else {
      const idx = (win.__currentChapterIndex ?? 0);
      updated.chapters[idx] = {
        ...updated.chapters[idx],
        text: updated.chapters[idx].text.replace(regex!, replaceWith),
      };
    }
    setBook(proj!.id, updated);

    // recontagem
    let count = 0;
    for (const ch of (scope === "book" ? updated.chapters : [updated.chapters[(win.__currentChapterIndex ?? 0)]])) {
      const m = ch.text.match(regex!);
      if (m) count += m.length;
    }
    setInfo(`Substituição concluída. Restaram ${count} ocorrência(s).`);
  };

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Busca & Substituir</h3>
      <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
        <input
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          placeholder="Substituir por..."
          value={replaceWith}
          onChange={(e) => setReplaceWith(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label>
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
            />{" "}
            Usar regex
          </label>
          <label>
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />{" "}
            Case-sensitive
          </label>
          <label>Escopo: </label>
          <select value={scope} onChange={(e) => setScope(e.target.value as "chapter" | "book")}>
            <option value="chapter">Capítulo atual</option>
            <option value="book">Livro inteiro</option>
          </select>
          <button className="btn" onClick={countMatches}>
            Contar
          </button>
          <button className="btn primary" onClick={replaceAll} disabled={!query}>
            Substituir tudo
          </button>
          {info && <span style={{ color: "#93c5fd" }}>{info}</span>}
        </div>
        <p style={{ color: "#93a3b5" }}>
          Dica: com regex ativo, use grupos e âncoras. Ex.: <code>\bcap[ií]tulo\b</code>
        </p>
      </div>
    </div>
  );
}
