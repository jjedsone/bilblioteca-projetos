import { useState } from 'react'
import { useProjects } from '../store/projects'
import type { Book } from '../types'

export default function CoverManager() {
  const { projects, selectedId, setBook } = useProjects()
  const proj = projects.find(p => p.id === selectedId) as Book | undefined
  const [msg, setMsg] = useState('')

  if (!proj?.coverDataUrl) return null
  const book = proj

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
      setBook(proj.id, updated); setMsg(`Capa definida (${file.name})`)
    }
    reader.readAsDataURL(file)
  }
  const removeCover = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { coverDataUrl, ...rest } = book; // coverDataUrl is omitted from updated book
    const updated: Book = { ...rest };
    setBook(proj.id, updated);
    setMsg('Capa removida');
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Capa do Livro</h3>
      <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
          }}
        />
        <button className="btn" onClick={removeCover}>Remover capa</button>
        {msg && <span style={{ color:'#93c5fd' }}>{msg}</span>}
      </div>
      {book.coverDataUrl && (
        <div style={{ marginTop: 12 }}>
          <img src={book.coverDataUrl} alt="Capa" style={{ maxWidth: 240, borderRadius: 8, border: '1px solid #1f2937' }} />
        </div>
      )}
    </div>
  )
}
