import DatabaseSingleton from '../config/DatabaseSingleton.js';
import { DeliveryNotificationDispatcher } from '../services/templates/NotificationTemplate.js';

/**
 * Padrão de Projeto: DAO (Data Access Object - 2/3)
 * Abstração e persistência relacional de encomendas recebidas na portaria.
 */
export class DeliveryDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
    this.notifier = new DeliveryNotificationDispatcher();
  }

  // Restringe a consulta às unidades do condomínio ativo (aliases u = units, b = blocks).
  tenantScope(condominiumId) {
    if (!condominiumId) return { sql: '', params: [] };
    const cId = parseInt(condominiumId, 10);
    if (cId === 1) {
      return { sql: ' AND (b.condominium_id = 1 OR u.block_id IS NULL)', params: [] };
    }
    return { sql: ' AND b.condominium_id = ?', params: [cId] };
  }

  getDeliveries({ condominiumId, status, unit_id } = {}) {
    const scope = this.tenantScope(condominiumId);
    let sql = `
      SELECT d.*, u.block, u.number as unit_number, r.name as resident_name
      FROM deliveries d
      LEFT JOIN units u ON d.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON d.resident_id = r.id
      WHERE 1=1${scope.sql}
    `;
    const params = [...scope.params];

    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    if (unit_id) {
      sql += ' AND d.unit_id = ?';
      params.push(parseInt(unit_id, 10));
    }

    sql += ' ORDER BY d.received_at DESC';
    return this.db.prepare(sql).all(params);
  }

  getDelivery(id, condominiumId) {
    const scope = this.tenantScope(condominiumId);
    return this.db.prepare(`
      SELECT d.*, u.block, u.number as unit_number, r.name as resident_name
      FROM deliveries d
      LEFT JOIN units u ON d.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON d.resident_id = r.id
      WHERE d.id = ?${scope.sql}
    `).get(parseInt(id, 10), ...scope.params) || null;
  }

  // Garante que unidade (e morador, se informado) pertencem ao condomínio ativo.
  validateRecipient(unitId, residentId, condominiumId) {
    const scope = this.tenantScope(condominiumId);
    const unit = this.db.prepare(`
      SELECT u.id FROM units u
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE u.id = ?${scope.sql}
    `).get(unitId, ...scope.params);
    if (!unit) {
      throw new Error('Unidade não encontrada neste condomínio.');
    }

    if (residentId) {
      const resident = this.db.prepare('SELECT id FROM residents WHERE id = ? AND unit_id = ?').get(residentId, unitId);
      if (!resident) {
        throw new Error('O morador informado não pertence à unidade selecionada.');
      }
    }
  }

  createDelivery(data, condominiumId) {
    const unitId = parseInt(data.unit_id, 10);
    const residentId = data.resident_id ? parseInt(data.resident_id, 10) : null;
    this.validateRecipient(unitId, residentId, condominiumId);

    const pickupCode = String(Math.floor(1000 + Math.random() * 9000));
    const stmt = this.db.prepare(`
      INSERT INTO deliveries (unit_id, resident_id, courier, tracking_code, description, status, pickup_code, notes, received_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
    `);

    const info = stmt.run(
      unitId,
      residentId,
      data.courier,
      data.tracking_code || null,
      data.description || '',
      pickupCode,
      data.notes || ''
    );

    const delivery = this.getDelivery(info.lastInsertRowid);
    const resident = delivery.resident_id ? this.db.prepare('SELECT name, phone, email FROM residents WHERE id = ?').get(delivery.resident_id) : null;

    // Dispara notificação via Template Method
    if (resident) {
      this.notifier.sendNotification(resident, delivery);
    }

    return {
      ...delivery,
      block: delivery.block || '',
      unit_number: delivery.unit_number || '',
      resident_name: resident ? resident.name : 'Morador'
    };
  }

  updateDelivery(id, data, condominiumId) {
    const delivery = this.getDelivery(id, condominiumId);
    if (!delivery) {
      throw new Error('Encomenda não encontrada.');
    }

    if (delivery.status === 'delivered') {
      throw new Error('Encomenda já retirada não pode ser alterada.');
    }

    const unitId = data.unit_id ? parseInt(data.unit_id, 10) : delivery.unit_id;
    let residentId = delivery.resident_id;
    if (data.resident_id !== undefined) {
      residentId = data.resident_id ? parseInt(data.resident_id, 10) : null;
    }
    this.validateRecipient(unitId, residentId, condominiumId);

    this.db.prepare(`
      UPDATE deliveries
      SET unit_id = ?, resident_id = ?, courier = ?, tracking_code = ?, description = ?, notes = ?
      WHERE id = ?
    `).run(
      unitId,
      residentId,
      data.courier || delivery.courier,
      data.tracking_code !== undefined ? data.tracking_code || null : delivery.tracking_code,
      data.description !== undefined ? data.description || '' : delivery.description,
      data.notes !== undefined ? data.notes || '' : delivery.notes,
      delivery.id
    );

    return this.getDelivery(delivery.id);
  }

  deleteDelivery(id, condominiumId) {
    const delivery = this.getDelivery(id, condominiumId);
    if (!delivery) return false;
    const result = this.db.prepare('DELETE FROM deliveries WHERE id = ?').run(delivery.id);
    return result.changes > 0;
  }

  pickupDelivery(id, { pickup_code, picked_up_by }, condominiumId) {
    const delivery = this.getDelivery(id, condominiumId);
    if (!delivery) {
      throw new Error('Encomenda não encontrada.');
    }

    if (delivery.status === 'delivered') {
      throw new Error('Esta encomenda já foi retirada.');
    }

    if (pickup_code && delivery.pickup_code !== String(pickup_code).trim()) {
      throw new Error('Código de retirada (PIN) incorreto.');
    }

    const stmt = this.db.prepare(`
      UPDATE deliveries
      SET status = 'delivered', picked_up_at = CURRENT_TIMESTAMP, picked_up_by = ?
      WHERE id = ?
    `);

    stmt.run(picked_up_by || 'Morador', delivery.id);
    return this.getDelivery(delivery.id);
  }

  cancelDelivery(id, { reason, cancelledBy, condominiumId } = {}) {
    const delivery = this.getDelivery(id, condominiumId);
    if (!delivery) {
      throw new Error('Encomenda não encontrada.');
    }
    if (delivery.status === 'delivered') {
      throw new Error('Não é possível cancelar uma encomenda que já foi entregue.');
    }

    this.db.prepare(`
      UPDATE deliveries
      SET status = 'CANCELLED',
          cancelled_at = CURRENT_TIMESTAMP,
          cancelled_by = ?,
          cancellation_reason = ?
      WHERE id = ?
    `).run(cancelledBy || 'Administração', reason || 'Cancelada', delivery.id);

    return this.getDelivery(delivery.id);
  }
}