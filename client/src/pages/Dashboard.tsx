import React, { useState } from "react";
import { Calendar, Download, Loader2, FileSpreadsheet } from "lucide-react";
import { useAuth } from "../contexts/AuthContext"; // Ajuste o caminho
import { useReports } from "../contexts/ReportContext"; // Ajuste o caminho

// URL DO SEU WEBHOOK NO N8N
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
      // 1. Envia o comando para o n8n trabalhar e gerar o arquivo
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

      // Esperamos que o n8n devolva um JSON com a URL do arquivo: { "file_url": "https://..." }
      const n8nData = await n8nResponse.json();
      const fileUrl = n8nData.file_url;

      // 2. Salva o registro no nosso banco de dados
      await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, file_url: fileUrl }),
      });

      // 3. Mostra o botão de download e atualiza a lista
      setLastGeneratedUrl(fileUrl);
      refreshReports(); 

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Ocorreu um erro ao processar a planilha. Verifique o n8n.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="flex-1 bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        
        {/* Cabeçalho da Tela */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-90" />
          <h1 className="text-2xl font-bold">Gerador de Planilhas</h1>
          <p className="text-blue-100 mt-1 text-sm">
            Selecione o período abaixo para processar os dados fixos.
          </p>
        </div>

        {/* Formulário */}
        <div className="p-8">
          <form onSubmit={handleGenerateReport} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              
              {/* Data Inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    disabled={isGenerating}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Data Final */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    disabled={isGenerating}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Botão Gerar */}
            <button
              type="submit"
              disabled={isGenerating}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${isGenerating ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"} transition-colors`}
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

          {/* Área de Sucesso e Download */}
          {lastGeneratedUrl && !isGenerating && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-in fade-in zoom-in duration-300">
              <h3 className="text-green-800 font-semibold mb-2">Planilha gerada com sucesso!</h3>
              <a
                href={lastGeneratedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium shadow"
              >
                <Download className="w-4 h-4 mr-2" />
                Fazer Download Agora
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}