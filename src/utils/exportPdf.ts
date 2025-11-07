// src/utils/exportPdf.ts
import { jsPDF } from "jspdf";
import type { Book } from "../types";

export async function exportBookToPDF(book: Book) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const kws = (book.keywords ?? []).join(", ");
  // Propriedades do documento
  doc.setProperties({
    title: book.title,
    subject: book.subject ?? undefined,
    author: book.author ?? undefined,
    keywords: kws || undefined,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const lineHeight = 18;

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(book.title || "Sem título", margin, margin);

  // Conteúdo (simplificado)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  let y = margin + 24;
  for (const ch of book.chapters) {
    // quebra de página se necessário
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.text(ch.title || "Capítulo", margin, y);
    y += lineHeight;

    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(ch.text || "", pageWidth - margin * 2);
    for (const line of wrapped) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += lineHeight; // espaço entre capítulos
  }

  doc.save(`${(book.title || "livro").replace(/[^\w\d-_]+/g, "_")}.pdf`);
}
