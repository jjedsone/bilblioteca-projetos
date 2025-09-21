// TODO: Replace the following Book definition with the correct import if Book is defined elsewhere
export interface Book {
  // Define the properties of Book here
  id: string
  title: string
  // Add other properties as needed
}

export interface Version {
  id: string
  createdAt: string
  note?: string
  book: Book
}

// TODO: Replace the following Project definition with the correct import if Project is defined elsewhere
interface Project {
  id: string
  book: Book
  // Add other properties as needed
}

export interface ProjectWithVersions extends Project {
  versions?: Version[]
}
import { useProjects } from '../store/projects'

// Define the type for the useProjects return value
interface UseProjectsResult {
  projects: ProjectWithVersions[];
  selectedId: string;
  restoreVersion: (projectId: string, versionId: string) => void;
}

export default function VersionHistory() {
  const { projects, selectedId, restoreVersion } = useProjects() as UseProjectsResult
  const proj = projects.find((p: ProjectWithVersions) => p.id === selectedId)
  if (!proj?.book) return null
  const versions = proj.versions ?? []

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Histórico de versões</h3>
      {versions.length === 0 && <div style={{ color:'#93a3b5' }}>Nenhuma versão salva ainda. Use "Salvar versão" na barra superior.</div>}
      {versions.map((v: Version) => (
        <div key={v.id} style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'6px 0', borderBottom:'1px dashed #1f2937' }}>
          <div>
            <div><strong>{new Date(v.createdAt).toLocaleString()}</strong></div>
            {v.note && <div style={{ color:'#93a3b5' }}>{v.note}</div>}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" onClick={()=>restoreVersion(proj.id, v.id)}>Restaurar</button>
          </div>
        </div>
      ))}
    </div>
  )
}
