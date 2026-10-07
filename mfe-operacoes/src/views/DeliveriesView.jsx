import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  CheckCircle, 
  Key, 
  Send, 
  QrCode, 
  X, 
  Filter,
  CheckCircle2,
  Clock,
  Building
} from 'lucide-react';
import { api } from '../services/api';

export default function DeliveriesView({ showToast }) {
  const [deliveries, setDeliveries] = useState([]);
  const [units, setUnits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [pickupPinInput, setPickupPinInput] = useState('');
  const [pickedUpByInput, setPickedUpByInput] = useState('');

  // Form de nova encomenda
  const [formData, setFormData] = useState({
    unit_id: '',
    resident_id: '',
    courier: 'Mercado Livre',
    tracking_code: '',
    description: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [delRes, unitRes, resRes] = await Promise.all([
        api.getDeliveries({ status: statusFilter }),
        api.getUnits(),
        api.getResidents()
      ]);
      setDeliveries(delRes);
      setUnits(unitRes);
      setResidents(resRes);
    } catch (err) {
      showToast('Erro ao carregar encomendas', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.unit_id || !formData.courier) {
      showToast('Preencha os campos obrigatórios.', 'warning');
      return;
    }
    try {
      const created = await api.createDelivery(formData);
      showToast(`Encomenda cadastrada! PIN de retirada gerado: ${created.pickup_code}`, 'success');
      setIsNewModalOpen(false);
      setFormData({ unit_id: '', resident_id: '', courier: 'Mercado Livre', tracking_code: '', description: '', notes: '' });
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao registrar encomenda.', 'danger');
    }
  };

  const handlePickup = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    try {
      await api.pickupDelivery(selectedDelivery.id, {
        pickup_code: pickupPinInput,
        picked_up_by: pickedUpByInput || 'Morador'
      });
      showToast('Encomenda entregue e retirada confirmada!', 'success');
      setIsPickupModalOpen(false);
      setSelectedDelivery(null);
      setPickupPinInput('');
      setPickedUpByInput('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao confirmar retirada. Verifique o PIN.', 'danger');
    }
  };

  const filteredDeliveries = deliveries.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.block?.toLowerCase().includes(term) ||
      item.unit_number?.toLowerCase().includes(term) ||
      item.resident_name?.toLowerCase().includes(term) ||
      item.courier?.toLowerCase().includes(term) ||
      item.tracking_code?.toLowerCase().includes(term)
    );
  });

  const availableResidentsForUnit = formData.unit_id 
    ? residents.filter(r => r.unit_id === parseInt(formData.unit_id, 10))
    : [];

  return (
    <div>
      {/* Barra de Ações Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-box" style={{ width: '280px' }}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar por unidade, morador, código..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="form-control" 
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="pending">Aguardando Retirada</option>
            <option value="delivered">Já Entregues</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
          <Plus size={18} /> Registrar Recebimento de Pacote
        </button>
      </div>

      {/* Tabela de Encomendas */}
      <div className="card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Unidade / Morador</th>
                <th>Transportadora</th>
                <th>Descrição / Rastreio</th>
                <th>Recebido em</th>
                <th>PIN de Retirada</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Carregando encomendas...</td></tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhuma encomenda encontrada.</td></tr>
              ) : (
                filteredDeliveries.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{pkg.block} - Apto {pkg.unit_number}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pkg.resident_name || 'Destinatário Geral'}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{pkg.courier}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{pkg.description || 'Pacote sem descrição'}</div>
                      {pkg.tracking_code && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          Cod: {pkg.tracking_code}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{new Date(pkg.received_at).toLocaleDateString('pt-BR')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(pkg.received_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        color: '#60a5fa'
                      }}>
                        <Key size={14} /> {pkg.pickup_code}
                      </div>
                    </td>
                    <td>
                      {pkg.status === 'pending' ? (
                        <span className="badge badge-warning">
                          <Clock size={12} /> Aguardando Retirada
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Retirado em {new Date(pkg.picked_up_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {pkg.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="Simular Notificação WhatsApp"
                            onClick={() => showToast(`Notificação enviada ao morador da unidade ${pkg.block} - ${pkg.unit_number} com PIN: ${pkg.pickup_code}`, 'info')}
                          >
                            <Send size={14} /> Notificar
                          </button>
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setSelectedDelivery(pkg);
                              setIsPickupModalOpen(true);
                            }}
                          >
                            <CheckCircle size={14} /> Dar Baixa
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          Por: {pkg.picked_up_by || 'Morador'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Recebimento de Pacote */}
      {isNewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="var(--accent-primary)" /> Registrar Encomenda
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsNewModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Unidade de Destino *</label>
                  <select 
                    className="form-control"
                    required
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value, resident_id: '' })}
                  >
                    <option value="">Selecione o Apartamento</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
                    ))}
                  </select>
                </div>

                {formData.unit_id && (
                  <div className="form-group">
                    <label>Morador Destinatário (Opcional)</label>
                    <select 
                      className="form-control"
                      value={formData.resident_id}
                      onChange={(e) => setFormData({ ...formData, resident_id: e.target.value })}
                    >
                      <option value="">Morador / Toda Unidade</option>
                      {availableResidentsForUnit.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Empresa / Transportadora *</label>
                    <select 
                      className="form-control"
                      value={formData.courier}
                      onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                    >
                      <option value="Mercado Livre">Mercado Livre</option>
                      <option value="Amazon Brasil">Amazon Brasil</option>
                      <option value="Correios (SEDEX / PAC)">Correios</option>
                      <option value="Shopee">Shopee</option>
                      <option value="Magalu">Magalu</option>
                      <option value="iFood">iFood</option>
                      <option value="Transportadora Jadlog">Jadlog</option>
                      <option value="Outra Transportadora">Outra</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Código de Rastreio</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: BR123456789" 
                      value={formData.tracking_code}
                      onChange={(e) => setFormData({ ...formData, tracking_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição do Pacote / Volume</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: Caixa média Mercado Livre, Envelope lacrado..." 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Observações da Portaria</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Ex: Deixado na gaveta 3 da portaria"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar e Gerar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Baixa / Retirada */}
      {isPickupModalOpen && selectedDelivery && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="var(--accent-success)" /> Baixa de Encomenda
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsPickupModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePickup}>
              <div className="modal-body">
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem' }}>{selectedDelivery.block} - Apto {selectedDelivery.unit_number}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Morador: {selectedDelivery.resident_name || 'Qualquer morador da unidade'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '4px' }}>{selectedDelivery.courier} • {selectedDelivery.description}</div>
                </div>

                <div className="form-group">
                  <label>Digite o PIN de Retirada (4 Dígitos do Morador) *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="Ex: 7492"
                    maxLength={4}
                    style={{ fontSize: '1.4rem', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 'bold' }}
                    value={pickupPinInput}
                    onChange={(e) => setPickupPinInput(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '6px' }}>
                    O morador recebeu este código no aviso de entrega. PIN de teste: <strong>{selectedDelivery.pickup_code}</strong>
                  </small>
                </div>

                <div className="form-group">
                  <label>Nome de quem está retirando na portaria</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: O próprio morador, filho, funcionário..." 
                    value={pickedUpByInput}
                    onChange={(e) => setPickedUpByInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPickupModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Confirmar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
