import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Building2,
  Car,
  Phone,
  Mail,
  Trash2,
  Search,
  X,
  Plus,
  ShieldAlert,
  KeyRound,
  Pencil
} from 'lucide-react';
import { api } from '../services/api';
import CrudModal, { DeleteConfirmModal } from '../components/CrudModal';

const EMPTY_RESIDENT = {
  unit_id: '',
  name: '',
  email: '',
  phone: '',
  cpf: '',
  role: 'Proprietário',
  emergency_contact: ''
};

const EMPTY_VEHICLE = {
  unit_id: '',
  resident_id: '',
  plate: '',
  model: '',
  color: '',
  type: 'Carro',
  parking_spot: ''
};

export default function ResidentsView({ showToast }) {
  const [activeTab, setActiveTab] = useState('residents'); // 'residents' | 'vehicles'
  const [units, setUnits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  // Modais
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // null = criando, objeto = editando
  const [editingResident, setEditingResident] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // Form morador
  const [residentForm, setResidentForm] = useState(EMPTY_RESIDENT);

  // Form veículo
  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [unitRes, resRes, vehRes] = await Promise.all([
        api.getUnits(),
        api.getResidents({ search: searchTerm, unit_id: selectedUnitId }),
        api.getVehicles()
      ]);
      setUnits(unitRes);
      setResidents(resRes);
      setVehicles(vehRes);
    } catch (err) {
      showToast('Erro ao carregar dados de moradores.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedUnitId]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const openCreateModal = () => {
    setEditingResident(null);
    setResidentForm(EMPTY_RESIDENT);
    setIsResidentModalOpen(true);
  };

  const openEditModal = (res) => {
    setEditingResident(res);
    setResidentForm({
      unit_id: String(res.unit_id),
      name: res.name || '',
      email: res.email || '',
      phone: res.phone || '',
      cpf: res.cpf || '',
      role: res.role || 'Proprietário',
      emergency_contact: res.emergency_contact || ''
    });
    setIsResidentModalOpen(true);
  };

  const closeResidentModal = () => {
    setIsResidentModalOpen(false);
    setEditingResident(null);
    setResidentForm(EMPTY_RESIDENT);
  };

  const handleSubmitResident = async (e) => {
    e.preventDefault();
    if (!residentForm.unit_id || !residentForm.name) {
      showToast('Unidade e nome são obrigatórios.', 'warning');
      return;
    }
    try {
      if (editingResident) {
        await api.updateResident(editingResident.id, residentForm);
        showToast('Morador atualizado com sucesso!', 'success');
      } else {
        await api.createResident(residentForm);
        showToast('Novo morador cadastrado com sucesso!', 'success');
      }
      closeResidentModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar morador.', 'danger');
    }
  };

  const handleDeleteResident = async (id, name) => {
    setDeleteConfirmation({
      message: `Deseja realmente remover o cadastro de ${name}?`,
      onConfirm: async () => {
        try {
          await api.deleteResident(id);
          showToast(`Morador ${name} removido.`, 'info');
          setDeleteConfirmation(null);
          loadData();
        } catch (err) {
          showToast(err.message || 'Erro ao remover morador.', 'danger');
        }
      }
    });
  };

  const openCreateVehicleModal = () => {
    setEditingVehicle(null);
    setVehicleForm(EMPTY_VEHICLE);
    setIsVehicleModalOpen(true);
  };

  const openEditVehicleModal = (veh) => {
    setEditingVehicle(veh);
    setVehicleForm({
      unit_id: String(veh.unit_id || ''),
      resident_id: veh.resident_id ? String(veh.resident_id) : '',
      plate: veh.plate || '',
      model: veh.model || '',
      color: veh.color || '',
      type: veh.type || 'Carro',
      parking_spot: veh.parking_spot || ''
    });
    setIsVehicleModalOpen(true);
  };

  const closeVehicleModal = () => {
    setIsVehicleModalOpen(false);
    setEditingVehicle(null);
    setVehicleForm(EMPTY_VEHICLE);
  };

  const handleSubmitVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.unit_id || !vehicleForm.plate || !vehicleForm.model) {
      showToast('Preencha os campos obrigatórios do veículo (Unidade, Placa e Modelo).', 'warning');
      return;
    }
    try {
      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, vehicleForm);
        showToast(`Veículo ${vehicleForm.plate} atualizado com sucesso!`, 'success');
      } else {
        await api.createVehicle(vehicleForm);
        showToast('Veículo cadastrado com sucesso!', 'success');
      }
      closeVehicleModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar veículo.', 'danger');
    }
  };

  const handleDeleteVehicle = async (vehicle) => {
    const confirmMsg = `Deseja realmente excluir o veículo "${vehicle.model}" (Placa: ${vehicle.plate})? Esta ação não afetará o morador ou apartamento.`;
    setDeleteConfirmation({
      message: confirmMsg,
      onConfirm: async () => {
        try {
          await api.deleteVehicle(vehicle.id);
          showToast(`Veículo ${vehicle.plate} excluído com sucesso.`, 'info');
          setDeleteConfirmation(null);
          loadData();
        } catch (err) {
          showToast(err.message || 'Erro ao excluir veículo.', 'danger');
        }
      }
    });
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (selectedUnitId && String(v.unit_id) !== String(selectedUnitId)) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (v.plate && v.plate.toLowerCase().includes(term)) ||
      (v.model && v.model.toLowerCase().includes(term)) ||
      (v.color && v.color.toLowerCase().includes(term)) ||
      (v.resident_name && v.resident_name.toLowerCase().includes(term)) ||
      (v.unit_number && String(v.unit_number).toLowerCase().includes(term)) ||
      (v.block && v.block.toLowerCase().includes(term))
    );
  });

  const unitResidentsForVehicle = vehicleForm.unit_id
    ? residents.filter(r => String(r.unit_id) === String(vehicleForm.unit_id))
    : [];

  return (
    <div>
      {/* Abas Superiores de Navegação */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'residents' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('residents')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: activeTab === 'residents' ? '600' : 'normal' }}
        >
          <Users size={18} /> Moradores ({residents.length})
        </button>
        <button
          className={`btn ${activeTab === 'vehicles' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('vehicles')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: activeTab === 'vehicles' ? '600' : 'normal' }}
        >
          <Car size={18} /> Ver Veículos ({vehicles.length})
        </button>
      </div>

      {/* Barra de Ações Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <div className="search-box" style={{ width: '280px' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder={activeTab === 'residents' ? "Buscar por morador, CPF, telefone..." : "Buscar por placa, modelo, morador..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary">Buscar</button>
          </form>

          <select
            className="form-control"
            style={{ width: '200px' }}
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
          >
            <option value="">Todas as Unidades</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
            ))}
          </select>
        </div>

        {/* Botões lado a lado conforme solicitado */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {activeTab === 'residents' ? (
            <button className="btn btn-secondary" onClick={() => setActiveTab('vehicles')}>
              <Car size={16} /> Ver Veículos
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={() => setActiveTab('residents')}>
              <Users size={16} /> Ver Moradores
            </button>
          )}
          <button className="btn btn-secondary" onClick={openCreateVehicleModal}>
            <Plus size={16} /> Cadastrar Veículo
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <UserPlus size={16} /> Novo Morador
          </button>
        </div>
      </div>

      {/* Visualização: Tabela de Veículos ou Grid de Moradores */}
      {activeTab === 'vehicles' ? (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Carregando veículos cadastrados...</div>
          ) : filteredVehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <Car size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <h4 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>Nenhum veículo cadastrado</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                {searchTerm || selectedUnitId
                  ? 'Nenhum veículo encontrado para os filtros selecionados.'
                  : 'Nenhum veículo foi associado às unidades deste condomínio até o momento.'}
              </p>
              <button className="btn btn-primary" onClick={openCreateVehicleModal}>
                <Plus size={16} /> Cadastrar Primeiro Veículo
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Veículo (Marca / Modelo)</th>
                    <th>Placa</th>
                    <th>Cor</th>
                    <th>Pessoa Responsável</th>
                    <th>Apartamento</th>
                    <th>Bloco</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((veh) => (
                    <tr key={veh.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent-primary)'
                          }}>
                            <Car size={16} />
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-main)', display: 'block' }}>{veh.model}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{veh.type || 'Carro'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: '700', letterSpacing: '0.5px' }}>
                          {veh.plate}
                        </span>
                      </td>
                      <td>
                        {veh.color || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        {veh.resident_name ? (
                          <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{veh.resident_name}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Não associada</span>
                        )}
                      </td>
                      <td>
                        {veh.unit_number ? (
                          <span className="badge badge-secondary">Apto {veh.unit_number}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {veh.block ? (
                          <span>{veh.block}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            title="Editar informações do veículo"
                            onClick={() => openEditVehicleModal(veh)}
                          >
                            <Pencil size={14} /> Editar
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--danger, #ef4444)', display: 'flex', alignItems: 'center', gap: '6px' }}
                            title="Excluir este veículo"
                            onClick={() => handleDeleteVehicle(veh)}
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Grid de Moradores Cadastrados */
        <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>Carregando moradores...</div>
        ) : residents.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Nenhum morador encontrado.
          </div>
        ) : (
          residents.map((res) => {
            const resVehicles = vehicles.filter(v => v.resident_id === res.id || v.unit_id === res.unit_id);

            return (
              <div key={res.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <span className="badge badge-info" style={{ marginBottom: '6px' }}>
                        {res.block} - Apto {res.unit_number}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginTop: '2px' }}>
                        {res.name}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                        {res.role}
                      </span>
                    </div>
                    {/* Ações: Editar + Excluir */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '4px' }}
                        title="Editar morador"
                        onClick={() => openEditModal(res)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                        title="Excluir cadastro"
                        onClick={() => handleDeleteResident(res.id, res.name)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {res.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} color="var(--accent-primary)" /> {res.phone}
                      </div>
                    )}
                    {res.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={14} color="var(--accent-primary)" /> {res.email}
                      </div>
                    )}
                    {res.cpf && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <KeyRound size={14} color="var(--text-dim)" /> CPF: {res.cpf}
                      </div>
                    )}
                    {res.emergency_contact && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
                        <ShieldAlert size={14} /> Emergência: {res.emergency_contact}
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção de Veículos da Unidade */}
                {resVehicles.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Car size={13} color="var(--accent-purple)" />
                      {resVehicles.map(v => `${v.model} (${v.plate})`).join(' • ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}

      {/* Modal: Criar / Editar Morador */}
      <CrudModal
        isOpen={isResidentModalOpen}
        onClose={closeResidentModal}
        title={editingResident ? 'Editar Morador' : 'Cadastrar Novo Morador'}
        icon={editingResident ? Pencil : UserPlus}
        onSubmit={handleSubmitResident}
        submitText={editingResident ? 'Salvar Alterações' : 'Salvar Morador'}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Unidade (Apartamento) *</label>
            <select
              className="form-control"
              required
              value={residentForm.unit_id}
              onChange={(e) => setResidentForm({ ...residentForm, unit_id: e.target.value })}
            >
              <option value="">Selecione a Unidade</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Papel / Vínculo *</label>
            <select
              className="form-control"
              value={residentForm.role}
              onChange={(e) => setResidentForm({ ...residentForm, role: e.target.value })}
            >
              <option value="Proprietário">Proprietário</option>
              <option value="Inquilino">Inquilino</option>
              <option value="Familiar">Familiar / Dependente</option>
              <option value="Síndico">Síndico / Subsíndico</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Nome Completo *</label>
          <input
            type="text"
            className="form-control"
            required
            placeholder="Ex: Carlos Eduardo Silva"
            value={residentForm.name}
            onChange={(e) => setResidentForm({ ...residentForm, name: e.target.value })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Telefone / WhatsApp</label>
            <input
              type="text"
              className="form-control"
              placeholder="(11) 98765-4321"
              value={residentForm.phone}
              onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              className="form-control"
              placeholder="morador@email.com"
              value={residentForm.email}
              onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>CPF</label>
            <input
              type="text"
              className="form-control"
              placeholder="123.456.789-00"
              value={residentForm.cpf}
              onChange={(e) => setResidentForm({ ...residentForm, cpf: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Contato de Emergência</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Maria (Esposa) (11) 99999-8888"
              value={residentForm.emergency_contact}
              onChange={(e) => setResidentForm({ ...residentForm, emergency_contact: e.target.value })}
            />
          </div>
        </div>
      </CrudModal>

      {/* Modal: Cadastrar / Editar Veículo */}
      <CrudModal
        isOpen={isVehicleModalOpen}
        onClose={closeVehicleModal}
        title={editingVehicle ? 'Editar Veículo' : 'Cadastrar Veículo'}
        icon={editingVehicle ? Pencil : Car}
        iconColor="var(--accent-purple)"
        onSubmit={handleSubmitVehicle}
        submitText={editingVehicle ? 'Salvar Alterações' : 'Cadastrar Veículo'}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Unidade (Apartamento) *</label>
            <select
              className="form-control"
              required
              value={vehicleForm.unit_id}
              onChange={(e) => {
                const newUnitId = e.target.value;
                setVehicleForm({
                  ...vehicleForm,
                  unit_id: newUnitId,
                  resident_id: '' // reseta morador ao trocar de unidade
                });
              }}
            >
              <option value="">Selecione a Unidade</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Pessoa Responsável (Morador)</label>
            <select
              className="form-control"
              value={vehicleForm.resident_id}
              onChange={(e) => setVehicleForm({ ...vehicleForm, resident_id: e.target.value })}
            >
              <option value="">Não associar a morador específico</option>
              {unitResidentsForVehicle.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
              ))}
            </select>
            {vehicleForm.unit_id && unitResidentsForVehicle.length === 0 && (
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                Nenhum morador cadastrado nesta unidade.
              </small>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Veículo</label>
            <select
              className="form-control"
              value={vehicleForm.type}
              onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
            >
              <option value="Carro">Carro</option>
              <option value="Moto">Moto</option>
              <option value="SUV / Caminhonete">SUV / Caminhonete</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Placa do Veículo *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Ex: BRA2E19"
              value={vehicleForm.plate}
              onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Modelo / Marca *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Ex: Toyota Corolla, Honda Civic..."
              value={vehicleForm.model}
              onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Cor</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Prata, Preto, Branco"
              value={vehicleForm.color}
              onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Vaga de Garagem</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ex: Vaga G1-04"
            value={vehicleForm.parking_spot}
            onChange={(e) => setVehicleForm({ ...vehicleForm, parking_spot: e.target.value })}
          />
        </div>
      </CrudModal>
      <DeleteConfirmModal
        isOpen={Boolean(deleteConfirmation)}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => deleteConfirmation?.onConfirm()}
        message={deleteConfirmation?.message}
      />
    </div>
  );
}
