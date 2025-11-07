# 📚 TXT → Livro

Uma aplicação web profissional para transformar documentos de texto (.txt) em livros editáveis e exportáveis em múltiplos formatos (PDF, EPUB, DOCX).

## ✨ Características Principais

### 🎨 Sistema de Temas Profissional
- **Tema Dracula**: Ativado automaticamente quando detecta conteúdo sobre frontend/desenvolvimento
- **5 Temas disponíveis**: Dracula, Dark, Light, GitHub Dark, Monokai
- Detecção inteligente de conteúdo para aplicar o tema apropriado
- Interface moderna e responsiva

### 📖 Gerenciamento de Livros
- Importação de arquivos .txt com detecção automática de capítulos
- Editor de texto rico com edição por parágrafos
- **Modo Foco**: Leitura fullscreen sem distrações com controles de fonte e largura
- **Finalizar Livro**: Marque seu livro como finalizado e leia na biblioteca em formato tipo Kindle
- **Visualização Kindle Completa**: Interface profissional inspirada no Kindle com todas as funcionalidades
- **Leitor de Voz**: Leitura automática usando Web Speech API (nativo do navegador, leve e eficiente)
- **Marcadores**: Salve e navegue para marcadores no livro
- **Modo Escuro**: Alternância entre modo claro e escuro
- **Personalização Avançada**: Escolha de fonte, tamanho, espaçamento e margens
- **Tags e Categorias**: Organize seus projetos com tags personalizadas e categorias
- **Filtros Avançados**: Busque e filtre projetos por categoria, tag ou texto
- Reorganização de capítulos por arrastar e soltar
- Gerenciamento de metadados (autor, assunto, palavras-chave)
- Capa personalizada para os livros
- Sistema de versões e histórico (undo/redo)

### 🔍 Recursos Avançados
- **Busca Global**: Pesquisa em todo o conteúdo do livro (Ctrl+F)
- **Estatísticas**: Contagem de palavras, caracteres, páginas estimadas e tempo de leitura
- **Biblioteca de Projetos**: Visualização em grade com busca e filtros
- **Exportação**: PDF, EPUB e DOCX com formatação profissional

### ⌨️ Atalhos de Teclado

**No Editor:**
- `Ctrl+F`: Buscar no livro / Abrir modo foco
- `Ctrl+K`: Busca rápida
- `Ctrl+Z`: Desfazer
- `Ctrl+Shift+Z`: Refazer
- `↑ ↓`: Navegar entre capítulos
- `Ctrl+Shift+?`: Mostrar/ocultar ajuda de atalhos

**No Modo Kindle:**
- `ESC`: Fechar visualização
- `← →`: Navegar entre capítulos
- `M`: Abrir/fechar menu
- `R`: Iniciar/parar leitura de voz
- `B`: Salvar marcador
- `G`: Ir para marcador
- `D`: Alternar modo escuro

## 🚀 Como Usar

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Uso Básico

1. **Criar um Projeto**: Clique em "Novo" na sidebar
2. **Importar .txt**: Arraste e solte ou selecione um arquivo .txt
3. **Editar**: Clique nos parágrafos para editar, use os botões para adicionar/remover
4. **Configurar Metadados**: Adicione autor, assunto e palavras-chave
5. **Adicionar Capa**: Faça upload de uma imagem para a capa
6. **Finalizar Livro**: Clique em "Finalizar Livro" no Topbar quando terminar de revisar
7. **Ler na Biblioteca**: Livros finalizados aparecem na biblioteca com botão "Ler Livro" (formato Kindle)
8. **Exportar**: Escolha entre PDF, EPUB ou DOCX

## 🎯 Funcionalidades Implementadas

### ✅ Completas
- [x] Sistema de temas profissional com 5 opções
- [x] Detecção automática de tema Dracula para conteúdo frontend
- [x] Importação de arquivos .txt com parsing inteligente
- [x] Editor de texto com edição por parágrafos
- [x] **Modo Foco**: Leitura fullscreen com controles personalizáveis
- [x] **Finalizar Livro**: Marque livros como finalizados e leia em formato Kindle
- [x] **Visualização Kindle Completa**: Interface profissional tipo Kindle com todas as funcionalidades
- [x] **Leitor de Voz**: Leitura automática usando Web Speech API (nativo, leve)
- [x] **Marcadores**: Sistema de marcadores para navegação rápida
- [x] **Modo Escuro**: Alternância entre modo claro e escuro no Kindle
- [x] **Personalização Avançada**: Fonte, tamanho, espaçamento e margens ajustáveis
- [x] **Atalhos de teclado profissionais**: Sistema completo de atalhos
- [x] **Ajuda de atalhos**: Modal interativo com todos os atalhos
- [x] **Sistema de Tags e Categorias**: Organize projetos com tags e categorias
- [x] **Filtros avançados**: Busque por categoria, tag ou texto
- [x] Busca global no conteúdo
- [x] Estatísticas detalhadas dos livros
- [x] Exportação para PDF, EPUB e DOCX
- [x] Gerenciamento de metadados
- [x] Sistema de capas
- [x] Biblioteca de projetos com busca e filtros
- [x] Histórico e versões
- [x] Interface responsiva e moderna

### 🔄 Em Desenvolvimento
- [ ] Assistente IA para sugestões e correções
- [ ] Exportação para Markdown
- [ ] Compartilhamento de projetos
- [ ] Colaboração em tempo real
- [ ] Temas personalizados pelo usuário

## 💡 Ideias e Melhorias Futuras

### 🤖 Assistente IA
- **Correção gramatical automática**: Análise e correção de erros
- **Sugestões de melhoria**: Recomendações de estilo e clareza
- **Geração de conteúdo**: Assistente para expandir capítulos
- **Análise de sentimento**: Detecção de tom e emoção no texto
- **Resumo automático**: Geração de sinopses e resumos

### 📊 Analytics e Insights
- **Análise de leitura**: Tempo médio por capítulo
- **Heatmap de edições**: Visualização de onde mais edita
- **Gráficos de progresso**: Acompanhamento de escrita ao longo do tempo
- **Comparação de versões**: Diff visual entre versões

### 🎨 Personalização
- **Temas customizados**: Criar seus próprios temas
- **Fontes personalizadas**: Escolher fontes para leitura
- **Layouts alternativos**: Diferentes modos de visualização
- **Shortcuts customizáveis**: Configurar seus próprios atalhos

### 🌐 Colaboração
- **Compartilhamento**: Compartilhar projetos via link
- **Colaboração em tempo real**: Múltiplos usuários editando
- **Comentários**: Sistema de comentários e anotações
- **Revisão**: Sistema de revisão e aprovação

### 📱 Mobile
- **App mobile**: Versão nativa para iOS/Android
- **Modo offline**: Trabalhar sem conexão
- **Sincronização**: Sincronização entre dispositivos

### 🔧 Ferramentas Avançadas
- **Markdown support**: Suporte completo a Markdown
- **LaTeX**: Exportação para LaTeX
- **Templates**: Templates pré-definidos para diferentes tipos de livros
- **Plugins**: Sistema de plugins para extensibilidade

## 🛠️ Tecnologias

- **React 18**: Framework UI
- **TypeScript**: Tipagem estática
- **Vite**: Build tool e dev server
- **Zustand**: Gerenciamento de estado
- **LocalForage**: Persistência de dados
- **JSZip**: Geração de arquivos ZIP (EPUB, DOCX)
- **jsPDF**: Geração de PDFs
- **Web Speech API**: Leitor de voz (nativo do navegador, sem dependências)

## 🎤 Leitor de Voz

O leitor de voz usa a **Web Speech API**, que é nativa dos navegadores modernos. Isso significa:

- ✅ **Zero dependências**: Não adiciona bibliotecas ao projeto
- ✅ **Leve**: 0 bytes adicionais ao bundle
- ✅ **Gratuito**: Sem custos de API
- ✅ **Offline**: Funciona sem internet
- ✅ **Eficiente**: Processamento nativo do navegador

Para mais detalhes técnicos, consulte [LEITOR_VOZ_INFO.md](./LEITOR_VOZ_INFO.md)

## 📝 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── BookView.tsx    # Visualizador e editor do livro
│   ├── BookStats.tsx   # Estatísticas do livro
│   ├── SearchBar.tsx   # Barra de busca
│   ├── ThemeSelector.tsx # Seletor de temas
│   └── ...
├── store/              # Gerenciamento de estado
│   ├── projects.ts     # Store de projetos
│   └── theme.ts        # Store de temas
├── utils/              # Utilitários
│   ├── parseTxt.ts     # Parser de arquivos .txt
│   ├── exportPdf.ts    # Exportação PDF
│   ├── exportEpub.ts   # Exportação EPUB
│   └── exportDocx.ts   # Exportação DOCX
├── pages/              # Páginas
│   └── Library.tsx     # Biblioteca de projetos
└── styles/             # Estilos
    └── global.css      # Estilos globais com temas
```

## 🎨 Temas Disponíveis

### Dracula 🧛
Tema inspirado no popular tema Dracula, perfeito para conteúdo sobre desenvolvimento frontend. Ativado automaticamente quando detecta palavras-chave relacionadas.

### Dark 🌙
Tema escuro padrão, confortável para longas sessões de escrita e edição.

### Light ☀️
Tema claro, ideal para ambientes bem iluminados.

### GitHub Dark 💻
Tema inspirado no GitHub Dark, familiar para desenvolvedores.

### Monokai 🎨
Tema baseado no esquema de cores Monokai, popular em editores de código.

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para escritores e desenvolvedores**
