import { useState } from 'react'
import { useProjects } from '../store/projects'
import type { Book } from '../types'

export default function CoverManager() {
  const { projects, selectedId, setBook } = useProjects()
  const proj = projects.find(p => p.id === selectedId)
  const [msg, setMsg] = useState('')

  if (!proj) return null
  const book = proj.book
  if (!book) return null

  const onPick = async (file: File) => {
    if (!file) return
    if (!/^image\//.test(file.type)) { alert('Escolha uma imagem (png/jpg/webp).'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const updated: Book = { 
        ...book, 
        coverDataUrl: String(reader.result),
        title: book.title,
        chapters: book.chapters
      }
      setBook(proj.id, updated); 
      setMsg(`Capa definida (${file.name})`);
      setTimeout(() => setMsg(''), 3000);
    }
    reader.readAsDataURL(file)
  }
  
  const removeCover = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { coverDataUrl, ...rest } = book;
    const updated: Book = { ...rest };
    setBook(proj.id, updated);
    setMsg('Capa removida');
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="card">
      <h3>🖼️ Capa do Livro</h3>
      <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom: 12 }}>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
            }}
            style={{ display: 'none' }}
          />
          <span className="btn">📁 Escolher imagem</span>
        </label>
        {book.coverDataUrl && (
          <button className="btn danger" onClick={removeCover}>🗑️ Remover capa</button>
        )}
        {msg && <span style={{ color:'var(--success)', fontSize: '13px' }}>✓ {msg}</span>}
      </div>
      {book.coverDataUrl && (
        <div style={{ marginTop: 12 }}>
          <img 
            src={book.coverDataUrl} 
            alt="Capa do livro" 
            style={{ 
              maxWidth: 240, 
              maxHeight: 320,
              borderRadius: 8, 
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              objectFit: 'contain'
            }} 
          />
        </div>
      )}
    </div>
  )
}
