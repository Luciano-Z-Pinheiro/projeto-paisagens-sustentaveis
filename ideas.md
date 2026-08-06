# ChatBot Projeto Paisagens Sustentáveis - Design

## Abordagem Escolhida: Clean Minimalist Interface

### Design Movement
**Minimalism com foco em usabilidade** - Inspirado em interfaces modernas de chat como Manus AI, com ênfase em clareza, espaçamento generoso e hierarquia visual bem definida.

### Core Principles
1. **Clareza Radical**: Remover todo elemento desnecessário; cada pixel tem propósito
2. **Espaçamento Generoso**: Usar whitespace para criar respiração visual e reduzir fadiga cognitiva
3. **Hierarquia Intuitiva**: Tamanhos, pesos e cores guiam o olhar naturalmente
4. **Responsividade Nativa**: Layout adapta-se perfeitamente de mobile a desktop

### Color Philosophy
- **Tema Claro**: Branco predominante (#FFFFFF), preto (#1A1A1A) para texto, cinza (#E5E5E5, #F5F5F5) para elementos secundários
- **Tema Escuro**: Inverso - fundo escuro (#0F0F0F), branco/cinza claro para texto, cinza escuro (#1A1A1A) para elementos
- **Accent Color**: Verde suave (#10B981) para botões, ações e elementos interativos - conecta com tema de "Paisagens Sustentáveis"

### Layout Paradigm
- **Sidebar esquerda**: Histórico de chats (colapsável)
- **Área principal**: Janela de chat com mensagens
- **Input area**: Campo de texto fixo no rodapé
- **Header**: Título e toggle de tema

### Signature Elements
1. **Divider sutil**: Linha cinza clara entre sidebar e chat
2. **Mensagens com bolhas**: Usuário à direita (verde suave), IA à esquerda (cinza)
3. **Ícones minimalistas**: De lucide-react para ações

### Interaction Philosophy
- **Transições suaves**: Animações de 150-200ms em aberturas/fechamentos
- **Feedback imediato**: Botões respondem ao click com scale suave
- **Hover states**: Mudança sutil de cor/background
- **Loading states**: Spinner discreto para requisições

### Animation
- Entrada de mensagens: fade-in + slide-up suave (150ms)
- Toggle de sidebar: slide-out/in (200ms)
- Hover em botões: scale(1.02) com transição suave
- Respeitando `prefers-reduced-motion`

### Typography System
- **Display/Headings**: Geist Sans (font-weight: 600-700) - moderno, limpo
- **Body**: Geist Sans (font-weight: 400-500) - legível, neutro
- **Monospace**: JetBrains Mono para códigos (se necessário)

### Brand Essence
**Assistente inteligente e acessível para sustentabilidade ambiental** - Confiável, claro, eficiente.

**Personality**: Profissional, amigável, direto.

**Brand Voice**:
- Headlines: "Conversa com o Assistente de Paisagens Sustentáveis"
- CTAs: "Enviar mensagem", "Novo chat", "Limpar histórico"
- Exemplo: "Olá! Como posso ajudar com seu projeto de paisagens sustentáveis?"

### Signature Brand Color
**Verde Esmeralda (#10B981)** - Representa sustentabilidade, crescimento e confiança.

## Especificações Técnicas

### Tema Claro
- Background: #FFFFFF
- Foreground (texto): #1A1A1A
- Sidebar: #F9FAFB
- Mensagem Usuário: #10B981 (verde)
- Mensagem IA: #F3F4F6 (cinza claro)
- Border: #E5E7EB

### Tema Escuro
- Background: #0F0F0F
- Foreground (texto): #F3F4F6
- Sidebar: #1A1A1A
- Mensagem Usuário: #10B981 (verde - mantém)
- Mensagem IA: #1F2937 (cinza escuro)
- Border: #374151

### Componentes Principais
1. **Sidebar**: Lista de chats com ícone de delete/editar
2. **Chat Area**: Scroll com mensagens, input fixo no rodapé
3. **Header**: Logo + Título + Toggle Tema + Menu
4. **Message Bubble**: Estilo diferente para usuário e IA

### Funcionalidades
- ✅ Histórico de chats (localStorage)
- ✅ Tema claro/escuro (localStorage)
- ✅ Integração com webhook n8n
- ✅ Geração de user_id, chat_id
- ✅ Envio de mensagens com contexto
- ✅ Sidebar colapsável
- ✅ Novo chat
- ✅ Deletar chat
