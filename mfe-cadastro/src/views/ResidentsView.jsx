import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Building2, 
  Car, 
  Heart, 
  Phone, 
  Mail, 
  Trash2, 
  Search, 
  X, 
  Plus, 
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api';

export default function ResidentsView({ showToast }) {
  const [units, setUnits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  // Modais
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Form morador
  const [residentForm, setResidentForm] = useState({
    unit_id: '',
    name: '',
    email: '',
    phone: '',
    cpf: '',
    role: 'Proprietário',
    emergency_contact: ''
  });

  // Form veículo
  const [vehicleForm, setVehicleForm] = useState({
    unit_id: '',
    resident_id: '',
    plate: '',
    model: '',
    color: '',
    type: 'Carro',
    parking_spot: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [unitRes, resRes, vehRes, petRes] = await Promise.all([
        api.getUnits(),
        api.getResidents({ search: searchTerm, unit_id: selectedUnitId }),
        api.getVehicles(),
        api.getPets()
      ]);
      setUnits(unitRes);
      setResidents(resRes);
      setVehicles(vehRes);
      setPets(petRes);
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

  const handleCreateResident = async (e) => {
    e.preventDefault();
    if (!residentForm.unit_id || !residentForm.name) {
      showToast('Unidade e nome são obrigatórios.', 'warning');
      return;
    }
    try {
      await api.createResident(residentForm);
      showToast('Novo morador cadastrado com sucesso!', 'success');
      setIsResidentModalOpen(false);
      setResidentForm({ unit_id: '', name: '', email: '', phone: '', cpf: '', role: 'Proprietário', emergency_contact: '' });
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao cadastrar morador.', 'danger');
    }
  };

  const handleDeleteResident = async (id, name) => {
    if (!window.confirm(`Deseja realmente remover o cadastro de ${name}?`)) return;
    try {
      await api.deleteResident(id);
      showToast(`Morador ${name} removido.`, 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao remover morador.', 'danger');
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.unit_id || !vehicleForm.plate || !vehicleForm.model) {
      showToast('Preencha os campos obrigatórios do veículo.', 'warning');
      return;
    }
    try {
      await api.createVehicle(vehicleForm);
      showToast('Veículo cadastrado com sucesso!', 'success');
      setIsVehicleModalOpen(false);
      setVehicleForm({ unit_id: '', resident_id: '', plate: '', model: '', color: '', type: 'Carro', parking_spot: '' });
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao cadastrar veículo.', 'danger');
    }
  };

  return (
    <div>
      {/* Barra de Ações Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <div className="search-box" style={{ width: '280px' }}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Buscar por morador, CPF, telefone..." 
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

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setIsVehicleModalOpen(true)}>
            <Car size={16} /> Cadastrar Veículo
          </button>
          <button className="btn btn-primary" onClick={() => setIsResidentModalOpen(true)}>
            <UserPlus size={16} /> Novo Morador
          </button>
        </div>
      </div>

      {/* Grid de Moradores Cadastrados */}
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
            const resPets = pets.filter(p => p.unit_id === res.unit_id);

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
                    <button 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      title="Excluir cadastro"
                      onClick={() => handleDeleteResident(res.id, res.name)}
                    >
                      <Trash2 size={16} />
                    </button>
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

                {/* Seção de Veículos e Pets da Unidade */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {resVehicles.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Car size={13} color="var(--accent-purple)" />
                      {resVehicles.map(v => `${v.model} (${v.plate})`).join(' • ')}
                    </div>
                  )}
                  {resPets.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Heart size={13} color="#f43f5e" />
                      {resPets.map(p => `${p.name} (${p.type})`).join(' • ')}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Novo Morador */}
      {isResidentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--accent-primary)" /> Cadastrar Novo Morador
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsResidentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateResident}>
              <div className="modal-body">
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
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsResidentModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Morador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Veículo */}
      {isVehicleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={20} color="var(--accent-purple)" /> Cadastrar Veículo
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsVehicleModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateVehicle}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Unidade *</label>
                    <select 
                      className="form-control"
                      required
                      value={vehicleForm.unit_id}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, unit_id: e.target.value })}
                    >
                      <option value="">Selecione o Apartamento</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
                      ))}
                    </select>
                  </div>

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
                    </select>
                  </div>
                </div>

                <div className="form-row">
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
                </div>

                <div className="form-row">
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
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsVehicleModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Cadastrar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
