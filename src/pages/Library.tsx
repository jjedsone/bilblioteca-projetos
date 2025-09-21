// src/pages/Library.tsx
import { useProjects } from "../store/projects";
import { goEditor } from "../router";

export default function Library() {
  const { projects } = useProjects();

  const openProject = (id: string) => {
    goEditor(id); // seta hash e envia o pid
  };

  if (!projects || projects.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Biblioteca de Projetos</h1>
        <p style={{ opacity: 0.7 }}>Nenhum projeto salvo ainda.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Biblioteca de Projetos</h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>
        Seus projetos salvos aparecem aqui. Clique para abrir.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {projects.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid var(--panel-border)",
              borderRadius: 12,
              padding: 12,
              background: "var(--panel)",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 700 }}>{p.name || "Sem título"}</div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>
              Capítulos: {p.book?.chapters?.length ?? 0}
            </div>
            <button type="button" className="btn primary" onClick={() => openProject(p.id)}>
              Abrir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
