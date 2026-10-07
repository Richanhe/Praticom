import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  LogOut, 
  Search, 
  Car, 
  UserCheck, 
  Clock, 
  X, 
  CheckCircle,
  Building,
  Briefcase,
  Truck
} from 'lucide-react';
import { api } from '../services/api';

export default function AccessControlView({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [units, setUnits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de entrada
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    visitor_name: '',
    document: '',
    type: 'Visitante',
    company: '',
    vehicle_plate: '',
    unit_id: '',
    authorized_by: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, unitRes, resRes] = await Promise.all([
        api.getAccessLogs({ status: statusFilter, type: typeFilter, search: searchTerm }),
        api.getUnits(),
        api.getResidents()
      ]);
      setLogs(logsRes);
      setUnits(unitRes);
      setResidents(resRes);
    } catch (err) {
      showToast('Erro ao carregar registros de acesso.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    if (!formData.visitor_name || !formData.document) {
      showToast('Nome e documento são obrigatórios.', 'warning');
      return;
    }
    try {
      await api.registerEntry(formData);
      showToast(`Entrada liberada para ${formData.visitor_name}!`, 'success');
      setIsEntryModalOpen(false);
      setFormData({
        visitor_name: '',
        document: '',
        type: 'Visitante',
        company: '',
        vehicle_plate: '',
        unit_id: '',
        authorized_by: '',
        notes: ''
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao registrar entrada.', 'danger');
    }
  };

  const handleExit = async (id, name) => {
    try {
      await api.registerExit(id);
      showToast(`Saída registrada para ${name}.`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao registrar saída.', 'danger');
    }
  };

  const activeCount = logs.filter(l => l.status === 'inside').length;

  return (
    <div>
      {/* Banner de Status da Portaria */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Painel de Controle da Portaria
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Atualmente <strong>{activeCount} pessoa(s)</strong> externas estão dentro do condomínio.
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setIsEntryModalOpen(true)}>
          <UserPlus size={18} /> Registrar Nova Entrada
        </button>
      </div>

      {/* Filtros e Busca */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '420px' }}>
          <div className="search-box" style={{ width: '100%' }}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nome, documento, placa, empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Buscar</button>
        </form>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select 
            className="form-control" 
            style={{ width: '170px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="inside">Dentro do Prédio</option>
            <option value="exited">Já Saíram</option>
          </select>

          <select 
            className="form-control" 
            style={{ width: '180px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            <option value="Visitante">Visitante</option>
            <option value="Prestador de Serviço">Prestador de Serviço</option>
            <option value="Entregador">Entregador</option>
          </select>
        </div>
      </div>

      {/* Tabela de Acessos */}
      <div className="card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome / Documento</th>
                <th>Tipo</th>
                <th>Destino / Unidade</th>
                <th>Autorizado Por</th>
                <th>Horário de Entrada</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Carregando acessos...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum registro de acesso encontrado.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{log.visitor_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Doc: {log.document} {log.company && `• ${log.company}`}
                      </div>
                      {log.vehicle_plate && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Car size={12} /> Placa: {log.vehicle_plate}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        log.type === 'Visitante' ? 'badge-purple' : 
                        log.type === 'Prestador de Serviço' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td>
                      {log.unit_number ? (
                        <span style={{ fontWeight: '600' }}>{log.block} - Apto {log.unit_number}</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Área Comum / Geral</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{log.authorized_by || 'Portaria'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{new Date(log.entered_at).toLocaleDateString('pt-BR')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(log.entered_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      {log.status === 'inside' ? (
                        <span className="badge badge-warning">
                          <Clock size={12} /> No Condomínio
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <CheckCircle size={12} /> Saiu às {log.exited_at ? new Date(log.exited_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {log.status === 'inside' ? (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleExit(log.id, log.visitor_name)}
                        >
                          <LogOut size={14} /> Registrar Saída
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Finalizado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registro de Nova Entrada */}
      {isEntryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--accent-purple)" /> Registrar Entrada na Portaria
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsEntryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEntrySubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="Ex: João Carlos Silveira" 
                      value={formData.visitor_name}
                      onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Documento (RG / CPF) *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="Ex: 12.345.678-9" 
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Entrada *</label>
                    <select 
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Visitante">Visitante</option>
                      <option value="Prestador de Serviço">Prestador de Serviço</option>
                      <option value="Entregador">Entregador</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Empresa / Prestador</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: Enel, Net, iFood..." 
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Unidade de Destino</label>
                    <select 
                      className="form-control"
                      value={formData.unit_id}
                      onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    >
                      <option value="">Selecione o Apartamento</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Placa do Veículo (Se houver)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: BRA2E19" 
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Autorizado Por (Morador / Portaria)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: Carlos Eduardo (Apto 101-A)" 
                    value={formData.authorized_by}
                    onChange={(e) => setFormData({ ...formData, authorized_by: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Observações / Motivo da Visita</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Ex: Manutenção elétrica autorizada pelo morador"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEntryModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Liberar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
