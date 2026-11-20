# OtimizaTreino

Sistema web para **otimização de treino de musculação**: o praticante cadastra suas fichas, registra o que fez em cada série (repetições, carga e RPE) e o sistema sugere a carga da próxima sessão, analisa o volume semanal por grupo muscular, estima o 1RM e emite alertas de fadiga e equilíbrio.

Projeto da disciplina **Desenvolvimento de Projetos II**.

| | |
|---|---|
| **Integrantes** | NOME DO ALUNO 1 — RA 000000 <br> NOME DO ALUNO 2 — RA 000000 *(remover se for individual)* |
| **Modalidade** | Dupla / Individual *(deixar apenas a opção correta)* |
| **Documentação** | [`docs/Documentacao-OtimizaTreino.pdf`](docs/Documentacao-OtimizaTreino.pdf) |

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | JavaScript, React 18, React Router 6, Vite 6 |
| Back-end | JavaScript, Node.js 20+, Express 5 |
| Banco de dados | MySQL 8 (driver `mysql2`) |
| Testes | `node:test` (regras de otimização) |
| Diagramas | PlantUML (`docs/diagramas`) |

## Funcionalidades

- **CRUD completo** de Usuários, Exercícios, Treinos (fichas com itens) e Sessões (com séries realizadas).
- **Otimização** (`/api/usuarios/:id/otimizacao`):
  - sugestão de carga por exercício (aumentar ~5% / ~2,5%, manter ou reduzir ~10%) a partir das repetições e do RPE da última sessão;
  - volume semanal (séries) por grupo muscular comparado à faixa recomendada para o nível;
  - 1RM estimado (Epley) e evolução;
  - alertas de deload (RPE alto), inatividade, grupos musculares ausentes e faixa de repetições incompatível com o objetivo.
- **Aplicar sugestões** na ficha com um clique (transação no banco).

## Como executar

Pré-requisitos: **Node.js 20+** e **MySQL 8** (ou MariaDB 10.6+).

```bash
# 1) Banco de dados
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql      # dados de exemplo (opcional)

# 2) Back-end (porta 3001)
cd server
cp .env.example .env                      # edite usuário/senha do MySQL
npm install
npm start

# 3) Front-end (porta 5173) — em outro terminal
cd client
npm install
npm run dev
```

Acesse http://localhost:5173.

> Para rodar tudo numa porta só: `cd client && npm run build`; depois `cd ../server && npm start` e acesse http://localhost:3001 (o Express serve o front compilado).

Testes das regras de otimização:

```bash
cd server && npm test
```

## Estrutura

```
otimiza-treino/
├── client/                 # Front-end React (Vite)
│   └── src/
│       ├── pages/          # Painel (otimização), Usuarios, Exercicios, Treinos, Sessoes
│       ├── components/     # Modal, Campo, Vazio
│       ├── context/        # Praticante ativo e avisos
│       └── api.js          # Chamadas à API REST
├── server/                 # API REST Node/Express
│   ├── src/
│   │   ├── models/         # Entidades: Usuario, Exercicio, Treino, TreinoExercicio, Sessao, SerieRealizada
│   │   ├── repositories/   # Acesso ao MySQL (CRUD genérico + Treino/Sessão com transações)
│   │   ├── services/       # OtimizadorTreino (regras de otimização)
│   │   ├── routes/         # Fábrica de rotas CRUD
│   │   └── app.js          # Configuração do Express e tratamento de erros
│   └── test/               # Testes automatizados
├── database/               # schema.sql e seed.sql
└── docs/                   # Documentação (PDF) e fontes dos diagramas (.puml)
```

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/usuarios` | Listar / criar usuário |
| GET/PUT/DELETE | `/api/usuarios/:id` | Consultar / editar / excluir |
| GET/POST | `/api/exercicios?grupo_muscular=` | Listar (com filtro) / criar |
| GET/PUT/DELETE | `/api/exercicios/:id` | Consultar / editar / excluir |
| GET/POST | `/api/treinos?usuario_id=` | Listar / criar ficha com itens |
| GET/PUT/DELETE | `/api/treinos/:id` | Consultar / editar / excluir |
| GET/POST | `/api/sessoes?usuario_id=&treino_id=` | Listar / registrar sessão com séries |
| GET/PUT/DELETE | `/api/sessoes/:id` | Consultar / editar / excluir |
| GET | `/api/usuarios/:id/otimizacao` | Análise e sugestões |
| POST | `/api/treinos/:id/aplicar-sugestoes` | Aplica novas cargas na ficha |
