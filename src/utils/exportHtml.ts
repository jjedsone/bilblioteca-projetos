// src/utils/exportHtml.ts
import type { Book } from "../types";

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function exportBookToHTML(book: Book): void {
  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(book.title || "Livro")}</title>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
      color: #333;
      background: #fefefe;
    }
    h1 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 10px;
    }
    .metadata {
      text-align: center;
      color: #666;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }
    h2 {
      color: #34495e;
      margin-top: 40px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    p {
      text-align: justify;
      margin-bottom: 20px;
      text-indent: 2em;
    }
    .cover {
      text-align: center;
      margin: 40px 0;
    }
    .cover img {
      max-width: 300px;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(book.title || "Sem título")}</h1>
  
  <div class="metadata">
    ${book.author ? `<p><strong>Autor:</strong> ${escapeHtml(book.author)}</p>` : ""}
    ${book.subject ? `<p><strong>Assunto:</strong> ${escapeHtml(book.subject)}</p>` : ""}
    ${book.keywords && book.keywords.length > 0 ? `<p><strong>Palavras-chave:</strong> ${escapeHtml(book.keywords.join(", "))}</p>` : ""}
  </div>
`;

  // Capa
  if (book.coverDataUrl) {
    html += `  <div class="cover">
    <img src="${book.coverDataUrl}" alt="Capa do livro" />
  </div>
`;
  }

  // Capítulos
  book.chapters.forEach((chapter, index) => {
    html += `  <h2>${index + 1}. ${escapeHtml(chapter.title)}</h2>\n`;
    
    const paragraphs = chapter.text.split(/\n{2,}/).filter(Boolean);
    paragraphs.forEach((para) => {
      html += `  <p>${escapeHtml(para.trim())}</p>\n`;
    });
  });

  html += `</body>
</html>`;

  // Criar blob e download
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(book.title || "livro").replace(/[^\w\d-_]+/g, "_")}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

