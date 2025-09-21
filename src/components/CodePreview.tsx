// src/App.tsx
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Importer from './Importer'
import BookView from './BookView'
import CoverManager from './CoverManager'
import MetadataManager from './MetadataManager'
import { useProjects } from '../store/projects'


export default function App() {
  const store = useProjects?.();
  const projects = store?.projects ?? [];
  const selectedId = store?.selectedId ?? null;
  const proj = projects.find(p => p.id === selectedId);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div style={{ padding: 12 }}>
          {!proj && (
            <div className="card">
              <h3>Bem-vindo</h3>
              <p>Crie um projeto, importe um .txt, edite capítulos, adicione capa e exporte PDF/EPUB/DOCX.</p>
            </div>
          )}

          {proj && !proj.book && <Importer />}

          {proj?.book && (
            <>
              <MetadataManager />
              <CoverManager />
              <BookView book={proj.book} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
