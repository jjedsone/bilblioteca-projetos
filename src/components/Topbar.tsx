// src/components/Topbar.tsx
import { useProjects } from "../store/projects";
import { exportBookToPDF } from "../utils/exportPdf";
import { exportBookToEPUB } from "../utils/exportEpub";
import { exportBookToDOCX } from "../utils/exportDocx";
import { exportBookToMarkdown } from "../utils/exportMarkdown";
import { exportBookToHTML } from "../utils/exportHtml";
import ThemeSelector from "./ThemeSelector";
import { useTheme } from "../store/theme";
import { useEffect } from "react";

export default function Topbar() {
  const { projects, selectedId, renameProject, undo, redo, saveVersion, finalizeBook } = useProjects();
  const { detectFrontendContent } = useTheme();
  const proj = projects.find((p) => p.id === selectedId);

  // Detecta automaticamente se o conteúdo é sobre frontend
  useEffect(() => {
    if (proj?.book) {
      detectFrontendContent(proj.book.title, proj.book.keywords);
    }
  }, [proj?.book?.title, proj?.book?.keywords, detectFrontendContent]);

  return (
    <div className="topbar">
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontSize: "16px", fontWeight: 700 }}>📚 TXT → Livro</strong>

        {proj && (
          <>
            <span style={{ color: "var(--fg2)", fontSize: "13px" }}>Projeto:</span>
            <input
              style={{ width: 280, maxWidth: "100%" }}
              value={proj.name}
              onChange={(e) => renameProject(proj.id, e.target.value)}
              placeholder="Nome do projeto"
            />
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {proj?.book && (
          <>
            <button 
              className="btn" 
              onClick={() => undo(proj.id)}
              title="Desfazer (Ctrl+Z)"
            >
              ↶ Desfazer
            </button>
            <button 
              className="btn" 
              onClick={() => redo(proj.id)}
              title="Refazer (Ctrl+Shift+Z)"
            >
              ↷ Refazer
            </button>
            <button
              className="btn"
              onClick={() => {
                const note = prompt("Nota desta versão (opcional):") || undefined;
                if (note !== null) {
                  saveVersion(proj.id, note);
                }
              }}
              title="Salvar versão do livro"
            >
              💾 Versão
            </button>
            <div style={{ width: "1px", height: "20px", background: "var(--border)", margin: "0 4px" }} />
            <button 
              className="btn" 
              onClick={() => exportBookToEPUB(proj.book!)}
              title="Exportar como EPUB"
            >
              📖 EPUB
            </button>
            <button 
              className="btn" 
              onClick={() => exportBookToDOCX(proj.book!)}
              title="Exportar como DOCX"
            >
              📄 DOCX
            </button>
            <button 
              className="btn primary" 
              onClick={() => exportBookToPDF(proj.book!)}
              title="Exportar como PDF"
            >
              📑 PDF
            </button>
            <button 
              className="btn" 
              onClick={() => exportBookToMarkdown(proj.book!)}
              title="Exportar como Markdown"
            >
              📝 MD
            </button>
            <button 
              className="btn" 
              onClick={() => exportBookToHTML(proj.book!)}
              title="Exportar como HTML"
            >
              🌐 HTML
            </button>
            <div style={{ width: "1px", height: "20px", background: "var(--border)", margin: "0 4px" }} />
            <button
              className="btn success"
              onClick={() => {
                if (proj.book && confirm("Finalizar este livro? Ele será salvo na biblioteca em formato tipo Kindle.")) {
                  finalizeBook(proj.id);
                  alert("Livro finalizado com sucesso! Agora você pode visualizá-lo na biblioteca em formato tipo Kindle.");
                }
              }}
              title="Finalizar livro e salvar na biblioteca"
              disabled={!proj.book || proj.finalized}
            >
              {proj.finalized ? "✓ Finalizado" : "📚 Finalizar Livro"}
            </button>
          </>
        )}

        <ThemeSelector />

        <button
          className="btn"
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "?",
              ctrlKey: true,
              shiftKey: true,
            });
            window.dispatchEvent(event);
          }}
          title="Atalhos de teclado (Ctrl+Shift+?)"
        >
          ⌨️
        </button>

        <a 
          className="btn" 
          href="https://github.com/" 
          target="_blank" 
          rel="noreferrer"
          title="Ajuda e documentação"
        >
          ❓
        </a>
      </div>
    </div>
  );
}
