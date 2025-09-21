import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// teste rápido
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// rota de chat usando Ollama
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body as {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
    };

    // pega só o texto do usuário
    const ultima = messages?.slice().reverse().find(m => m.role === 'user')?.content ?? '';

    // faz chamada à API do Ollama
    const r = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",     // escolha o modelo que baixou com ollama run
        prompt: ultima,
        stream: false
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: err });
    }

    const data = await r.json();
    res.json({ answer: data.response });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

const port = Number(process.env.PORT || 5174);
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}, usando Ollama`);
});
