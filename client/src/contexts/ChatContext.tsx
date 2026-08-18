import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  hasError?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  institution?: string;
}

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  activeUsers: number;
  createNewChat: () => void;
  deleteChat: (chatId: string) => void;
  selectChat: (chatId: string) => void;
  addMessage: (message: Message) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  searchChats: (query: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);
// URL do nosso backend (em produção pode ser a mesma origem)
const API_URL = "http://localhost:3001";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState(1);
  const [socket, setSocket] = useState<Socket | null>(null);

  // 1. Configurar WebSocket
  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on("user_joined", (data) => {
      toast.info(data.message); // Notifica na tela que alguém entrou
      setActiveUsers((prev) => prev + 1);
    });

    return () => { newSocket.close(); };
  }, []);

  // 2. Avisar o servidor ao trocar de chat
  useEffect(() => {
    if (socket && currentChatId) {
      socket.emit("join_chat", currentChatId);
      setActiveUsers(1); // Reseta a contagem local ao mudar de sala
    }
  }, [currentChatId, socket]);

  // 3. Buscar Chats do Banco
  const fetchChats = useCallback(async (searchQuery = "") => {
    try {
      const url = searchQuery ? `${API_URL}/api/chats?search=${encodeURIComponent(searchQuery)}` : `${API_URL}/api/chats`;
      const res = await fetch(url);
      const data = await res.json();
      setChats(data);
      if (!currentChatId && data.length > 0) setCurrentChatId(data[0].id);
    } catch (error) {
      console.error("Erro ao buscar do banco", error);
    }
  }, [currentChatId]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const searchChats = (query: string) => { fetchChats(query); };

  const createNewChat = async () => {
    const newChat: Chat = { id: nanoid(), title: "Novo Chat", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    await fetch(`${API_URL}/api/chats`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newChat)
    });
  };

  const deleteChat = async (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) setCurrentChatId(null);
    await fetch(`${API_URL}/api/chats/${chatId}`, { method: "DELETE" });
  };

  const selectChat = (chatId: string) => setCurrentChatId(chatId);

  const addMessage = async (message: Message) => {
    if (!currentChatId) return;
    
    // Atualiza interface local
    setChats((prev) => prev.map((chat) => {
      if (chat.id === currentChatId) {
        const title = chat.messages.length === 0 && message.role === "user" ? message.content.substring(0, 50) : chat.title;
        return { ...chat, messages: [...chat.messages, message], updatedAt: Date.now(), title };
      }
      return chat;
    }));

    // Salva no banco de dados
    await fetch(`${API_URL}/api/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...message, chat_id: currentChatId })
    });
  };

  const removeMessage = (chatId: string, messageId: string) => {
    setChats((prev) => prev.map((chat) => chat.id === chatId ? { ...chat, messages: chat.messages.filter((m) => m.id !== messageId) } : chat));
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, title } : c));
    await fetch(`${API_URL}/api/chats`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chat, title, updated_at: Date.now() })
    });
  };

  const currentChat = chats.find((c) => c.id === currentChatId) || null;

  return (
    <ChatContext.Provider value={{ chats, currentChatId, currentChat, activeUsers, createNewChat, deleteChat, selectChat, addMessage, removeMessage, updateChatTitle, searchChats }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) throw new Error("useChat deve ser usado dentro de ChatProvider");
  return context;
}