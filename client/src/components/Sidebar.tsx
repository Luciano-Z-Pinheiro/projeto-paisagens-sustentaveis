import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquarePlus, 
  Trash2, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  Edit2, 
  Check
} from "lucide-react";
import { useState } from "react";
import { Search } from "lucide-react";

const { chats, currentChatId, createNewChat, deleteChat, selectChat, updateChatTitle, searchChats } = useChat();

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { 
    chats, 
    currentChatId, 
    createNewChat, 
    deleteChat, 
    selectChat, 
    updateChatTitle 
  } = useChat();
  const { theme, toggleTheme } = useTheme();
  
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = (e: React.MouseEvent, chatId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent, chatId: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      updateChatTitle(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 lg:z-auto flex flex-col transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <h1 className="font-semibold text-sidebar-foreground text-sm">Chats</h1>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-sidebar-accent rounded-md transition-colors"
          >
            <X size={20} className="text-sidebar-foreground" />
          </button>
        </div>

        {/* Novo Chat Button */}
        <div className="p-4 border-b border-sidebar-border">
          <Button
            onClick={createNewChat}
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            size="sm"
          >
            <MessageSquarePlus size={16} className="mr-2" />
            Novo Chat
          </Button>
        </div>

        <div className="p-4 border-b border-sidebar-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/50" />
            <input
              type="text"
              placeholder="Pesquisar em tudo..."
              onChange={(e) => searchChats(e.target.value)}
              className="w-full bg-sidebar-accent/50 text-sm text-sidebar-foreground rounded-md pl-9 pr-3 py-2 border-none outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-sidebar-foreground/60 text-sm">
                Nenhum chat ainda. Crie um novo!
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className="group relative flex items-center w-full"
                  onMouseEnter={() => setHoveredChatId(chat.id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                >
                  {editingChatId === chat.id ? (
                    <div className="flex items-center w-full px-2 py-1.5 bg-sidebar-accent rounded-md">
                      <input
                        autoFocus
                        className="flex-1 bg-transparent border-none outline-none text-sm text-sidebar-foreground"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(e, chat.id)}
                        onBlur={(e) => handleSaveEdit(e, chat.id)}
                      />
                      <button onMouseDown={(e) => handleSaveEdit(e, chat.id)} className="p-1">
                        <Check size={14} className="text-primary" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          selectChat(chat.id);
                          onToggle(); // Fechar sidebar em mobile
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors truncate text-sm pr-16 ${
                          currentChatId === chat.id
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`}
                      >
                        {chat.title}
                      </button>
                      
                      {/* Botões de Ação */}
                      {(hoveredChatId === chat.id || currentChatId === chat.id) && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-sidebar-accent via-sidebar-accent to-transparent pl-4 pr-1">
                          <button
                            onClick={(e) => handleStartEdit(e, chat.id, chat.title)}
                            className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors"
                            title="Renomear"
                          >
                            <Edit2 size={14} className="text-sidebar-foreground/70" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                            className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} className="text-destructive" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer - Theme Toggle */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center p-2 rounded-md hover:bg-sidebar-accent transition-colors"
          >
            {theme === "light" ? (
              <Moon size={18} className="text-sidebar-foreground" />
            ) : (
              <Sun size={18} className="text-sidebar-foreground" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-4 lg:hidden z-40 p-2 bg-accent text-accent-foreground rounded-full shadow-lg hover:bg-accent/90 transition-colors"
      >
        <Menu size={24} />
      </button>
    </>
  );
}
