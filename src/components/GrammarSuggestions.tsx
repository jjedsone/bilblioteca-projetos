import { useMemo } from "react";
import type { GrammarSuggestion } from "../utils/grammar";
import { getGrammarSuggestions } from "../utils/grammar";

interface GrammarSuggestionsProps {
  text: string;
}

export default function GrammarSuggestions({ text }: GrammarSuggestionsProps) {
  const suggestions = useMemo<GrammarSuggestion[]>(() => getGrammarSuggestions(text), [text]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: "rgba(255, 152, 0, 0.08)",
        border: "1px solid rgba(255, 152, 0, 0.2)",
        borderRadius: "6px",
        padding: "10px 12px",
        marginBottom: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div style={{ fontWeight: 600, color: "#ffb74d", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
        <span role="img" aria-label="Sugestões">
          📝
        </span>
        Sugestões gramaticais
      </div>
      <ul style={{ margin: 0, paddingLeft: "16px", color: "#ffcc80", fontSize: "12px" }}>
        {suggestions.map((item) => (
          <li key={item.id} style={{ marginBottom: "4px", color: "#ffd699" }}>
            {item.message}
          </li>
        ))}
      </ul>
      <span style={{ fontSize: "11px", opacity: 0.7 }}>
        Ajuste manualmente o parágrafo conforme necessário.
      </span>
    </div>
  );
}

