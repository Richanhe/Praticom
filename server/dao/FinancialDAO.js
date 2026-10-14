import DatabaseSingleton from '../config/DatabaseSingleton.js';
import { FinancialReportGenerator } from '../services/templates/ReportTemplate.js';

/**
 * Padrão de Projeto: DAO (Data Access Object - 3/3)
 * Abstração e persistência relacional de dados financeiros condominiais no SQLite.
 */
export class FinancialDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
    this.reportGenerator = new FinancialReportGenerator(this.db);
  }

  transactionScope(condominiumId) {
    const condoId = parseInt(condominiumId, 10);
    if (!Number.isInteger(condoId) || condoId <= 0) {
      throw new Error('Condomínio inválido para esta operação.');
    }
    if (condoId === 1) {
      return {
        sql: '(f.condominium_id = 1 OR (f.condominium_id IS NULL AND (b.condominium_id = 1 OR u.block_id IS NULL)))',
        params: []
      };
    }
    return {
      sql: '(f.condominium_id = ? OR (f.condominium_id IS NULL AND b.condominium_id = ?))',
      params: [condoId, condoId]
    };
  }

  getTransaction(id, condominiumId) {
    const scope = this.transactionScope(condominiumId);
    return this.db.prepare(`
      SELECT f.*, f.id AS document_number, f.paid_at AS payment_date,
        u.block, u.number AS unit_number
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE f.id = ? AND ${scope.sql}
    `).get(parseInt(id, 10), ...scope.params) || null;
  }

  validateUnit(unitId, condominiumId) {
    if (!unitId) return;
    const condoId = parseInt(condominiumId, 10);
    const unit = this.db.prepare(`
      SELECT u.id
      FROM units u
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE u.id = ? AND ${condoId === 1
        ? '(b.condominium_id = 1 OR u.block_id IS NULL)'
        : 'b.condominium_id = ?'}
    `).get(...(condoId === 1 ? [parseInt(unitId, 10)] : [parseInt(unitId, 10), condoId]));
    if (!unit) throw new Error('A unidade informada não pertence ao condomínio ativo.');
  }

  getSummary({ condominiumId } = {}) {
    const financialScope = condominiumId
      ? this.transactionScope(condominiumId)
      : { sql: '1=1', params: [] };
    const whereClause = `WHERE ${financialScope.sql}`;
    let unitWhereClause = 'WHERE 1=1';
    const params = [...financialScope.params];
    const unitParams = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        unitWhereClause += ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        unitWhereClause += ' AND b.condominium_id = ?';
        unitParams.push(cId);
      }
    }

    const totals = this.db.prepare(`
      SELECT
        SUM(CASE WHEN UPPER(f.type) = 'INCOME' AND UPPER(f.status) = 'PAID' THEN f.amount ELSE 0 END) AS income_paid,
        SUM(CASE WHEN UPPER(f.type) = 'INCOME' AND UPPER(f.status) IN ('PENDING', 'OVERDUE') THEN f.amount ELSE 0 END) AS income_pending,
        SUM(CASE WHEN UPPER(f.type) = 'INCOME' AND UPPER(f.status) = 'OVERDUE' THEN f.amount ELSE 0 END) AS income_overdue,
        SUM(CASE WHEN UPPER(f.type) = 'EXPENSE' AND UPPER(f.status) = 'PAID' THEN f.amount ELSE 0 END) AS expense_paid,
        SUM(CASE WHEN UPPER(f.type) = 'EXPENSE' AND UPPER(f.status) IN ('PENDING', 'OVERDUE') THEN f.amount ELSE 0 END) AS expense_pending,
        SUM(CASE WHEN UPPER(f.type) = 'EXPENSE' AND UPPER(f.status) = 'OVERDUE' THEN f.amount ELSE 0 END) AS expense_overdue
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      ${whereClause}
    `).get(...params);

    const overdueCount = this.db.prepare(`
      SELECT COUNT(DISTINCT f.unit_id) AS count
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      ${whereClause} AND UPPER(f.type) = 'INCOME' AND UPPER(f.status) = 'OVERDUE'
    `).get(...params).count;

    const totalUnits = this.db.prepare(`
      SELECT COUNT(*) as count FROM units u LEFT JOIN blocks b ON u.block_id = b.id ${unitWhereClause}
    `).get(...unitParams).count;

    const defaultRate = totalUnits > 0 ? (overdueCount / totalUnits) * 100 : 0;
    const delinquencyByUnit = this.db.prepare(`
      SELECT u.block, u.number AS unit_number, SUM(f.amount) AS total_debt
      FROM financial_transactions f
      JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      ${whereClause} AND UPPER(f.type) = 'INCOME' AND UPPER(f.status) = 'OVERDUE'
      GROUP BY u.id
      ORDER BY total_debt DESC
    `).all(...params);
    const incomePaid = totals?.income_paid || 0;
    const expensePaid = totals?.expense_paid || 0;

    return {
      income: {
        paid: incomePaid,
        pending: totals?.income_pending || 0,
        overdue: totals?.income_overdue || 0
      },
      expense: {
        paid: expensePaid,
        pending: totals?.expense_pending || 0,
        overdue: totals?.expense_overdue || 0
      },
      currentBalance: incomePaid - expensePaid,
      default_rate: parseFloat(defaultRate.toFixed(1)),
      delinquencyByUnit,
      default_amount: totals?.income_overdue || 0,
      overdue_count: overdueCount
    };
  }

  getTransactions({ condominiumId, status, type, category, search } = {}) {
    const financialScope = condominiumId
      ? this.transactionScope(condominiumId)
      : { sql: '1=1', params: [] };
    let sql = `
      SELECT f.*, f.id AS document_number, f.paid_at AS payment_date,
        u.block, u.number as unit_number
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE ${financialScope.sql}
    `;
    const params = [...financialScope.params];

    if (status) {
      sql += ' AND UPPER(f.status) = ?';
      params.push(status.toUpperCase());
    }

    if (type) {
      sql += ' AND UPPER(f.type) = ?';
      params.push(type.toUpperCase());
    }

    if (category) {
      sql += ' AND f.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND LOWER(f.description) LIKE ?';
      params.push(`%${search.toLowerCase()}%`);
    }

    sql += ' ORDER BY f.due_date DESC';
    return this.db.prepare(sql).all(params);
  }

  createTransaction(data) {
    this.validateUnit(data.unit_id, data.condominium_id);
    const stmt = this.db.prepare(`
      INSERT INTO financial_transactions (condominium_id, unit_id, description, amount, type, category, status, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      data.condominium_id ? parseInt(data.condominium_id, 10) : null,
      data.unit_id ? parseInt(data.unit_id, 10) : null,
      data.description,
      parseFloat(data.amount),
      data.type.toUpperCase(),
      data.category || 'Outros',
      (data.status || 'PENDING').toUpperCase(),
      data.due_date || new Date().toISOString().split('T')[0]
    );

    return this.db.prepare(`
      SELECT f.*, f.id AS document_number, f.paid_at AS payment_date,
        u.block, u.number AS unit_number
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      WHERE f.id = ?
    `).get(info.lastInsertRowid);
  }

  updateTransaction(id, data, condominiumId) {
    const existing = this.getTransaction(id, condominiumId);
    if (!existing) return null;
    if (existing.status?.toUpperCase() === 'PAID') {
      throw new Error('Lançamentos pagos não podem ser editados.');
    }

    const unitId = data.unit_id === undefined
      ? existing.unit_id
      : (data.unit_id ? parseInt(data.unit_id, 10) : null);
    this.validateUnit(unitId, condominiumId);

    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('O valor do lançamento deve ser maior que zero.');
    }
    if (!['INCOME', 'EXPENSE'].includes(String(data.type).toUpperCase())) {
      throw new Error('Tipo de lançamento inválido.');
    }

    const scope = this.transactionScope(condominiumId);
    this.db.prepare(`
      UPDATE financial_transactions
      SET unit_id = ?, description = ?, amount = ?, type = ?, category = ?, due_date = ?
      WHERE id = ? AND id IN (
        SELECT f.id
        FROM financial_transactions f
        LEFT JOIN units u ON f.unit_id = u.id
        LEFT JOIN blocks b ON u.block_id = b.id
        WHERE f.id = ? AND ${scope.sql}
      )
    `).run(
      unitId,
      data.description,
      amount,
      String(data.type).toUpperCase(),
      data.category,
      data.due_date,
      parseInt(id, 10),
      parseInt(id, 10),
      ...scope.params
    );
    return this.getTransaction(id, condominiumId);
  }

  deleteTransaction(id, condominiumId) {
    const existing = this.getTransaction(id, condominiumId);
    if (!existing) return false;
    if (existing.status?.toUpperCase() === 'PAID') {
      throw new Error('Lançamentos pagos não podem ser excluídos.');
    }

    const scope = this.transactionScope(condominiumId);
    const result = this.db.prepare(`
      DELETE FROM financial_transactions
      WHERE id = ? AND id IN (
        SELECT f.id
        FROM financial_transactions f
        LEFT JOIN units u ON f.unit_id = u.id
        LEFT JOIN blocks b ON u.block_id = b.id
        WHERE f.id = ? AND ${scope.sql}
      )
    `).run(parseInt(id, 10), parseInt(id, 10), ...scope.params);
    return result.changes > 0;
  }

  payTransaction(id, condominiumId) {
    let scope = '';
    const params = [parseInt(id, 10)];
    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        scope = ' AND (scoped.condominium_id = 1 OR scoped.condominium_id IS NULL OR b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        scope = ' AND (scoped.condominium_id = ? OR b.condominium_id = ?)';
        params.push(cId, cId);
      }
    }
    const stmt = this.db.prepare(`
      UPDATE financial_transactions AS f
      SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
      WHERE f.id = ?
        AND EXISTS (
          SELECT 1 FROM financial_transactions scoped
          LEFT JOIN units u ON scoped.unit_id = u.id
          LEFT JOIN blocks b ON u.block_id = b.id
          WHERE scoped.id = f.id${scope}
        )
    `);
    const result = stmt.run(...params);
    if (result.changes === 0) return null;
    return this.db.prepare(`
      SELECT f.*, f.id AS document_number, f.paid_at AS payment_date,
        u.block, u.number AS unit_number
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      WHERE f.id = ?
    `).get(parseInt(id, 10));
  }

  generateReport() {
    return this.reportGenerator.generateReport();
  }
}
