import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext"; // Ajuste o caminho se necessário

// URL do Backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface Report {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
  is_archived: boolean;
  username?: string;
}

interface ReportContextType {
  reports: Report[];
  activeUsers: string[];
  isLoading: boolean;
  archiveReport: (id: string, isArchived: boolean) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  refreshReports: () => Promise<void>;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Busca inicial das planilhas
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Configuração do WebSocket (Tempo Real) e carga inicial
  useEffect(() => {
    if (!user || !token) return;

    fetchReports();

    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Entra no "dashboard global"
    newSocket.emit("join_dashboard", { username: user.username });

    // Atualiza quem está online
    newSocket.on("active_users", (users: string[]) => setActiveUsers(users));

    // Se o n8n gerar um relatório novo, ou alguém deletar/arquivar, recarrega a lista
    newSocket.on("new_report_generated", fetchReports);
    newSocket.on("report_updated", fetchReports);

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  // Função para Arquivar/Desarquivar
  const archiveReport = async (id: string, isArchived: boolean) => {
    await fetch(`${API_URL}/api/reports/${id}/archive`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ is_archived: isArchived })
    });
  };

  // Função para Excluir
  const deleteReport = async (id: string) => {
    await fetch(`${API_URL}/api/reports/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  return (
    <ReportContext.Provider 
      value={{ 
        reports, 
        activeUsers, 
        isLoading, 
        archiveReport, 
        deleteReport, 
        refreshReports: fetchReports 
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) throw new Error("useReports deve ser usado dentro de um ReportProvider");
  return context;
};