import { useState } from "react";
import { Message } from "@/contexts/ChatContext";
import { Bot, User, Copy, Check, RefreshCw } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: Message;
  onResend?: (message: Message) => void;
}

export function ChatMessage({ message, onResend }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 mb-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center relative">
          <Bot size={18} className="text-muted-foreground" />
        </div>
      )}
      
      <div className="relative max-w-xs lg:max-w-md xl:max-w-3xl flex flex-col gap-2">
        <div
          className={`px-4 py-3 rounded-lg break-words shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-none"
              : message.hasError 
                ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-none"
                : "bg-muted text-foreground rounded-bl-none"
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown>{message.content}</Streamdown>
            </div>
          )}
        </div>

        {/* Ações da IA (Copiar e Reenviar) */}
        {!isUser && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!message.hasError && (
              <button 
                onClick={handleCopy} 
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Copiar resposta"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            )}

            {message.hasError && onResend && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onResend(message)} 
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <RefreshCw size={12} className="mr-2" /> Tentar Novamente
              </Button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User size={18} className="text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
