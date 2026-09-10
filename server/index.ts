import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { Server } from "socket.io";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "minha_chave_super_secreta_paisagens";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Pega só o token depois da palavra "Bearer"

  if (!token) {
    res.status(401).json({ error: "Acesso negado. Token não fornecido." });
    return;
  }

  // Verifica se o token é verdadeiro usando a sua chave secreta
  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      res.status(403).json({ error: "Token inválido ou expirado." });
      return;
    }
    
    // Salva os dados do usuário dentro da requisição e manda seguir em frente
    (req as any).user = decodedUser;
    next();
  });
};

// ==========================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================
const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  password: "ibs12345",
  host: "127.0.0.1",
  port: 5432,
  database: "evolution_db"
});

// Força o Postgres a procurar direto dentro do seu Schema
pool.on("connect", (client) => {
  client.query('SET search_path TO "Chatbot_PPS", public;');
});

// Teste de conexão ao iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Erro fatal ao conectar no banco de dados:", err.message);
  } else {
    console.log("✅ Banco de dados conectado com SUCESSO!");
    release();
  }
});

async function startServer() {
  const app = express();
  app.use(cors());
  const server = createServer(app);
  
  // Configurando o Socket.io
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  app.use(express.json());

  // ==========================================
  // ROTAS DE AUTENTICAÇÃO
  // ==========================================

  // 1. Rota de Cadastro (Registro)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password } = req.body;

      const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: "Este e-mail já está cadastrado." });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = await pool.query(
        "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username",
        [email, username, passwordHash]
      );

      res.status(201).json(newUser.rows[0]);
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).json({ error: "Erro interno no servidor ao registrar usuário." });
    }
  });

  // 2. Rota de Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      }

      const user = userResult.rows[0];

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ 
        token, 
        user: { id: user.id, email: user.email, username: user.username } 
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno no servidor ao fazer login." });
    }
  });

  // ==========================================
  // ROTAS DE RELATÓRIOS (PLANILHAS)
  // ==========================================

  // 1. Buscar todos os relatórios gerados
  app.get("/api/reports", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT reports.*, users.username 
        FROM reports 
        LEFT JOIN users ON reports.user_id = users.id 
        ORDER BY reports.created_at DESC
        `);
      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
      res.status(500).json({ error: "Erro ao buscar relatórios" });
    }
  });

  // Rota de criar o relatório
app.post("/api/reports", authenticateToken, async (req, res) => {
  try {
    const { title, file_url } = req.body;
    
    // O id do usuário vem do token descriptografado pelo middleware (req.user)
    const userId = (req as any).user.id; 

    // Atualizamos o INSERT para incluir o user_id
    const result = await pool.query(
      `INSERT INTO reports (title, file_url, user_id) 
       VALUES ($1, $2, $3) RETURNING *`,
      [title, file_url, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao salvar relatório:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

  // 3. Arquivar ou Desarquivar relatório
  app.patch("/api/reports/:id/archive", async (req, res) => {
    try {
      const { id } = req.params;
      const { is_archived } = req.body;
      await pool.query('UPDATE reports SET is_archived = $1 WHERE id = $2', [is_archived, id]);
      
      io.emit("report_updated"); // Atualiza a tela de todos
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao arquivar:", error);
      res.status(500).json({ error: "Erro ao arquivar relatório" });
    }
  });

  // 4. Excluir relatório definitivamente
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM reports WHERE id = $1', [id]);
      
      io.emit("report_updated"); // Atualiza a tela de todos
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar:", error);
      res.status(500).json({ error: "Erro ao excluir relatório" });
    }
  });


  // ==========================================
  // WEBSOCKETS (INDICADOR DE PRESENÇA GLOBAL)
  // ==========================================
  // Como não há mais salas separadas, vamos mostrar quem está na ferramenta
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    let currentUser: string | null = null;

    // Quando alguém entra na ferramenta
    socket.on("join_dashboard", ({ username }) => {
      currentUser = username;
      onlineUsers.set(socket.id, username);
      
      // Envia a lista atualizada com os NOMES ÚNICOS de todos online
      io.emit("active_users", Array.from(new Set(onlineUsers.values())));
    });

    // Quando a pessoa fecha a aba ou o navegador
    socket.on("disconnect", () => {
      if (currentUser) {
        onlineUsers.delete(socket.id);
        io.emit("active_users", Array.from(new Set(onlineUsers.values())));
      }
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