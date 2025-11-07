// src/components/AnnotationsManager.tsx
import { useState, useMemo } from "react";
import { useProjects } from "../store/projects";

interface AnnotationsManagerProps {
  currentChapter: number;
  currentParagraph: number;
}

export default function AnnotationsManager({
  currentChapter,
  currentParagraph,
}: AnnotationsManagerProps) {
  const { projects, selectedId, addAnnotation, removeAnnotation, updateAnnotation } = useProjects();
  const [selectedText, setSelectedText] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedColor, setSelectedColor] = useState("#ffd700");

  const proj = projects.find((p) => p.id === selectedId);
  const annotations = useMemo(() => {
    if (!proj?.annotations) return [];
    return proj.annotations.filter(
      (a) => a.chapterIndex === currentChapter && a.paragraphIndex === currentParagraph
    );
  }, [proj, currentChapter, currentParagraph]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      setShowAddNote(true);
    }
  };

  const handleAddAnnotation = () => {
    if (!proj || !selectedText.trim() || !noteText.trim()) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    selection.getRangeAt(0);
    const paragraph = selection.anchorNode?.parentElement;
    if (!paragraph) return;

    const paragraphText = paragraph.textContent || "";
    const startChar = paragraphText.indexOf(selectedText);
    const endChar = startChar + selectedText.length;

    if (startChar >= 0) {
      addAnnotation(proj.id, {
        chapterIndex: currentChapter,
        paragraphIndex: currentParagraph,
        startChar,
        endChar,
        text: selectedText,
        note: noteText,
        color: selectedColor,
      });

      setSelectedText("");
      setNoteText("");
      setShowAddNote(false);
      selection.removeAllRanges();
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h4 style={{ margin: 0, fontSize: "14px" }}>📝 Anotações</h4>
        <button
          className="btn"
          onClick={handleTextSelection}
          style={{ fontSize: "12px", padding: "4px 8px" }}
          title="Selecione um texto e clique para adicionar anotação"
        >
          + Adicionar
        </button>
      </div>

      {showAddNote && selectedText && (
        <div
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "8px",
          }}
        >
          <div style={{ marginBottom: "8px", fontSize: "12px", color: "var(--fg2)" }}>
            Texto selecionado: <strong>{selectedText}</strong>
          </div>
          <input
            type="text"
            placeholder="Digite sua anotação..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              marginBottom: "8px",
              fontSize: "12px",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              background: "var(--surface)",
              color: "var(--fg)",
            }}
          />
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "12px" }}>Cor:</label>
            {["#ffd700", "#ff6b6b", "#4ecdc4", "#95e1d3", "#f38181"].map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: color,
                  border: selectedColor === color ? "2px solid var(--primary)" : "1px solid var(--border)",
                  cursor: "pointer",
                }}
                title={color}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn primary" onClick={handleAddAnnotation} style={{ fontSize: "12px", padding: "4px 8px" }}>
              Salvar
            </button>
            <button
              className="btn"
              onClick={() => {
                setShowAddNote(false);
                setSelectedText("");
                setNoteText("");
              }}
              style={{ fontSize: "12px", padding: "4px 8px" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {annotations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {annotations.map((ann) => (
            <div
              key={ann.id}
              style={{
                background: "var(--surface2)",
                border: `2px solid ${ann.color || "#ffd700"}`,
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "12px",
              }}
            >
              <div style={{ marginBottom: "4px", fontWeight: 600, color: ann.color || "#ffd700" }}>
                "{ann.text}"
              </div>
              <div style={{ color: "var(--fg2)", marginBottom: "4px" }}>{ann.note}</div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  className="btn"
                  onClick={() => {
                    const newNote = prompt("Editar anotação:", ann.note);
                    if (newNote && proj) {
                      updateAnnotation(proj.id, ann.id, newNote);
                    }
                  }}
                  style={{ fontSize: "11px", padding: "2px 6px" }}
                >
                  ✏️ Editar
                </button>
                <button
                  className="btn danger"
                  onClick={() => {
                    if (proj && confirm("Remover esta anotação?")) {
                      removeAnnotation(proj.id, ann.id);
                    }
                  }}
                  style={{ fontSize: "11px", padding: "2px 6px" }}
                >
                  🗑️ Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {annotations.length === 0 && !showAddNote && (
        <div style={{ fontSize: "12px", color: "var(--fg2)", fontStyle: "italic" }}>
          Nenhuma anotação neste parágrafo. Selecione um texto e clique em "Adicionar".
        </div>
      )}
    </div>
  );
}

