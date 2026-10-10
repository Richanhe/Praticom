# 🏢 Praticom - Sistema Integrado de Gestão Condominial (ERP)

<p align="center">
  <img src="design/landing-page-praticom.png" alt="Praticom Banner" width="100%" style="border-radius: 10px; max-height: 420px; object-fit: cover;" />
</p>

<p align="center">
  <b>Plataforma inteligente, moderna e acessível para gestão completa de condomínios residenciais e comerciais.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React & Vite" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js & Express" />
  <img src="https://img.shields.io/badge/Design-Dark%2FLight%20Mode-8B5CF6?style=flat-square" alt="Dark / Light Mode" />
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-success?style=flat-square" alt="Status" />
</p>

---

## 🌐 Site Publicado

**Acesse:** **https://praticom.z1.web.core.windows.net/**

Hospedado como site estático em uma **Conta de Armazenamento do Azure** (Azure Storage Account, container `$web`).

---

## 📌 Visão Geral

O **Praticom** é uma solução ERP completa para condomínios focada em eficiência operacional para síndicos e administradoras, agilidade para a portaria e praticidade e conveniência para os moradores.

A aplicação conta com arquitetura desacoplada (Frontend SPA em React + Backend RESTful em Express), persistência rápida em JSON local com auto-seeding e uma interface fluida com suporte nativo a temas Claro/Escuro e perfis de acesso.

---

## ✨ Principais Funcionalidades

### 📊 1. Dashboard e Métricas em Tempo Real
* Indicadores instantâneos de encomendas a retirar, visitantes ativos no local e inadimplência.
* Gráficos e resumos de receitas vs. despesas, próximas reservas de áreas comuns e avisos urgentes.
* Atualização automática periódica para monitoramento de rotina.

### 📦 2. Gestão de Encomendas (Deliveries)
* Cadastro rápido de encomendas recebidas na portaria (transportadora, destinatário, unidade e rastreio).
* Geração de código de retirada seguro (PIN/QR Code).
* Notificação de chegada e confirmação com baixa de entrega ao morador.

### 🛡️ 3. Portaria e Controle de Acesso
* Fluxo em tempo real de visitantes, prestadores de serviços e entregadores.
* Registro de entrada com documento, empresa, unidade de destino e foto/identificação.
* Baixa ágil de saída e histórico de acessos auditável.

### 👥 4. Cadastro de Moradores, Unidades e Veículos
* Gerenciamento de blocos e unidades condominiais.
* Cadastro de moradores com dados de contato e vínculos.
* Registro de veículos (placa, modelo e vaga) para liberação na portaria.
* Cadastro e identificação de animais de estimação (pets).

### 📅 5. Reservas de Espaços Comuns
* Agendamento de churrasqueiras, salão de festas, academia, quadras e espaços gourmet.
* Validação automática de conflitos de datas e horários.
* Políticas e regras de reserva configuráveis por pessoa/dia.

### 💰 6. Gestão Financeira Condominial
* Controle de fluxo de caixa (taxas condominiais, manutenções, despesas operacionais).
* Status de transações (Pago, Pendente, Atrasado) e categorias orçamentárias.
* Relatório consolidado com resumo financeiro mensal.

### 📢 7. Mural de Comunicados
* Publicação de comunicados e alertas para o condomínio.
* Filtros por categoria (*Manutenção*, *Assembleia*, *Aviso Geral*, *Urgente*).
* Destaque com nível de prioridade e fixação de avisos críticos.

### 🛒 8. Mercadinho Autônomo (Honest Market & PDV)
* Mini-mercado 24/7 integrado ao condomínio.
* Terminal de Ponto de Venda (PDV) com autoatendimento para compras rápidas.
* Múltiplos meios de pagamento: **PIX**, **Cartão** e **Débito em Cota Condominial**.
* Controle de estoque em tempo real com alertas visuais de reposição.

---

## 🧩 Arquitetura de Microfrontends (Module Federation)

O frontend é dividido em **três aplicações React independentes**, integradas em tempo de execução com **Module Federation** (`@originjs/vite-plugin-federation`):

| Aplicação | Papel | Expõe / Consome | Funcionalidades |
|---|---|---|---|
| **`client`** (shell / host) | Layout, navegação, dashboard e notificações | Consome `mfeCadastro/Cadastro` e `mfeOperacoes/Operacoes` | Dashboard, Financeiro, Mural de Avisos, Mercadinho |
| **`mfe-cadastro`** (remote) | Microfrontend de cadastro | Expõe `./Cadastro` | Cadastro de Moradores e Controle de Acesso (Portaria) |
| **`mfe-operacoes`** (remote) | Microfrontend de operações | Expõe `./Operacoes` | Reservas de Espaços e Controle de Encomendas |

* Cada remote gera um `remoteEntry.js`, carregado sob demanda pelo shell (`React.lazy` + `Suspense`).
* `react` e `react-dom` são compartilhados como *singleton*, evitando cópias duplicadas.
* Em produção, os remotes são publicados no mesmo site, em `/mfe-cadastro/` e `/mfe-operacoes/`.

### 💾 Dados

Shell e microfrontends consomem a API REST do backend Express (`/server`) em `http://localhost:5000/api`.

---

## 🛠️ Tecnologias

### 🖥️ Frontend (`/client`, `/mfe-cadastro`, `/mfe-operacoes`)
* **React 18** e **Vite 5**
* **Module Federation** via `@originjs/vite-plugin-federation`
* **Lucide React**: ícones vetoriais
* **Design System Customizado**: CSS Vanilla com variáveis temáticas (Dark/Light mode), layout responsivo e micro-interações.

### ⚙️ Backend (`/server`)
* **Node.js & Express**: rotas da API RESTful.
* **Persistência** em `condo_store.json`, com dados de demonstração iniciais.

---

## 📁 Estrutura de Pastas

```text
Praticom/
├── client/                 # Shell (host) do Module Federation
├── mfe-cadastro/           # Remote: Moradores + Controle de Acesso
├── mfe-operacoes/          # Remote: Reservas + Encomendas
├── server/                 # Backend Express (API REST)
├── design/                 # Protótipos visuais
├── GRUPO.md                # Integrantes do grupo
└── package.json            # Scripts de instalação, build e execução
```

---

## 🚀 Como Executar o Projeto

### 📋 Pré-requisitos
* [Node.js](https://nodejs.org/) (versão 18 ou superior) e `npm`

### ▶️ Execução local

```bash
# 1. Backend (em um terminal)
cd server
npm install
npm run dev          # API em http://localhost:5000

# 2. Frontend (em outro terminal, na raiz do repositório)
npm run install:all  # dependências do shell e dos dois microfrontends
npm run build:remotes
npm start            # remotes em 3001/3002 e shell em 3000
```

*Aplicação disponível em: `http://localhost:3000`*

Cada microfrontend também roda isolado: `npm run dev --prefix mfe-cadastro` (porta 3001) ou `npm run dev --prefix mfe-operacoes` (porta 3002).

---

## ☁️ Publicação no Azure (Conta de Armazenamento)

```bash
# Builda os dois remotes e o shell (cada um gera seu próprio dist/)
npm run build
```

No container `$web` da conta de armazenamento (com *Site estático* habilitado), os arquivos ficam assim:

| Origem | Destino no `$web` |
|---|---|
| `client/dist/*` | `/` (raiz) |
| `mfe-cadastro/dist/assets/*` | `/mfe-cadastro/assets/` |
| `mfe-operacoes/dist/assets/*` | `/mfe-operacoes/assets/` |

Exemplo via Azure CLI:

```bash
az storage blob upload-batch --account-name praticom --destination '$web' --source client/dist --overwrite
az storage blob upload-batch --account-name praticom --destination '$web' --destination-path mfe-cadastro/assets --source mfe-cadastro/dist/assets --overwrite
az storage blob upload-batch --account-name praticom --destination '$web' --destination-path mfe-operacoes/assets --source mfe-operacoes/dist/assets --overwrite
```

---

## 🔌 Principais Endpoints da API

| Módulo | Método | Endpoint | Descrição |
|---|---|---|---|
| **Dashboard** | `GET` | `/api/dashboard` | Métricas consolidadas e resumo geral |
| **Encomendas** | `GET` | `/api/deliveries` | Listagem com filtros de status e unidade |
| | `POST` | `/api/deliveries` | Registro de nova encomenda na portaria |
| | `PATCH` | `/api/deliveries/:id/pickup` | Confirmação de retirada com PIN |
| **Portaria** | `GET` | `/api/access` | Histórico e logs de controle de acesso |
| | `POST` | `/api/access/entry` | Registro de entrada de visitante/prestador |
| | `PATCH` | `/api/access/:id/exit` | Registro de saída do condomínio |
| **Moradores** | `GET` | `/api/residents` | Lista de moradores cadastrados |
| | `POST` | `/api/residents` | Cadastro de novo morador |
| | `DELETE` | `/api/residents/:id` | Remoção de morador |
| **Unidades** | `GET` | `/api/units` | Lista de apartamentos/unidades |
| **Veículos & Pets** | `GET` | `/api/vehicles`, `/api/pets` | Listagem de veículos e animais cadastrados |
| **Reservas** | `GET` | `/api/reservations` | Consulta de reservas por data/espaço |
| | `POST` | `/api/reservations` | Realização de nova reserva |
| | `PATCH` | `/api/reservations/:id/cancel` | Cancelamento de reserva |
| **Financeiro** | `GET` | `/api/financial/summary` | Balanço consolidado de receitas e despesas |
| | `GET` | `/api/financial/transactions` | Extrato de transações |
| | `POST` | `/api/financial/transactions` | Lançamento de nova conta |
| | `PATCH` | `/api/financial/transactions/:id/pay` | Baixa de pagamento |
| **Comunicados** | `GET` | `/api/announcements` | Lista de avisos e comunicados |
| | `POST` | `/api/announcements` | Publicação de novo comunicado |
| **Mercadinho** | `GET` | `/api/market/products` | Catálogo de produtos e níveis de estoque |
| | `POST` | `/api/market/checkout` | Conclusão de compra no autoatendimento |
| | `PATCH` | `/api/market/products/:id/stock` | Ajuste manual ou reposição de estoque |

---

## 🎨 Protótipos e Design

Os protótipos de alta fidelidade e referências visuais estão organizados no diretório [`design/`](design/), cobrindo telas como:
* Painel da Síndica & Módulos Administrativos
* Painel da Portaria & Fila de Entrada
* Acesso Inteligente (Face ID)
* Interface do Morador (Acessibilidade e Usabilidade)
* PDV do Mercadinho Condominial

---

## 📄 Licença

Este projeto está desenvolvido sob licença proprietária para gestão condominial. Todos os direitos reservados.
