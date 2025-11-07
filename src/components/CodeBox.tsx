/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/CodeBox.tsx

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

// Linguagens leves do Prism
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";

// Registrar com múltiplos aliases
SyntaxHighlighter.registerLanguage("markup", markup);
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);

// mapeia nomes “humanos” para os que o Prism espera
const normalizeLang = (l?: string) => {
  const s = (l || "").toLowerCase();
  if (s === "html") return "markup";
  if (s === "js") return "javascript";
  if (s === "ts") return "typescript";
  return s || "markup";
};

interface CodeBoxProps {
  title?: string;
  code: unknown;          // pode vir qualquer coisa — vamos blindar
  language?: string;
}

export default function CodeBox({ title = "", code, language = "markup" }: CodeBoxProps) {
  // Se vier um ReactElement/objeto, converto pra string segura
  let codeString: string;
  if (typeof code === "string") {
    codeString = code;
  } else if (code == null) {
    codeString = "";
  } else if (typeof code === "object") {
    // evita passar ReactElement como child
    try {
      codeString = JSON.stringify(code, null, 2);
    } catch {
      codeString = String(code);
    }
  } else {
    codeString = String(code);
  }

  const lang = normalizeLang(language);

  return (
    <div className="codebox">
      {title ? (
        <div className="codebox__title">
          <span className="window-dots"><i></i><i></i><i></i></span>
          {title}
        </div>
      ) : null}

      {/* fallback visual se, por algum motivo, ainda não for string */}
      {typeof codeString !== "string" ? (
        <pre style={{ background: "var(--code-bg,#282a36)", padding: 12, borderRadius: 10 }}>
          {String(codeString)}
        </pre>
      ) : (
        <SyntaxHighlighter
          language={lang}
          style={dracula as any}
          wrapLongLines
          showLineNumbers
          lineNumberStyle={{ opacity: 0.6 }}
          customStyle={{
            background: "var(--code-bg, #282a36)",
            fontSize: 14,
            lineHeight: 1.55,
            borderRadius: 10,
            margin: 0,
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      )}
    </div>
  );
}