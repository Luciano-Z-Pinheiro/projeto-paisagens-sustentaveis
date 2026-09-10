import React, { useState } from "react";
import { Calendar, Download, Loader2, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../contexts/AuthContext"; 
import { useReports } from "../contexts/ReportContext"; 

const N8N_WEBHOOK_URL = "https://ibs-n8n.biotracebrasil.com.br/webhook/automacao-projeto-pps"; 
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function MainContent() {
  const { user, token } = useAuth();
  const { refreshReports } = useReports();
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return alert("Selecione o período completo!");

    setIsGenerating(true);
    setLastGeneratedUrl(null);

    const title = `Relatorio_${startDate}_a_${endDate}.xlsx`;

    try {
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data_inicial: startDate,
          data_final: endDate,
          usuario_solicitante: user?.username,
          email_solicitante: user?.email
        }),
      });

      if (!n8nResponse.ok) throw new Error("Erro no n8n ao gerar planilha.");

      const blob = await n8nResponse.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, file_url: "download_direto" }),
      });

      setLastGeneratedUrl("sucesso"); 
      refreshReports(); 

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Ocorreu um erro ao processar a planilha. Verifique o n8n.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    // bg-background controla o fundo geral (branco no claro, escuro no dark)
    <main className="flex-1 bg-background flex items-center justify-center p-8 transition-colors">
      
      {/* bg-card controla o fundo do formulário e border-border a linha de contorno */}
      <div className="max-w-2xl w-full bg-card text-card-foreground rounded-xl shadow-lg overflow-hidden border border-border transition-colors">
        
        {/* Cabeçalho usa bg-primary (Marrom no claro, Verde Sálvia no escuro) */}
        <div className="bg-primary p-6 text-primary-foreground text-center transition-colors">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-90" />
          <h1 className="text-2xl font-bold">Gerador de Planilhas</h1>
          <p className="text-primary-foreground/80 mt-1 text-sm">
            Selecione o período abaixo para processar os dados fixos.
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleGenerateReport} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              
              {/* Data Inicial */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Data Inicial
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {/* Ícone com cor neutra dinâmica */}
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="date"
                    required
                    disabled={isGenerating}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    // Abre o calendário clicando em qualquer lugar do campo
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    // dark:[color-scheme:dark] resolve o ícone invisível
                    // cursor-pointer muda o mouse para a "mãozinha" indicando clique
                    className="block w-full pl-10 pr-3 py-2 bg-background border border-border text-foreground rounded-md focus:ring-primary focus:border-primary transition-colors cursor-pointer dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Data Final */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Data Final
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="date"
                    required
                    disabled={isGenerating}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className="block w-full pl-10 pr-3 py-2 bg-background border border-border text-foreground rounded-md focus:ring-primary focus:border-primary transition-colors cursor-pointer dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Botão Gerar - usa a cor primária */}
            <button
              type="submit"
              disabled={isGenerating}
              className={`w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-bold text-primary-foreground transition-colors 
                ${isGenerating 
                  ? "bg-primary/50 cursor-not-allowed" 
                  : "bg-primary hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Processando dados no n8n...
                </>
              ) : (
                "Gerar Planilha"
              )}
            </button>
          </form>

          {/* Área de Sucesso */}
          {lastGeneratedUrl && !isGenerating && (
            <div className="mt-8 p-4 bg-accent/20 border border-accent text-accent-foreground rounded-lg text-center animate-in fade-in zoom-in duration-300">
              <h3 className="font-semibold mb-2">Planilha gerada com sucesso!</h3>
              <p className="text-sm opacity-90">
                O download foi iniciado automaticamente. Verifique sua pasta de downloads.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}