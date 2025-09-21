/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/App.tsx
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Importer from "./components/Importer";
import BookView from "./components/BookView";
import CoverManager from "./components/CoverManager";
import MetadataManager from "./components/MetadataManager";
import ChatPanel from "./components/ChatPanel";
import { useProjects } from "./store/projects";
import "./styles/global.css";

type Route = "editor" | "biblioteca";
const Library = lazy(() => import("./pages/Library")); // ✅ em vez de require

function getRoute(): Route {
  return location.hash.startsWith("#/biblioteca") ? "biblioteca" : "editor";
}
function getPidFromHash(): string | null {
  const m = location.hash.match(/pid=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function App() {
  const store = useProjects?.();
  const projects = store?.projects ?? [];
  const selectedId = store?.selectedId ?? null;
  const setSelectedId = (store as any)?.setSelectedId as
    | ((id: string | null) => void)
    | undefined;

  const [route, setRoute] = useState<Route>(() => getRoute());

  useEffect(() => {
    const onHash = () => {
      setRoute(getRoute());
      const pid = getPidFromHash();
      if (pid && setSelectedId) setSelectedId(pid);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [setSelectedId]);

  const proj = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId]
  );

  if (route === "biblioteca") {
    return (
      <div className="layout">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div style={{ padding: 12 }}>
            <Suspense fallback={<div className="card">Carregando…</div>}>
              <Library />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }

  // Editor
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

              <div className="card" style={{ marginTop: 16 }}>
                <h3>Assistente (IA)</h3>
                <p>Converse com a IA sobre o conteúdo ou peça ajuda técnica.</p>
                <ChatPanel />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
