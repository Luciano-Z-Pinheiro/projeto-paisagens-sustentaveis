import React, { createContext, useContext, useEffect, useState } from "react";
import { nanoid } from "nanoid";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  createNewChat: () => void;
  deleteChat: (chatId: string) => void;
  selectChat: (chatId: string) => void;
  addMessage: (message: Message) => void;
  updateChatTitle: (chatId: string, title: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = "chatbot_chats";
const CURRENT_CHAT_KEY = "chatbot_current_chat";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Carregar chats do localStorage
  useEffect(() => {
    const storedChats = localStorage.getItem(STORAGE_KEY);
    const storedCurrentChatId = localStorage.getItem(CURRENT_CHAT_KEY);

    if (storedChats) {
      try {
        const parsedChats = JSON.parse(storedChats);
        setChats(parsedChats);
        if (storedCurrentChatId && parsedChats.some((c: Chat) => c.id === storedCurrentChatId)) {
          setCurrentChatId(storedCurrentChatId);
        } else if (parsedChats.length > 0) {
          setCurrentChatId(parsedChats[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar chats:", error);
      }
    }
  }, []);

  // Salvar chats no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  // Salvar chat atual no localStorage
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem(CURRENT_CHAT_KEY, currentChatId);
    }
  }, [currentChatId]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: nanoid(),
      title: "Novo Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      const remaining = chats.filter((c) => c.id !== chatId);
      if (remaining.length > 0) {
        setCurrentChatId(remaining[0].id);
      } else {
        setCurrentChatId(null);
      }
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const addMessage = (message: Message) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === currentChatId) {
          // Atualizar título se for a primeira mensagem do usuário
          const title =
            chat.messages.length === 0 && message.role === "user"
              ? message.content.substring(0, 50)
              : chat.title;

          return {
            ...chat,
            messages: [...chat.messages, message],
            updatedAt: Date.now(),
            title,
          };
        }
        return chat;
      })
    );
  };

  const updateChatTitle = (chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title } : chat
      )
    );
  };

  const currentChat = chats.find((c) => c.id === currentChatId) || null;

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChatId,
        currentChat,
        createNewChat,
        deleteChat,
        selectChat,
        addMessage,
        updateChatTitle,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat deve ser usado dentro de ChatProvider");
  }
  return context;
}
