import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Archive, Trash2, ArchiveRestore, DownloadCloud, Sun, Moon, LogOut, Check, X } from "lucide-react";
import { useReports } from "../contexts/ReportContext"; 
import { useAuth } from "../contexts/AuthContext"; // Importar o hook de autenticação
import { useTheme } from "../contexts/ThemeContext";

export function Sidebar() {
  const { reports, archiveReport, deleteReport, isLoading } = useReports();
  const { logout } = useAuth(); // Obter a função de logout do contexto de autenticação
  const [showArchived, setShowArchived] = useState(false);

  const { isDarkMode, toggleTheme } = useTheme();

  const activeReports = reports.filter((r) => !r.is_archived);
  const archivedReports = reports.filter((r) => r.is_archived);
  const displayReports = showArchived ? archivedReports : activeReports;
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  return (
    <aside className="w-64 h-screen bg-sidebar text-sidebar-foreground flex flex-col shadow-lg border-r border-sidebar-border transition-colors">
      {/* CABEÇALHO COM A LOGO MAIOR E SEM SOBRA */}
      <div className="py-4 px-2 border-b border-sidebar-border flex justify-center items-center transition-colors">
        <img 
          src={isDarkMode ? "/logo3.png" : "/logo2.png"} 
          alt="Logo do Projeto" 
          // Aqui está o truque: w-52 (largura grande) e h-auto (altura abraça a imagem)
          className="w-52 h-auto object-contain transition-all duration-300" 
        />
      </div>

      {/* BOTÃO DE ALTERNAR VISUALIZAÇÃO */}
      <div className="p-4">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="w-full py-2 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded transition-colors"
        >
          {showArchived ? "Ver Planilhas Ativas" : "Ver Planilhas Arquivadas"}
        </button>
      </div>

      {/* LISTA DE PLANILHAS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center mt-4">Carregando...</p>
        ) : displayReports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Nenhuma planilha {showArchived ? "arquivada" : "gerada"}.
          </p>
        ) : (
          displayReports.map((report) => (
            <div 
              key={report.id} 
              // Removido o 'group' e ajustado o fundo para dar destaque
              className="flex flex-col p-3 bg-sidebar-accent/20 rounded-lg border border-sidebar-border/50 hover:border-sidebar-ring transition-colors"
            >
              
              {/* 1. TÍTULO E ÍCONE */}
              <div className="flex items-center gap-2 overflow-hidden mb-3">
                <FileSpreadsheet size={16} className="text-sidebar-ring shrink-0" />
                <span className="text-sm font-medium truncate text-sidebar-foreground" title={report.title}>
                  {report.title}
                </span>
              </div>

              {/* 2. BOTÕES DE AÇÃO (Sempre visíveis) */}
              <div className="flex items-center gap-2 mb-3">
                {/* Botão Baixar */}
                <button
                  onClick={() => {/* Sua função de baixar aqui, ex: window.open(report.file_url) */}}
                  className="flex-1 flex justify-center items-center p-1.5 bg-sidebar-accent/50 text-sidebar-foreground rounded hover:bg-sidebar-accent transition-colors"
                  title="Baixar Planilha"
                >
                  <DownloadCloud size={16} />
                </button>

                {/* Botão Arquivar / Restaurar */}
                <button
                  onClick={() => archiveReport(report.id, !report.is_archived)}
                  className="flex-1 flex justify-center items-center p-1.5 bg-sidebar-accent/50 text-sidebar-foreground rounded hover:bg-sidebar-accent transition-colors"
                  title={report.is_archived ? "Restaurar" : "Arquivar"}
                >
                  {report.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                </button>

                {/* Botão Excluir com Dupla Confirmação */}
                {reportToDelete === report.id ? (
                  // PASSO 2: MOSTRA OS BOTÕES DE CONFIRMAR OU CANCELAR
                  <div className="flex-1 flex gap-1">
                    <button
                      onClick={() => {
                        deleteReport(report.id);
                        setReportToDelete(null); // Limpa a memória após excluir
                      }}
                      className="flex-1 flex justify-center items-center p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      title="Sim, quero excluir!"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setReportToDelete(null)}
                      className="flex-1 flex justify-center items-center p-1.5 bg-sidebar-accent/50 text-sidebar-foreground rounded hover:bg-sidebar-accent transition-colors"
                      title="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  // PASSO 1: MOSTRA A LIXEIRA NORMAL
                  <button
                    onClick={() => setReportToDelete(report.id)}
                    className="flex-1 flex justify-center items-center p-1.5 bg-destructive/10 text-destructive rounded hover:bg-destructive hover:text-white transition-colors"
                    title="Excluir Definitivamente"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* 3. METADADOS (Data e Usuário) */}
              <div className="pt-2 border-t border-sidebar-border text-[11px] text-sidebar-foreground/70 leading-relaxed">
                <p>
                  <span className="font-semibold opacity-80">Gerado em:</span>{" "}
                  {new Date(report.created_at).toLocaleDateString("pt-BR")} às {new Date(report.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="truncate" title={report.username || "Sistema"}>
                  <span className="font-semibold opacity-80">Por:</span> {report.username || "Sistema"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RODAPÉ COM BOTÕES DE TEMA E SAIR */}
      <div className="p-4 border-t border-border flex items-center justify-between bg-card">
        
        {/* Botão de Tema */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/80 rounded transition-colors text-secondary-foreground text-sm"
          title="Alternar Tema"
        >
          {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Botão de Sair */}
        <button
          onClick={logout}
          className="p-2 bg-destructive/80 hover:bg-destructive rounded text-destructive-foreground transition-colors"
          title="Sair do Sistema"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}