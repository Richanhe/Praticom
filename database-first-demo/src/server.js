import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../generated/prisma/client.js';

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT || 5050);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/condominiums', async (_req, res, next) => {
  try {
    const condominiums = await prisma.condominiums.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(condominiums);
  } catch (error) {
    next(error);
  }
});

app.post('/api/condominiums', async (req, res, next) => {
  try {
    const { name, cnpj, address, city, state, postal_code, phone, status } = req.body;
    if (!String(name || '').trim()) {
      return res.status(400).json({ error: 'O nome do condomínio é obrigatório.' });
    }

    const condominium = await prisma.condominiums.create({
      data: {
        name: String(name).trim(),
        cnpj: cnpj || null,
        address: address || null,
        city: city || null,
        state: state || null,
        postal_code: postal_code || null,
        phone: phone || null,
        status: status || 'ACTIVE'
      }
    });
    res.status(201).json(condominium);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/condominiums/:id', async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID do condomínio inválido.' });
    }

    const condominium = await prisma.condominiums.update({
      where: { id },
      data: req.body
    });
    res.json(condominium);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/condominiums/:id', async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID do condomínio inválido.' });
    }

    await prisma.condominiums.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Erro na demonstração Database First.' });
});

const server = app.listen(port, () => {
  console.log(`Database First CRUD disponível em http://localhost:${port}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
