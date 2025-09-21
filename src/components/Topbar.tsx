// src/components/Topbar.tsx
import { useProjects } from "../store/projects";
import { exportBookToPDF } from "../utils/exportPdf";
import { exportBookToEPUB } from "../utils/exportEpub";
import {exportBookToDOCX }from "../utils/exportDocx"; // default import

export default function Topbar() {
  const { projects, selectedId, renameProject, undo, redo, saveVersion } = useProjects();
  const proj = projects.find((p) => p.id === selectedId);

  return (
    <div className="topbar">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <strong>TXT → Livro</strong>

        {proj && (
          <>
            <span style={{ color: "#93a3b5" }}>Projeto:</span>
            <input
              style={{ width: 280 }}
              value={proj.name}
              onChange={(e) => renameProject(proj.id, e.target.value)}
            />
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {proj?.book && (
          <>
            <button className="btn" onClick={() => undo(proj.id)}>Desfazer</button>
            <button className="btn" onClick={() => redo(proj.id)}>Refazer</button>
            <button
              className="btn"
              onClick={() => {
                const note = prompt("Nota desta versão (opcional):") || undefined;
                saveVersion(proj.id, note);
              }}
            >
              Salvar versão
            </button>
            <button className="btn" onClick={() => exportBookToEPUB(proj.book!)}>Exportar EPUB</button>
            <button className="btn" onClick={() => exportBookToDOCX(proj.book!)}>Exportar DOCX</button>
            <button className="btn primary" onClick={() => exportBookToPDF(proj.book!)}>Exportar PDF</button>
          </>
        )}

        <a className="btn" href="https://github.com/" target="_blank" rel="noreferrer">
          Ajuda
        </a>
      </div>
    </div>
  );
}
