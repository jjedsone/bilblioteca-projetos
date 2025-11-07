// src/components/ThemeSelector.tsx
import { useTheme, type ThemeName } from "../store/theme";

export default function ThemeSelector() {
  const { currentTheme, setTheme, theme } = useTheme();
  
  const themes: { name: ThemeName; label: string; emoji: string }[] = [
    { name: "dracula", label: "Dracula", emoji: "🧛" },
    { name: "dark", label: "Dark", emoji: "🌙" },
    { name: "light", label: "Light", emoji: "☀️" },
    { name: "github-dark", label: "GitHub Dark", emoji: "💻" },
    { name: "monokai", label: "Monokai", emoji: "🎨" },
  ];

  return (
    <div style={{ position: "relative" }}>
      <select
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
        style={{
          background: theme.colors.surface2,
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.fg,
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "13px",
          cursor: "pointer",
        }}
        title="Selecione um tema"
      >
        {themes.map((t) => (
          <option key={t.name} value={t.name}>
            {t.emoji} {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}

