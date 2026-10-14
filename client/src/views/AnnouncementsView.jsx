import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Pencil,
  AlertTriangle,
  Calendar,
  User,
  X,
  Tag,
  CheckCircle,
  Bell
} from 'lucide-react';
import { api } from '../services/api';

const EMPTY_ANNOUNCEMENT = {
  title: '',
  content: '',
  priority: 'normal',
  category: 'Geral',
  author: 'Síndico Geral',
  target_block: 'Todos',
  is_pinned: false,
  expires_at: ''
};

export default function AnnouncementsView({ showToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState(EMPTY_ANNOUNCEMENT);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnouncements({
        category: categoryFilter,
        priority: priorityFilter
      });
      setAnnouncements(res);
    } catch (err) {
      showToast('Erro ao carregar comunicados.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, priorityFilter]);

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormData(EMPTY_ANNOUNCEMENT);
    setIsModalOpen(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      content: announcement.content || '',
      priority: announcement.priority || 'normal',
      category: announcement.category || 'Geral',
      author: announcement.author || 'Síndico Geral',
      target_block: announcement.target_block || 'Todos',
      is_pinned: Boolean(announcement.is_pinned),
      expires_at: announcement.expires_at || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
    setFormData(EMPTY_ANNOUNCEMENT);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showToast('Título e conteúdo são obrigatórios.', 'warning');
      return;
    }
    try {
      if (editingAnnouncement) {
        await api.updateAnnouncement(editingAnnouncement.id, formData);
        showToast('Comunicado atualizado com sucesso!', 'success');
      } else {
        await api.createAnnouncement(formData);
        showToast('Comunicado publicado no mural com sucesso!', 'success');
      }
      closeModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao publicar comunicado.', 'danger');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Deseja remover o comunicado "${title}"?`)) return;
    try {
      await api.deleteAnnouncement(id);
      showToast('Comunicado excluído do mural.', 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir comunicado.', 'danger');
    }
  };

  return (
    <div>
      {/* Barra de Ações Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas Categorias</option>
            <option value="Geral">Geral</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Assembleia">Assembleia</option>
            <option value="Segurança">Segurança</option>
            <option value="Lazer">Lazer</option>
          </select>

          <select
            className="form-control"
            style={{ width: '180px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">Todas Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="normal">Normal</option>
            <option value="low">Baixa</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Publicar Novo Comunicado
        </button>
      </div>

      {/* Grid de Comunicados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Carregando comunicados...</div>
        ) : announcements.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Nenhum comunicado encontrado no mural.
          </div>
        ) : (
          [...announcements]
            .sort((a, b) => {
              const aPinned = (a.is_pinned === 1 || a.is_pinned === true) ? 1 : 0;
              const bPinned = (b.is_pinned === 1 || b.is_pinned === true) ? 1 : 0;
              if (bPinned !== aPinned) return bPinned - aPinned;
              return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            })
            .map((ann) => {
              const isPinned = ann.is_pinned === 1 || ann.is_pinned === true;
              const p = String(ann.priority || '').toLowerCase();
              const isUrgent = p === 'urgent' || p === 'urgente' || p === 'high' || p === 'alta';

              return (
                <div
                  key={ann.id}
                  className="card"
                  style={{
                    borderLeft: isPinned ? '5px solid var(--accent-purple)' : isUrgent ? '5px solid var(--accent-danger)' : '1px solid var(--border-color)',
                    background: isPinned ? 'rgba(168, 85, 247, 0.03)' : isUrgent ? 'rgba(239, 68, 68, 0.04)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {isPinned && (
                        <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Pin size={12} /> Fixado
                        </span>
                      )}
                    <span className={`badge ${ann.priority === 'urgent' ? 'badge-danger' :
                        ann.priority === 'high' ? 'badge-warning' : 'badge-info'
                      }`}>
                      Prioridade: {ann.priority}
                    </span>
                    <span className="badge badge-success">
                      {ann.category}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Destino: <strong>{ann.target_block}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(ann.created_at).toLocaleDateString('pt-BR')} às {new Date(ann.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      title="Editar aviso"
                      onClick={() => openEditModal(ann)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      title="Excluir aviso"
                      onClick={() => handleDelete(ann.id, ann.title)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '10px', fontWeight: '800' }}>
                  {ann.title}
                </h3>

                <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '16px' }}>
                  {ann.content}
                </p>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} color="var(--accent-primary)" />
                    Publicado por: <strong>{ann.author}</strong>
                  </div>
                  {ann.expires_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> Válido até: {new Date(ann.expires_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Novo Comunicado */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={20} color="var(--accent-primary)" /> {editingAnnouncement ? 'Editar Comunicado' : 'Publicar Comunicado Oficial'}
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Título do Comunicado *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ex: Interrupção Temporária de Água para Manutenção"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria *</label>
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Geral">Geral</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Assembleia">Assembleia</option>
                      <option value="Segurança">Segurança</option>
                      <option value="Lazer">Lazer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nível de Prioridade *</label>
                    <select
                      className="form-control"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente (Destaque Vermelho)</option>
                      <option value="low">Baixa</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mensagem / Conteúdo Completo *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    required
                    placeholder="Escreva a mensagem clara com datas, horários e orientações aos condôminos..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Destinatários</label>
                    <select
                      className="form-control"
                      value={formData.target_block}
                      onChange={(e) => setFormData({ ...formData, target_block: e.target.value })}
                    >
                      <option value="Todos">Todo o Condomínio (Todas as Torres)</option>
                      <option value="Torre A">Apenas Torre A</option>
                      <option value="Torre B">Apenas Torre B</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Válido Até (Opcional)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="is_pinned"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_pinned" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Fixar este aviso no topo do mural dos moradores
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAnnouncement ? 'Salvar Alterações' : 'Publicar Aviso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
