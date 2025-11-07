// src/components/AIAssistant.tsx
import { useState } from "react";
import type { Book, Chapter } from "../types";
import {
  analyzeSentiment,
  analyzeText,
  generateSummary,
  suggestTitle,
  getWritingSuggestions,
  translateText,
  expandParagraph,
  type WritingSuggestion,
} from "../utils/aiHelpers";

interface AIAssistantProps {
  book: Book;
  currentChapter?: Chapter;
  currentParagraph?: string;
}

type TabType = "suggestions" | "grammar" | "summary" | "sentiment" | "translate" | "expand" | "chat";

export default function AIAssistant({ book, currentChapter, currentParagraph }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<TabType>("suggestions");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ question: string; answer: string }>>([]);

  const textToAnalyze = currentParagraph || currentChapter?.text || "";

  const handleAnalyzeSentiment = () => {
    setLoading(true);
    setTimeout(() => {
      const analysis = analyzeSentiment(textToAnalyze);
      setResults(analysis);
      setLoading(false);
    }, 500);
  };

  const handleAnalyzeText = () => {
    setLoading(true);
    setTimeout(() => {
      const analysis = analyzeText(textToAnalyze);
      setResults(analysis);
      setLoading(false);
    }, 500);
  };

  const handleGenerateSummary = () => {
    setLoading(true);
    setTimeout(() => {
      const summary = generateSummary(textToAnalyze);
      setResults({ summary });
      setLoading(false);
    }, 500);
  };

  const handleSuggestTitle = () => {
    setLoading(true);
    setTimeout(() => {
      const suggestions = suggestTitle(textToAnalyze);
      setResults({ suggestions });
      setLoading(false);
    }, 500);
  };

  const handleGetSuggestions = () => {
    setLoading(true);
    setTimeout(() => {
      const suggestions = getWritingSuggestions(textToAnalyze);
      setResults({ suggestions });
      setLoading(false);
    }, 500);
  };

  const handleTranslate = async () => {
    if (!textToAnalyze.trim()) return;
    setLoading(true);
    try {
      const translated = await translateText(textToAnalyze, targetLanguage);
      setResults({ translated, original: textToAnalyze });
    } catch (error) {
      setResults({ error: "Erro ao traduzir texto" });
    }
    setLoading(false);
  };

  const handleExpand = async () => {
    if (!textToAnalyze.trim()) return;
    setLoading(true);
    try {
      const expanded = await expandParagraph(textToAnalyze);
      setResults({ original: textToAnalyze, expanded });
    } catch (error) {
      setResults({ error: "Erro ao expandir parágrafo" });
    }
    setLoading(false);
  };

  const handleChat = () => {
    if (!chatQuery.trim()) return;
    setLoading(true);
    
    // Simulação de chat básico
    setTimeout(() => {
      const queryLower = chatQuery.toLowerCase();
      let answer = "";

      if (queryLower.includes("resumo") || queryLower.includes("resumir")) {
        answer = generateSummary(textToAnalyze || book.chapters[0]?.text || "");
      } else if (queryLower.includes("sentimento") || queryLower.includes("tom")) {
        const sentiment = analyzeSentiment(textToAnalyze || book.chapters[0]?.text || "");
        answer = `O tom do texto é ${sentiment.sentiment} (score: ${sentiment.score.toFixed(2)}).`;
      } else if (queryLower.includes("palavras") || queryLower.includes("contagem")) {
        const analysis = analyzeText(textToAnalyze || book.chapters[0]?.text || "");
        answer = `O texto tem ${analysis.wordCount} palavras, ${analysis.sentenceCount} frases e ${analysis.paragraphCount} parágrafos. A complexidade é ${analysis.complexity === "simple" ? "simples" : analysis.complexity === "moderate" ? "moderada" : "complexa"} (legibilidade: ${analysis.readabilityScore.toFixed(1)}/100).`;
      } else if (queryLower.includes("estrutura") || queryLower.includes("organização")) {
        const suggestions = getWritingSuggestions(textToAnalyze || book.chapters[0]?.text || "");
        if (suggestions.length > 0) {
          answer = `Encontrei ${suggestions.length} sugestões de melhoria:\n\n${suggestions.slice(0, 3).map((s, i) => `${i + 1}. ${s.suggestion}`).join("\n")}`;
        } else {
          answer = "O texto está bem estruturado! Não encontrei sugestões de melhoria significativas.";
        }
      } else if (queryLower.includes("título") || queryLower.includes("titulo")) {
        const suggestions = suggestTitle(textToAnalyze || book.chapters[0]?.text || "");
        answer = `Sugestões de título:\n\n${suggestions.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
      } else {
        answer = `Com base no conteúdo do livro "${book.title}", posso ajudar com:\n- Resumos de capítulos\n- Análise de sentimento\n- Sugestões de escrita\n- Correção gramatical\n- Tradução\n- Expansão de parágrafos\n\nFaça uma pergunta específica!`;
      }

      setChatHistory([...chatHistory, { question: chatQuery, answer }]);
      setChatQuery("");
      setLoading(false);
    }, 1000);
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "18px" }}>🤖 Assistente de IA</h3>
        <div style={{ fontSize: "12px", color: "var(--fg2)" }}>
          {textToAnalyze ? `Analisando: ${textToAnalyze.length} caracteres` : "Selecione um texto para analisar"}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          { id: "suggestions" as TabType, label: "💡 Sugestões" },
          { id: "grammar" as TabType, label: "✓ Gramática" },
          { id: "summary" as TabType, label: "📝 Resumo" },
          { id: "sentiment" as TabType, label: "😊 Sentimento" },
          { id: "translate" as TabType, label: "🌐 Traduzir" },
          { id: "expand" as TabType, label: "📈 Expandir" },
          { id: "chat" as TabType, label: "💬 Chat" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? "primary" : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              setResults(null);
            }}
            style={{ fontSize: "12px", padding: "6px 12px" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das tabs */}
      <div style={{ minHeight: "200px" }}>
        {activeTab === "suggestions" && (
          <div>
            <button
              className="btn primary"
              onClick={handleGetSuggestions}
              disabled={!textToAnalyze.trim() || loading}
              style={{ marginBottom: "12px" }}
            >
              {loading ? "Analisando..." : "🔍 Obter Sugestões"}
            </button>
            {results?.suggestions && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {results.suggestions.map((s: WritingSuggestion, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "12px",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "4px", color: "var(--accent)" }}>
                      {s.type === "grammar" && "✓ Gramática"}
                      {s.type === "style" && "🎨 Estilo"}
                      {s.type === "clarity" && "💡 Clareza"}
                      {s.type === "structure" && "📐 Estrutura"}
                    </div>
                    <div style={{ fontSize: "13px", marginBottom: "4px", color: "var(--fg2)" }}>
                      {s.text}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--fg)", marginBottom: "4px" }}>
                      <strong>Sugestão:</strong> {s.suggestion}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--fg2)" }}>
                      {s.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "grammar" && (
          <div>
            <button
              className="btn primary"
              onClick={handleAnalyzeText}
              disabled={!textToAnalyze.trim() || loading}
              style={{ marginBottom: "12px" }}
            >
              {loading ? "Analisando..." : "✓ Verificar Gramática e Estilo"}
            </button>
            {results && (
              <div style={{ background: "var(--surface2)", padding: "12px", borderRadius: "6px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                  <div><strong>Palavras:</strong> {results.wordCount}</div>
                  <div><strong>Frases:</strong> {results.sentenceCount}</div>
                  <div><strong>Parágrafos:</strong> {results.paragraphCount}</div>
                  <div><strong>Média palavras/frase:</strong> {results.avgWordsPerSentence?.toFixed(1)}</div>
                  <div><strong>Legibilidade:</strong> {results.readabilityScore?.toFixed(1)}/100</div>
                  <div><strong>Complexidade:</strong> {
                    results.complexity === "simple" ? "Simples" :
                    results.complexity === "moderate" ? "Moderada" : "Complexa"
                  }</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "summary" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button
                className="btn primary"
                onClick={handleGenerateSummary}
                disabled={!textToAnalyze.trim() || loading}
              >
                {loading ? "Gerando..." : "📝 Gerar Resumo"}
              </button>
              {currentChapter && (
                <button
                  className="btn"
                  onClick={handleSuggestTitle}
                  disabled={loading}
                >
                  {loading ? "Gerando..." : "📌 Sugerir Título"}
                </button>
              )}
            </div>
            {results?.summary && (
              <div style={{ background: "var(--surface2)", padding: "12px", borderRadius: "6px" }}>
                <div style={{ fontSize: "14px", lineHeight: "1.6" }}>{results.summary}</div>
              </div>
            )}
            {results?.suggestions && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontWeight: 600, marginBottom: "8px" }}>Sugestões de Título:</div>
                {results.suggestions.map((title: string, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--surface2)",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      marginBottom: "4px",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (currentChapter && confirm(`Usar "${title}" como título do capítulo?`)) {
                        // Aqui você pode adicionar lógica para atualizar o título
                        alert("Funcionalidade de atualização de título será implementada.");
                      }
                    }}
                  >
                    {idx + 1}. {title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "sentiment" && (
          <div>
            <button
              className="btn primary"
              onClick={handleAnalyzeSentiment}
              disabled={!textToAnalyze.trim() || loading}
              style={{ marginBottom: "12px" }}
            >
              {loading ? "Analisando..." : "😊 Analisar Sentimento"}
            </button>
            {results && (
              <div style={{ background: "var(--surface2)", padding: "12px", borderRadius: "6px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                    Sentimento: {
                      results.sentiment === "positive" ? "😊 Positivo" :
                      results.sentiment === "negative" ? "😢 Negativo" : "😐 Neutro"
                    }
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--fg2)" }}>
                    Score: {results.score?.toFixed(2)} (de -1 a 1)
                  </div>
                </div>
                <div style={{ fontSize: "13px" }}>
                  <div><strong>Emoções detectadas:</strong></div>
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div>Positivas: {results.emotions?.positive || 0}</div>
                    <div>Negativas: {results.emotions?.negative || 0}</div>
                    <div>Neutras: {results.emotions?.neutral || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "translate" && (
          <div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>
                Idioma de destino:
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  background: "var(--surface2)",
                  color: "var(--fg)",
                }}
              >
                <option value="en">Inglês (English)</option>
                <option value="es">Espanhol (Español)</option>
                <option value="fr">Francês (Français)</option>
                <option value="de">Alemão (Deutsch)</option>
                <option value="it">Italiano (Italiano)</option>
              </select>
            </div>
            <button
              className="btn primary"
              onClick={handleTranslate}
              disabled={!textToAnalyze.trim() || loading}
              style={{ marginBottom: "12px" }}
            >
              {loading ? "Traduzindo..." : "🌐 Traduzir"}
            </button>
            {results?.translated && (
              <div style={{ background: "var(--surface2)", padding: "12px", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", color: "var(--fg2)", marginBottom: "8px" }}>
                  Original:
                </div>
                <div style={{ fontSize: "13px", marginBottom: "12px", padding: "8px", background: "var(--surface)", borderRadius: "4px" }}>
                  {results.original}
                </div>
                <div style={{ fontSize: "13px", color: "var(--fg2)", marginBottom: "8px" }}>
                  Tradução:
                </div>
                <div style={{ fontSize: "13px", padding: "8px", background: "var(--surface)", borderRadius: "4px" }}>
                  {results.translated}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "expand" && (
          <div>
            <button
              className="btn primary"
              onClick={handleExpand}
              disabled={!textToAnalyze.trim() || loading}
              style={{ marginBottom: "12px" }}
            >
              {loading ? "Expandindo..." : "📈 Expandir Parágrafo"}
            </button>
            {results?.expanded && (
              <div style={{ background: "var(--surface2)", padding: "12px", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", color: "var(--fg2)", marginBottom: "8px" }}>
                  Original:
                </div>
                <div style={{ fontSize: "13px", marginBottom: "12px", padding: "8px", background: "var(--surface)", borderRadius: "4px" }}>
                  {results.original}
                </div>
                <div style={{ fontSize: "13px", color: "var(--fg2)", marginBottom: "8px" }}>
                  Expandido:
                </div>
                <div style={{ fontSize: "13px", padding: "8px", background: "var(--surface)", borderRadius: "4px" }}>
                  {results.expanded}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "chat" && (
          <div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "var(--fg2)", marginBottom: "4px" }}>
                Faça perguntas sobre o livro ou peça análises:
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChat();
                    }
                  }}
                  placeholder="Ex: Qual o sentimento do texto? Resuma este capítulo..."
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "13px",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    background: "var(--surface2)",
                    color: "var(--fg)",
                  }}
                />
                <button
                  className="btn primary"
                  onClick={handleChat}
                  disabled={!chatQuery.trim() || loading}
                >
                  {loading ? "..." : "Enviar"}
                </button>
              </div>
            </div>

            {chatHistory.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }}>
                {chatHistory.map((item, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "4px" }}>
                      Você: {item.question}
                    </div>
                    <div
                      style={{
                        background: "var(--surface2)",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                      }}
                    >
                      {item.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!textToAnalyze.trim() && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--fg2)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🤖</div>
            <div>Selecione um parágrafo ou capítulo para analisar</div>
          </div>
        )}
      </div>
    </div>
  );
}

