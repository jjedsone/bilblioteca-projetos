// src/components/Sidebar.tsx
import { useMemo, useState } from "react";
import { useProjects } from "../store/projects";

export default function Sidebar() {
  const {
    projects,
    selectedId,
    addProject,
    renameProject,
    deleteProject,
    selectProject,
    // setSelectedId // se preferir, pode usar este no lugar de selectProject
  } = useProjects();

  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => (p.name || "").toLowerCase().includes(q));
  }, [projects, filter]);

  const openEditor = (id: string) => {
    // seleciona e navega para o editor
    selectProject(id);
    location.hash = "#/editor?pid=" + encodeURIComponent(id);
  };

  const goLibrary = () => (location.hash = "#/biblioteca");

  const onCreate = () => {
    const name = prompt("Nome do novo projeto:", "Meu projeto") || "Sem título";
    addProject(name);
    // A store já define selectedId para o projeto recém-criado.
    location.hash = "#/editor";
  };

  return (
    <aside
      className="sidebar"
      style={{
        width: 280,
        minWidth: 240,
        borderRight: "1px solid var(--panel-border)",
        background: "var(--panel)",
        display: "flex",
        flexDirection: "column",
        padding: 10,
        gap: 10,
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Projetos</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn primary" onClick={onCreate}>
            + Novo
          </button>
          <button type="button" className="btn" onClick={goLibrary}>
            Biblioteca
          </button>
        </div>
        <input
          type="search"
          placeholder="Filtrar..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {/* Lista de projetos */}
      <div
        style={{
          overflowY: "auto",
          display: "grid",
          gap: 6,
        }}
      >
        {filtered.length === 0 && (
          <div style={{ opacity: 0.6, fontSize: 13 }}>Nada encontrado.</div>
        )}

        {filtered.map((p) => {
          const isActive = p.id === selectedId;
          return (
            <div
              key={p.id}
              style={{
                border: "1px solid var(--panel-border)",
                borderRadius: 10,
                background: isActive
                  ? "color-mix(in oklab, var(--panel) 80%, var(--fg) 5%)"
                  : "var(--panel)",
                padding: 8,
                display: "grid",
                gap: 6,
              }}
            >
              <button
                type="button"
                onClick={() => openEditor(p.id)}
                title="Abrir no editor"
                style={{
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  color: "var(--fg)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {p.name || "Sem título"}
              </button>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const name =
                      prompt("Renomear projeto:", p.name || "Sem título") ??
                      p.name;
                    if (!name) return;
                    renameProject(p.id, name);
                  }}
                >
                  Renomear
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => openEditor(p.id)}
                >
                  Abrir
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (
                      confirm(
                        `Excluir o projeto "${p.name || "Sem título"}"? Esta ação não pode ser desfeita.`
                      )
                    ) {
                      deleteProject(p.id);
                    }
                  }}
                >
                  Excluir
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, fontSize: 12, opacity: 0.7 }}>
                <span>
                  Capítulos: {p.book?.chapters?.length ?? 0}
                </span>
                <span>•</span>
                <span>
                  Atualizado:{" "}
                  {p.updatedAt instanceof Date
                    ? p.updatedAt.toLocaleDateString()
                    : String(p.updatedAt).slice(0, 10)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
