import { useState, useRef, useEffect, useCallback } from "react";
import { useChat, Message } from "@/contexts/ChatContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

// Componente interno que usa o contexto
function ChatPageContent() {
  const { currentChat, activeUsers, addMessage, createNewChat, removeMessage } = useChat();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || !currentChat || isLoading) return;

    // Só adiciona a mensagem do usuário se não for um reenvio
    if (!overrideText) {
      const userMessage: Message = {
        id: nanoid(),
        role: "user",
        content: textToSend,
        timestamp: Date.now(),
      };
      
      addMessage(userMessage);
      setInput("");
      
      // Reseta a altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }

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
            message: textToSend,
            timestamp: Date.now(),
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
      toast.error("Falha na comunicação com o assistente.");
      
      // Adicionar mensagem de erro com a flag hasError
      const errorMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro de conexão ao processar sua solicitação. Verifique sua internet ou tente novamente.",
        timestamp: Date.now(),
        hasError: true, // Flag para habilitar o botão de reenviar
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = (errorMsg: Message) => {
    if (!currentChat) return;
    
    // Remove a mensagem de erro atual do chat
    if (removeMessage) {
      removeMessage(currentChat.id, errorMsg.id);
    }
    
    // Encontra a última mensagem do usuário para enviar novamente
    const lastUserMsg = [...currentChat.messages].reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Envia a mensagem com 'Enter' sem o 'Shift' pressionado
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
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-muted-foreground">
                Chat ID: {currentChat.id.substring(0, 8)}...
              </p>
              {activeUsers > 1 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {activeUsers} online
                </span>
              )}
            </div>
          </div>
          </header>
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
                <div className="text-4xl mb-4"><img src="/logo.png" alt="Logo Paisagens Sustentáveis" className="w-16 h-16 object-contain" /></div>
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
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                    onResend={handleResend}
                  />
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
          <div className="max-w-4xl mx-auto flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize do textarea
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Shift + Enter para quebrar linha)"
              disabled={isLoading}
              className="flex-1 resize-none bg-input text-foreground placeholder:text-muted-foreground rounded-md border border-border px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-y-auto"
              style={{ minHeight: "44px", maxHeight: "200px" }}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-[44px] px-4"
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
