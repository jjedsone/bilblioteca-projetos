// src/utils/exportMarkdown.ts
import type { Book } from "../types";

export function exportBookToMarkdown(book: Book): void {
  let markdown = `# ${book.title}\n\n`;

  if (book.author) {
    markdown += `**Autor:** ${book.author}\n\n`;
  }

  if (book.subject) {
    markdown += `**Assunto:** ${book.subject}\n\n`;
  }

  if (book.keywords && book.keywords.length > 0) {
    markdown += `**Palavras-chave:** ${book.keywords.join(", ")}\n\n`;
  }

  markdown += "---\n\n";

  // Capítulos
  book.chapters.forEach((chapter, index) => {
    markdown += `## ${index + 1}. ${chapter.title}\n\n`;
    
    // Dividir em parágrafos
    const paragraphs = chapter.text.split(/\n{2,}/).filter(Boolean);
    paragraphs.forEach((para) => {
      markdown += `${para.trim()}\n\n`;
    });
  });

  // Criar blob e download
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(book.title || "livro").replace(/[^\w\d-_]+/g, "_")}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

