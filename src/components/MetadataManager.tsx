// src/components/MetadataManager.tsx
import { useState } from 'react';
import { useProjects } from '../store/projects';
import type { Book } from '../types';

export default function MetadataManager() {
  const { projects, selectedId, setBook } = useProjects(); // <-- aqui
  const proj = projects.find(p => p.id === selectedId);
  const [info, setInfo] = useState('');

  const book = proj?.book;
  const [author, setAuthor] = useState(book?.author ?? '');
  const [subject, setSubject] = useState(book?.subject ?? '');
  const [keywords, setKeywords] = useState((book?.keywords ?? []).join(', '));

  if (!book) return null;

  const save = () => {
    const updated: Book = {
      ...book,
      author: author.trim() || undefined,
      subject: subject.trim() || undefined,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    };
    setBook(proj!.id, updated);
    setInfo('Metadados salvos.');
    setTimeout(() => setInfo(''), 1500);
  };

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Metadados</h3>
      <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
        <label>Autor<input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Nome do autor" /></label>
        <label>Assunto<input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Tema/assunto do livro" /></label>
        <label>Palavras-chave (separe por vírgula)<input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="ex.: ficção, aventura, IA" /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn primary" onClick={save}>Salvar metadados</button>
          {info && <span style={{ color: '#93c5fd' }}>{info}</span>}
        </div>
      </div>
    </div>
  );
}
