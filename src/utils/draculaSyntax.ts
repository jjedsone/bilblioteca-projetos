// src/utils/draculaSyntax.ts
// Função para aplicar colorização de sintaxe estilo Dracula ao texto

export interface DraculaColors {
  keyword: string;      // Palavras-chave (purple)
  string: string;       // Strings (yellow)
  number: string;       // Números (green)
  function: string;      // Funções (cyan)
  comment: string;      // Comentários (gray)
  operator: string;     // Operadores (pink)
  variable: string;     // Variáveis (white)
  property: string;      // Propriedades (cyan)
  default: string;       // Texto padrão (white)
}

export const draculaColors: DraculaColors = {
  keyword: "#bd93f9",      // Purple - palavras-chave
  string: "#f1fa8c",       // Yellow - strings
  number: "#50fa7b",       // Green - números
  function: "#8be9fd",     // Cyan - funções
  comment: "#6272a4",      // Gray - comentários
  operator: "#ff79c6",     // Pink - operadores
  variable: "#f8f8f2",     // White - variáveis
  property: "#8be9fd",     // Cyan - propriedades
  default: "#f8f8f2",      // White - texto padrão
};

// Palavras-chave comuns de programação
const keywords = new Set([
  // JavaScript/TypeScript
  "function", "const", "let", "var", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "return", "try", "catch", "finally", "throw", "new", "this", "super", "extends", "class", "interface", "type", "enum", "namespace", "import", "export", "from", "as", "default", "async", "await", "promise", "then", "catch", "finally",
  // HTML/CSS
  "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "img", "button", "input", "form", "select", "option", "ul", "ol", "li", "table", "tr", "td", "th", "style", "script", "link", "meta", "title", "head", "body", "html",
  // CSS
  "color", "background", "margin", "padding", "border", "width", "height", "display", "flex", "grid", "position", "top", "left", "right", "bottom", "z-index", "opacity", "transform", "transition", "animation", "media", "query",
  // React
  "react", "component", "props", "state", "useState", "useEffect", "useCallback", "useMemo", "useRef", "useContext", "createContext", "provider", "router", "route", "link", "nav", "header", "footer", "main", "section", "article",
  // Outros
  "true", "false", "null", "undefined", "NaN", "Infinity", "console", "log", "error", "warn", "info", "debug", "document", "window", "localStorage", "sessionStorage", "fetch", "axios", "http", "https", "api", "url", "json", "xml", "html", "css", "js", "ts", "tsx", "jsx",
]);

// Função para detectar strings (entre aspas)
function detectStrings(text: string): Array<{ start: number; end: number; type: "string" }> {
  const strings: Array<{ start: number; end: number; type: "string" }> = [];
  const patterns = [
    /"([^"\\]|\\.)*"/g,  // Strings duplas
    /'([^'\\]|\\.)*'/g,  // Strings simples
    /`([^`\\]|\\.)*`/g,  // Template strings
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      strings.push({ start: match.index, end: match.index + match[0].length, type: "string" });
    }
  });

  return strings;
}

// Função para detectar comentários
function detectComments(text: string): Array<{ start: number; end: number; type: "comment" }> {
  const comments: Array<{ start: number; end: number; type: "comment" }> = [];
  const patterns = [
    /\/\/.*$/gm,           // Comentários de linha
    /\/\*[\s\S]*?\*\//g,    // Comentários de bloco
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      comments.push({ start: match.index, end: match.index + match[0].length, type: "comment" });
    }
  });

  return comments;
}

// Função para detectar números
function detectNumbers(text: string): Array<{ start: number; end: number; type: "number" }> {
  const numbers: Array<{ start: number; end: number; type: "number" }> = [];
  const pattern = /\b\d+\.?\d*\b/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    numbers.push({ start: match.index, end: match.index + match[0].length, type: "number" });
  }

  return numbers;
}

// Função para detectar palavras-chave
function detectKeywords(text: string): Array<{ start: number; end: number; type: "keyword" }> {
  const keywordsFound: Array<{ start: number; end: number; type: "keyword" }> = [];
  const pattern = /\b\w+\b/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const word = match[0];
    if (keywords.has(word.toLowerCase())) {
      keywordsFound.push({ start: match.index, end: match.index + match[0].length, type: "keyword" });
    }
  }

  return keywordsFound;
}

// Função para detectar funções (padrão: palavra seguida de parênteses)
function detectFunctions(text: string): Array<{ start: number; end: number; type: "function" }> {
  const functions: Array<{ start: number; end: number; type: "function" }> = [];
  const pattern = /\b\w+\s*\(/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const funcName = match[0].replace(/\s*\(/, "");
    // Não marcar como função se for uma palavra-chave
    if (!keywords.has(funcName.toLowerCase()) && funcName.length > 0) {
      functions.push({ start: match.index, end: match.index + funcName.length, type: "function" });
    }
  }

  return functions;
}

// Função para detectar operadores
function detectOperators(text: string): Array<{ start: number; end: number; type: "operator" }> {
  const operators: Array<{ start: number; end: number; type: "operator" }> = [];
  // Operadores comuns: +, -, *, /, =, ==, ===, !=, !==, <, >, <=, >=, &&, ||, !, ?, :, ., ,, ;, [, ], {, }, (, )
  const pattern = /[+\-*/%=<>!&|?:;.,()[\]{}]/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Verificar se não está dentro de uma string ou comentário
    const char = match[0];
    // Operadores especiais que devem ser destacados
    if (['+', '-', '*', '/', '=', '!', '<', '>', '&', '|', '?', ':', '.', ',', ';'].includes(char)) {
      operators.push({ start: match.index, end: match.index + 1, type: "operator" });
    }
  }

  return operators;
}

// Função principal para aplicar colorização
export function applyDraculaSyntax(text: string): Array<{ text: string; color: string }> {
  if (!text) return [{ text: "", color: draculaColors.default }];

  const segments: Array<{ start: number; end: number; type: string; priority: number }> = [];

  // Detectar diferentes tipos (com prioridades)
  const strings = detectStrings(text);
  const comments = detectComments(text);
  const numbers = detectNumbers(text);
  const keywordsFound = detectKeywords(text);
  const functions = detectFunctions(text);
  const operators = detectOperators(text);

  // Adicionar com prioridades (comentários e strings têm prioridade mais alta)
  comments.forEach(c => segments.push({ ...c, priority: 6 }));
  strings.forEach(s => segments.push({ ...s, priority: 5 }));
  numbers.forEach(n => segments.push({ ...n, priority: 4 }));
  keywordsFound.forEach(k => segments.push({ ...k, priority: 3 }));
  functions.forEach(f => segments.push({ ...f, priority: 2 }));
  operators.forEach(o => segments.push({ ...o, priority: 1 }));

  // Ordenar por posição
  segments.sort((a, b) => a.start - b.start);

  // Remover sobreposições (manter apenas o de maior prioridade)
  const filtered: typeof segments = [];
  for (const seg of segments) {
    let overlaps = false;
    for (let i = 0; i < filtered.length; i++) {
      const existing = filtered[i];
      if (
        (seg.start >= existing.start && seg.start < existing.end) ||
        (seg.end > existing.start && seg.end <= existing.end) ||
        (seg.start <= existing.start && seg.end >= existing.end)
      ) {
        if (seg.priority > existing.priority) {
          filtered[i] = seg;
        }
        overlaps = true;
        break;
      }
    }
    if (!overlaps) {
      filtered.push(seg);
    }
  }

  // Criar array de segmentos coloridos
  const result: Array<{ text: string; color: string }> = [];
  let lastIndex = 0;

  filtered.forEach(seg => {
    // Adicionar texto antes do segmento
    if (seg.start > lastIndex) {
      const beforeText = text.substring(lastIndex, seg.start);
      if (beforeText) {
        result.push({ text: beforeText, color: draculaColors.default });
      }
    }

    // Adicionar o segmento colorido
    const segmentText = text.substring(seg.start, seg.end);
    const color = draculaColors[seg.type as keyof DraculaColors] || draculaColors.default;
    result.push({ text: segmentText, color });

    lastIndex = seg.end;
  });

  // Adicionar texto restante
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      result.push({ text: remainingText, color: draculaColors.default });
    }
  }

  // Se não houver segmentos, retornar texto completo
  if (result.length === 0) {
    return [{ text, color: draculaColors.default }];
  }

  return result;
}

// Função para converter texto em HTML com spans coloridos
export function renderDraculaSyntaxHTML(text: string): string {
  const segments = applyDraculaSyntax(text);
  return segments.map(seg => {
    const escaped = seg.text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    return `<span style="color: ${seg.color}">${escaped}</span>`;
  }).join("");
}

