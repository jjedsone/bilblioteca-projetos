// src/utils/exportChapter.ts
import { jsPDF } from "jspdf";
import type { Chapter } from "../types";

export async function exportChapterToPDF(chapter: Chapter, bookTitle?: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const lineHeight = 18;

  // Título do livro (se fornecido)
  if (bookTitle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(bookTitle, margin, margin);
  }

  // Título do capítulo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  let y = margin + (bookTitle ? 24 : 0);
  doc.text(chapter.title || "Capítulo", margin, y);
  y += lineHeight * 1.5;

  // Conteúdo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const wrapped = doc.splitTextToSize(chapter.text || "", pageWidth - margin * 2);
  for (const line of wrapped) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  const filename = `${(chapter.title || "capitulo").replace(/[^\w\d-_]+/g, "_")}.pdf`;
  doc.save(filename);
}

export function exportChapterToMarkdown(chapter: Chapter, bookTitle?: string): void {
  let content = "";
  
  if (bookTitle) {
    content += `# ${bookTitle}\n\n`;
  }
  
  content += `## ${chapter.title}\n\n`;
  content += chapter.text;
  
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(chapter.title || "capitulo").replace(/[^\w\d-_]+/g, "_")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportChapterToHTML(chapter: Chapter, bookTitle?: string): void {
  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${chapter.title}</title>
  <style>
    body {
      font-family: Georgia, serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
      color: #333;
    }
    h1 { color: #2563eb; }
    h2 { color: #1e40af; margin-top: 40px; }
    p { text-align: justify; margin-bottom: 16px; }
  </style>
</head>
<body>
  ${bookTitle ? `<h1>${bookTitle}</h1>` : ""}
  <h2>${chapter.title}</h2>
  <div>${chapter.text.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(chapter.title || "capitulo").replace(/[^\w\d-_]+/g, "_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

