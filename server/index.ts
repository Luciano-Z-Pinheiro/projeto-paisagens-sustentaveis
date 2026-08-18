import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de Conexão com o PostgreSQL
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ibs12345@localhost:5432/evolution_db",
});

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Configurando o Socket.io para o "Indicador de Usuário Ativo"
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  // Habilitar parse de JSON no Express
  app.use(express.json());

  // ==========================================
  // ROTAS DA API (SALVAR E LER DO BANCO)
  // ==========================================

  // 1. Buscar todos os chats (com suporte a busca global)
  app.get("/api/chats", async (req, res) => {
    const { search } = req.query;
    try {
      let query = `SELECT * FROM "Chatbot_PPS".chats ORDER BY updated_at DESC`;
      let values: any[] = [];

      // Se o usuário digitou algo na busca, procuramos pelo título do chat ou pelo conteúdo das mensagens
      if (search) {
        query = `
          SELECT DISTINCT c.* FROM "Chatbot_PPS".chats c
          LEFT JOIN "Chatbot_PPS".messages m ON c.id = m.chat_id
          WHERE c.title ILIKE $1 OR m.content ILIKE $1
          ORDER BY c.updated_at DESC
        `;
        values = [`%${search}%`];
      }

      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (err) {
      console.error("Erro ao buscar chats:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // 2. Criar ou Atualizar um Chat (quando renomeado)
  app.post("/api/chats", async (req, res) => {
    const { id, title, institution, created_at, updated_at } = req.body;
    try {
      await pool.query(
        `INSERT INTO "Chatbot_PPS".chats (id, title, institution, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = EXCLUDED.updated_at`,
        [id, title, institution || null, created_at, updated_at]
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao salvar chat:", err);
      res.status(500).json({ error: "Erro ao salvar chat" });
    }
  });

  // ==========================================
  // WEBSOCKETS (INDICADOR DE PRESENÇA)
  // ==========================================
  io.on("connection", (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    // Quando um usuário entra em um chat
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      // Avisa as outras pessoas da sala que alguém entrou
      socket.to(chatId).emit("user_joined", { socketId: socket.id, message: "Outra pessoa está visualizando este chat" });
    });

    // Quando o usuário sai ou desconecta
    socket.on("disconnect", () => {
      console.log(`Usuário desconectado: ${socket.id}`);
    });
  });

  // ==========================================
  // SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND
  // ==========================================
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Iniciar o servidor
  const port = process.env.PORT || 3001; // Mudamos para 3001 para não conflitar com o Vite no ambiente de dev
  server.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
