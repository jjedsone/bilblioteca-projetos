export interface GrammarSuggestion {
  id: string;
  message: string;
}

const LETTER_REGEX = /[a-záàâãäåçéèêëíìîïñóòôõöúùûüýÿ]/i;

export function getGrammarSuggestions(text: string): GrammarSuggestion[] {
  const suggestions: GrammarSuggestion[] = [];
  const messages = new Set<string>();
  const trimmed = text.trim();

  if (!trimmed) {
    return suggestions;
  }

  const pushSuggestion = (id: string, message: string) => {
    if (messages.has(message)) return;
    messages.add(message);
    suggestions.push({ id, message });
  };

  if (/\s{2,}/.test(text)) {
    pushSuggestion("double-space", "Evite espaços duplos consecutivos.");
  }

  if (/\s+[,.!?;:]/.test(text)) {
    pushSuggestion("space-before-punctuation", "Remova espaços antes da pontuação.");
  }

  if (/(!!|\?\?)/.test(text)) {
    pushSuggestion("repeated-punctuation", "Evite repetir sinais de pontuação como '!!' ou '??'.");
  }

  if (!/[.!?…]$/.test(trimmed)) {
    pushSuggestion("ending-punctuation", "Considere finalizar o parágrafo com pontuação (. ! ?).");
  }

  const sentenceRegex = /[^.!?…]+[.!?…]?/g;
  const sentences = trimmed.match(sentenceRegex) ?? [trimmed];
  sentences.forEach((sentence, index) => {
    const first = sentence.trimStart().charAt(0);
    if (first && LETTER_REGEX.test(first) && first === first.toLowerCase()) {
      const preview = sentence.trim().slice(0, 30);
      pushSuggestion(`sentence-case-${index}`, `Inicie a frase com letra maiúscula: "${preview}..."`);
    }
  });

  return suggestions;
}

