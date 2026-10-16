import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Utensils,
  PartyPopper,
  Trophy,
  Dumbbell,
  Briefcase,
  Flame,
  Plus,
  Ban,
  Building,
  Edit3,
  Trash2,
  Save
} from 'lucide-react';
import { api } from '../services/api';
import { DeleteConfirmModal } from '../components/CrudModal';

const initialSpaceForm = {
  name: '',
  description: '',
  capacity: '',
  price_per_hour: '',
  rules: ''
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentLocalDateTime = () => {
  const now = new Date();
  return {
    date: formatLocalDate(now),
    minutes: now.getHours() * 60 + now.getMinutes()
  };
};

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  return Number.isInteger(hours) && Number.isInteger(minutes)
    ? hours * 60 + minutes
    : NaN;
};

const isPastReservationStart = (date, time) => {
  const current = getCurrentLocalDateTime();
  return date === current.date && timeToMinutes(time) <= current.minutes;
};

const addHoursToTime = (time, hoursToAdd) => {
  if (!time) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const baseDate = new Date(2000, 0, 1, hours, minutes || 0, 0, 0);
  baseDate.setHours(baseDate.getHours() + hoursToAdd);
  const nextHours = String(baseDate.getHours()).padStart(2, '0');
  const nextMinutes = String(baseDate.getMinutes()).padStart(2, '0');
  return `${nextHours}:${nextMinutes}`;
};

const initialReservationForm = {
  space_id: '',
  unit_id: '',
  resident_id: '',
  reservation_date: formatLocalDate(new Date()),
  start_time: '08:00',
  end_time: '09:00',
  guests_count: 0,
  notes: ''
};

const todayLocal = new Date();
todayLocal.setHours(0, 0, 0, 0);
const minReservationDate = formatLocalDate(todayLocal);

export default function ReservationsView({ showToast }) {
  const [spaces, setSpaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [units, setUnits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros / Seleção
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [selectedDate, setSelectedDate] = useState(minReservationDate);

  // CRUD de Áreas
  const [spaceForm, setSpaceForm] = useState(initialSpaceForm);
  const [editingSpaceId, setEditingSpaceId] = useState(null);

  // CRUD de Reservas
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationMode, setReservationMode] = useState('create');
  const [editingReservationId, setEditingReservationId] = useState(null);
  const [reservationForm, setReservationForm] = useState(initialReservationForm);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const resetSpaceForm = () => {
    setSpaceForm(initialSpaceForm);
    setEditingSpaceId(null);
  };

  const resetReservationForm = () => {
    setReservationForm({
      ...initialReservationForm,
      reservation_date: selectedDate,
      space_id: activeSpace?.id ? String(activeSpace.id) : ''
    });
    setReservationMode('create');
    setEditingReservationId(null);
  };

  // Ícones dinâmicos
  const iconMap = {
    Utensils: Utensils,
    Flame: Flame,
    PartyPopper: PartyPopper,
    Trophy: Trophy,
    Dumbbell: Dumbbell,
    Briefcase: Briefcase
  };

  const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' },
    { start: '19:00', end: '20:00' },
    { start: '20:00', end: '21:00' },
    { start: '21:00', end: '22:00' },
    { start: '22:00', end: '23:00' }
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [spacesRes, resRes, unitsRes, residentsRes] = await Promise.all([
        api.getSpaces(),
        api.getReservations({ date: selectedDate }),
        api.getUnits(),
        api.getResidents()
      ]);
      setSpaces(spacesRes);
      setReservations(resRes);
      setUnits(unitsRes);
      setResidents(residentsRes);

      if (spacesRes.length > 0) {
        const hasSelectedSpace = spacesRes.some(space => space.id === parseInt(selectedSpaceId, 10));
        if (!selectedSpaceId || !hasSelectedSpace) {
          setSelectedSpaceId(String(spacesRes[0].id));
        }
      }
    } catch (err) {
      showToast('Erro ao carregar reservas e espaços.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const activeSpace = spaces.find(s => s.id === parseInt(selectedSpaceId, 10)) || spaces[0];

  // Identificar quais horários já estão ocupados neste espaço e data
  const occupiedSlots = reservations.filter(r => r.space_id === activeSpace?.id && r.status === 'CONFIRMED');

  const filteredReservations = reservations.filter(reservation => reservation.reservation_date === selectedDate);

  const syncReservationResident = (unitId, currentResidentId = '') => {
    const availableResidents = residents.filter(resident => resident.unit_id === parseInt(unitId, 10));
    if (currentResidentId && availableResidents.some(resident => resident.id === parseInt(currentResidentId, 10))) {
      return currentResidentId;
    }
    return availableResidents[0]?.id ? String(availableResidents[0].id) : '';
  };

  const openReservationModal = ({ mode = 'create', reservation = null, slot = null } = {}) => {
    const targetSpaceId = reservation?.space_id || activeSpace?.id || '';
    const targetUnitId = reservation?.unit_id || '';
    const targetResidentId = reservation?.resident_id || '';

    const startTime = reservation?.start_time || slot?.start || '08:00';
    const endTime = reservation?.end_time || slot?.end || '09:00';

    setReservationMode(mode);
    setEditingReservationId(reservation?.id || null);
    setReservationForm({
      space_id: targetSpaceId ? String(targetSpaceId) : '',
      unit_id: targetUnitId ? String(targetUnitId) : '',
      resident_id: targetResidentId ? String(targetResidentId) : '',
      reservation_date: reservation?.reservation_date || selectedDate,
      start_time: startTime,
      end_time: endTime,
      guests_count: reservation?.guests_count ?? 0,
      notes: reservation?.notes || ''
    });

    if (targetUnitId && !targetResidentId) {
      setReservationForm(current => ({
        ...current,
        resident_id: syncReservationResident(targetUnitId)
      }));
    }

    setIsReservationModalOpen(true);
  };

  const handleOpenBooking = (slot) => {
    if (!activeSpace) {
      showToast('Cadastre uma área comum antes de criar reservas.', 'warning');
      return;
    }

    // Verificar se o slot já está ocupado
    const isOccupied = occupiedSlots.some(r => r.start_time === slot.start);
    if (isOccupied || isPastReservationStart(selectedDate, slot.start)) return;

    openReservationModal({ mode: 'create', slot });
  };

  const handleSpaceFormChange = (field, value) => {
    setSpaceForm(current => ({ ...current, [field]: value }));
  };

  const handleEditSpace = (space) => {
    setEditingSpaceId(space.id);
    setSpaceForm({
      name: space.name || '',
      description: space.description || '',
      capacity: space.capacity ?? '',
      price_per_hour: space.price_per_hour ?? '',
      rules: space.rules || ''
    });
  };

  const handleSaveSpace = async (e) => {
    e.preventDefault();

    if (!spaceForm.name.trim()) {
      showToast('Informe o nome da área.', 'warning');
      return;
    }

    if (!spaceForm.capacity || parseInt(spaceForm.capacity, 10) <= 0) {
      showToast('Informe uma capacidade válida.', 'warning');
      return;
    }

    try {
      const payload = {
        ...spaceForm,
        capacity: parseInt(spaceForm.capacity, 10),
        price_per_hour: spaceForm.price_per_hour === '' ? 0 : parseFloat(spaceForm.price_per_hour || '0')
      };

      if (editingSpaceId) {
        await api.updateSpace(editingSpaceId, payload);
        showToast('Área atualizada com sucesso.', 'success');
      } else {
        await api.createSpace(payload);
        showToast('Área criada com sucesso.', 'success');
      }

      resetSpaceForm();
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar área.', 'danger');
    }
  };

  const handleDeleteSpace = async (space) => {
    setDeleteConfirmation({
      message: `Excluir a área "${space.name}"?`,
      onConfirm: async () => {
        try {
          await api.deleteSpace(space.id);
          if (editingSpaceId === space.id) resetSpaceForm();
          showToast('Área removida com sucesso.', 'info');
          setDeleteConfirmation(null);
          loadData();
        } catch (err) {
          showToast(err.message || 'Erro ao excluir área.', 'danger');
        }
      }
    });
  };

  const handleReservationFieldChange = (field, value) => {
    if (field === 'unit_id') {
      setReservationForm(current => ({
        ...current,
        unit_id: value,
        resident_id: syncReservationResident(value)
      }));
      return;
    }

    if (field === 'start_time') {
      setReservationForm(current => ({
        ...current,
        start_time: value,
        end_time: addHoursToTime(value, 1)
      }));
      return;
    }

    if (field === 'end_time') {
      setReservationForm(current => ({
        ...current,
        end_time: value,
        start_time: addHoursToTime(value, -1)
      }));
      return;
    }

    setReservationForm(current => ({ ...current, [field]: value }));
  };

  const handleSaveReservation = async (e) => {
    e.preventDefault();

    if (!reservationForm.space_id || !reservationForm.unit_id || !reservationForm.resident_id) {
      showToast('Selecione a área, a unidade e o morador.', 'warning');
      return;
    }

    if (!reservationForm.start_time || !reservationForm.end_time) {
      showToast('Selecione o período da reserva.', 'warning');
      return;
    }

    if (isPastReservationStart(reservationForm.reservation_date, reservationForm.start_time)) {
      showToast('Não é possível reservar um horário que já passou.', 'warning');
      return;
    }

    const payload = {
      space_id: parseInt(reservationForm.space_id, 10),
      resident_id: parseInt(reservationForm.resident_id, 10),
      unit_id: parseInt(reservationForm.unit_id, 10),
      reservation_date: reservationForm.reservation_date,
      start_time: reservationForm.start_time,
      end_time: reservationForm.end_time,
      guests_count: parseInt(reservationForm.guests_count, 10) || 0,
      notes: reservationForm.notes
    };

    try {
      if (reservationMode === 'edit' && editingReservationId) {
        await api.updateReservation(editingReservationId, payload);
        showToast('Reserva atualizada com sucesso.', 'success');
      } else {
        await api.createReservation(payload);
        showToast('Reserva confirmada com sucesso.', 'success');
      }

      setIsReservationModalOpen(false);
      setEditingReservationId(null);
      setReservationMode('create');
      setReservationForm(initialReservationForm);
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar reserva.', 'danger');
    }
  };

  const handleCancelReservation = async (id, spaceName, time) => {
    setDeleteConfirmation({
      title: 'Cancelar reserva',
      message: `Deseja cancelar a reserva de ${spaceName} às ${time}?`,
      onConfirm: async () => {
        try {
          await api.cancelReservation(id);
          showToast('Reserva cancelada com sucesso.', 'info');
          setDeleteConfirmation(null);
          loadData();
        } catch (err) {
          showToast(err.message || 'Erro ao cancelar reserva.', 'danger');
        }
      }
    });
  };

  const handleDeleteReservation = async (reservation) => {
    setDeleteConfirmation({
      message: `Excluir permanentemente a reserva de ${reservation.space_name} às ${reservation.start_time}?`,
      onConfirm: async () => {
        try {
          await api.deleteReservation(reservation.id);
          showToast('Reserva excluída com sucesso.', 'info');
          setDeleteConfirmation(null);
          loadData();
        } catch (err) {
          showToast(err.message || 'Erro ao excluir reserva.', 'danger');
        }
      }
    });
  };

  return (
    <div>
      <div style={{
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: 'var(--radius-xl)',
        padding: '18px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
            <Clock size={22} />
            <DeleteConfirmModal
              isOpen={Boolean(deleteConfirmation)}
              onClose={() => setDeleteConfirmation(null)}
              onConfirm={() => deleteConfirmation?.onConfirm()}
              title={deleteConfirmation?.title || 'Confirmar exclusão'}
              message={deleteConfirmation?.message}
            />
          </div>
          <div>
            <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '1.05rem' }}>
              Regra Oficial do Condomínio: Limite de 1 Hora por Morador / Dia
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Para garantir acesso justo a todos, cada apartamento possui uma cota máxima de 1 hora por dia para reservas de áreas comuns.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Data:</label>
          <input
            type="date"
            className="form-control"
            style={{ width: '170px' }}
            min={minReservationDate}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <Building size={20} color="var(--accent-primary)" />
            <span>Cadastro de Áreas Comuns</span>
          </div>
          {editingSpaceId && <span className="badge badge-warning">Editando área</span>}
        </div>

        <form onSubmit={handleSaveSpace} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nome da Área *</label>
              <input
                className="form-control"
                value={spaceForm.name}
                onChange={(e) => handleSpaceFormChange('name', e.target.value)}
                placeholder="Ex.: Salão de festas"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Capacidade *</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={spaceForm.capacity}
                onChange={(e) => handleSpaceFormChange('capacity', e.target.value)}
                placeholder="Ex.: 40"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Taxa por Hora (R$)</label>
              <input
                type="number"
                className="form-control"
                min="0"
                step="0.01"
                value={spaceForm.price_per_hour}
                onChange={(e) => handleSpaceFormChange('price_per_hour', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Descrição</label>
            <input
              className="form-control"
              value={spaceForm.description}
              onChange={(e) => handleSpaceFormChange('description', e.target.value)}
              placeholder="Ex.: Espaço climatizado para eventos"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Regras de Uso</label>
            <textarea
              className="form-control"
              rows="2"
              value={spaceForm.rules}
              onChange={(e) => handleSpaceFormChange('rules', e.target.value)}
              placeholder="Ex.: Limpeza obrigatória ao final do uso"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> {editingSpaceId ? 'Salvar Alterações' : 'Criar Área'}
            </button>
            {editingSpaceId && (
              <button type="button" className="btn btn-secondary" onClick={resetSpaceForm}>
                Cancelar Edição
              </button>
            )}
          </div>
        </form>

        <div className="table-container" style={{ marginTop: '18px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Área</th>
                <th>Capacidade</th>
                <th>Taxa/Hora</th>
                <th>Regras</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {spaces.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Nenhuma área cadastrada ainda.
                  </td>
                </tr>
              ) : spaces.map((space) => (
                <tr key={space.id}>
                  <td style={{ fontWeight: '700' }}>{space.name}</td>
                  <td>{space.capacity} pessoas</td>
                  <td>{space.price_per_hour ? `R$ ${Number(space.price_per_hour).toFixed(2)}` : 'Gratuita'}</td>
                  <td style={{ maxWidth: 320 }}>{space.rules || space.description || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => handleEditSpace(space)}>
                        <Edit3 size={14} /> Editar
                      </button>
                      <button className="btn btn-secondary btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => handleDeleteSpace(space)}>
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {spaces.map((space) => {
          const isSelected = activeSpace?.id === space.id;
          const IconComp = iconMap[space.icon] || CalendarDays;

          return (
            <div
              key={space.id}
              onClick={() => setSelectedSpaceId(String(space.id))}
              style={{
                background: isSelected ? 'var(--accent-primary-gradient)' : 'var(--bg-card)',
                border: isSelected ? '1px solid transparent' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                color: isSelected ? '#ffffff' : 'var(--text-main)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#fff' : 'var(--accent-primary)'
                }}>
                  <IconComp size={22} />
                </div>
                {space.price_per_hour > 0 ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(16, 185, 129, 0.15)', color: isSelected ? '#fff' : '#10b981', padding: '2px 8px', borderRadius: '12px' }}>
                    Taxa: R$ {Number(space.price_per_hour).toFixed(2)}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(59, 130, 246, 0.15)', color: isSelected ? '#fff' : '#60a5fa', padding: '2px 8px', borderRadius: '12px' }}>
                    Gratuito
                  </span>
                )}
              </div>

              <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>{space.name}</div>
              <div style={{ fontSize: '0.78rem', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                Capacidade: {space.capacity} pessoas
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ fontSize: '1.25rem' }}>
              Grade de Horários - {activeSpace?.name || 'Selecione uma área'}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Data selecionada: <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}></div>
              <span style={{ color: 'var(--text-muted)' }}>Disponível (1h)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.5)' }}></div>
              <span style={{ color: 'var(--text-muted)' }}>Ocupado</span>
            </div>
          </div>
        </div>

        <div className="slots-grid">
          {timeSlots.map((slot) => {
            const reservationInSlot = occupiedSlots.find(r => r.start_time === slot.start);
            const isOccupied = !!reservationInSlot;
            const isPast = isPastReservationStart(selectedDate, slot.start);

            return (
              <div
                key={slot.start}
                className={`slot-button ${isOccupied || isPast ? 'occupied' : ''}`}
                aria-disabled={isOccupied || isPast}
                onClick={() => !isOccupied && !isPast && handleOpenBooking(slot)}
              >
                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                  {slot.start} - {slot.end}
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  {isOccupied ? (
                    <div>
                      <div style={{ color: '#f87171', fontWeight: '600' }}>Reservado</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {reservationInSlot.block} - {reservationInSlot.unit_number} ({reservationInSlot.resident_name})
                      </div>
                    </div>
                  ) : isPast ? (
                    <span style={{ color: 'var(--text-dim)' }}>Horário encerrado</span>
                  ) : (
                    <span style={{ color: '#10b981' }}>Disponível</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <CheckCircle2 size={20} color="var(--accent-success)" />
            <span>Reservas Agendadas para {selectedDate}</span>
          </div>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => openReservationModal({ mode: 'create' })}>
            <Plus size={14} /> Nova Reserva
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Espaço Comum</th>
                <th>Horário</th>
                <th>Morador / Unidade</th>
                <th>Convidados</th>
                <th>Status</th>
                <th>Observações</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Nenhuma reserva realizada para esta data.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((res) => (
                  <tr key={res.id}>
                    <td style={{ fontWeight: '700' }}>{res.space_name}</td>
                    <td>
                      <span className="badge badge-purple" style={{ fontFamily: 'monospace' }}>
                        {res.start_time} às {res.end_time}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{res.resident_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {res.block} - Apto {res.unit_number}
                      </div>
                    </td>
                    <td>{res.guests_count || 0} pessoas</td>
                    <td>
                      {res.status === 'CONFIRMED' ? (
                        <span className="badge badge-success">Confirmada</span>
                      ) : (
                        <span className="badge badge-danger">{res.status}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{res.notes || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          type="button"
                          onClick={() => openReservationModal({ mode: 'edit', reservation: res })}
                        >
                          <Edit3 size={14} /> Editar
                        </button>
                        {res.status === 'CONFIRMED' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleCancelReservation(res.id, res.space_name, res.start_time)}
                          >
                            <Ban size={14} /> Cancelar
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          type="button"
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDeleteReservation(res)}
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isReservationModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={20} color="var(--accent-primary)" />
                {reservationMode === 'edit' ? 'Editar Reserva' : 'Confirmar Reserva de 1 Hora'}
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsReservationModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveReservation}>
              <div className="modal-body">
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '18px'
                }}>
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                    {spaces.find(space => space.id === parseInt(reservationForm.space_id, 10))?.name || activeSpace?.name || 'Área selecionada'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Data: <strong>{reservationForm.reservation_date}</strong> • Horário: <strong>{reservationForm.start_time} às {reservationForm.end_time}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label>Área Comum *</label>
                  <select
                    className="form-control"
                    required
                    value={reservationForm.space_id}
                    onChange={(e) => handleReservationFieldChange('space_id', e.target.value)}
                  >
                    <option value="">Selecione a Área</option>
                    {spaces.map((space) => (
                      <option key={space.id} value={space.id}>{space.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Data da Reserva *</label>
                  <input
                    type="date"
                    className="form-control"
                    min={minReservationDate}
                    value={reservationForm.reservation_date}
                    onChange={(e) => handleReservationFieldChange('reservation_date', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Hora Inicial *</label>
                    <input
                      type="time"
                      className="form-control"
                      min={reservationForm.reservation_date === getCurrentLocalDateTime().date
                        ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
                        : undefined}
                      value={reservationForm.start_time}
                      onChange={(e) => handleReservationFieldChange('start_time', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Hora Final *</label>
                    <input
                      type="time"
                      className="form-control"
                      value={reservationForm.end_time}
                      onChange={(e) => handleReservationFieldChange('end_time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Apartamento / Unidade *</label>
                  <select
                    className="form-control"
                    required
                    value={reservationForm.unit_id}
                    onChange={(e) => handleReservationFieldChange('unit_id', e.target.value)}
                  >
                    <option value="">Selecione o Apartamento</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.block} - Apto {unit.number}</option>
                    ))}
                  </select>
                </div>

                {reservationForm.unit_id && (
                  <div className="form-group">
                    <label>Morador Responsável *</label>
                    <select
                      className="form-control"
                      required
                      value={reservationForm.resident_id}
                      onChange={(e) => handleReservationFieldChange('resident_id', e.target.value)}
                    >
                      <option value="">Selecione o Morador</option>
                      {residents.filter(resident => resident.unit_id === parseInt(reservationForm.unit_id, 10)).map((resident) => (
                        <option key={resident.id} value={resident.id}>{resident.name} ({resident.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Número Estimado de Convidados</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={reservationForm.guests_count}
                    onChange={(e) => handleReservationFieldChange('guests_count', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Finalidade / Observações</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Ex: Treino particular, almoço de família..."
                    value={reservationForm.notes}
                    onChange={(e) => handleReservationFieldChange('notes', e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsReservationModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {reservationMode === 'edit' ? 'Salvar Alterações' : 'Confirmar Agendamento (1h)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
