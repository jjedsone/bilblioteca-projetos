// src/components/TagsManager.tsx
import { useState, useMemo } from "react";
import { useProjects } from "../store/projects";

export default function TagsManager() {
  const { projects, selectedId, addTag, removeTag, setCategory } = useProjects();
  const proj = projects.find((p) => p.id === selectedId);
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState(proj?.category || "");

  if (!proj) return null;

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((p) => {
      p.tags?.forEach((tag) => tags.add(tag.toLowerCase()));
    });
    return Array.from(tags).sort();
  }, [projects]);

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(proj.id, newTag.trim());
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    removeTag(proj.id, tag);
  };

  const handleSetCategory = () => {
    setCategory(proj.id, newCategory);
  };

  const handleTagSuggestion = (tag: string) => {
    addTag(proj.id, tag);
  };

  const categories = ["Ficção", "Não-ficção", "Técnico", "Educacional", "Biografia", "Poesia", "Outro"];

  return (
    <div className="card">
      <h3>🏷️ Tags e Categorias</h3>
      
      {/* Categoria */}
      <div style={{ marginBottom: 16 }}>
        <label>
          Categoria
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button className="btn primary" onClick={handleSetCategory}>
              Salvar
            </button>
          </div>
          {proj.category && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  background: "var(--primary)",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {proj.category}
              </span>
              <button
                className="btn"
                onClick={() => {
                  setCategory(proj.id, "");
                  setNewCategory("");
                }}
                style={{ padding: "4px 8px", fontSize: "12px" }}
              >
                ✕
              </button>
            </div>
          )}
        </label>
      </div>

      {/* Tags */}
      <div>
        <label>
          Tags
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Adicionar tag..."
              style={{ flex: 1 }}
            />
            <button className="btn primary" onClick={handleAddTag}>
              ➕ Adicionar
            </button>
          </div>
        </label>

        {/* Tags existentes do projeto */}
        {proj.tags && proj.tags.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {proj.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {tag}
                <button
                  className="btn"
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    padding: 0,
                    background: "transparent",
                    border: "none",
                    color: "var(--fg2)",
                    cursor: "pointer",
                    fontSize: "14px",
                    lineHeight: 1,
                  }}
                  title="Remover tag"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Sugestões de tags */}
        {allTags.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: "12px", color: "var(--fg2)", marginBottom: 8 }}>
              Tags sugeridas (de outros projetos):
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {allTags
                .filter((tag) => !proj.tags?.some((t) => t.toLowerCase() === tag))
                .slice(0, 10)
                .map((tag) => (
                  <button
                    key={tag}
                    className="btn"
                    onClick={() => handleTagSuggestion(tag)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "12px",
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                    }}
                    title={`Adicionar tag "${tag}"`}
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

