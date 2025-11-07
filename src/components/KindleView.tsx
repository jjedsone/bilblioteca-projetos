// src/components/KindleView.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import type { Book } from "../types";

interface KindleViewProps {
  book: Book;
  onClose: () => void;
}

export default function KindleView({ book, onClose }: KindleViewProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [margin, setMargin] = useState(60);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bookmark, setBookmark] = useState<number | null>(null);
  const [showProgress, setShowProgress] = useState(true);
  const [fontFamily, setFontFamily] = useState("Georgia");
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const readingRef = useRef<{ cancel: () => void; pause: () => void; resume: () => void } | null>(null);
  const highlightedWordRef = useRef<HTMLSpanElement | null>(null);
  const autoStartRef = useRef(false);

  const chapter = book.chapters[currentChapter];
  const paragraphs = chapter.text.split(/\n{2,}/).filter(Boolean);
  const fullText = paragraphs.join(" ");
  const words = fullText.split(/\s+/).filter(Boolean);

  // Leitor de voz usando Web Speech API
  const stopReading = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsReading(false);
    setIsPaused(false);
    setCurrentWordIndex(0);
    setReadingProgress(0);
  }, []);

  // Teste rápido de voz
  const testVoice = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      alert("Seu navegador não suporta leitura de voz.");
      return;
    }

    const testText = "Olá! Este é um teste do leitor de voz. A voz está funcionando corretamente.";
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.lang = "pt-BR";
    utterance.rate = readingSpeed;
    utterance.volume = volume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      console.log("Teste de voz finalizado");
    };

    utterance.onerror = (event) => {
      if (event.error !== "interrupted" && event.error !== "canceled") {
        alert(`Erro no teste de voz: ${event.error}`);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, readingSpeed, volume]);

  const startReading = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      alert("Seu navegador não suporta leitura de voz.");
      return;
    }

    if (isReading) {
      stopReading();
      return;
    }

    // Cancelar qualquer leitura anterior
    window.speechSynthesis.cancel();

    // Pequeno delay para garantir que o cancelamento foi processado
    setTimeout(() => {
      // Preparar o áudio primeiro
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = "pt-BR";
      utterance.rate = readingSpeed;
      utterance.pitch = 1;
      utterance.volume = volume;
      
      // Aplicar voz selecionada
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Marcar como lendo ANTES de configurar os eventos
      setIsReading(true);
      setIsPaused(false);

      utterance.onstart = () => {
        console.log("Leitura iniciada");
        setCurrentWordIndex(0);
      };
      
      // Atualizar índice da palavra durante a leitura
      utterance.onboundary = (event) => {
        if (event.name === "word" && event.charIndex !== undefined) {
          // Calcular índice da palavra baseado na posição no texto
          const textBefore = fullText.substring(0, event.charIndex);
          const wordsBefore = textBefore.split(/\s+/).filter(Boolean).length;
          setCurrentWordIndex(wordsBefore);
          
          // Calcular progresso da leitura
          const progress = (event.charIndex / fullText.length) * 100;
          setReadingProgress(progress);
          
          // Scroll automático para a palavra destacada
          setTimeout(() => {
            if (highlightedWordRef.current) {
              highlightedWordRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 100);
        }
      };

      utterance.onend = () => {
        console.log("Leitura finalizada");
        setIsReading(false);
        setIsPaused(false);
        setCurrentWordIndex(0);
        setReadingProgress(100);
      };

      utterance.onerror = (event) => {
        setIsReading(false);
        setCurrentWordIndex(0);
        
        // Ignorar erros de interrupção/cancelamento (são esperados e normais)
        if (event.error === "interrupted" || event.error === "canceled") {
          // Não fazer nada - são ações esperadas do usuário
          return;
        }
        
        // Tratamento de erros reais
        let errorMessage = "Erro ao ler o texto. ";
        if (event.error === "not-allowed") {
          errorMessage = "Permissão de áudio negada. Por favor, permita o uso de áudio no navegador.";
        } else if (event.error === "network") {
          errorMessage = "Erro de rede ao acessar o serviço de voz.";
        } else if (event.error === "synthesis-failed") {
          errorMessage = "Falha na síntese de voz. Tente novamente.";
        } else if (event.error === "synthesis-unavailable") {
          errorMessage = "Serviço de voz não disponível no momento.";
        } else if (event.error === "text-too-long") {
          errorMessage = "Texto muito longo para leitura. Tente ler por capítulos menores.";
        } else if (event.error === "invalid-argument") {
          errorMessage = "Argumento inválido na leitura.";
        } else {
          errorMessage = `Erro na leitura: ${event.error || "Erro desconhecido"}. Verifique as configurações de áudio.`;
          // Log apenas para erros desconhecidos para debug
          console.warn("Erro desconhecido na leitura:", event);
        }
        
        // Mostrar alerta apenas para erros reais
        alert(errorMessage);
      };

      utterance.onpause = () => {
        console.log("Leitura pausada");
        setIsPaused(true);
      };

      utterance.onresume = () => {
        console.log("Leitura retomada");
        setIsPaused(false);
      };

      readingRef.current = { 
        cancel: () => {
          window.speechSynthesis.cancel();
          setIsReading(false);
          setIsPaused(false);
        },
        pause: () => {
          window.speechSynthesis.pause();
          setIsPaused(true);
        },
        resume: () => {
          window.speechSynthesis.resume();
          setIsPaused(false);
        }
      };
      
      // Preparar o áudio e depois iniciar a leitura
      try {
        // Primeiro, preparar o áudio (transformar texto em áudio)
        console.log("Preparando áudio...");
        
        // Aguardar um momento para garantir que tudo está pronto
        setTimeout(() => {
          // Agora iniciar a leitura
          window.speechSynthesis.speak(utterance);
          console.log("Leitura iniciada - áudio preparado e reproduzindo");
        }, 200);
      } catch (error) {
        console.error("Erro ao iniciar leitura:", error);
        setIsReading(false);
        setIsPaused(false);
        alert("Erro ao iniciar a leitura de voz. Verifique as configurações de áudio do navegador.");
      }
    }, 100);
  }, [fullText, readingSpeed, volume, isReading, stopReading, selectedVoice]);

  // Salvar bookmark
  const saveBookmark = useCallback(() => {
    setBookmark(currentChapter);
    alert(`Marcador salvo no capítulo ${currentChapter + 1}`);
  }, [currentChapter]);

  // Ir para bookmark
  const goToBookmark = useCallback(() => {
    if (bookmark !== null) {
      setCurrentChapter(bookmark);
    }
  }, [bookmark]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentChapter > 0) {
        setCurrentChapter(currentChapter - 1);
        stopReading();
      } else if (e.key === "ArrowRight" && currentChapter < book.chapters.length - 1) {
        setCurrentChapter(currentChapter + 1);
        stopReading();
      } else if (e.key === "m" || e.key === "M") {
        setIsMenuOpen((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        startReading();
      } else if (e.key === " " || e.key === "Spacebar") {
        // Espaço para pausar/retomar
        e.preventDefault();
        if (isReading) {
          if (isPaused) {
            if (readingRef.current) {
              readingRef.current.resume();
            }
          } else {
            if (readingRef.current) {
              readingRef.current.pause();
            }
          }
        }
      } else if (e.key === "p" || e.key === "P") {
        // P para pausar
        if (isReading && !isPaused && readingRef.current) {
          readingRef.current.pause();
        }
      } else if (e.key === "b" || e.key === "B") {
        saveBookmark();
      } else if (e.key === "g" || e.key === "G") {
        goToBookmark();
      } else if (e.key === "d" || e.key === "D") {
        setIsDarkMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      stopReading();
    };
  }, [currentChapter, book.chapters.length, onClose, startReading, stopReading, saveBookmark, goToBookmark, isReading, isPaused]);

  // Carregar vozes disponíveis
  useEffect(() => {
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        const ptVoices = voices.filter((voice) => 
          voice.lang.startsWith("pt") || voice.lang.includes("Portuguese")
        );
        
        setAvailableVoices(voices);
        
        // Selecionar primeira voz em português por padrão, ou primeira disponível
        // Apenas se ainda não tiver uma voz selecionada
        setSelectedVoice((current) => {
          if (current) return current; // Manter a seleção atual
          if (ptVoices.length > 0) {
            return ptVoices[0];
          } else if (voices.length > 0) {
            return voices[0];
          }
          return null;
        });
      }
    };

    // Carregar vozes imediatamente
    loadVoices();

    // Alguns navegadores carregam vozes de forma assíncrona
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Limpar leitura ao mudar de capítulo ou desmontar componente
  useEffect(() => {
    stopReading();
    return () => {
      // Cleanup: parar leitura ao desmontar
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentChapter, stopReading]);

  // Iniciar leitura automaticamente quando o componente é montado e vozes estão carregadas
  useEffect(() => {
    if (autoStartRef.current) return; // Já tentou iniciar
    
    // Aguardar um pouco para garantir que as vozes foram carregadas
    const timer = setTimeout(() => {
      if (selectedVoice && !isReading && availableVoices.length > 0) {
        autoStartRef.current = true;
        // Pequeno delay adicional para garantir que tudo está pronto
        setTimeout(() => {
          if (!isReading) {
            startReading();
          }
        }, 500);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [selectedVoice, availableVoices.length, isReading, startReading]);

  const chapterProgress = ((currentChapter + 1) / book.chapters.length) * 100;
  const totalWords = book.chapters.reduce((acc, ch) => acc + ch.text.split(/\s+/).filter(Boolean).length, 0);
  const currentWords = book.chapters.slice(0, currentChapter).reduce((acc, ch) => acc + ch.text.split(/\s+/).filter(Boolean).length, 0) + words.length;
  const totalProgress = (currentWords / totalWords) * 100;

  const fonts = [
    { name: "Georgia", label: "Georgia (Padrão)" },
    { name: "Times New Roman", label: "Times New Roman" },
    { name: "Palatino", label: "Palatino" },
    { name: "Book Antiqua", label: "Book Antiqua" },
    { name: "Arial", label: "Arial" },
    { name: "Helvetica", label: "Helvetica" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDarkMode ? "#1a1a1a" : "#f5f5dc",
        color: isDarkMode ? "#e0e0e0" : "#1a1a1a",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        fontFamily: `${fontFamily}, serif`,
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Barra superior tipo Kindle */}
      <div
        style={{
          background: isDarkMode ? "#0a0a0a" : "#2c2c2c",
          color: "#fff",
          padding: "8px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          position: "relative",
          transition: "background-color 0.3s ease",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "16px",
              padding: "4px 8px",
            }}
            title="Menu (M)"
          >
            ☰
          </button>
          <span>{book.title}</span>
          {book.author && <span style={{ opacity: 0.7 }}>• {book.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {showProgress && (
            <>
              <span>
                {currentChapter + 1} / {book.chapters.length}
              </span>
              <span>{Math.round(chapterProgress)}%</span>
            </>
          )}
          <button
            onClick={() => setShowProgress(!showProgress)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "12px",
              padding: "4px 8px",
            }}
            title="Mostrar/ocultar progresso"
          >
            {showProgress ? "👁️" : "👁️‍🗨️"}
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "16px",
              padding: "4px 8px",
            }}
            title="Fechar (ESC)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Menu lateral tipo Kindle */}
      {isMenuOpen && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "40px",
            bottom: "60px",
            width: "320px",
            background: isDarkMode ? "#0a0a0a" : "#2c2c2c",
            color: "#fff",
            padding: "20px",
            overflowY: "auto",
            zIndex: 10000,
            boxShadow: "2px 0 10px rgba(0,0,0,0.3)",
            transition: "background-color 0.3s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Configurações</h3>
            <button
              onClick={() => setIsMenuOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Sumário */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: "14px" }}>Sumário</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "200px", overflowY: "auto" }}>
              {book.chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setCurrentChapter(idx);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    background: idx === currentChapter ? "#444" : "transparent",
                    border: "none",
                    color: "#fff",
                    textAlign: "left",
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderRadius: "4px",
                    fontSize: "13px",
                  }}
                >
                  {idx + 1}. {ch.title}
                </button>
              ))}
            </div>
          </div>

          {/* Controles de leitura */}
          <div style={{ marginBottom: 24, paddingTop: 24, borderTop: "1px solid #444" }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: "14px" }}>Leitura</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "block", color: "#fff", fontSize: "12px" }}>
                Voz
                <select
                  value={selectedVoice ? selectedVoice.name : ""}
                  onChange={(e) => {
                    const voice = availableVoices.find((v) => v.name === e.target.value);
                    if (voice) {
                      setSelectedVoice(voice);
                      if (isReading) {
                        stopReading();
                        setTimeout(() => startReading(), 100);
                      }
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "6px",
                    marginTop: 4,
                    background: "#333",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  {availableVoices.length === 0 && (
                    <option value="">Carregando vozes...</option>
                  )}
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} {voice.lang} {voice.default ? "(Padrão)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              
              <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                {/* Botão Play - sempre visível */}
                <button
                  onClick={() => {
                    if (!isReading) {
                      startReading();
                    } else if (isPaused && readingRef.current) {
                      readingRef.current.resume();
                    }
                  }}
                  disabled={isReading && !isPaused}
                  style={{
                    background: isReading && !isPaused ? "#666" : "#4caf50",
                    border: "none",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "4px",
                    cursor: isReading && !isPaused ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: isReading && !isPaused ? 0.6 : 1,
                  }}
                  title={isReading && !isPaused ? "Leitura em andamento" : isPaused ? "Retomar leitura" : "Iniciar leitura"}
                >
                  ▶️ {isPaused ? "Retomar Leitura" : "Iniciar Leitura"}
                </button>
                
                {/* Botão Pause - sempre visível */}
                <button
                  onClick={() => {
                    if (isReading && !isPaused && readingRef.current) {
                      readingRef.current.pause();
                    }
                  }}
                  disabled={!isReading || isPaused}
                  style={{
                    background: !isReading || isPaused ? "#666" : "#ff9800",
                    border: "none",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "4px",
                    cursor: !isReading || isPaused ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: !isReading || isPaused ? 0.6 : 1,
                  }}
                  title={!isReading ? "Nenhuma leitura em andamento" : isPaused ? "Leitura pausada" : "Pausar leitura"}
                >
                  ⏸️ Pausar Leitura
                </button>
                
                {/* Botão Stop - sempre visível */}
                <button
                  onClick={stopReading}
                  disabled={!isReading}
                  style={{
                    background: !isReading ? "#666" : "#d32f2f",
                    border: "none",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "4px",
                    cursor: !isReading ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: !isReading ? 0.6 : 1,
                  }}
                  title={!isReading ? "Nenhuma leitura em andamento" : "Parar leitura"}
                >
                  ⏹️ Parar Leitura
                </button>
                
                <button
                  onClick={testVoice}
                  style={{
                    background: "#2196f3",
                    border: "none",
                    color: "#fff",
                    padding: "8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                  title="Testar a voz selecionada"
                >
                  🔊 Testar Voz
                </button>
              </div>
              
              {isReading && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ 
                    fontSize: "11px", 
                    color: "#aaa", 
                    marginBottom: 4,
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span>Progresso: {Math.round(readingProgress)}%</span>
                    <span>{isPaused ? "⏸️ Pausado" : "▶️ Lendo..."}</span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: "4px",
                    background: "#333",
                    borderRadius: "2px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${readingProgress}%`,
                      height: "100%",
                      background: isPaused ? "#ff9800" : "#4caf50",
                      transition: "width 0.3s ease, background 0.3s ease"
                    }} />
                  </div>
                </div>
              )}
              
              <label style={{ display: "block", color: "#fff", fontSize: "12px" }}>
                Velocidade: {readingSpeed.toFixed(1)}x
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={readingSpeed}
                  onChange={(e) => {
                    setReadingSpeed(Number(e.target.value));
                    if (isReading) {
                      stopReading();
                      setTimeout(() => startReading(), 100);
                    }
                  }}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
              
              <label style={{ display: "block", color: "#fff", fontSize: "12px" }}>
                Volume: {Math.round(volume * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    if (isReading) {
                      stopReading();
                      setTimeout(() => startReading(), 100);
                    }
                  }}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
            </div>
          </div>

          {/* Marcadores */}
          <div style={{ marginBottom: 24, paddingTop: 24, borderTop: "1px solid #444" }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: "14px" }}>Marcadores</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={saveBookmark}
                style={{
                  background: "#2196f3",
                  border: "none",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  flex: 1,
                }}
                title="Salvar marcador (B)"
              >
                📑 Salvar
              </button>
              <button
                onClick={goToBookmark}
                disabled={bookmark === null}
                style={{
                  background: bookmark === null ? "#555" : "#ff9800",
                  border: "none",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: bookmark === null ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  flex: 1,
                  opacity: bookmark === null ? 0.5 : 1,
                }}
                title="Ir para marcador (G)"
              >
                📍 Ir para
              </button>
            </div>
            {bookmark !== null && (
              <div style={{ marginTop: 8, fontSize: "11px", opacity: 0.7, color: "#fff" }}>
                Marcador: Cap. {bookmark + 1}
              </div>
            )}
          </div>

          {/* Aparência */}
          <div style={{ marginBottom: 24, paddingTop: 24, borderTop: "1px solid #444" }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: "14px" }}>Aparência</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "block", color: "#fff", fontSize: "12px" }}>
                Fonte
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    marginTop: 4,
                    background: "#333",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                  }}
                >
                  {fonts.map((font) => (
                    <option key={font.name} value={font.name}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "block", color: "#fff", fontSize: "12px" }}>
                Tamanho da fonte: {fontSize}px
                <input
                  type="range"
                  min="12"
                  max="32"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>

              <label style={{ display: "block", color: "#fff", fontSize: "12px" }}>
                Espaçamento entre linhas: {lineHeight.toFixed(1)}
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>

              <label style={{ display: "block", color: "#fff", fontSize: "12px" }}>
                Margens: {margin}px
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="10"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  background: isDarkMode ? "#ff9800" : "#333",
                  border: "none",
                  color: "#fff",
                  padding: "8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
                title="Modo escuro (D)"
              >
                {isDarkMode ? "☀️ Modo Claro" : "🌙 Modo Escuro"}
              </button>
            </div>
          </div>

          {/* Atalhos */}
          <div style={{ paddingTop: 24, borderTop: "1px solid #444" }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: "14px" }}>Atalhos</h4>
            <div style={{ fontSize: "11px", color: "#aaa", lineHeight: 1.6 }}>
              <div>ESC - Fechar</div>
              <div>← → - Navegar capítulos</div>
              <div>M - Menu</div>
              <div>R - Iniciar/Parar leitura</div>
              <div>Espaço - Pausar/Retomar leitura</div>
              <div>P - Pausar leitura</div>
              <div>B - Salvar marcador</div>
              <div>G - Ir para marcador</div>
              <div>D - Modo escuro</div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: `40px ${margin}px`,
          maxWidth: "900px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            color: isDarkMode ? "#e0e0e0" : "#1a1a1a",
            textAlign: "justify",
            transition: "color 0.3s ease",
          }}
        >
          <h1
            style={{
              fontSize: `${fontSize * 1.5}px`,
              marginBottom: "24px",
              textAlign: "center",
              fontWeight: 400,
            }}
          >
            {book.title}
          </h1>

          {book.author && (
            <p
              style={{
                textAlign: "center",
                fontSize: `${fontSize * 0.9}px`,
                marginBottom: "40px",
                opacity: 0.7,
              }}
            >
              {book.author}
            </p>
          )}

          <h2
            style={{
              fontSize: `${fontSize * 1.2}px`,
              marginTop: "40px",
              marginBottom: "24px",
              fontWeight: 400,
            }}
          >
            {currentChapter + 1}. {chapter.title}
          </h2>

          {paragraphs.map((para, idx) => {
            // Destaque de palavras durante leitura
            const paraWords = para.split(/(\s+)/);
            let wordIndex = 0;
            let currentParaWordIndex = 0;
            
            // Calcular índice da primeira palavra deste parágrafo
            for (let i = 0; i < idx; i++) {
              currentParaWordIndex += paragraphs[i].split(/\s+/).filter(Boolean).length;
            }
            
            return (
              <p
                key={idx}
                style={{
                  marginBottom: `${fontSize * 0.8}px`,
                  textIndent: `${fontSize * 1.5}px`,
                }}
              >
                {paraWords.map((part, partIdx) => {
                  if (/\s+/.test(part)) {
                    return <span key={partIdx}>{part}</span>;
                  }
                  
                  const globalWordIndex = currentParaWordIndex + wordIndex;
                  wordIndex++;
                  
                  const isHighlighted = isReading && globalWordIndex === currentWordIndex;
                  
                  return (
                    <span
                      key={partIdx}
                      ref={isHighlighted ? highlightedWordRef : null}
                      style={{
                        backgroundColor: isHighlighted ? (isDarkMode ? "#ffd700" : "#ffff00") : "transparent",
                        color: isHighlighted ? (isDarkMode ? "#000" : "#000") : "inherit",
                        padding: isHighlighted ? "2px 4px" : "0",
                        borderRadius: isHighlighted ? "3px" : "0",
                        transition: "background-color 0.2s ease, transform 0.2s ease",
                        fontWeight: isHighlighted ? 600 : "normal",
                        transform: isHighlighted ? "scale(1.05)" : "scale(1)",
                        display: "inline-block",
                      }}
                    >
                      {part}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </div>
      </div>

      {/* Barra inferior tipo Kindle */}
      <div
        style={{
          background: isDarkMode ? "#0a0a0a" : "#2c2c2c",
          color: "#fff",
          padding: "8px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          transition: "background-color 0.3s ease",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
            disabled={currentChapter === 0}
            style={{
              background: "transparent",
              border: "1px solid #555",
              color: "#fff",
              padding: "6px 12px",
              cursor: currentChapter === 0 ? "not-allowed" : "pointer",
              opacity: currentChapter === 0 ? 0.5 : 1,
              borderRadius: "4px",
            }}
            title="Capítulo anterior (←)"
          >
            ← Anterior
          </button>
          <button
            onClick={() =>
              setCurrentChapter(
                Math.min(book.chapters.length - 1, currentChapter + 1)
              )
            }
            disabled={currentChapter === book.chapters.length - 1}
            style={{
              background: "transparent",
              border: "1px solid #555",
              color: "#fff",
              padding: "6px 12px",
              cursor:
                currentChapter === book.chapters.length - 1
                  ? "not-allowed"
                  : "pointer",
              opacity: currentChapter === book.chapters.length - 1 ? 0.5 : 1,
              borderRadius: "4px",
            }}
            title="Próximo capítulo (→)"
          >
            Próximo →
          </button>
          {/* Botões de controle de leitura na barra inferior */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => {
                if (!isReading) {
                  startReading();
                } else if (isPaused && readingRef.current) {
                  readingRef.current.resume();
                }
              }}
              disabled={isReading && !isPaused}
              style={{
                background: isReading && !isPaused ? "#666" : "#4caf50",
                border: "none",
                color: "#fff",
                padding: "6px 12px",
                cursor: isReading && !isPaused ? "not-allowed" : "pointer",
                borderRadius: "4px",
                fontSize: "11px",
                opacity: isReading && !isPaused ? 0.6 : 1,
              }}
              title={isReading && !isPaused ? "Leitura em andamento" : isPaused ? "Retomar" : "Iniciar"}
            >
              ▶️
            </button>
            <button
              onClick={() => {
                if (isReading && !isPaused && readingRef.current) {
                  readingRef.current.pause();
                }
              }}
              disabled={!isReading || isPaused}
              style={{
                background: !isReading || isPaused ? "#666" : "#ff9800",
                border: "none",
                color: "#fff",
                padding: "6px 12px",
                cursor: !isReading || isPaused ? "not-allowed" : "pointer",
                borderRadius: "4px",
                fontSize: "11px",
                opacity: !isReading || isPaused ? 0.6 : 1,
              }}
              title={!isReading ? "Nenhuma leitura" : isPaused ? "Pausado" : "Pausar"}
            >
              ⏸️
            </button>
            <button
              onClick={stopReading}
              disabled={!isReading}
              style={{
                background: !isReading ? "#666" : "#d32f2f",
                border: "none",
                color: "#fff",
                padding: "6px 12px",
                cursor: !isReading ? "not-allowed" : "pointer",
                borderRadius: "4px",
                fontSize: "11px",
                opacity: !isReading ? 0.6 : 1,
              }}
              title={!isReading ? "Nenhuma leitura" : "Parar"}
            >
              ⏹️
            </button>
          </div>
        </div>
        {showProgress && (
          <div style={{ opacity: 0.7, display: "flex", gap: 16, alignItems: "center" }}>
            <span>Capítulo: {Math.round(chapterProgress)}%</span>
            <span>•</span>
            <span>Livro: {Math.round(totalProgress)}%</span>
          </div>
        )}
      </div>

      {/* Barra de progresso */}
      {showProgress && (
        <div
          style={{
            height: "4px",
            background: isDarkMode ? "#0a0a0a" : "#2c2c2c",
            position: "relative",
            transition: "background-color 0.3s ease",
          }}
        >
          <div
            style={{
              height: "100%",
              background: isReading ? "#4caf50" : "#fff",
              width: `${totalProgress}%`,
              transition: "width 0.3s ease, background-color 0.3s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

