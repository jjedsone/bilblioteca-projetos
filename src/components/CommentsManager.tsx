// src/components/CommentsManager.tsx
import { useState, useMemo } from "react";
import { useProjects } from "../store/projects";
import type { Comment } from "../store/projects";

interface CommentsManagerProps {
  currentChapter: number;
  currentParagraph: number;
}

export default function CommentsManager({
  currentChapter,
  currentParagraph,
}: CommentsManagerProps) {
  const { projects, selectedId, addComment, removeComment, updateComment } = useProjects();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const proj = projects.find((p) => p.id === selectedId);
  const comments = useMemo(() => {
    if (!proj?.comments) return [];
    return proj.comments.filter(
      (c) => c.chapterIndex === currentChapter && c.paragraphIndex === currentParagraph
    );
  }, [proj, currentChapter, currentParagraph]);

  const handleAddComment = () => {
    if (!proj || !newComment.trim()) return;

    addComment(proj.id, {
      chapterIndex: currentChapter,
      paragraphIndex: currentParagraph,
      text: newComment,
    });

    setNewComment("");
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = () => {
    if (!proj || !editingId || !editText.trim()) return;

    updateComment(proj.id, editingId, editText);
    setEditingId(null);
    setEditText("");
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>💬 Comentários</h4>

      <div style={{ marginBottom: "12px" }}>
        <textarea
          placeholder="Adicionar comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleAddComment();
            }
          }}
          style={{
            width: "100%",
            minHeight: "60px",
            padding: "8px 12px",
            fontSize: "12px",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            background: "var(--surface2)",
            color: "var(--fg)",
            resize: "vertical",
          }}
        />
        <button
          className="btn primary"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          style={{ marginTop: "8px", fontSize: "12px", padding: "4px 8px" }}
        >
          + Adicionar Comentário (Ctrl+Enter)
        </button>
      </div>

      {comments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "10px 12px",
                fontSize: "12px",
              }}
            >
              {editingId === comment.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: "60px",
                      padding: "6px 8px",
                      fontSize: "12px",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      background: "var(--surface)",
                      color: "var(--fg)",
                      marginBottom: "8px",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn primary"
                      onClick={handleSaveEdit}
                      style={{ fontSize: "11px", padding: "2px 6px" }}
                    >
                      Salvar
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      style={{ fontSize: "11px", padding: "2px 6px" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "4px", color: "var(--fg)" }}>{comment.text}</div>
                  <div style={{ fontSize: "10px", color: "var(--fg2)", marginBottom: "4px" }}>
                    {comment.createdAt instanceof Date
                      ? comment.createdAt.toLocaleString("pt-BR")
                      : new Date(comment.createdAt).toLocaleString("pt-BR")}
                    {comment.author && ` • ${comment.author}`}
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button
                      className="btn"
                      onClick={() => handleStartEdit(comment)}
                      style={{ fontSize: "11px", padding: "2px 6px" }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => {
                        if (proj && confirm("Remover este comentário?")) {
                          removeComment(proj.id, comment.id);
                        }
                      }}
                      style={{ fontSize: "11px", padding: "2px 6px" }}
                    >
                      🗑️ Remover
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {comments.length === 0 && (
        <div style={{ fontSize: "12px", color: "var(--fg2)", fontStyle: "italic" }}>
          Nenhum comentário neste parágrafo.
        </div>
      )}
    </div>
  );
}

