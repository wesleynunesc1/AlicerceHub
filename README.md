# Alicerce OS — Central Operacional

> Sistema web interno desenvolvido para centralizar e elevar a operação da agência **Alicerce**.
> *"A estrutura por trás da nossa operação."*

![Logo Oficial Alicerce](./public/Ab.png)

---

## 🏛️ Sobre o Projeto

O **Alicerce OS** foi concebido para reunir em um único ambiente os principais clientes, projetos, processos operacionais (SOPs), materiais da marca e o Brand Center da agência. 

O fluxo de valor central da agência é expresso na arquitetura do sistema:
$$\text{Cliente} \longrightarrow \text{Projeto} \longrightarrow \text{Processo (SOP)} \longrightarrow \text{Material} \longrightarrow \text{Entrega}$$

---

## 🎨 Identidade Visual & Design System

A estética do Alicerce OS segue princípios de luxo, precisão arquitetônica e clareza editorial:

- **Verde Profundo Alicerce** (`#0B221B`, `#12352B`): Sidebar, botões de ação e componentes de autoridade.
- **Creme / Off-white** (`#FAF8F5`, `#F3EFEA`): Superfícies de leitura e background da aplicação.
- **Ouro Suave / Sand Gold** (`#C5A880`, `#DFCEB7`): Indicadores refinados, realces e badges de excelência.
- **Tipografia**:
  - *Cormorant Garamond*: Títulos editoriais, manifesto e cabeçalhos institucionais.
  - *Plus Jakarta Sans*: Interface, dashboards, tabelas e dados operacionais com máxima legibilidade.
- **100% Responsivo**: Desktop widescreen, notebook, tablets (vertical e horizontal) e smartphones.

---

## 🚀 Módulos do MVP

1. **Autenticação & Sessão**:
   - Tela de login com a logo oficial, credenciais de demonstração com 1 clique, recuperação de senha e persistência de sessão.
2. **Dashboard**:
   - Saudação personalizada (*"Bom dia, Wesley"*), indicadores-chave (Clientes Ativos, Projetos em Andamento, Aguardando Cliente, Entregas Próximas), tabela de projetos prioritários, agenda de entregas e log de atividades recentes.
3. **Clientes**:
   - Cadastro completo (dados cadastrais, múltiplos serviços contratados, responsável interno, notas), busca instantânea, filtros por status e visualização em cards ou tabela editorial.
   - Perfil individual do cliente com abas: *Visão Geral*, *Projetos Vinculados*, *Materiais* e *Informações Cadastrais*.
4. **Projetos**:
   - Gestão de fluxos com etapas vinculadas obrigatoriamente a clientes.
   - Barra de progresso dinâmica em tempo real calculada a partir do checklist de fases (Briefing, Acessos, Planejamento, Produção, Aprovação, Entrega).
   - Observações internas e conexão direta com documentos de apoio.
5. **Processos (SOPs)**:
   - A biblioteca de procedimentos padronizados da agência dividida por pilares: *Aquisição*, *Presença Digital*, *Conteúdo*, *Marca* e *Estratégia*.
   - Manuais detalhados passo a passo (ex.: Meta Ads, Google Ads, Social Media, Google Meu Negócio, Landing Pages, Sites Institucionais, etc.) com checklists de conformidade e editor integrado.
6. **Materiais**:
   - Biblioteca interna categorizada (*Comercial*, *Onboarding*, *Contratos*, *Briefings*, *Checklists*, *Relatórios*, *Apresentações*, *Templates*, *Documentos internos*).
   - Links diretos para arquivos de trabalho e documentos oficiais.
7. **Brand Center**:
   - Vitrine da marca com logo oficial, diretrizes de respiro, paleta interativa com cópia de HEX em um clique, espécimes tipográficos, tom de voz oficial, manifesto e os 4 pilares editoriais da Alicerce.
8. **Perfil & Configurações**:
   - Gestão de dados pessoais, segurança, exportação de backup em JSON e ferramenta de restauração dos dados padrão da agência.

---

## 🔑 Credenciais de Demonstração (MVP)

- **URL do Repositório**: [https://github.com/wesleynunesc1/AlicerceHub](https://github.com/wesleynunesc1/AlicerceHub)
- **URL Pública (GitHub Pages)**: [https://wesleynunesc1.github.io/AlicerceHub/](https://wesleynunesc1.github.io/AlicerceHub/)
- **E-mail de Acesso**: `admin@alicerce.com`
- **Senha**: `alicerce2025` *(ou utilize o botão "Preencher credenciais de demonstração" na tela de login)*

---

## 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript**
- **Vite** (Build ultrarrápido com assets relativos)
- **Vanilla CSS Tokens & Modern CSS Architecture** (Sem sobrecarga de frameworks externos)
- **Lucide Icons** (Ícones precisos e elegantes)
- **LocalStorage Database Service** com dados reais de seed pré-configurados

---

## 💻 Como Rodar Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/wesleynunesc1/AlicerceHub.git

# 2. Entrar na pasta
cd AlicerceHub

# 3. Instalar dependências
npm install

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse em seu navegador: `http://localhost:3000/`.
