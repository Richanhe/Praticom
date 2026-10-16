# Demonstração Database First

Esta pasta é independente do Praticom. Ela usa uma cópia do banco SQLite
existente e não altera o backend, o frontend ou o banco original.

## Fluxo demonstrado

1. Copiar o banco existente para `database/`.
2. Executar `npm run db:pull`.
3. O Prisma ler as tabelas e gerar os modelos em `prisma/schema.prisma`.
4. Executar `npm run db:generate`.
5. Usar o cliente gerado em um CRUD Express separado.

## Executar

No PowerShell, dentro desta pasta:

```powershell
npm install
Copy-Item ..\server\condo_database.sqlite .\database\condo_database.sqlite
Copy-Item .env.example .env
npm run db:pull
npm run db:generate
npm run dev
```

A API ficará disponível em `http://localhost:5050`.

## Endpoints demonstrativos

| Método | Endpoint | Operação |
|---|---|---|
| GET | `/api/condominiums` | Listar condomínios |
| POST | `/api/condominiums` | Criar condomínio |
| PATCH | `/api/condominiums/:id` | Atualizar condomínio |
| DELETE | `/api/condominiums/:id` | Excluir condomínio |

O CRUD é uma demonstração técnica. As regras completas do sistema original,
como multi-tenancy, feature flags e validações específicas, continuam no
Praticom e não são substituídas por este exemplo.
