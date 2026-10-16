import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  X,
  CreditCard,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import CrudModal, { DeleteConfirmModal } from '../components/CrudModal';

export default function FinancialView({ showToast }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: 'income',
    category: 'Taxa Condominial',
    description: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    unit_id: '',
    status: 'pending'
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transRes, sumRes, unitRes] = await Promise.all([
        api.getFinancialTransactions({ type: typeFilter, status: statusFilter, category: categoryFilter }),
        api.getFinancialSummary(),
        api.getUnits()
      ]);
      setTransactions(transRes);
      setSummary(sumRes);
      setUnits(unitRes);
    } catch (err) {
      showToast('Erro ao carregar dados financeiros.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter, categoryFilter]);

  const openCreateModal = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'income',
      category: 'Taxa Condominial',
      description: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      unit_id: '',
      status: 'pending'
    });
    setIsNewModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type?.toLowerCase() || 'income',
      category: transaction.category || 'Outros',
      description: transaction.description || '',
      amount: String(transaction.amount ?? ''),
      due_date: transaction.due_date?.slice(0, 10) || '',
      unit_id: transaction.unit_id ? String(transaction.unit_id) : '',
      status: transaction.status?.toLowerCase() || 'pending'
    });
    setIsNewModalOpen(true);
  };

  const closeModal = () => {
    setIsNewModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.category || !formData.due_date || !Number.isFinite(Number(formData.amount)) || Number(formData.amount) <= 0) {
      showToast('Preencha os campos obrigatórios.', 'warning');
      return;
    }
    try {
      if (editingTransaction) {
        await api.updateFinancialTransaction(editingTransaction.id, formData);
        showToast('Lançamento atualizado com sucesso!', 'success');
      } else {
        await api.createFinancialTransaction(formData);
        showToast('Lançamento financeiro registrado!', 'success');
      }
      closeModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar lançamento.', 'danger');
    }
  };

  const handleDelete = async (transaction) => {
    setDeleteConfirmation({
      message: `Excluir o lançamento "${transaction.description}" no valor de R$ ${Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`,
      onConfirm: async () => {
        try {
          await api.deleteFinancialTransaction(transaction.id);
          showToast('Lançamento excluído.', 'info');
          setDeleteConfirmation(null);
          loadData();
        } catch (err) {
          showToast(err.message || 'Erro ao excluir lançamento.', 'danger');
        }
      }
    });
  };

  const handlePay = async (id) => {
    try {
      await api.payFinancialTransaction(id);
      showToast('Pagamento confirmado e quitado com sucesso!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao registrar pagamento.', 'danger');
    }
  };

  return (
    <div>
      {/* Resumo Financeiro KPI */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <TrendingUp size={26} />
          </div>
          <div className="metric-info">
            <h4>Total Recebido</h4>
            <div className="value" style={{ color: '#10b981' }}>
              R$ {(summary?.income?.paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="subtext">
              R$ {(summary?.income?.pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <TrendingDown size={26} />
          </div>
          <div className="metric-info">
            <h4>Total de Despesas</h4>
            <div className="value" style={{ color: '#ef4444' }}>
              R$ {(summary?.expense?.paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="subtext">
              R$ {(summary?.expense?.pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <DollarSign size={26} />
          </div>
          <div className="metric-info">
            <h4>Saldo Líquido Atual</h4>
            <div className="value" style={{ color: (summary?.currentBalance || 0) >= 0 ? '#3b82f6' : '#ef4444' }}>
              R$ {(summary?.currentBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="subtext">Caixa operacional consolidado</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <AlertCircle size={26} />
          </div>
          <div className="metric-info">
            <h4>Inadimplência Geral</h4>
            <div className="value" style={{ color: '#f59e0b' }}>
              R$ {(summary?.income?.overdue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="subtext">
              {summary?.delinquencyByUnit?.length || 0} unidade(s) com boletos vencidos
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Inadimplência por Unidade (Se houver) */}
      {summary?.delinquencyByUnit && summary.delinquencyByUnit.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={24} color="var(--accent-warning)" />
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>Atenção: Unidades com Boletos em Atraso</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {summary.delinquencyByUnit.map(u => `${u.block} Apto ${u.unit_number} (R$ ${u.total_debt.toFixed(2)})`).join(' • ')}
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { setTypeFilter('income'); setStatusFilter('overdue'); }}>
            Filtrar Inadimplentes
          </button>
        </div>
      )}

      {/* Filtros e Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: '160px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            <option value="income">Receitas (+)</option>
            <option value="expense">Despesas (-)</option>
          </select>

          <select
            className="form-control"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="paid">Quitados / Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Vencidos (Inadimplentes)</option>
          </select>

          <select
            className="form-control"
            style={{ width: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas Categorias</option>
            <option value="Taxa Condominial">Taxa Condominial</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Água/Luz">Água / Luz</option>
            <option value="Salários">Salários & Portaria</option>
            <option value="Mercadinho">Mercadinho</option>
            <option value="Reserva de Espaço">Reserva de Espaço</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Novo Lançamento Financeiro
        </button>
      </div>

      {/* Tabela de Transações */}
      <div className="card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Documento / Categoria</th>
                <th>Descrição</th>
                <th>Unidade</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Carregando lançamentos...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum lançamento encontrado.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{tx.category}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {tx.document_number}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{tx.description}</div>
                    </td>
                    <td>
                      {tx.unit_number ? `${tx.block} - Apto ${tx.unit_number}` : <span style={{ color: 'var(--text-dim)' }}>Geral</span>}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{new Date(tx.due_date).toLocaleDateString('pt-BR')}</div>
                      {tx.payment_date && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                          Pago: {new Date(tx.payment_date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        color: tx.type?.toUpperCase() === 'INCOME' ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {tx.type?.toUpperCase() === 'INCOME' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td>
                      {tx.status?.toUpperCase() === 'PAID' && <span className="badge badge-success"><CheckCircle2 size={12} /> Pago</span>}
                      {tx.status?.toUpperCase() === 'PENDING' && <span className="badge badge-warning"><Clock size={12} /> Pendente</span>}
                      {tx.status?.toUpperCase() === 'OVERDUE' && <span className="badge badge-danger"><AlertCircle size={12} /> Vencido</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {tx.status?.toUpperCase() !== 'PAID' ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button className="btn btn-secondary btn-sm" title="Editar lançamento" onClick={() => openEditModal(tx)}>
                            <Pencil size={14} /> Editar
                          </button>
                          <button className="btn btn-danger btn-sm" title="Excluir lançamento" onClick={() => handleDelete(tx)}>
                            <Trash2 size={14} /> Excluir
                          </button>
                          <button className="btn btn-success btn-sm" onClick={() => handlePay(tx.id)}>
                            <CheckCircle2 size={14} /> Dar Baixa
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Imprimir Comprovante / Recibo"
                          onClick={() => showToast(`Recibo emitido para ${tx.document_number}`, 'info')}
                        >
                          <FileText size={14} /> Recibo
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

      {/* Modal: Novo Lançamento Financeiro */}
      <CrudModal
        isOpen={isNewModalOpen}
        onClose={closeModal}
        title={editingTransaction ? 'Editar Lançamento Financeiro' : 'Novo Lançamento Financeiro'}
        icon={DollarSign}
        onSubmit={handleSubmit}
        submitText={editingTransaction ? 'Salvar Alterações' : 'Registrar Lançamento'}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Transação *</label>
            <select
              className="form-control"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="income">Receita / Entrada (+)</option>
              <option value="expense">Despesa / Saída (-)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Categoria *</label>
            <select
              className="form-control"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Taxa Condominial">Taxa Condominial</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Água/Luz">Água / Luz / Gás</option>
              <option value="Salários">Salários & Portaria</option>
              <option value="Mercadinho">Mercadinho</option>
              <option value="Reserva de Espaço">Reserva de Espaço</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Descrição do Lançamento *</label>
          <input
            type="text"
            className="form-control"
            required
            placeholder="Ex: Taxa Condominial Ref. 09/2026, Troca de lâmpadas LED..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Data de Vencimento *</label>
            <input
              type="date"
              className="form-control"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Vincular à Unidade (Opcional)</label>
            <select
              className="form-control"
              value={formData.unit_id}
              onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
            >
              <option value="">Nenhuma / Geral do Condomínio</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
              ))}
            </select>
          </div>

          {!editingTransaction && (
            <div className="form-group">
              <label>Status Inicial</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Pendente</option>
                <option value="paid">Já Pago / Quitado</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
          )}
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
