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
import BookStats from "./components/BookStats";
import TagsManager from "./components/TagsManager";
import KeyboardShortcutsHelp from "./components/KeyboardShortcutsHelp";
import AIAssistant from "./components/AIAssistant";
import { useProjects } from "./store/projects";
import { useGlobalShortcuts } from "./hooks/useKeyboardShortcuts";

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
  
  // Atalhos globais
  useGlobalShortcuts();

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
      <>
        <KeyboardShortcutsHelp />
        <div className="layout">
          <Sidebar />
          <div className="main">
            <Topbar />
            <div style={{ padding: 12, overflowY: "auto", height: "100%" }}>
              <Suspense fallback={<div className="card">Carregando…</div>}>
                <Library />
              </Suspense>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Editor
  return (
    <>
      <KeyboardShortcutsHelp />
      <div className="layout">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div style={{ padding: 12, overflowY: "auto", height: "100%" }}>
          {!proj && (
            <div className="card">
              <h3>Bem-vindo</h3>
              <p>Crie um projeto, importe um .txt, edite capítulos, adicione capa e exporte PDF/EPUB/DOCX.</p>
            </div>
          )}

          {proj && !proj.book && <Importer />}

          {proj?.book && (
            <>
              <div style={{ display: "grid", gap: 12 }}>
                <BookStats book={proj.book} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <MetadataManager />
                  <CoverManager />
                </div>
                <TagsManager />
              </div>
              <BookView book={proj.book} />

              <AIAssistant
                book={proj.book}
                currentChapter={proj.book.chapters.find((_, i) => i === 0)}
              />
            </>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
