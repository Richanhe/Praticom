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
  Building
} from 'lucide-react';
import { api } from '../services/api';

export default function ReservationsView({ showToast }) {
  const [spaces, setSpaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [units, setUnits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros / Seleção
  const [selectedSpaceId, setSelectedSpaceId] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal de Nova Reserva
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [residentIdInput, setResidentIdInput] = useState('');
  const [unitIdInput, setUnitIdInput] = useState('');
  const [guestsCount, setGuestsCount] = useState(0);
  const [notesInput, setNotesInput] = useState('');

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

      if (spacesRes.length > 0 && !selectedSpaceId) {
        setSelectedSpaceId(spacesRes[0].id);
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
  const occupiedSlots = reservations.filter(r => r.space_id === activeSpace?.id && r.status === 'Confirmada');

  const handleOpenBooking = (slot) => {
    // Verificar se o slot já está ocupado
    const isOccupied = occupiedSlots.some(r => r.start_time === slot.start);
    if (isOccupied) return;

    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleUnitChange = (unitId) => {
    setUnitIdInput(unitId);
    // Pegar o primeiro morador desta unidade
    const firstResident = residents.find(r => r.unit_id === parseInt(unitId, 10));
    if (firstResident) {
      setResidentIdInput(firstResident.id.toString());
    } else {
      setResidentIdInput('');
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!residentIdInput || !unitIdInput || !selectedSlot) {
      showToast('Selecione o morador e o horário.', 'warning');
      return;
    }

    try {
      await api.createReservation({
        space_id: activeSpace.id,
        resident_id: parseInt(residentIdInput, 10),
        unit_id: parseInt(unitIdInput, 10),
        reservation_date: selectedDate,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        guests_count: guestsCount,
        notes: notesInput
      });

      showToast(`Reserva confirmada com sucesso para ${selectedSlot.start} às ${selectedSlot.end}!`, 'success');
      setIsModalOpen(false);
      setSelectedSlot(null);
      setNotesInput('');
      setGuestsCount(0);
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao criar reserva.', 'danger');
    }
  };

  const handleCancelReservation = async (id, spaceName, time) => {
    if (!window.confirm(`Deseja cancelar a reserva de ${spaceName} às ${time}?`)) return;
    try {
      await api.cancelReservation(id);
      showToast('Reserva cancelada com sucesso.', 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao cancelar reserva.', 'danger');
    }
  };

  return (
    <div>
      {/* Alerta de Regra de Negócio: 1 hora por morador por dia */}
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
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Seletor de Espaços Comuns (Cards) */}
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
              onClick={() => setSelectedSpaceId(space.id)}
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
                {space.fee > 0 ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(16, 185, 129, 0.15)', color: isSelected ? '#fff' : '#10b981', padding: '2px 8px', borderRadius: '12px' }}>
                    Taxa: R$ {space.fee.toFixed(2)}
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

      {/* Grade de Horários (Slots de 1 Hora) */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ fontSize: '1.25rem' }}>
              Grade de Horários - {activeSpace?.name}
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

            return (
              <div
                key={slot.start}
                className={`slot-button ${isOccupied ? 'occupied' : ''}`}
                onClick={() => !isOccupied && handleOpenBooking(slot)}
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
                  ) : (
                    <span style={{ color: '#10b981' }}>Disponível</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Reservas Confirmadas do Dia */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <CheckCircle2 size={20} color="var(--accent-success)" />
            <span>Reservas Agendadas para {selectedDate}</span>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Espaço Comum</th>
                <th>Horário (Exatamente 1h)</th>
                <th>Morador / Unidade</th>
                <th>Convidados</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Nenhuma reserva realizada para esta data.
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
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
                        {res.block} - Apto {res.unit_number} {res.resident_phone && `• ${res.resident_phone}`}
                      </div>
                    </td>
                    <td>{res.guests_count || 0} pessoas</td>
                    <td>
                      {res.status === 'Confirmada' ? (
                        <span className="badge badge-success">Confirmada</span>
                      ) : (
                        <span className="badge badge-danger">{res.status}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {res.status === 'Confirmada' && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={() => handleCancelReservation(res.id, res.space_name, res.start_time)}
                        >
                          <Ban size={14} /> Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação de Reserva */}
      {isModalOpen && selectedSlot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={20} color="var(--accent-primary)" /> Confirmar Reserva de 1 Hora
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateReservation}>
              <div className="modal-body">
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '18px'
                }}>
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)' }}>{activeSpace.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Data: <strong>{selectedDate}</strong> • Horário: <strong>{selectedSlot.start} às {selectedSlot.end} (1 hora)</strong>
                  </div>
                  {activeSpace.fee > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>
                      Taxa de uso: R$ {activeSpace.fee.toFixed(2)} (será debitada na taxa condominial)
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Apartamento / Unidade *</label>
                  <select 
                    className="form-control"
                    required
                    value={unitIdInput}
                    onChange={(e) => handleUnitChange(e.target.value)}
                  >
                    <option value="">Selecione o Apartamento</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
                    ))}
                  </select>
                </div>

                {unitIdInput && (
                  <div className="form-group">
                    <label>Morador Responsável *</label>
                    <select 
                      className="form-control"
                      required
                      value={residentIdInput}
                      onChange={(e) => setResidentIdInput(e.target.value)}
                    >
                      <option value="">Selecione o Morador</option>
                      {residents.filter(r => r.unit_id === parseInt(unitIdInput, 10)).map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Número Estimado de Convidados (Capacidade máxima: {activeSpace.capacity})</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    max={activeSpace.capacity}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label>Finalidade / Observações</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Ex: Treino particular, almoço de família..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Agendamento (1h)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
