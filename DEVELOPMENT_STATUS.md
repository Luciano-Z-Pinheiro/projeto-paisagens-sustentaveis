# ChatBot Projeto Paisagens Sustentáveis - Status de Desenvolvimento

## ✅ Funcionalidades Implementadas

### Interface e Layout
- **Sidebar**: Histórico de chats com opção de criar novo chat, deletar chats e alternar tema
- **Chat Area**: Área principal com mensagens, header com título e ID do chat
- **Input Area**: Campo de texto para digitar mensagens + botão de envio
- **Tema Claro/Escuro**: Toggle de tema na sidebar com cores customizadas
  - Tema Claro: Branco predominante, preto e cinza para detalhes
  - Tema Escuro: Inverso - fundo escuro, branco/cinza claro para texto
- **Cor de Destaque**: Verde esmeralda (#10B981) para botões e elementos interativos

### Funcionalidades do Chat
- **Criação Automática de Chat**: Primeiro chat é criado automaticamente ao carregar
- **Histórico de Chats**: Armazenado em localStorage com persistência entre sessões
- **Geração de IDs**: user_id, chat_id gerados e armazenados
- **Renderização de Mensagens**: Bolhas de chat diferenciadas para usuário (verde) e IA (cinza)
- **Sidebar Colapsável**: Em mobile, sidebar pode ser aberta/fechada com botão flutuante

### Integração com n8n
- **Webhook Configurado**: URL do webhook pronta para receber requisições
- **Estrutura de Payload**: Enviando user_id, chat_id, message e timestamp
- **Resposta da IA**: Estrutura pronta para receber resposta do webhook

## 🔧 Problema Identificado

O botão de envio está desabilitado por padrão quando o input está vazio. Após digitar uma mensagem, o botão deveria ficar habilitado, mas isso não está acontecendo corretamente. A lógica de habilitação do botão precisa ser revisada.

## 📋 Próximos Passos

1. Corrigir a lógica de habilitação do botão de envio
2. Testar o envio de mensagens e recebimento de respostas do webhook
3. Adicionar feedback visual durante o carregamento (spinner)
4. Melhorar a UX com animações de entrada de mensagens
5. Adicionar função de editar título do chat
6. Adicionar função de limpar histórico de chats

## 🎨 Design Implementado

- **Tipografia**: Sistema de fontes limpo com pesos diferenciados
- **Espaçamento**: Generoso para melhor legibilidade
- **Cores**: Verde esmeralda como cor primária, cinza para elementos secundários
- **Animações**: Transições suaves de 150-200ms
- **Responsividade**: Layout adaptativo para mobile e desktop

## 📁 Estrutura de Arquivos

```
client/src/
├── pages/
│   ├── ChatPage.tsx          # Página principal do chat
│   ├── Home.tsx              # Página padrão (não usada)
│   └── NotFound.tsx          # Página 404
├── components/
│   ├── Sidebar.tsx           # Componente da sidebar
│   ├── ChatMessage.tsx       # Componente de mensagem
│   └── ui/                   # Componentes shadcn/ui
├── contexts/
│   ├── ChatContext.tsx       # Contexto de gerenciamento de chats
│   └── ThemeContext.tsx      # Contexto de tema (já existia)
├── App.tsx                   # Componente raiz
├── index.css                 # Estilos globais com cores customizadas
└── main.tsx                  # Entrada da aplicação
```

## 🌐 Webhook do n8n

URL: `https://ibs-n8n.biotracebrasil.com.br/webhook-test/chatbot-projeto-pps`

Payload enviado:
```json
{
  "user_id": "string",
  "chat_id": "string",
  "message": "string",
  "timestamp": "number"
}
```

Resposta esperada:
```json
{
  "response": "string"
}
```
