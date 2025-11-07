// src/pages/Library.tsx
import { useMemo, useState } from "react";
import { useProjects } from "../store/projects";
import { goEditor } from "../router";
import KindleView from "../components/KindleView";

export default function Library() {
  const { projects, deleteProject, toggleFavorite, markAsRead, markAsReading, unmarkRead } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [kindleView, setKindleView] = useState<{ bookId: string } | null>(null);

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.book?.title?.toLowerCase().includes(query) ||
          p.book?.author?.toLowerCase().includes(query) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filtro por categoria
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filtro por tag
    if (selectedTag) {
      filtered = filtered.filter((p) =>
        p.tags?.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    // Filtro por favoritos
    if (showFavorites) {
      filtered = filtered.filter((p) => p.isFavorite);
    }

    // Filtro por lidos
    if (showRead) {
      filtered = filtered.filter((p) => p.isRead);
    }

    // Filtro por em leitura
    if (showReading) {
      filtered = filtered.filter((p) => p.isReading);
    }

    return filtered;
  }, [projects, searchQuery, selectedCategory, selectedTag, showFavorites, showRead, showReading]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [projects]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((p) => {
      p.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [projects]);

  const openProject = (id: string) => {
    goEditor(id);
  };

  const openKindleView = (id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (proj?.book && proj.finalized) {
      setKindleView({ bookId: id });
    }
  };

  const projForKindle = kindleView
    ? projects.find((p) => p.id === kindleView.bookId)
    : null;

  if (!projects || projects.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", marginBottom: 16 }}>📚 Biblioteca de Projetos</h1>
        <p style={{ color: "var(--fg2)", marginBottom: 24, fontSize: "16px" }}>
          Nenhum projeto salvo ainda.
        </p>
        <button
          className="btn primary"
          onClick={() => {
            location.hash = "#/editor";
          }}
        >
          ➕ Criar Primeiro Projeto
        </button>
      </div>
    );
  }

  if (kindleView && projForKindle?.book) {
    return (
      <KindleView
        book={projForKindle.book}
        onClose={() => setKindleView(null)}
      />
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "32px", marginBottom: 8 }}>📚 Biblioteca de Projetos</h1>
        <p style={{ color: "var(--fg2)", marginBottom: 16 }}>
          Gerencie seus livros e projetos. {projects.length} {projects.length === 1 ? "projeto" : "projetos"} no total.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 Buscar projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              maxWidth: 300,
              padding: "10px 16px",
              fontSize: "14px",
            }}
          />

          {allCategories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                minWidth: 150,
              }}
            >
              <option value="">Todas as categorias</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                minWidth: 150,
              }}
            >
              <option value="">Todas as tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}

          <button
            className={`btn ${showFavorites ? "primary" : ""}`}
            onClick={() => setShowFavorites(!showFavorites)}
            title="Mostrar apenas favoritos"
          >
            ⭐ Favoritos
          </button>
          <button
            className={`btn ${showRead ? "primary" : ""}`}
            onClick={() => setShowRead(!showRead)}
            title="Mostrar apenas lidos"
          >
            ✓ Lidos
          </button>
          <button
            className={`btn ${showReading ? "primary" : ""}`}
            onClick={() => setShowReading(!showReading)}
            title="Mostrar apenas em leitura"
          >
            📖 Em Leitura
          </button>

          {(selectedCategory || selectedTag || showFavorites || showRead || showReading) && (
            <button
              className="btn"
              onClick={() => {
                setSelectedCategory("");
                setSelectedTag("");
                setShowFavorites(false);
                setShowRead(false);
                setShowReading(false);
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--fg2)", fontSize: "16px" }}>
            Nenhum projeto encontrado para "{searchQuery}"
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filteredProjects.map((p) => {
            const wordCount = p.book?.chapters.reduce(
              (acc, ch) => acc + ch.text.split(/\s+/).filter(Boolean).length,
              0
            ) || 0;
            
            return (
              <div
                key={p.id}
                className="card"
                style={{
                  display: "grid",
                  gap: 12,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onClick={() => openProject(p.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: "18px" }}>
                      {p.name || "Sem título"}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {p.isFavorite && (
                        <span
                          style={{
                            fontSize: "18px",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(p.id);
                          }}
                          title="Remover dos favoritos"
                        >
                          ⭐
                        </span>
                      )}
                      {!p.isFavorite && (
                        <span
                          style={{
                            fontSize: "18px",
                            cursor: "pointer",
                            opacity: 0.3,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(p.id);
                          }}
                          title="Adicionar aos favoritos"
                        >
                          ⭐
                        </span>
                      )}
                      {p.finalized && (
                        <span
                          style={{
                            background: "var(--success)",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                          title="Livro finalizado"
                        >
                          ✓ Finalizado
                        </span>
                      )}
                      {p.isRead && (
                        <span
                          style={{
                            background: "var(--primary)",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                          title="Livro lido"
                        >
                          ✓ Lido
                        </span>
                      )}
                      {p.isReading && (
                        <span
                          style={{
                            background: "var(--accent)",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                          title="Em leitura"
                        >
                          📖 Lendo
                        </span>
                      )}
                    </div>
                  </div>
                  {p.book?.title && p.book.title !== p.name && (
                    <div style={{ color: "var(--fg2)", fontSize: "14px", marginBottom: 8 }}>
                      📖 {p.book.title}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "13px", color: "var(--fg2)" }}>
                  <span>📑 {p.book?.chapters?.length ?? 0} capítulos</span>
                  {wordCount > 0 && <span>📝 {wordCount.toLocaleString()} palavras</span>}
                </div>

                {p.book?.author && (
                  <div style={{ fontSize: "13px", color: "var(--fg2)" }}>
                    ✍️ {p.book.author}
                  </div>
                )}

                {(p.category || (p.tags && p.tags.length > 0)) && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {p.category && (
                      <span
                        style={{
                          background: "var(--primary)",
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {p.category}
                      </span>
                    )}
                    {p.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                          color: "var(--fg)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {p.tags && p.tags.length > 3 && (
                      <span style={{ fontSize: "11px", color: "var(--fg2)" }}>
                        +{p.tags.length - 3} mais
                      </span>
                    )}
                  </div>
                )}

                <div style={{ fontSize: "12px", color: "var(--fg2)" }}>
                  Atualizado:{" "}
                  {p.updatedAt instanceof Date
                    ? p.updatedAt.toLocaleDateString("pt-BR")
                    : new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {p.finalized && p.book ? (
                    <button
                      type="button"
                      className="btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openKindleView(p.id);
                      }}
                      style={{ flex: 1 }}
                      title="Ler em formato Kindle"
                    >
                      📖 Ler Livro
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProject(p.id);
                      }}
                      style={{ flex: 1 }}
                    >
                      Abrir
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Excluir o projeto "${p.name || "Sem título"}"? Esta ação não pode ser desfeita.`
                        )
                      ) {
                        deleteProject(p.id);
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  {!p.isRead && (
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (p.isReading) {
                          markAsRead(p.id);
                        } else {
                          markAsReading(p.id);
                        }
                      }}
                      style={{ fontSize: "11px", padding: "4px 8px", flex: 1 }}
                      title={p.isReading ? "Marcar como lido" : "Marcar como em leitura"}
                    >
                      {p.isReading ? "✓ Lido" : "📖 Lendo"}
                    </button>
                  )}
                  {p.isRead && (
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        unmarkRead(p.id);
                      }}
                      style={{ fontSize: "11px", padding: "4px 8px", flex: 1 }}
                      title="Desmarcar como lido"
                    >
                      ↻ Desmarcar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
