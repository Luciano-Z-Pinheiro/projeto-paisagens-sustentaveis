import React, { JSX } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contextos
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReportProvider } from './contexts/ReportContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Telas e Componentes
import { AuthPage } from './pages/AuthPage'; // Se ficar vermelho, mude para: import AuthPage from './pages/AuthPage';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent'; 

// Componente para proteger a tela principal
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// O Novo Layout Fixo
const DashboardLayout = () => {
  return (
    <ReportProvider>
      <div className="flex h-screen w-full overflow-hidden bg-gray-100">
        <Sidebar />
        <MainContent />
      </div>
    </ReportProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Rotas Públicas (Ambas apontam para a sua página que gerencia Login/Cadastro) */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
          {/* Rota Privada (A Ferramenta) */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            } 
          />

          {/* Redireciona qualquer rota perdida para a principal */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  );
}