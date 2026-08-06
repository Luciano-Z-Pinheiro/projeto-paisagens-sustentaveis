import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquarePlus, Trash2, Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { chats, currentChatId, createNewChat, deleteChat, selectChat } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

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
                  className="group relative"
                  onMouseEnter={() => setHoveredChatId(chat.id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                >
                  <button
                    onClick={() => {
                      selectChat(chat.id);
                      onToggle(); // Fechar sidebar em mobile
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors truncate text-sm ${
                      currentChatId === chat.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    {chat.title}
                  </button>

                  {/* Delete Button */}
                  {hoveredChatId === chat.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-red-500/20 rounded-md transition-colors"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
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
