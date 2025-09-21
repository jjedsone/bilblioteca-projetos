// src/utils/parseTxt.ts
import { type Book, type Chapter, makeId } from "../types";

function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v]/g, " ")
    .replace(/\u00A0/g, " ");
}

const chapterHeaderRegex = new RegExp(
  String.raw`^\s*(?:cap[ií]tulo|cap\.|chapter)\s+(\d+|[ivxlcdm]+)\b.*$`,
  "i"
);

function isLikelyHeader(line: string): boolean {
  const cleaned = line.trim();
  if (!cleaned) return false;
  if (cleaned.length > 90) return false;

  const isAllCaps =
    cleaned === cleaned.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ]/.test(cleaned);

  const looksLikeTitleCase =
    /^[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ][^.!?]{0,90}$/.test(cleaned) && !/[.!?]$/.test(cleaned);

  return isAllCaps || looksLikeTitleCase || chapterHeaderRegex.test(cleaned);
}

export function parseTxtToBook(
  raw: string,
  opts?: { defaultTitle?: string }
): Book {
  const text = normalize(raw).trim();
  const lines = text.split("\n");

  const breaks: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (chapterHeaderRegex.test(line)) {
      breaks.push(i);
      continue;
    }

    if (i > 0 && i < lines.length - 1) {
      const prevBlank = lines[i - 1].trim() === "";
      const nextBlank = lines[i + 1].trim() === "";
      if (prevBlank && nextBlank && isLikelyHeader(line)) breaks.push(i);
    }
  }

  const chapters: Chapter[] = [];

  // Usa text:string (um bloco concatenado com linha em branco entre parágrafos)
  const commit = (title: string, chunk: string[]) => {
    const textBlock = chunk
      .join("\n")
      .split(/\n{2,}/) // detecta parágrafos
      .map((p) => p.trim())
      .filter(Boolean)
      .join("\n\n");

    chapters.push({
      id: makeId("ch"),
      title: title || "Sem título",
      text: textBlock,
      paragraphs: []
    });
  };

  if (breaks.length > 0) {
    for (let b = 0; b < breaks.length; b++) {
      const start = breaks[b];
      const end = b < breaks.length - 1 ? breaks[b + 1] : lines.length;
      const header = lines[start].trim();
      const body = lines.slice(start + 1, end);
      commit(header, body);
    }
  } else {
    const words = text.split(/\s+/).filter(Boolean);
    const CHUNK = 1800;
    let cursor = 0;
    let index = 1;
    while (cursor < words.length) {
      const slice = words.slice(cursor, cursor + CHUNK).join(" ");
      commit(`Capítulo ${index}`, [slice]);
      index++;
      cursor += CHUNK;
    }
  }

  const titleCandidate = lines.find((l) => isLikelyHeader(l));
  const title = (opts?.defaultTitle || titleCandidate || "Meu Livro").trim();

  return {
    id: makeId("book"),
    title,
    chapters,
  };
}
