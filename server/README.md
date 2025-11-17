# 📚 Backend - API de Livros

Backend REST API para gerenciar livros e projetos do aplicativo de biblioteca.

## 🚀 Como Usar

### Instalação

As dependências já estão instaladas no projeto raiz. O backend usa:
- Express.js
- TypeScript
- Cors

### Executar o Servidor

```bash
# Desenvolvimento
npm run dev:server

# Ou usando tsx diretamente
npx tsx server/index.ts
```

O servidor iniciará na porta **5174** (ou a porta definida em `PORT`).

## 📡 Endpoints da API

### Projetos

- `GET /api/projects` - Listar todos os projetos
- `GET /api/projects/:id` - Obter projeto específico
- `POST /api/projects` - Criar novo projeto
- `PUT /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Deletar projeto

### Saúde

- `GET /api/health` - Verificar status do servidor

## 📁 Estrutura

```
server/
├── index.ts          # Servidor principal
├── types.ts          # Tipos TypeScript
├── storage.ts        # Gerenciamento de dados (JSON)
├── routes/
│   └── projects.ts   # Rotas de projetos
├── data/             # Dados armazenados (JSON)
└── tsconfig.json     # Configuração TypeScript
```

## 💾 Armazenamento

Atualmente os dados são salvos em `server/data/projects.json`. Este é um formato simples que pode ser migrado para:
- Firebase Firestore
- MongoDB
- PostgreSQL
- Outros bancos de dados

## 🔄 Próximos Passos

1. Adicionar autenticação
2. Adicionar validação de dados
3. Adicionar paginação
4. Migrar para banco de dados real
5. Adicionar upload de arquivos (capas)

