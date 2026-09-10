import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, User, ArrowRight, Leaf } from "lucide-react";
import { navigate } from "wouter/use-browser-location";
import { useNavigate } from "react-router-dom";

export function AuthPage() {
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  
  // Estado para alternar entre Login e Cadastro
  const [isLogin, setIsLogin] = useState(true);
  
  // Estados dos campos do formulário
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("ESPIÃO DA TELA - Usuário atual:", user);
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      
      // O PULO DO GATO: Força o redirecionamento imediato em caso de sucesso!
      navigate("/"); 
      
    } catch (error) {
      console.error("Erro no AuthPage:", error);
      alert("Erro ao entrar. Verifique suas credenciais.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Trocamos o fundo genérico pela cor brand-light
    <div className="min-h-screen flex items-center justify-center bg-brand-light p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        
        {/* INSERÇÃO DA LOGO 1 AQUI */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Logo Oficial do Projeto" 
            className="h-24 object-contain" 
          />
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? "Acesso ao Sistema" : "Criar Nova Conta"}
        </h2>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email sempre aparece */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="email"
              required
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Nome de usuário só aparece no Cadastro */}
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                required
                placeholder="Como quer ser chamado?"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all animate-in slide-in-from-top-2"
              />
            </div>
          )}

          {/* Senha sempre aparece */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="password"
              required
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Confirmação de senha só aparece no Cadastro */}
          {!isLogin && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                required
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all animate-in slide-in-from-top-2"
              />
            </div>
          )}

          {/* Exibição de Erro Local */}
          {localError && (
            <p className="text-destructive text-sm font-medium text-center bg-destructive/10 py-2 rounded">
              {localError}
            </p>
          )}

          {/* Botão de Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Toggle Login/Cadastro */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setLocalError("");
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin 
              ? "Não tem uma conta? Cadastre-se" 
              : "Já tem uma conta? Faça login"}
          </button>
        </div>

      </div>
    </div>
  );
}