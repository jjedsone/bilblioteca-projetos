// src/components/KeyboardShortcutsHelp.tsx
import { useState, useEffect } from "react";

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "?") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ["Ctrl", "F"], description: "Buscar no livro / Abrir modo foco (no editor)" },
    { keys: ["Ctrl", "K"], description: "Busca rápida" },
    { keys: ["Ctrl", "Z"], description: "Desfazer" },
    { keys: ["Ctrl", "Shift", "Z"], description: "Refazer" },
    { keys: ["↑", "↓"], description: "Navegar entre capítulos (no editor)" },
    { keys: ["←", "→"], description: "Navegar capítulos (modo foco)" },
    { keys: ["Ctrl", "+"], description: "Aumentar fonte (modo foco)" },
    { keys: ["Ctrl", "-"], description: "Diminuir fonte (modo foco)" },
    { keys: ["ESC"], description: "Fechar busca/modo foco/ajuda" },
    { keys: ["Ctrl", "Shift", "?"], description: "Mostrar/ocultar esta ajuda" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="card"
        style={{
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>⌨️ Atalhos de Teclado</h2>
          <button className="btn" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                background: "var(--surface2)",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "var(--fg2)", fontSize: "14px" }}>{shortcut.description}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {shortcut.keys.map((key, keyIdx) => (
                  <span
                    key={keyIdx}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--accent)",
                      fontFamily: "monospace",
                    }}
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: "12px", background: "var(--surface2)", borderRadius: "8px", fontSize: "13px", color: "var(--fg2)" }}>
          💡 <strong>Dica:</strong> Pressione <kbd style={{ padding: "2px 6px", background: "var(--surface)", borderRadius: "4px" }}>Ctrl + Shift + ?</kbd> a qualquer momento para ver esta ajuda.
        </div>
      </div>
    </div>
  );
}

