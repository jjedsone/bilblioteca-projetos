// src/utils/aiHelpers.ts
// Utilitários para funcionalidades de IA
// Nota: Estas são implementações básicas. Para produção, integre com APIs como OpenAI, Claude, etc.

export interface WritingSuggestion {
  type: "grammar" | "style" | "clarity" | "structure";
  text: string;
  suggestion: string;
  reason: string;
}

export interface SentimentAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  emotions: Record<string, number>;
}

export interface TextAnalysis {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  readabilityScore: number;
  complexity: "simple" | "moderate" | "complex";
}

/**
 * Análise básica de sentimento usando palavras-chave
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  const positiveWords = [
    "bom", "ótimo", "excelente", "maravilhoso", "perfeito", "feliz", "alegre",
    "sucesso", "vitória", "amor", "esperança", "confiança", "satisfação"
  ];
  const negativeWords = [
    "ruim", "terrível", "horrível", "triste", "raiva", "medo", "fracasso",
    "derrota", "ódio", "desespero", "desconfiança", "insatisfação"
  ];

  const textLower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    positiveCount += (textLower.match(regex) || []).length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    negativeCount += (textLower.match(regex) || []).length;
  });

  const total = positiveCount + negativeCount;
  const score = total > 0 ? (positiveCount - negativeCount) / total : 0;

  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  if (score > 0.2) sentiment = "positive";
  else if (score < -0.2) sentiment = "negative";

  return {
    sentiment,
    score,
    emotions: {
      positive: positiveCount,
      negative: negativeCount,
      neutral: Math.max(0, text.split(/\s+/).length - positiveCount - negativeCount)
    }
  };
}

/**
 * Análise de texto básica
 */
export function analyzeText(text: string): TextAnalysis {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);

  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  
  // Score de legibilidade simplificado (Flesch Reading Ease adaptado)
  const avgSentenceLength = avgWordsPerSentence;
  const avgSyllablesPerWord = estimateSyllables(words);
  const readability = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  let complexity: "simple" | "moderate" | "complex" = "moderate";
  if (readability > 70) complexity = "simple";
  else if (readability < 30) complexity = "complex";

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgWordsPerSentence,
    readabilityScore: Math.max(0, Math.min(100, readability)),
    complexity
  };
}

/**
 * Estima sílabas em português (aproximação)
 */
function estimateSyllables(words: string[]): number {
  let totalSyllables = 0;
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-záàâãéêíóôõúç]/g, "");
    if (cleanWord.length <= 2) {
      totalSyllables += 1;
    } else {
      // Aproximação: contar vogais e ditongos
      const vowels = cleanWord.match(/[aeiouáàâãéêíóôõúç]/gi)?.length || 1;
      totalSyllables += Math.max(1, vowels);
    }
  });
  return words.length > 0 ? totalSyllables / words.length : 1;
}

/**
 * Gera resumo básico (primeiras e últimas frases)
 */
export function generateSummary(text: string, maxLength: number = 200): string {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  if (sentences.length <= 2) {
    return text.substring(0, maxLength) + (text.length > maxLength ? "..." : "");
  }

  const firstSentence = sentences[0];
  const lastSentence = sentences[sentences.length - 1];
  const summary = firstSentence + ". " + lastSentence;

  return summary.length > maxLength
    ? summary.substring(0, maxLength) + "..."
    : summary;
}

/**
 * Sugere título baseado no conteúdo
 */
export function suggestTitle(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const firstSentence = sentences[0] || "";
  
  // Extrair palavras-chave (palavras mais frequentes, excluindo stop words)
  const stopWords = new Set([
    "o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das",
    "em", "no", "na", "nos", "nas", "para", "com", "por", "que", "e", "ou"
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const topWords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);

  const suggestions: string[] = [];

  // Sugestão 1: Primeira frase (limitada)
  if (firstSentence.length > 0 && firstSentence.length < 60) {
    suggestions.push(firstSentence.substring(0, 60));
  }

  // Sugestão 2: Palavras-chave
  if (topWords.length > 0) {
    suggestions.push(topWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
  }

  // Sugestão 3: Primeiras palavras da primeira frase
  const firstWords = firstSentence.split(/\s+/).slice(0, 5).join(" ");
  if (firstWords.length < 50) {
    suggestions.push(firstWords);
  }

  return suggestions.filter((s, i, arr) => arr.indexOf(s) === i).slice(0, 3);
}

/**
 * Sugestões básicas de escrita
 */
export function getWritingSuggestions(text: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = [];

  // Verificar frases muito longas
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  sentences.forEach((sentence) => {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (words.length > 30) {
      suggestions.push({
        type: "clarity",
        text: sentence.substring(0, 50) + "...",
        suggestion: "Considere dividir esta frase longa em duas ou mais frases menores.",
        reason: `Frase com ${words.length} palavras pode ser difícil de ler.`
      });
    }
  });

  // Verificar repetição de palavras
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  Object.entries(wordFreq).forEach(([word, count]) => {
    if (count > 5 && word.length > 4) {
      suggestions.push({
        type: "style",
        text: `Palavra "${word}" repetida ${count} vezes`,
        suggestion: `Considere usar sinônimos para "${word}" para variar o texto.`,
        reason: "Repetição excessiva pode tornar o texto monótono."
      });
    }
  });

  return suggestions.slice(0, 5);
}

/**
 * Tradução básica (placeholder - requer API real)
 */
export async function translateText(
  text: string,
  targetLang: string,
  _sourceLang: string = "pt"
): Promise<string> {
  // Placeholder - em produção, usar API de tradução (Google Translate, DeepL, etc.)
  // Por enquanto, retorna o texto original com uma nota
  return `[Tradução para ${targetLang}]: ${text}\n\nNota: Integre com uma API de tradução para funcionalidade completa.`;
}

/**
 * Expande parágrafo (placeholder - requer IA real)
 */
export async function expandParagraph(text: string): Promise<string> {
  // Placeholder - em produção, usar API de IA (OpenAI, Claude, etc.)
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  if (sentences.length === 0) return text;

  // Simulação básica: adiciona explicações genéricas
  const expanded = text + "\n\n" +
    "Este parágrafo pode ser expandido com mais detalhes, exemplos e explicações. " +
    "Em uma implementação completa com IA, o texto seria analisado e expandido " +
    "com informações relevantes e contextualizadas.";

  return expanded;
}

