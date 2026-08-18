import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ibs12345@localhost:5432/evolution_db",
});

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Configurando o Socket.io
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  app.use(express.json());

  // ==========================================
  // ROTAS DA API (SALVAR E LER DO BANCO)
  // ==========================================

  // 1. Buscar todos os chats e suas mensagens
  app.get("/api/chats", async (req, res) => {
    const { search } = req.query;
    try {
      let query = `
        SELECT c.id, c.title, c.institution, c.created_at as "createdAt", c.updated_at as "updatedAt",
          c.is_pinned as "isPinned", c.is_archived as "isArchived",
          COALESCE(
            json_agg(
              json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'timestamp', m.timestamp, 'hasError', m.has_error)
              ORDER BY m.timestamp ASC
            ) FILTER (WHERE m.id IS NOT NULL), '[]'
          ) as messages
        FROM "Chatbot_PPS".chats c
        LEFT JOIN "Chatbot_PPS".messages m ON c.id = m.chat_id
      `;
      let values: any[] = [];

      if (search) {
        query += ` WHERE c.title ILIKE $1 OR m.content ILIKE $1 `;
        values = [`%${search}%`];
      }

      query += ` GROUP BY c.id ORDER BY c.updated_at DESC`;

      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (err) {
      console.error("Erro ao buscar chats:", err);
      res.status(500).json({ error: "Erro interno" });
    }
  });
  
  // 2. Criar ou Atualizar um Chat
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

  // 3. Salvar Mensagem
  app.post("/api/chats", async (req, res) => {
    const { id, title, institution, createdAt, updatedAt, isPinned, isArchived } = req.body;
    try {
      await pool.query(
        `INSERT INTO "Chatbot_PPS".chats (id, title, institution, created_at, updated_at, is_pinned, is_archived) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
            title = EXCLUDED.title, 
            updated_at = EXCLUDED.updated_at, 
            is_pinned = EXCLUDED.is_pinned, 
            is_archived = EXCLUDED.is_archived`,
        [id, title, institution || null, createdAt, updatedAt, isPinned || false, isArchived || false]
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao salvar chat" });
    }
  });

  // 4. Deletar Chat
  app.delete("/api/chats/:id", async (req, res) => {
    try {
      await pool.query(`DELETE FROM "Chatbot_PPS".chats WHERE id = $1`, [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao deletar chat:", err);
      res.status(500).json({ error: "Erro ao deletar chat" });
    }
  });

  // ==========================================
  // WEBSOCKETS (INDICADOR DE PRESENÇA)
  // ==========================================
  io.on("connection", (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      socket.to(chatId).emit("user_joined", { socketId: socket.id, message: "Outra pessoa está visualizando este chat" });
    });

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

  const port = process.env.PORT || 3001;
  server.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
