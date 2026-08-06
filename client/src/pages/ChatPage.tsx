import { useState, useRef, useEffect, useCallback } from "react";
import { useChat, Message } from "@/contexts/ChatContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

// Componente interno que usa o contexto
function ChatPageContent() {
  const { currentChat, addMessage, createNewChat } = useChat();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gerar ou recuperar user_id
  const [userId] = useState(() => {
    let stored = localStorage.getItem("user_id");
    if (!stored) {
      stored = nanoid();
      localStorage.setItem("user_id", stored);
    }
    return stored;
  });

  // Usar useCallback para evitar dependências infinitas
  const createNewChatCallback = useCallback(() => {
    createNewChat();
  }, [createNewChat]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  const sendMessage = async () => {
    if (!input.trim() || !currentChat || isLoading) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    // Adicionar mensagem do usuário
    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      // Enviar para o webhook do n8n (produção)
      const response = await fetch(
        "https://ibs-n8n.biotracebrasil.com.br/webhook/chatbot-projeto-pps",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            chat_id: currentChat.id,
            message: userMessage.content,
            timestamp: userMessage.timestamp,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Adicionar resposta da IA
      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: data.output || data.response || "Desculpe, não consegui processar sua mensagem.",
        timestamp: Date.now(),
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");

      // Adicionar mensagem de erro
      const errorMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        timestamp: Date.now(),
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Criar um chat automaticamente se não houver nenhum
  useEffect(() => {
    if (!currentChat) {
      createNewChatCallback();
    }
  }, [currentChat, createNewChatCallback]);

  if (!currentChat) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card px-4 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">
              ChatBot Projeto Paisagens Sustentáveis
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Chat ID: {currentChat.id.substring(0, 8)}...
            </p>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto">
            {currentChat.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-4xl mb-4">💬</div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Comece uma conversa
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  Faça perguntas sobre paisagens sustentáveis, projetos ambientais e muito mais.
                </p>
              </div>
            ) : (
              <>
                {currentChat.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Loader2 size={18} className="text-muted-foreground animate-spin" />
                    </div>
                    <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg rounded-bl-none">
                      <p className="text-sm">Processando...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => {
                const value = e.target.value;
                setInput(value);
                console.log('Input changed:', value);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 bg-input text-foreground placeholder:text-muted-foreground"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente wrapper que fornece o contexto
export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
}
