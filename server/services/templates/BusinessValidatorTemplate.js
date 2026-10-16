import { Reservation } from '../../domain/index.js';

/**
 * Padrão de Projeto: TEMPLATE METHOD (Validação e Integridade de Negócio)
 * AbstractBusinessValidator padroniza o algoritmo de validação em camadas.
 */
export class AbstractBusinessValidator {
  validate(data, context = {}) {
    this.checkRequiredFields(data);
    this.checkTemporalConstraints(data);
    this.checkUniquenessAndConflicts(data, context);
    this.checkRelationalIntegrity(data, context);
    return true;
  }

  checkRequiredFields(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Dados para validação não fornecidos.');
    }
  }

  checkTemporalConstraints(data) {
    // Hook padrão: sobrescrito apenas por entidades com restrições temporais (datas/horários)
  }

  checkUniquenessAndConflicts(data, context) {
    // Hook padrão: sobrescrito por entidades com restrições de unicidade ou conflito
  }

  checkRelationalIntegrity(data, context) {
    // Hook padrão: sobrescrito por entidades com restrições de chave estrangeira
  }
}

/**
 * Subclasse concreta: Validador de Agendamento e Conflitos de Reservas
 */
export class ReservationConflictValidator extends AbstractBusinessValidator {
  constructor(db) {
    super();
    this.db = db;
  }

  checkRequiredFields(data) {
    super.checkRequiredFields(data);
    if (!data.space_id) throw new Error('O espaço da reserva é obrigatório.');
    if (!data.reservation_date) throw new Error('A data da reserva é obrigatória.');
    if (!data.start_time || !data.end_time) throw new Error('Horários de início e fim são obrigatórios.');
    // Integridade via entidade de domínio
    const entity = new Reservation(data);
    if (entity.startTime >= entity.endTime) {
      throw new Error('O horário de início deve ser anterior ao horário de término.');
    }
  }

  checkTemporalConstraints(data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(`${data.reservation_date}T00:00:00`);
    if (Number.isNaN(targetDate.getTime())) {
      throw new Error('Data da reserva inválida.');
    }
    if (targetDate < today) {
      throw new Error('Não é permitido criar ou editar reservas em datas passadas.');
    }

    const startHour = parseInt(String(data.start_time).split(':')[0], 10);
    const startMinute = parseInt(String(data.start_time).split(':')[1], 10);
    const endHour = parseInt(String(data.end_time).split(':')[0], 10);
    const endMinute = parseInt(String(data.end_time).split(':')[1], 10);
    if (
      !Number.isInteger(startHour) ||
      !Number.isInteger(startMinute) ||
      !Number.isInteger(endHour) ||
      !Number.isInteger(endMinute) ||
      startMinute < 0 ||
      startMinute > 59 ||
      endMinute < 0 ||
      endMinute > 59
    ) {
      throw new Error('Horário da reserva inválido.');
    }
    if (targetDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (startHour * 60 + startMinute <= currentMinutes) {
        throw new Error('Não é permitido criar ou editar reservas em horários passados.');
      }
    }
    if (endHour - startHour !== 1) {
      throw new Error('Cada reserva deve ter exatamente 1 hora de duração.');
    }
  }

  checkUniquenessAndConflicts(data, context) {
    const excludeId = context.excludeId ? parseInt(context.excludeId, 10) : null;
    let sql = `
      SELECT COUNT(*) as count FROM reservations
      WHERE space_id = ? AND reservation_date = ? AND UPPER(status) IN ('CONFIRMED', 'CONFIRMADA')
      AND start_time < ? AND end_time > ?
    `;
    const params = [
      parseInt(data.space_id, 10),
      data.reservation_date,
      data.end_time,
      data.start_time
    ];

    if (excludeId) {
      sql += ' AND id <> ?';
      params.push(excludeId);
    }

    const conflict = this.db.prepare(sql).get(...params);
    if (conflict.count > 0) {
      throw new Error('Já existe uma reserva confirmada para este horário e espaço.');
    }
  }
}
