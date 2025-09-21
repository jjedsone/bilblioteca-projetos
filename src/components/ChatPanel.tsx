/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setLoading(true);

    const next = [...msgs, { role: "user", content: text } as Msg];
    setMsgs(next);

    try {
      // use rota RELATIVA; o Vite proxiará para o backend
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Você é um assistente técnico, claro e educado." },
            ...next,
          ],
        }),
      });

      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || `HTTP ${r.status}`);
      }

      const data = await r.json();
      const answer = data?.answer ?? "Não foi possível obter resposta agora.";
      setMsgs([...next, { role: "assistant", content: answer }]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setMsgs([
        ...next,
        { role: "assistant", content: "Falha ao obter resposta. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          border: "1px solid #2b3a4a",
          padding: 12,
          borderRadius: 8,
          height: 300,
          overflow: "auto",
          background: "#0f1720",
        }}
      >
        {msgs.map((m, i) => (
          <div key={i} style={{ margin: "6px 0" }}>
            <strong>{m.role === "user" ? "Você" : "Assistente"}:</strong>{" "}
            <span>{m.content}</span>
          </div>
        ))}
        {loading && <div>Gerando resposta…</div>}
        {error && <div style={{ color: "#ff8383" }}>Erro: {error}</div>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta…"
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn primary" onClick={send} disabled={loading}>
          {loading ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
