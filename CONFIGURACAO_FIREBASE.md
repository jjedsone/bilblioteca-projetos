# 🔥 Configuração do Firebase - Biblioteca de Projetos

## ✅ Configuração Completa

O projeto está configurado para usar **Firestore** como banco de dados principal, substituindo o LocalForage.

### 📋 Variáveis de Ambiente

As credenciais do Firebase já estão configuradas com valores padrão no código. Se quiser usar variáveis de ambiente, crie um arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
VITE_FIREBASE_API_KEY=AIzaSyDwH61C4M9I1L8T26jBZw-EKlRIfBk6ijY
VITE_FIREBASE_AUTH_DOMAIN=biblioteca-86363.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=biblioteca-86363
VITE_FIREBASE_STORAGE_BUCKET=biblioteca-86363.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=716558210323
VITE_FIREBASE_APP_ID=1:716558210323:web:e6d7e5e6dfe781910c76e6
VITE_FIREBASE_MEASUREMENT_ID=G-L1Y3KX5V96
VITE_USE_FIRESTORE=true
```

### 🗂️ Estrutura do Firestore

**Coleção:** `projects`
- Cada documento representa um projeto/livro
- ID do documento = ID do projeto

**Sub-coleções (futuro):**
- `zustand-storage` - Estado do Zustand sincronizado

### 🔄 Como Funciona

1. **Storage Adapter:**
   - O Zustand usa um adapter personalizado (`firestoreStorage`) que salva no Firestore
   - Fallback automático para localStorage se Firestore falhar

2. **Sincronização:**
   - Ao carregar a aplicação, sincroniza projetos locais com o Firestore
   - Após cada mudança no store, sincroniza automaticamente com o Firestore (debounce de 1 segundo)
   - Projetos são salvos na coleção `projects` do Firestore

3. **Mesclagem Inteligente:**
   - Prioriza dados do Firestore (mais recente)
   - Mantém stacks de undo/redo local (não persistem no Firestore)
   - Projetos locais sem correspondência no Firestore são enviados automaticamente

### 📝 Exemplo de Uso

```typescript
import { useProjects } from "./store/projects";
import { firestoreService } from "./services/firestore";

// Usar o store normalmente
const { projects, addProject, updateProject } = useProjects();

// Adicionar projeto (sincroniza automaticamente com Firestore)
addProject("Meu Livro");

// Ou usar diretamente o serviço Firestore
await firestoreService.createProject({
  name: "Meu Livro",
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### 🔧 Configuração Atual

- **Firebase Project:** biblioteca-86363
- **Firestore Database:** (default)
- **Coleção:** `projects`
- **Regras:** Leitura e escrita liberadas (pode adicionar autenticação depois)

### 🚀 Próximos Passos

1. **Autenticação:** Adicionar Firebase Authentication
2. **Regras de Segurança:** Restringir acesso por usuário
3. **Storage:** Configurar Firebase Storage para upload de capas
4. **Offline:** Habilitar persistência offline do Firestore

### ✅ Status

- ✅ Firebase configurado
- ✅ Firestore integrado com Zustand
- ✅ Sincronização automática
- ✅ Fallback para localStorage
- ✅ Deploy realizado

