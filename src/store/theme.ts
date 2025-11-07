// src/store/theme.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeName = "dracula" | "dark" | "light" | "github-dark" | "monokai";

export interface Theme {
  name: ThemeName;
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    fg: string;
    fg2: string;
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    code: string;
  };
  font?: string;
}

const themes: Record<ThemeName, Theme> = {
  dracula: {
    name: "dracula",
    colors: {
      bg: "#282a36",
      surface: "#44475a",
      surface2: "#6272a4",
      border: "#6272a4",
      fg: "#f8f8f2",
      fg2: "#bd93f9",
      primary: "#bd93f9",
      primaryHover: "#a78bfa",
      secondary: "#6272a4",
      accent: "#ff79c6",
      success: "#50fa7b",
      warning: "#f1fa8c",
      error: "#ff5555",
      code: "#8be9fd",
    },
    font: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace",
  },
  dark: {
    name: "dark",
    colors: {
      bg: "#0b0f14",
      surface: "#0f1621",
      surface2: "#111827",
      border: "#1f2937",
      fg: "#e6edf3",
      fg2: "#93a3b5",
      primary: "#2563eb",
      primaryHover: "#3b82f6",
      secondary: "#1f2937",
      accent: "#93c5fd",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      code: "#60a5fa",
    },
  },
  light: {
    name: "light",
    colors: {
      bg: "#ffffff",
      surface: "#f9fafb",
      surface2: "#f3f4f6",
      border: "#e5e7eb",
      fg: "#111827",
      fg2: "#6b7280",
      primary: "#2563eb",
      primaryHover: "#3b82f6",
      secondary: "#f3f4f6",
      accent: "#3b82f6",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      code: "#1e40af",
    },
  },
  "github-dark": {
    name: "github-dark",
    colors: {
      bg: "#0d1117",
      surface: "#161b22",
      surface2: "#21262d",
      border: "#30363d",
      fg: "#c9d1d9",
      fg2: "#8b949e",
      primary: "#58a6ff",
      primaryHover: "#79c0ff",
      secondary: "#21262d",
      accent: "#f85149",
      success: "#3fb950",
      warning: "#d29922",
      error: "#f85149",
      code: "#c9d1d9",
    },
  },
  monokai: {
    name: "monokai",
    colors: {
      bg: "#272822",
      surface: "#3e3d32",
      surface2: "#49483e",
      border: "#75715e",
      fg: "#f8f8f2",
      fg2: "#a6e22e",
      primary: "#a6e22e",
      primaryHover: "#b8e73f",
      secondary: "#49483e",
      accent: "#f92672",
      success: "#a6e22e",
      warning: "#fd971f",
      error: "#f92672",
      code: "#66d9ef",
    },
  },
};

interface ThemeState {
  currentTheme: ThemeName;
  theme: Theme;
  setTheme: (name: ThemeName) => void;
  detectFrontendContent: (bookTitle?: string, keywords?: string[]) => ThemeName;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: "dark",
      theme: themes.dark,
      
      setTheme: (name) => {
        set({ currentTheme: name, theme: themes[name] });
        applyTheme(themes[name]);
      },

      detectFrontendContent: (bookTitle, keywords) => {
        const title = (bookTitle || "").toLowerCase();
        const kw = (keywords || []).join(" ").toLowerCase();
        const content = `${title} ${kw}`;

        const frontendKeywords = [
          "frontend",
          "front-end",
          "react",
          "vue",
          "angular",
          "javascript",
          "typescript",
          "css",
          "html",
          "web",
          "ui",
          "ux",
          "design",
          "component",
          "node",
          "next",
          "vite",
          "svelte",
          "tailwind",
          "bootstrap",
        ];

        const isFrontend = frontendKeywords.some((keyword) =>
          content.includes(keyword)
        );

        if (isFrontend && get().currentTheme !== "dracula") {
          const newTheme = "dracula";
          get().setTheme(newTheme);
          return newTheme;
        }
        
        return get().currentTheme;
      },
    }),
    {
      name: "txt-book-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

function applyTheme(theme: Theme) {
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

// Aplica tema inicial (será aplicado também em main.tsx)

