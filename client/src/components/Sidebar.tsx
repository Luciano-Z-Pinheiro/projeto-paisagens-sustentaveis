import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MessageSquarePlus, 
  Trash2, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  Edit2, 
  Check,
  Search,
  MoreVertical,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Download,
  FolderArchive,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

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
    deleteAllArchived,
    selectChat, 
    updateChatTitle,
    togglePinChat,
    toggleArchiveChat,
    searchChats
  } = useChat();
  
  const { theme, toggleTheme } = useTheme();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewingArchived, setViewingArchived] = useState(false);
  
  // Controle dos Diálogos de Exclusão (Duas etapas)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStartEdit = (e: React.MouseEvent, chatId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
    setOpenMenuId(null);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent, chatId: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      updateChatTitle(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  // Exportação formatada em TXT
  const handleExportChat = (e: React.MouseEvent, chat: any) => {
    e.stopPropagation();
    setOpenMenuId(null);
    
    let content = `Chat: ${chat.title}\nData de Criação: ${new Date(chat.createdAt).toLocaleString()}\n=================================================\n\n`;
    
    chat.messages.forEach((msg: any) => {
      const role = msg.role === 'user' ? 'Usuário' : 'Assistente (PPS)';
      const time = new Date(msg.timestamp).toLocaleString();
      content += `[${time}] ${role}:\n${msg.content}\n\n-------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    downloadAnchorNode.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    toast.success("Chat exportado em formato TXT com sucesso!");
  };

  // Divisão dos chats
  const activeChats = chats.filter(c => !c.isArchived);
  const archivedChats = chats.filter(c => c.isArchived);
  const pinnedChats = activeChats.filter(c => c.isPinned);
  const recentChats = activeChats.filter(c => !c.isPinned);

  const displayChats = viewingArchived ? archivedChats : activeChats;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />}

      <aside className={`fixed lg:relative left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 lg:z-auto flex flex-col transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        
        {/* Header Fixo */}
        <div className="flex-none p-4 border-b border-sidebar-border bg-sidebar/95 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-semibold text-sidebar-foreground text-sm tracking-tight">
              {viewingArchived ? "Chats Arquivados" : "Histórico de Chats"}
            </h1>
            <button onClick={onToggle} className="lg:hidden p-1 hover:bg-sidebar-accent rounded-md transition-colors">
              <X size={20} className="text-sidebar-foreground" />
            </button>
          </div>

          {!viewingArchived ? (
            <Button onClick={createNewChat} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200" size="sm">
              <MessageSquarePlus size={16} className="mr-2" /> Nova Conversa
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => setViewingArchived(false)} className="w-full" size="sm">
                <ArrowLeft size={16} className="mr-2" /> Voltar aos Ativos
              </Button>
              {archivedChats.length > 0 && (
                <Button variant="destructive" onClick={() => setIsDeletingAll(true)} className="w-full" size="sm">
                  <Trash2 size={16} className="mr-2" /> Excluir Todos
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Busca Fixa */}
        <div className="flex-none p-3 border-b border-sidebar-border bg-sidebar">
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              onChange={(e) => searchChats(e.target.value)}
              className="w-full bg-background/50 text-sm text-foreground rounded-lg pl-9 pr-3 py-2 border border-transparent focus:border-primary/30 focus:bg-background outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {!viewingArchived && (
              <button 
                onClick={() => setViewingArchived(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground font-medium hover:bg-sidebar-accent rounded-lg border border-transparent hover:border-border transition-all"
              >
                <FolderArchive size={18} className="text-primary" />
                Acessar Arquivados ({archivedChats.length})
              </button>
            )}

            {displayChats.length === 0 ? (
              <div className="p-4 text-center text-sidebar-foreground/60 text-sm">
                {viewingArchived ? "Nenhum chat arquivado." : "Nenhum chat encontrado."}
              </div>
            ) : (
              <>
                {/* Seção Fixados (Apenas na view principal) */}
                {!viewingArchived && pinnedChats.length > 0 && (
                  <div className="space-y-1">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fixados</p>
                    {pinnedChats.map(chat => renderChatButton(chat))}
                  </div>
                )}

                {/* Seção Recentes / Arquivados */}
                <div className="space-y-1">
                  {!viewingArchived && pinnedChats.length > 0 && (
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Recentes</p>
                  )}
                  {(viewingArchived ? archivedChats : recentChats).map(chat => renderChatButton(chat))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer - Theme Toggle */}
        <div className="p-4 border-t border-sidebar-border">
          <button onClick={toggleTheme} className="w-full flex items-center justify-center p-2 rounded-md hover:bg-sidebar-accent transition-colors">
            {theme === "light" ? <Moon size={18} className="text-sidebar-foreground" /> : <Sun size={18} className="text-sidebar-foreground" />}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button onClick={onToggle} className="fixed bottom-4 left-4 lg:hidden z-40 p-2 bg-accent text-accent-foreground rounded-full shadow-lg hover:bg-accent/90 transition-colors">
        <Menu size={24} />
      </button>

      {/* Diálogos de Confirmação de Exclusão (2 Etapas) */}
      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle size={20}/> Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o chat e todas as suas mensagens do servidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (chatToDelete) deleteChat(chatToDelete);
                setChatToDelete(null);
                toast.success("Chat excluído com sucesso.");
              }}
            >
              Sim, excluir chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeletingAll} onOpenChange={setIsDeletingAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle size={20}/> Esvaziar Arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>TODOS</strong> os chats arquivados. Esta ação é irreversível. Tem certeza?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                deleteAllArchived();
                setIsDeletingAll(false);
                toast.success("Todos os chats arquivados foram excluídos.");
              }}
            >
              Sim, excluir todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  // Função auxiliar para renderizar os itens do chat para não repetir código
  function renderChatButton(chat: any) {
    return (
      <div key={chat.id} className="group relative flex items-center w-full">
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
              onClick={() => { selectChat(chat.id); onToggle(); }}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors truncate text-sm pr-10 ${
                currentChatId === chat.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              {chat.title}
            </button>
            
            <div className={`absolute right-1 top-1/2 -translate-y-1/2 ${openMenuId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
              <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === chat.id ? null : chat.id); }} className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors">
                <MoreVertical size={16} className="text-sidebar-foreground/70" />
              </button>

              {openMenuId === chat.id && (
                <div ref={menuRef} className="absolute right-0 top-8 w-44 bg-card border border-border rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* Renomear e Exportar estão disponíveis para ambos (Ativos e Arquivados) */}
                  <button onClick={(e) => handleStartEdit(e, chat.id, chat.title)} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                    <Edit2 size={14} /> Renomear
                  </button>
                  <button onClick={(e) => handleExportChat(e, chat)} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                    <Download size={14} /> Exportar TXT
                  </button>
                  <div className="h-px bg-border my-1" />

                  {/* Lógica se for ATIVO */}
                  {!viewingArchived ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); togglePinChat(chat.id); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                        {chat.isPinned ? <><PinOff size={14} /> Desfixar</> : <><Pin size={14} /> Fixar no Topo</>}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleArchiveChat(chat.id); setOpenMenuId(null); toast.success("Chat arquivado."); }} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                        <Archive size={14} /> Arquivar
                      </button>
                    </>
                  ) : (
                    /* Lógica se for ARQUIVADO */
                    <>
                      <button onClick={(e) => { e.stopPropagation(); toggleArchiveChat(chat.id); setOpenMenuId(null); toast.success("Chat restaurado."); }} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                        <ArchiveRestore size={14} /> Restaurar Chat
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setChatToDelete(chat.id); }} className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2">
                        <Trash2 size={14} /> Excluir
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
}
