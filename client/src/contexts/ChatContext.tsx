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
  isPinned?: boolean;
  isArchived?: boolean;
}

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  activeUsers: number;
  createNewChat: () => void;
  deleteChat: (chatId: string) => void;
  deleteAllArchived: () => void;
  selectChat: (chatId: string) => void;
  addMessage: (message: Message) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  togglePinChat: (chatId: string) => void;
  toggleArchiveChat: (chatId: string) => void;
  searchChats: (query: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);
const API_URL = "http://localhost:3001";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState(1);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);
    newSocket.on("user_joined", (data) => {
      toast.info(data.message);
      setActiveUsers((prev) => prev + 1);
    });
    return () => { newSocket.close(); };
  }, []);

  useEffect(() => {
    if (socket && currentChatId) {
      socket.emit("join_chat", currentChatId);
      setActiveUsers(1);
    }
  }, [currentChatId, socket]);

  const fetchChats = useCallback(async (searchQuery = "") => {
    try {
      const url = searchQuery ? `${API_URL}/api/chats?search=${encodeURIComponent(searchQuery)}` : `${API_URL}/api/chats`;
      const res = await fetch(url);
      const data = await res.json();
      setChats(data);
      if (!currentChatId && data.length > 0) {
        const firstActive = data.find((c: Chat) => !c.isArchived);
        if (firstActive) setCurrentChatId(firstActive.id);
      }
    } catch (error) {
      console.error("Erro ao buscar do banco", error);
    }
  }, [currentChatId]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const searchChats = (query: string) => { fetchChats(query); };

  const createNewChat = async () => {
    const newChat: Chat = { id: nanoid(), title: "Novo Chat", messages: [], createdAt: Date.now(), updatedAt: Date.now(), isPinned: false, isArchived: false };
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

  const deleteAllArchived = async () => {
    const archivedChats = chats.filter(c => c.isArchived);
    setChats(prev => prev.filter(c => !c.isArchived));
    if (archivedChats.some(c => c.id === currentChatId)) setCurrentChatId(null);
    // Remove todos um a um
    for (const chat of archivedChats) {
      await fetch(`${API_URL}/api/chats/${chat.id}`, { method: "DELETE" });
    }
  };

  const selectChat = (chatId: string) => setCurrentChatId(chatId);

  const addMessage = async (message: Message) => {
    if (!currentChatId) return;
    setChats((prev) => prev.map((chat) => {
      if (chat.id === currentChatId) {
        const title = chat.messages.length === 0 && message.role === "user" ? message.content.substring(0, 50) : chat.title;
        return { ...chat, messages: [...chat.messages, message], updatedAt: Date.now(), title };
      }
      return chat;
    }));
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

  const togglePinChat = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    const isPinned = !chat.isPinned;
    setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, isPinned } : c));
    await fetch(`${API_URL}/api/chats`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chat, isPinned, updated_at: Date.now() })
    });
  };

  const toggleArchiveChat = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    const isArchived = !chat.isArchived;
    setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, isArchived, isPinned: false } : c)); // Desfixa ao arquivar
    if (isArchived && currentChatId === chatId) setCurrentChatId(null);
    await fetch(`${API_URL}/api/chats`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chat, isArchived, isPinned: false, updated_at: Date.now() })
    });
  };

  const currentChat = chats.find((c) => c.id === currentChatId) || null;

  return (
    <ChatContext.Provider value={{ chats, currentChatId, currentChat, activeUsers, createNewChat, deleteChat, deleteAllArchived, selectChat, addMessage, removeMessage, updateChatTitle, togglePinChat, toggleArchiveChat, searchChats }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) throw new Error("useChat deve ser usado dentro de ChatProvider");
  return context;
}
