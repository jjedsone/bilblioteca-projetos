import React, { useRef } from 'react'
import type { Book } from '../types';
import { useProjects } from '../store/projects'

type Props = { book: Book; current: number; onSelect: (index: number) => void }

export default function ChapterList({ book, current, onSelect }: Props) {
  const { projects, selectedId, setBook } = useProjects()
  const proj = projects.find(p => p.id === selectedId)
  const dragIndex = useRef<number | null>(null)

  const commitReorder = (from: number, to: number) => {
    if (!proj || from === null || to === null || from === to) return
    const chapters = [...book.chapters]
    const [moved] = chapters.splice(from, 1)
    chapters.splice(to, 0, moved)
    setBook(proj.id, { ...book, chapters })
  }
  const onDragStart = (i: number) => (e: React.DragEvent) => { dragIndex.current = i; e.dataTransfer.effectAllowed = 'move' }
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const onDrop = (i: number) => (e: React.DragEvent) => { e.preventDefault(); const from = dragIndex.current; commitReorder(from!, i); dragIndex.current = null }

  const moveUp = (i: number) => { if (!proj || i<=0) return; const c=[...book.chapters]; const [m]=c.splice(i,1); c.splice(i-1,0,m); setBook(proj.id, { ...book, chapters: c }) }
  const moveDown = (i: number) => { if (!proj || i>=book.chapters.length-1) return; const c=[...book.chapters]; const [m]=c.splice(i,1); c.splice(i+1,0,m); setBook(proj.id, { ...book, chapters: c }) }

  return (
    <div className="card toc">
      <h3>Sumário</h3>
      {book.chapters.map((ch, i) => (
        <div key={ch.id} className={`chapter-link ${i===current?'active':''}`}
          draggable onDragStart={onDragStart(i)} onDragOver={onDragOver} onDrop={onDrop(i)}
          onClick={()=>onSelect(i)}
          style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:8 }}
          title="Arraste para reordenar, clique para abrir">
          <span>{i+1}. {ch.title}</span>
          <span style={{ display:'flex', gap:4 }}>
            <button className="btn" onClick={(e)=>{e.stopPropagation(); moveUp(i)}} aria-label="Mover para cima">▲</button>
            <button className="btn" onClick={(e)=>{e.stopPropagation(); moveDown(i)}} aria-label="Mover para baixo">▼</button>
          </span>
        </div>
      ))}
    </div>
  )
}
