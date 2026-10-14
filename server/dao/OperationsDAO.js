import DatabaseSingleton from '../config/DatabaseSingleton.js';
import { AnnouncementNotificationDispatcher } from '../services/templates/NotificationTemplate.js';

/**
 * Módulo DAO Consolidado de Operações (Portaria & Mural de Comunicados)
 * Consolida as responsabilidades de acesso a dados de Acesso de Portaria e Comunicados em um único módulo coeso.
 */

export class AccessDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
  }

  getAccessLogs({ condominiumId, status, type, search } = {}) {
    let sql = `
      SELECT a.*, a.entry_time AS entered_at, a.exit_time AS exited_at, u.block, u.number as unit_number
      FROM access_logs a
      LEFT JOIN units u ON a.destination_unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        sql += ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        sql += ' AND b.condominium_id = ?';
        params.push(cId);
      }
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (type) {
      sql += ' AND a.type = ?';
      params.push(type);
    }

    if (search) {
      sql += ` AND (
        LOWER(a.visitor_name) LIKE ?
        OR a.document LIKE ?
        OR LOWER(COALESCE(a.company, '')) LIKE ?
        OR UPPER(COALESCE(a.vehicle_plate, '')) LIKE ?
      )`;
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term, `%${search.toUpperCase()}%`);
    }

    sql += ' ORDER BY a.entry_time DESC';
    return this.db.prepare(sql).all(params);
  }

  registerEntry(data) {
    const stmt = this.db.prepare(`
      INSERT INTO access_logs (
        visitor_name, document, type, destination_unit_id, status,
        company, vehicle_plate, authorized_by, notes, entry_time
      )
      VALUES (?, ?, ?, ?, 'IN_PROPERTY', ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const info = stmt.run(
      data.visitor_name,
      data.document,
      data.type || 'Visitante',
      parseInt(data.destination_unit_id || data.unit_id, 10),
      data.company || null,
      data.vehicle_plate || null,
      data.authorized_by || null,
      data.notes || ''
    );

    return this.db.prepare(`
      SELECT a.*, a.entry_time AS entered_at, a.exit_time AS exited_at,
        u.block, u.number AS unit_number
      FROM access_logs a
      LEFT JOIN units u ON a.destination_unit_id = u.id
      WHERE a.id = ?
    `).get(info.lastInsertRowid);
  }

  registerExit(id) {
    const stmt = this.db.prepare(`
      UPDATE access_logs
      SET status = 'EXITED', exit_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(parseInt(id, 10));
    return this.db.prepare(`
      SELECT a.*, a.entry_time AS entered_at, a.exit_time AS exited_at,
        u.block, u.number AS unit_number
      FROM access_logs a
      LEFT JOIN units u ON a.destination_unit_id = u.id
      WHERE a.id = ?
    `).get(parseInt(id, 10));
  }

  deleteAccess(id, condominiumId) {
    let sql = `
      DELETE FROM access_logs
      WHERE id = ?
        AND destination_unit_id IN (
          SELECT u.id
          FROM units u
          LEFT JOIN blocks b ON u.block_id = b.id
          WHERE 1=1
    `;
    const params = [parseInt(id, 10)];
    const cId = parseInt(condominiumId, 10);

    if (cId === 1) {
      sql += ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
    } else {
      sql += ' AND b.condominium_id = ?';
      params.push(cId);
    }

    sql += ')';
    return this.db.prepare(sql).run(...params).changes > 0;
  }
}

export class AnnouncementDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
    this.notifier = new AnnouncementNotificationDispatcher();
  }

  tenantScope(condominiumId) {
    const condoId = parseInt(condominiumId, 10);
    if (!Number.isInteger(condoId) || condoId <= 0) {
      throw new Error('Condomínio inválido para esta operação.');
    }
    if (condoId === 1) {
      return { sql: '(condominium_id = 1 OR condominium_id IS NULL)', params: [] };
    }
    return { sql: 'condominium_id = ?', params: [condoId] };
  }

  getAnnouncements({ condominiumId, category, priority, search } = {}) {
    let sql = 'SELECT * FROM announcements WHERE 1=1';
    const params = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        sql += ' AND (condominium_id = 1 OR condominium_id IS NULL)';
      } else {
        sql += ' AND condominium_id = ?';
        params.push(cId);
      }
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (priority) {
      sql += ' AND LOWER(priority) = LOWER(?)';
      params.push(priority);
    }

    if (search) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ?)';
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY is_pinned DESC, created_at DESC';
    return this.db.prepare(sql).all(params);
  }

  createAnnouncement(data, condominiumId) {
    const stmt = this.db.prepare(`
      INSERT INTO announcements (condominium_id, title, content, category, priority, author, target_block, is_pinned, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const condoId = data?.condominium_id || condominiumId || null;
    const info = stmt.run(
      condoId ? parseInt(condoId, 10) : null,
      data.title,
      data.content,
      data.category || 'Geral',
      data.priority || 'normal',
      data.author || data.created_by || 'Síndico Geral',
      data.target_block || 'Todos',
      data.is_pinned ? 1 : 0,
      data.expires_at || null
    );

    const announcement = this.db.prepare('SELECT * FROM announcements WHERE id = ?').get(info.lastInsertRowid);
    if (announcement.priority === 'URGENTE' || announcement.priority === 'high' || announcement.priority === 'urgent') {
      this.notifier.sendNotification({ name: 'Todos os Moradores', contact: 'Mural Geral' }, announcement);
    }
    return announcement;
  }

  updateAnnouncement(id, data, condominiumId) {
    const scope = this.tenantScope(condominiumId);
    const announcementId = parseInt(id, 10);
    const existing = this.db.prepare(`
      SELECT * FROM announcements
      WHERE id = ? AND ${scope.sql}
    `).get(announcementId, ...scope.params);
    if (!existing) return null;

    const updated = {
      title: data.title ?? existing.title,
      content: data.content ?? existing.content,
      category: data.category ?? existing.category,
      priority: data.priority ?? existing.priority,
      author: data.author ?? existing.author,
      target_block: data.target_block ?? existing.target_block,
      is_pinned: data.is_pinned === undefined ? existing.is_pinned : (data.is_pinned ? 1 : 0),
      expires_at: data.expires_at === undefined ? existing.expires_at : (data.expires_at || null)
    };

    this.db.prepare(`
      UPDATE announcements
      SET title = ?, content = ?, category = ?, priority = ?, author = ?,
        target_block = ?, is_pinned = ?, expires_at = ?
      WHERE id = ? AND ${scope.sql}
    `).run(
      updated.title,
      updated.content,
      updated.category,
      updated.priority,
      updated.author,
      updated.target_block,
      updated.is_pinned,
      updated.expires_at,
      announcementId,
      ...scope.params
    );

    return this.db.prepare('SELECT * FROM announcements WHERE id = ?').get(announcementId);
  }

  deleteAnnouncement(id, condominiumId) {
    const scope = this.tenantScope(condominiumId);
    const stmt = this.db.prepare(`DELETE FROM announcements WHERE id = ? AND ${scope.sql}`);
    const info = stmt.run(parseInt(id, 10), ...scope.params);
    return info.changes > 0;
  }
}
