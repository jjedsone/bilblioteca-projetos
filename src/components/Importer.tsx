import { useCallback, useState } from 'react'
import { parseTxtToBook } from '../utils/parseTxt'
import { useProjects } from '../store/projects'

export default function Importer() {
  const { projects, selectedId, setBook } = useProjects()
  const proj = projects.find(p => p.id === selectedId)
  const [dragOver, setDragOver] = useState(false)
  const [info, setInfo] = useState<string>('')

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !proj) return
    const file = files[0]
    if (!file.name.toLowerCase().endsWith('.txt')) { alert('Por favor, selecione um arquivo .txt'); return }
    const text = await file.text()
    const book = parseTxtToBook(text, { defaultTitle: proj.name })
    book.originalFilename = file.name
    setBook(proj.id, book)
    setInfo(`Importado: ${file.name} | ${book.chapters.length} capítulos detectados.`)
  }, [proj, setBook])

  return (
    <div className="card">
      <h3>Importar .txt</h3>
      <div className="dropzone"
        onDragOver={(e)=>{e.preventDefault(); setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={(e)=>{ e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files) }}
        aria-label="Área para soltar arquivo" role="button" tabIndex={0}>
        {dragOver ? 'Solte o arquivo .txt aqui' : 'Arraste e solte o seu .txt aqui ou clique para selecionar'}
        <br/><input type="file" accept=".txt" onChange={(e)=>onFiles(e.target.files)} />
      </div>
      {info && <div style={{ marginTop:8, color:'#93c5fd' }}>{info}</div>}
      <p style={{ color:'#93a3b5' }}>
        Dica: cabeçalhos como "Capítulo 1", "Cap. 2", "Chapter 3" ou título isolado entre linhas em branco.
        Depois de importar: defina <strong>capa</strong>, edite <strong>metadados</strong>, reordene capítulos por <strong>arrastar e soltar</strong> e edite o texto dos parágrafos.
      </p>
    </div>
  )
}
