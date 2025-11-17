// server/index.ts
import express from "express";
import cors from "cors";
import projectsRouter from "./routes/projects.js";

const app = express();
const PORT = process.env.PORT || 5174;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Permitir JSON grande para livros com imagens
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rotas
app.use("/api/projects", projectsRouter);

// Rota de saúde
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Middleware de erro
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Erro no servidor:", err);
  res.status(500).json({ error: "Erro interno do servidor", message: err.message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📚 API disponível em http://localhost:${PORT}/api`);
  console.log(`❤️  Endpoint de saúde: http://localhost:${PORT}/api/health`);
});

