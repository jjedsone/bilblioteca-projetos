import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useTheme } from "./store/theme";
import "./styles/global.css";

// Inicializa o tema
const { theme } = useTheme.getState();
if (typeof document !== "undefined") {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  root.style.setProperty("--bg", theme.colors.bg);
  root.style.setProperty("--surface", theme.colors.surface);
  root.style.setProperty("--surface2", theme.colors.surface2);
  root.style.setProperty("--border", theme.colors.border);
  root.style.setProperty("--fg", theme.colors.fg);
  root.style.setProperty("--fg2", theme.colors.fg2);
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--primary-hover", theme.colors.primaryHover);
  root.style.setProperty("--secondary", theme.colors.secondary);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--success", theme.colors.success);
  root.style.setProperty("--warning", theme.colors.warning);
  root.style.setProperty("--error", theme.colors.error);
  root.style.setProperty("--code", theme.colors.code);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
