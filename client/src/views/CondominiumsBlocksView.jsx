import React, { useEffect, useState } from 'react';
import { 
  Building2, Plus, MapPin, Layers, Link2, Edit3, Trash2, Eye, X, Check, Search, 
  AlertTriangle, Power, Phone, FileText, CheckCircle2, RefreshCw,
  Sliders, LayoutDashboard, ShieldCheck, Package, CalendarDays, DollarSign, ShoppingCart, Users, Megaphone
} from 'lucide-react';
import { api } from '../services/api';
import { DeleteConfirmModal } from '../components/CrudModal';

const emptyCondominium = { 
  name: '', cnpj: '', address: '', city: '', state: '', postal_code: '', phone: '', status: 'ACTIVE' 
};

export default function CondominiumsBlocksView({ showToast }) {
  const [condominiums, setCondominiums] = useState([]);
  const [selected, setSelected] = useState(() => api.getActiveCondominiumId() || '');
  const [blocks, setBlocks] = useState([]);
  const [units, setUnits] = useState([]);
  const [pendingUnits, setPendingUnits] = useState([]);
  
  // Forms & Modal States
  const [form, setForm] = useState(emptyCondominium);
  const [editingCondo, setEditingCondo] = useState(null); // null ou objeto condomínio em edição
  const [viewingCondo, setViewingCondo] = useState(null); // null ou objeto condomínio para visualização detalhada
  const [deletingCondo, setDeletingCondo] = useState(null); // null ou objeto condomínio para confirmação de exclusão
  
  const [blockName, setBlockName] = useState('');
  const [editingBlock, setEditingBlock] = useState(null);
  const [deletingBlock, setDeletingBlock] = useState(null);

  // Unit States
  const [selectedBlockFilter, setSelectedBlockFilter] = useState('ALL');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({ block_id: '', number: '', floor: '1', type: 'Residencial' });
  const [editingUnit, setEditingUnit] = useState(null);
  const [deletingUnit, setDeletingUnit] = useState(null);

  const [legacyBlock, setLegacyBlock] = useState('');
  const [targetBlock, setTargetBlock] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados dos Módulos Ativáveis por Condomínio
  const [condoModules, setCondoModules] = useState({
    dashboard: true,
    access: true,
    deliveries: true,
    reservations: true,
    financial: true,
    market: true
  });
  const [loadingModules, setLoadingModules] = useState(false);
  const [savingModules, setSavingModules] = useState(false);

  // Carregar dados
  const load = async () => {
    try {
      const [items, pending] = await Promise.all([
        api.getCondominiums(), 
        api.getPendingUnits()
      ]);
      setCondominiums(items || []); 
      setPendingUnits(pending || []);
      
      // Mantém o selecionado atual se ainda existir na lista;
      // só cai pro primeiro se não houver nenhum selecionado.
      const storedId = api.getActiveCondominiumId();
      const stillExists = items?.some(c => String(c.id) === storedId);
      const current = stillExists ? storedId : (items?.[0]?.id ? String(items[0].id) : '');

      if (current) { 
        setSelected(current); 
        api.setActiveCondominiumId(current);
        const [condoBlocks, condoUnits] = await Promise.all([
          api.getBlocks(current),
          api.getUnits()
        ]);
        setBlocks(condoBlocks || []); 
        setUnits(condoUnits || []);
      } else {
        setBlocks([]);
        setUnits([]);
      }
    } catch (err) { 
      showToast(err.message || 'Erro ao carregar dados territoriais.', 'danger'); 
    }
  };

  useEffect(() => { load(); }, []);

  const loadModulesForSelected = async (condoId) => {
    if (!condoId) return;
    setLoadingModules(true);
    try {
      const list = await api.getCondominiumModules(condoId);
      if (Array.isArray(list)) {
        const map = Object.fromEntries(list.map(m => [m.module_key, Boolean(m.enabled)]));
        setCondoModules({
          dashboard: Boolean(map.dashboard),
          access: Boolean(map.access),
          deliveries: Boolean(map.deliveries),
          reservations: Boolean(map.reservations),
          financial: Boolean(map.financial),
          market: Boolean(map.market)
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar módulos do condomínio:', err);
    } finally {
      setLoadingModules(false);
    }
  };

  const handleToggleModule = (key) => {
    setCondoModules(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveModules = async () => {
    if (!selected) return;
    setSavingModules(true);
    try {
      await api.updateCondominiumModules(selected, condoModules);
      showToast('Módulos do condomínio atualizados com sucesso!', 'success');
      window.dispatchEvent(new Event('condo-modules-changed'));
    } catch (err) {
      showToast(err.message || 'Erro ao salvar módulos do condomínio.', 'danger');
    } finally {
      setSavingModules(false);
    }
  };

  useEffect(() => { 
    if (selected) {
      api.setActiveCondominiumId(selected);
      loadModulesForSelected(selected);
      Promise.all([
        api.getBlocks(selected),
        api.getUnits()
      ]).then(([b, u]) => {
        setBlocks(b || []);
        setUnits(u || []);
      }).catch(err => showToast(err.message, 'danger')); 
    }
  }, [selected]);

  // --- AÇÕES DE CONDOMÍNIO ---

  // Cadastrar Novo Condomínio
  const handleCreateCondominium = async (event) => {
    event.preventDefault();
    try { 
      const created = await api.createCondominium(form); 
      setForm(emptyCondominium); 
      setSelected(String(created.id)); 
      api.setActiveCondominiumId(String(created.id));
      window.dispatchEvent(new Event('condo-list-changed'));
      showToast(`Condomínio "${created.name}" cadastrado e definido como ativo!`, 'success'); 
      await load(); 
    } catch (err) { 
      showToast(err.message, 'danger'); 
    }
  };

  // Atualizar Condomínio Existente (Editar)
  const handleUpdateCondominium = async (event) => {
    event.preventDefault();
    if (!editingCondo) return;
    try {
      const updated = await api.updateCondominium(editingCondo.id, editingCondo);
      window.dispatchEvent(new Event('condo-list-changed'));
      showToast(`Condomínio "${updated.name}" atualizado com sucesso!`, 'success');
      setEditingCondo(null);
      await load();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Alternar Status (Ativo / Inativo)
  const handleToggleStatus = async (condo) => {
    const nextStatus = condo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateCondominiumStatus(condo.id, nextStatus);
      window.dispatchEvent(new Event('condo-list-changed'));
      showToast(`Status do condomínio "${condo.name}" alterado para ${nextStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}.`, 'success');
      await load();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Confirmar e Deletar Condomínio
  const handleDeleteCondominium = async () => {
    if (!deletingCondo) return;
    try {
      await api.deleteCondominium(deletingCondo.id);
      window.dispatchEvent(new Event('condo-list-changed'));
      showToast(`Condomínio "${deletingCondo.name}" excluído com sucesso!`, 'success');
      if (selected === String(deletingCondo.id)) {
        setSelected('');
      }
      setDeletingCondo(null);
      await load();
    } catch (err) {
      showToast(err.message || 'Não foi possível excluir o condomínio.', 'danger');
    }
  };

  // --- AÇÕES DE BLOCOS ---

  const handleCreateBlock = async (event) => {
    event.preventDefault();
    if (!selected) return showToast('Selecione um condomínio primeiro.', 'warning');
    if (!blockName.trim()) return showToast('Informe o nome do bloco.', 'warning');

    const trimmed = blockName.trim();
    if (blocks.some(b => b.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      return showToast(`Já existe um bloco chamado "${trimmed}" neste condomínio.`, 'warning');
    }

    try { 
      await api.createBlock(selected, { name: trimmed }); 
      setBlockName(''); 
      showToast('Bloco cadastrado com sucesso!', 'success'); 
      setBlocks(await api.getBlocks(selected)); 
      await load(); 
    } catch (err) { 
      showToast(err.message, 'danger'); 
    }
  };

  const handleUpdateBlock = async (event) => {
    event.preventDefault();
    if (!editingBlock) return;
    const trimmed = editingBlock.name?.trim();
    if (!trimmed) return showToast('Informe o nome do bloco.', 'warning');

    if (blocks.some(b => b.id !== editingBlock.id && b.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      return showToast(`Já existe outro bloco chamado "${trimmed}" neste condomínio.`, 'warning');
    }

    try {
      await api.updateBlock(editingBlock.id, { name: trimmed, description: editingBlock.description });
      showToast('Bloco atualizado com sucesso.', 'success');
      setEditingBlock(null);
      setBlocks(await api.getBlocks(selected));
      await load();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteBlock = async (block) => {
    setDeletingBlock(block);
  };

  const handleConfirmDeleteBlock = async () => {
    if (!deletingBlock) return;
    try {
      await api.deleteBlock(deletingBlock.id);
      showToast(`Bloco "${deletingBlock.name}" removido com sucesso.`, 'success');
      setDeletingBlock(null);
      setBlocks(await api.getBlocks(selected));
      await load();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // --- AÇÕES DE UNIDADES ---

  const handleCreateUnit = async (event) => {
    event.preventDefault();
    if (!selected) return showToast('Selecione um condomínio primeiro.', 'warning');
    if (!unitForm.block_id) return showToast('Selecione um bloco para a unidade.', 'warning');
    if (!unitForm.number || !unitForm.number.trim()) return showToast('Informe o número da unidade.', 'warning');

    const trimmedNum = unitForm.number.trim();
    if (units.some(u => String(u.block_id) === String(unitForm.block_id) && u.number.trim().toLowerCase() === trimmedNum.toLowerCase())) {
      return showToast(`A unidade "${trimmedNum}" já está cadastrada neste bloco.`, 'warning');
    }

    try {
      await api.createUnit({ ...unitForm, number: trimmedNum });
      showToast(`Unidade "${trimmedNum}" cadastrada com sucesso!`, 'success');
      setIsCreatingUnit(false);
      setUnitForm({ block_id: blocks[0]?.id ? String(blocks[0].id) : '', number: '', floor: '1', type: 'Residencial' });
      await load();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleUpdateUnit = async (event) => {
    event.preventDefault();
    if (!editingUnit) return;
    const trimmedNum = String(editingUnit.number || '').trim();
    if (!trimmedNum) return showToast('Informe o número da unidade.', 'warning');

    const targetBlockId = editingUnit.block_id;
    if (units.some(u => u.id !== editingUnit.id && String(u.block_id) === String(targetBlockId) && u.number.trim().toLowerCase() === trimmedNum.toLowerCase())) {
      return showToast(`A unidade "${trimmedNum}" já existe neste bloco.`, 'warning');
    }

    try {
      await api.updateUnit(editingUnit.id, { ...editingUnit, number: trimmedNum });
      showToast(`Unidade "${trimmedNum}" atualizada com sucesso!`, 'success');
      setEditingUnit(null);
      await load();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;
    try {
      await api.deleteUnit(deletingUnit.id);
      showToast(`Unidade "${deletingUnit.number}" excluída com sucesso!`, 'success');
      setDeletingUnit(null);
      await load();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir unidade.', 'danger');
    }
  };

  // Mapear Unidades Legadas
  const handleMapUnits = async (event) => {
    event.preventDefault();
    if (!targetBlock || !legacyBlock) return showToast('Selecione a identificação legada e o bloco de destino.', 'warning');
    try { 
      const result = await api.mapLegacyUnits(targetBlock, legacyBlock); 
      showToast(`${result.mapped} unidade(s) associada(s) com sucesso!`, 'success'); 
      setLegacyBlock(''); 
      setTargetBlock(''); 
      await load(); 
    } catch (err) { 
      showToast(err.message, 'danger'); 
    }
  };

  const filteredCondominiums = condominiums.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cnpj && c.cnpj.includes(searchTerm)) ||
    (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedCondoObj = condominiums.find(c => String(c.id) === selected);
  const legacyBlocks = [...new Set(pendingUnits.map(unit => unit.legacy_block))];

  const filteredUnits = units.filter(u => {
    const matchesBlock = selectedBlockFilter === 'ALL' || String(u.block_id) === String(selectedBlockFilter);
    const matchesSearch = !unitSearchTerm || 
      String(u.number).toLowerCase().includes(unitSearchTerm.toLowerCase()) ||
      (u.block && u.block.toLowerCase().includes(unitSearchTerm.toLowerCase())) ||
      (u.type && u.type.toLowerCase().includes(unitSearchTerm.toLowerCase()));
    return matchesBlock && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Topo / Métricas Rápidas de Condomínios */}
      <div className="metrics-grid" style={{ marginBottom: 0 }}>
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--accent-mint)', color: 'var(--accent-mint-text)' }}>
            <Building2 size={24} />
          </div>
          <div className="metric-info">
            <h4>Condomínios cadastrados</h4>
            <div className="value">{condominiums.length}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--accent-info-bg)', color: 'var(--accent-info-text)' }}>
            <Layers size={24} />
          </div>
          <div className="metric-info">
            <h4>Total de blocos/torres</h4>
            <div className="value">{condominiums.reduce((acc, c) => acc + (c.blocks_count || 0), 0)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'var(--accent-purple-bg)', color: 'var(--accent-purple-text)' }}>
            <MapPin size={24} />
          </div>
          <div className="metric-info">
            <h4>Total de unidades/aptos</h4>
            <div className="value">{condominiums.reduce((acc, c) => acc + (c.units_count || 0), 0)}</div>
          </div>
        </div>
      </div>

      {/* Grid Principal: Form de Cadastro & Lista de Condomínios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(450px, 2fr)', gap: 24, alignItems: 'start' }}>
        
        {/* Formulário de Cadastro de Novo Condomínio */}
        <form className="card" onSubmit={handleCreateCondominium} style={{ position: 'sticky', top: 90 }}>
          <div className="card-header">
            <div className="card-title">
              <Building2 size={20} color="var(--brand-forest)" /> Cadastrar Novo Condomínio
            </div>
          </div>
          
          <div className="form-group">
            <label>Nome do Condomínio *</label>
            <input 
              className="form-control" 
              required 
              placeholder="Ex.: Residencial Horizon Tower" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CNPJ</label>
              <input 
                className="form-control" 
                placeholder="00.000.000/0001-00" 
                value={form.cnpj} 
                onChange={e => setForm({ ...form, cnpj: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>Telefone / Contato</label>
              <input 
                className="form-control" 
                placeholder="(11) 99999-9999" 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Endereço Completo</label>
            <input 
              className="form-control" 
              placeholder="Av. Paulista, 1000 - Bela Vista" 
              value={form.address} 
              onChange={e => setForm({ ...form, address: e.target.value })} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cidade</label>
              <input 
                className="form-control" 
                placeholder="São Paulo" 
                value={form.city} 
                onChange={e => setForm({ ...form, city: e.target.value })} 
              />
            </div>
            <div className="form-group" style={{ maxWidth: 90 }}>
              <label>UF</label>
              <input 
                className="form-control" 
                placeholder="SP" 
                maxLength={2} 
                value={form.state} 
                onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })} 
              />
            </div>
            <div className="form-group">
              <label>CEP</label>
              <input 
                className="form-control" 
                placeholder="01310-100" 
                value={form.postal_code} 
                onChange={e => setForm({ ...form, postal_code: e.target.value })} 
              />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            <Plus size={18} /> Salvar e Cadastrar Condomínio
          </button>
        </form>

        {/* Coluna da Direita: Lista Interativa de Condomínios e Gerenciamento de Blocos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Tabela / Cards de Condomínios Cadastrados */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div className="card-title">
                <MapPin size={20} color="var(--brand-forest)" /> Diretorio de Condomínios ({condominiums.length})
              </div>

              {/* Busca Rápida */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', minWidth: 220 }}>
                <Search size={14} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Buscar condomínio..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '.85rem', width: '100%', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {filteredCondominiums.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <Building2 size={36} opacity={0.4} style={{ marginBottom: 8 }} />
                <p>Nenhum condomínio encontrado {searchTerm ? 'para a busca informada' : 'no sistema'}.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Condomínio</th>
                      <th>CNPJ / Local</th>
                      <th>Status</th>
                      <th>Estrutura</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCondominiums.map(item => {
                      const isSelected = String(item.id) === selected;
                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => setSelected(String(item.id))}
                          style={{ 
                            cursor: 'pointer', 
                            background: isSelected ? 'var(--accent-mint)' : undefined,
                            transition: 'background 0.2s ease'
                          }}
                        >
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</div>
                            {item.phone && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}><Phone size={12} /> {item.phone}</div>}
                          </td>
                          <td>
                            <div style={{ fontSize: '.85rem' }}>{item.cnpj || 'Sem CNPJ'}</div>
                            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                              {item.city ? `${item.city}/${item.state || ''}` : 'Endereço não informado'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${item.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                              {item.status === 'ACTIVE' ? '🟢 Ativo' : '🔴 Inativo'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '.85rem', fontWeight: 600 }}>
                              {item.blocks_count || 0} bloco(s) • {item.units_count || 0} apto(s)
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              {/* Botão Visualizar Detalhes */}
                              <button 
                                className="btn-icon" 
                                title="Visualizar detalhes" 
                                onClick={() => setViewingCondo(item)}
                              >
                                <Eye size={16} />
                              </button>

                              {/* Botão Editar */}
                              <button 
                                className="btn-icon" 
                                title="Editar condomínio" 
                                onClick={() => setEditingCondo({ ...item })}
                              >
                                <Edit3 size={16} color="var(--brand-forest)" />
                              </button>

                              {/* Botão Excluir */}
                              <button 
                                className="btn-icon danger" 
                                title="Excluir condomínio" 
                                onClick={() => setDeletingCondo(item)}
                              >
                                <Trash2 size={16} color="var(--accent-danger)" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Gerenciamento de Módulos do Condomínio Selecionado */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div className="card-title">
                <Sliders size={20} color="var(--brand-forest)" />
                Módulos de {selectedCondoObj ? `"${selectedCondoObj.name}"` : 'Selecione um Condomínio'}
              </div>
              {selectedCondoObj && (
                <button 
                  className="btn btn-primary"
                  onClick={handleSaveModules}
                  disabled={savingModules || loadingModules || !selected}
                  style={{ padding: '6px 14px', fontSize: '.85rem' }}
                >
                  <Check size={15} /> {savingModules ? 'Salvando...' : 'Salvar Alterações de Módulos'}
                </button>
              )}
            </div>

            {loadingModules ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                Carregando módulos do condomínio...
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Defina quais módulos opcionais estão disponíveis para os usuários deste condomínio. As 3 áreas estruturais permanecem sempre ativas por padrão.
                </p>

                {/* Grid dos 6 Módulos Opcionais */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {[
                    { key: 'dashboard', label: 'Dashboard & Indicadores', icon: LayoutDashboard, desc: 'Métricas consolidadas do condomínio' },
                    { key: 'access', label: 'Portaria & Acessos', icon: ShieldCheck, desc: 'Entradas, saídas e registros de visitantes' },
                    { key: 'deliveries', label: 'Controle de Encomendas', icon: Package, desc: 'Recebimento de encomendas e retirada com PIN' },
                    { key: 'reservations', label: 'Reservas de Áreas Comuns', icon: CalendarDays, desc: 'Agendamento de churrasqueira, salão e quadra' },
                    { key: 'financial', label: 'Gestão Financeira & Taxas', icon: DollarSign, desc: 'Lançamentos, receitas, despesas e boletos' },
                    { key: 'market', label: 'Mercadinho & Estoque', icon: ShoppingCart, desc: 'PDV autônomo e controle de produtos' }
                  ].map(mod => {
                    const Icon = mod.icon;
                    const isEnabled = Boolean(condoModules[mod.key]);
                    return (
                      <div 
                        key={mod.key} 
                        onClick={() => handleToggleModule(mod.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: isEnabled ? '1.5px solid var(--brand-forest)' : '1px solid var(--border-color)',
                          background: isEnabled ? 'var(--accent-mint)' : 'var(--bg-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ 
                            width: 34, 
                            height: 34, 
                            borderRadius: 'var(--radius-sm)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: isEnabled ? 'var(--bg-primary)' : 'var(--bg-card)',
                            color: isEnabled ? 'var(--brand-forest)' : 'var(--text-muted)'
                          }}>
                            <Icon size={17} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text-main)' }}>
                              {mod.label}
                            </div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                              {mod.desc}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className={`badge ${isEnabled ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '.72rem' }}>
                            {isEnabled ? '🟢 Ativo' : '⚪ Inativo'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Áreas Estruturais Obrigatórias */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    Áreas Estruturais Obrigatórias (Sempre Ativas)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { label: 'Cadastro de Pessoas & Unidades', icon: Users },
                      { label: 'Condomínios & Blocos', icon: Building2 },
                      { label: 'Mural de Avisos', icon: Megaphone }
                    ].map(area => {
                      const AreaIcon = area.icon;
                      return (
                        <div 
                          key={area.label} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            fontSize: '.78rem',
                            color: 'var(--text-main)'
                          }}
                        >
                          <AreaIcon size={14} color="var(--brand-forest)" />
                          <span>{area.label}</span>
                          <span className="badge badge-info" style={{ fontSize: '.68rem', padding: '2px 6px' }}>Obrigatório</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gerenciamento de Blocos do Condomínio Selecionado */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">
                <Layers size={20} color="var(--brand-forest)" /> 
                Blocos de {selectedCondoObj ? `"${selectedCondoObj.name}"` : 'Selecione um Condomínio'}
              </div>
              {selectedCondoObj && (
                <span className="badge badge-info">{blocks.length} Bloco(s)</span>
              )}
            </div>

            {/* Inserir Bloco */}
            <form onSubmit={handleCreateBlock} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input 
                className="form-control" 
                placeholder="Nome do bloco (Ex.: Torre A, Bloco 1, Edifício Sol)" 
                value={blockName} 
                onChange={e => setBlockName(e.target.value)} 
                disabled={!selected}
              />
              <button className="btn btn-secondary" disabled={!selected}>
                <Plus size={16} /> Adicionar Bloco
              </button>
            </form>

            {/* Tabela de Blocos */}
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nome do Bloco</th>
                    <th>Status</th>
                    <th>Unidades Vinculadas</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.length ? blocks.map(block => (
                    <tr key={block.id}>
                      <td style={{ fontWeight: 700 }}>{block.name}</td>
                      <td>
                        <span className="badge badge-success">{block.status || 'ACTIVE'}</span>
                      </td>
                      <td>{block.units_count || 0} unidade(s)</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-icon" 
                            title="Editar Bloco"
                            onClick={() => setEditingBlock({ ...block })}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            className="btn-icon danger" 
                            title="Excluir Bloco"
                            onClick={() => handleDeleteBlock(block)}
                          >
                            <Trash2 size={15} color="var(--accent-danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        {selected ? 'Nenhum bloco cadastrado para este condomínio.' : 'Selecione um condomínio acima para visualizar seus blocos.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gerenciamento de Unidades do Condomínio Selecionado */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div className="card-title">
                <Building2 size={20} color="var(--brand-forest)" /> 
                Unidades Habitacionais {selectedCondoObj ? `("${selectedCondoObj.name}")` : ''} ({units.length})
              </div>
              <button 
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '.85rem' }}
                disabled={!selected || blocks.length === 0}
                onClick={() => {
                  setUnitForm({
                    block_id: blocks[0]?.id ? String(blocks[0].id) : '',
                    number: '',
                    floor: '1',
                    type: 'Residencial'
                  });
                  setIsCreatingUnit(true);
                }}
              >
                <Plus size={16} /> Nova Unidade
              </button>
            </div>

            {/* Filtros e Busca de Unidades */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <select 
                className="form-control" 
                style={{ flex: 1, minWidth: 160 }}
                value={selectedBlockFilter}
                onChange={e => setSelectedBlockFilter(e.target.value)}
                disabled={!selected}
              >
                <option value="ALL">Todos os Blocos ({units.length})</option>
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({units.filter(u => String(u.block_id) === String(b.id)).length} aptos)
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', flex: 2, minWidth: 200 }}>
                <Search size={14} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Buscar por número, bloco ou tipo..." 
                  value={unitSearchTerm} 
                  onChange={e => setUnitSearchTerm(e.target.value)}
                  disabled={!selected}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '.85rem', width: '100%', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* Tabela de Unidades */}
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th>Bloco</th>
                    <th>Andar</th>
                    <th>Tipo</th>
                    <th>Vínculos</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.length > 0 ? filteredUnits.map(unit => (
                    <tr key={unit.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>Apto {unit.number}</td>
                      <td>{unit.block || '-'}</td>
                      <td>{unit.floor ? `${unit.floor}º Andar` : '-'}</td>
                      <td>
                        <span className="badge badge-info">{unit.type || 'Residencial'}</span>
                      </td>
                      <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                        👥 {unit.residents_count || 0} morador(es) • 🚗 {unit.vehicles_count || 0} veíc.
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-icon" 
                            title="Editar Unidade"
                            onClick={() => setEditingUnit({ ...unit })}
                          >
                            <Edit3 size={15} color="var(--brand-forest)" />
                          </button>
                          <button 
                            className="btn-icon danger" 
                            title="Excluir Unidade"
                            onClick={() => setDeletingUnit(unit)}
                          >
                            <Trash2 size={15} color="var(--accent-danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        {!selected 
                          ? 'Selecione um condomínio acima para visualizar suas unidades.' 
                          : blocks.length === 0 
                            ? 'Cadastre ao menos um bloco antes de adicionar unidades.'
                            : 'Nenhuma unidade encontrada para os filtros aplicados.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {pendingUnits.length > 0 && (
            <form className="card" onSubmit={handleMapUnits}>
              <div className="card-title">
                <Link2 size={20} color="var(--brand-forest)" /> Associar Unidades Legadas Pendentes ({pendingUnits.length})
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', margin: '8px 0 16px 0' }}>
                Existem unidades no banco registradas antes do modelo relacional. Associe-as explicitamente ao bloco desejado.
              </p>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Identificação Legada Atual</label>
                  <select className="form-control" value={legacyBlock} onChange={e => setLegacyBlock(e.target.value)}>
                    <option value="">Selecione o Bloco Legado</option>
                    {legacyBlocks.map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Bloco de Destino</label>
                  <select className="form-control" value={targetBlock} onChange={e => setTargetBlock(e.target.value)}>
                    <option value="">Selecione o Bloco Alvo</option>
                    {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                  </select>
                </div>
              </div>
              
              <button className="btn btn-primary" style={{ marginTop: 8 }}>
                <Link2 size={16} /> Confirmar Associação de Unidades
              </button>
            </form>
          )}

        </div>
      </div>

      {/* ========================================================================== */}
      {/* MODAL DE EDIÇÃO DE CONDOMÍNIO                                              */}
      {/* ========================================================================== */}
      {editingCondo && (
        <div className="modal-overlay" onClick={() => setEditingCondo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="card-title">
                <Edit3 size={20} color="var(--brand-forest)" /> Editar Condomínio #{editingCondo.id}
              </div>
              <button className="btn-icon" onClick={() => setEditingCondo(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCondominium}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Nome do Condomínio *</label>
                  <input 
                    className="form-control" 
                    required 
                    value={editingCondo.name} 
                    onChange={e => setEditingCondo({ ...editingCondo, name: e.target.value })} 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>CNPJ</label>
                    <input 
                      className="form-control" 
                      value={editingCondo.cnpj || ''} 
                      onChange={e => setEditingCondo({ ...editingCondo, cnpj: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input 
                      className="form-control" 
                      value={editingCondo.phone || ''} 
                      onChange={e => setEditingCondo({ ...editingCondo, phone: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Endereço</label>
                  <input 
                    className="form-control" 
                    value={editingCondo.address || ''} 
                    onChange={e => setEditingCondo({ ...editingCondo, address: e.target.value })} 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cidade</label>
                    <input 
                      className="form-control" 
                      value={editingCondo.city || ''} 
                      onChange={e => setEditingCondo({ ...editingCondo, city: e.target.value })} 
                    />
                  </div>
                  <div className="form-group" style={{ maxWidth: 90 }}>
                    <label>UF</label>
                    <input 
                      className="form-control" 
                      maxLength={2} 
                      value={editingCondo.state || ''} 
                      onChange={e => setEditingCondo({ ...editingCondo, state: e.target.value.toUpperCase() })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>CEP</label>
                    <input 
                      className="form-control" 
                      value={editingCondo.postal_code || ''} 
                      onChange={e => setEditingCondo({ ...editingCondo, postal_code: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status do Condomínio</label>
                  <select 
                    className="form-control" 
                    value={editingCondo.status || 'ACTIVE'}
                    onChange={e => setEditingCondo({ ...editingCondo, status: e.target.value })}
                  >
                    <option value="ACTIVE">🟢 Ativo (Operando normalmente)</option>
                    <option value="INACTIVE">🔴 Inativo (Acesso suspenso)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingCondo(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CONDOMÍNIO                            */}
      {/* ========================================================================== */}
      {deletingCondo && (
        <div className="modal-overlay" onClick={() => setDeletingCondo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header" style={{ color: 'var(--accent-danger)' }}>
              <div className="card-title">
                <AlertTriangle size={22} color="var(--accent-danger)" /> Confirmar Exclusão
              </div>
              <button className="btn-icon" onClick={() => setDeletingCondo(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 0' }}>
              <p style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                Deseja realmente excluir o condomínio <strong>"{deletingCondo.name}"</strong>?
              </p>
              
              <div style={{ marginTop: 12, padding: 12, background: 'var(--accent-danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger-text)', fontSize: '.85rem' }}>
                <p>⚠️ <strong>Atenção:</strong> Condomínios que possuem blocos ou unidades vinculadas não poderão ser excluídos sem antes mover ou remover suas dependências.</p>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setDeletingCondo(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteCondominium} style={{ background: 'var(--accent-danger)', color: '#FFF' }}>
                <Trash2 size={16} /> Excluir Condomínio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL DE DETALHES DO CONDOMÍNIO (VISUALIZAR)                               */}
      {/* ========================================================================== */}
      {viewingCondo && (
        <div className="modal-overlay" onClick={() => setViewingCondo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="card-title">
                <Building2 size={20} color="var(--brand-forest)" /> Detalhes do Condomínio
              </div>
              <button className="btn-icon" onClick={() => setViewingCondo(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)' }}>{viewingCondo.name}</h3>
                  <span className="badge badge-success" style={{ marginTop: 4 }}>{viewingCondo.status}</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '.85rem', color: 'var(--text-muted)' }}>
                  ID: #{viewingCondo.id}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '.9rem' }}>
                <div><strong>CNPJ:</strong> {viewingCondo.cnpj || 'Não informado'}</div>
                <div><strong>Telefone:</strong> {viewingCondo.phone || 'Não informado'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Endereço:</strong> {viewingCondo.address || 'Não informado'}</div>
                <div><strong>Cidade/UF:</strong> {viewingCondo.city ? `${viewingCondo.city}/${viewingCondo.state || ''}` : 'N/A'}</div>
                <div><strong>CEP:</strong> {viewingCondo.postal_code || 'N/A'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <div className="metric-card" style={{ padding: 14, gap: 12 }}>
                  <div className="metric-icon-box" style={{ width: 40, height: 40, background: 'var(--accent-info-bg)', color: 'var(--accent-info-text)' }}>
                    <Layers size={18} />
                  </div>
                  <div className="metric-info">
                    <h4>Blocos cadastrados</h4>
                    <div className="value" style={{ fontSize: '1.4rem' }}>{viewingCondo.blocks_count || 0}</div>
                  </div>
                </div>
                <div className="metric-card" style={{ padding: 14, gap: 12 }}>
                  <div className="metric-icon-box" style={{ width: 40, height: 40, background: 'var(--accent-purple-bg)', color: 'var(--accent-purple-text)' }}>
                    <MapPin size={18} />
                  </div>
                  <div className="metric-info">
                    <h4>Unidades habitacionais</h4>
                    <div className="value" style={{ fontSize: '1.4rem' }}>{viewingCondo.units_count || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setViewingCondo(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL DE EDIÇÃO DE BLOCO                                                  */}
      {/* ========================================================================== */}
      {editingBlock && (
        <div className="modal-overlay" onClick={() => setEditingBlock(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div className="card-title">
                <Edit3 size={18} /> Editar Bloco #{editingBlock.id}
              </div>
              <button className="btn-icon" onClick={() => setEditingBlock(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateBlock}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label>Nome do Bloco *</label>
                  <input 
                    className="form-control" 
                    required 
                    value={editingBlock.name} 
                    onChange={e => setEditingBlock({ ...editingBlock, name: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Descrição / Observações</label>
                  <input 
                    className="form-control" 
                    value={editingBlock.description || ''} 
                    onChange={e => setEditingBlock({ ...editingBlock, description: e.target.value })} 
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingBlock(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================== */}
      {/* MODAL DE CADASTRO DE UNIDADE                                              */}
      {/* ========================================================================== */}
      {isCreatingUnit && (
        <div className="modal-overlay" onClick={() => setIsCreatingUnit(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="card-title">
                <Plus size={20} color="var(--brand-forest)" /> Nova Unidade / Apartamento
              </div>
              <button className="btn-icon" onClick={() => setIsCreatingUnit(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUnit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Bloco Pertencente *</label>
                  <select 
                    className="form-control" 
                    required 
                    value={unitForm.block_id}
                    onChange={e => setUnitForm({ ...unitForm, block_id: e.target.value })}
                  >
                    <option value="">Selecione o Bloco</option>
                    {blocks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Número / Identificação *</label>
                    <input 
                      className="form-control" 
                      required 
                      placeholder="Ex.: 101, 202-B, Cobertura 1" 
                      value={unitForm.number}
                      onChange={e => setUnitForm({ ...unitForm, number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Andar</label>
                    <input 
                      type="number"
                      className="form-control" 
                      placeholder="Ex.: 1" 
                      value={unitForm.floor}
                      onChange={e => setUnitForm({ ...unitForm, floor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Tipo de Unidade</label>
                  <select 
                    className="form-control" 
                    value={unitForm.type}
                    onChange={e => setUnitForm({ ...unitForm, type: e.target.value })}
                  >
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Cobertura">Cobertura</option>
                    <option value="Kitnet">Kitnet</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingUnit(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL DE EDIÇÃO DE UNIDADE                                                */}
      {/* ========================================================================== */}
      {editingUnit && (
        <div className="modal-overlay" onClick={() => setEditingUnit(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="card-title">
                <Edit3 size={18} color="var(--brand-forest)" /> Editar Unidade #{editingUnit.id}
              </div>
              <button className="btn-icon" onClick={() => setEditingUnit(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUnit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Bloco Pertencente *</label>
                  <select 
                    className="form-control" 
                    required 
                    value={editingUnit.block_id || ''}
                    onChange={e => setEditingUnit({ ...editingUnit, block_id: e.target.value })}
                  >
                    <option value="">Selecione o Bloco</option>
                    {blocks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Número / Identificação *</label>
                    <input 
                      className="form-control" 
                      required 
                      value={editingUnit.number}
                      onChange={e => setEditingUnit({ ...editingUnit, number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Andar</label>
                    <input 
                      type="number"
                      className="form-control" 
                      value={editingUnit.floor || 1}
                      onChange={e => setEditingUnit({ ...editingUnit, floor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Tipo de Unidade</label>
                  <select 
                    className="form-control" 
                    value={editingUnit.type || 'Residencial'}
                    onChange={e => setEditingUnit({ ...editingUnit, type: e.target.value })}
                  >
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Cobertura">Cobertura</option>
                    <option value="Kitnet">Kitnet</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUnit(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE UNIDADE                               */}
      {/* ========================================================================== */}
      {deletingUnit && (
        <div className="modal-overlay" onClick={() => setDeletingUnit(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header" style={{ color: 'var(--accent-danger)' }}>
              <div className="card-title">
                <AlertTriangle size={22} color="var(--accent-danger)" /> Confirmar Exclusão de Unidade
              </div>
              <button className="btn-icon" onClick={() => setDeletingUnit(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 0' }}>
              <p style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                Deseja realmente excluir a unidade <strong>"Apto {deletingUnit.number}"</strong> ({deletingUnit.block || 'Sem bloco'})?
              </p>
              
              <div style={{ marginTop: 12, padding: 12, background: 'var(--accent-danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger-text)', fontSize: '.85rem' }}>
                <p>⚠️ <strong>Atenção:</strong> Se esta unidade possuir moradores, veículos, encomendas, acessos de portaria ou boletos financeiros vinculados, a exclusão será bloqueada pela integridade relacional.</p>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setDeletingUnit(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteUnit} style={{ background: 'var(--accent-danger)', color: '#FFF' }}>
                <Trash2 size={16} /> Excluir Unidade
              </button>
            </div>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        isOpen={Boolean(deletingBlock)}
        onClose={() => setDeletingBlock(null)}
        onConfirm={handleConfirmDeleteBlock}
        message={`Deseja realmente excluir o bloco "${deletingBlock?.name}"?`}
      />
    </div>
  );
}
