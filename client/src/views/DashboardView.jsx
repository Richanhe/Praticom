import React from 'react';
import {
  Package,
  DollarSign,
  ShieldCheck,
  Users,
  CalendarDays,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ShoppingCart,
  Pin
} from 'lucide-react';

export default function DashboardView({ data, setCurrentView, onRefresh }) {
  const metrics = data?.metrics || {};
  const recentAccess = data?.recentAccess || [];
  const recentDeliveries = data?.recentDeliveries || [];
  const urgentAnnouncements = data?.urgentAnnouncements || [];
  const upcomingReservations = data?.upcomingReservations || [];

  const formatTime = (ts) => {
    if (!ts) return '-';
    const parsed = new Date(typeof ts === 'string' ? ts.replace(' ', 'T') : ts);
    return isNaN(parsed.getTime()) ? '-' : parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* Banner de Boas-Vindas */}
      <div className="welcome-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-success"><Sparkles size={13} /> Sistema Ativo</span>
            <span className="welcome-banner-condo">Condomínio Residencial Parque das Flores</span>
          </div>
          <h2 className="welcome-banner-title">
            Bem-vindo(a) ao PratiCom!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Tudo o que você precisa para o seu condomínio de forma rápida e prática.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => setCurrentView('deliveries')}>
            <Package size={16} /> Nova Encomenda
          </button>
          <button className="btn btn-suave" onClick={() => setCurrentView('access')}>
            <ShieldCheck size={16} /> Liberar Acesso
          </button>
        </div>
      </div>

      {/* Grid de KPIs Principais */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('deliveries')}>
          <div className="metric-icon-box" style={{ background: 'var(--accent-mint)', color: 'var(--accent-mint-text)' }}>
            <Package size={26} />
          </div>
          <div className="metric-info">
            <h4>Encomendas Pendentes</h4>
            <div className="value">{metrics.pendingDeliveries ?? 0}</div>
            <div className="subtext">Aguardando retirada na portaria</div>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('financial')}>
          <div className="metric-icon-box" style={{ background: 'rgba(130, 199, 135, 0.2)', color: 'var(--accent-mint-text)' }}>
            <DollarSign size={26} />
          </div>
          <div className="metric-info">
            <h4>Saldo em Caixa</h4>
            <div className="value" style={{ color: 'var(--accent-mint-text)' }}>
              R$ {(metrics.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="subtext">
              {metrics.overdueCount > 0 ? `${metrics.overdueCount} unidades em atraso` : 'Taxas em dia'}
            </div>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('access')}>
          <div className="metric-icon-box" style={{ background: 'var(--accent-info-bg)', color: 'var(--accent-info-text)' }}>
            <ShieldCheck size={26} />
          </div>
          <div className="metric-info">
            <h4>Pessoas no Condomínio</h4>
            <div className="value">{metrics.activeVisitors ?? metrics.activeAccess ?? 0}</div>
            <div className="subtext">Visitantes & Prestadores ativos</div>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('reservations')}>
          <div className="metric-icon-box" style={{ background: 'var(--accent-warning-bg)', color: 'var(--accent-warning-text)' }}>
            <CalendarDays size={26} />
          </div>
          <div className="metric-info">
            <h4>Reservas de Hoje</h4>
            <div className="value">{metrics.todayReservations ?? 0}</div>
            <div className="subtext">Limite: 1h por morador</div>
          </div>
        </div>

        <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('market')}>
          <div className="metric-icon-box" style={{ background: 'var(--accent-danger-bg)', color: 'var(--accent-danger-text)' }}>
            <ShoppingCart size={26} />
          </div>
          <div className="metric-info">
            <h4>Estoque do Mercadinho</h4>
            <div className="value" style={{ color: metrics.lowStockItems > 0 ? 'var(--accent-danger-text)' : 'inherit' }}>
              {metrics.lowStockItems ?? 0}
            </div>
            <div className="subtext">
              {metrics.lowStockItems > 0 ? 'Itens abaixo do estoque mínimo' : 'Estoque abastecido'}
            </div>
          </div>
        </div>
      </div>

      {/* Seção Central com 2 Colunas */}
      <div className="dashboard-grid">
        {/* Coluna Esquerda: Fluxo de Acesso & Encomendas Recentes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Feed de Acessos ao Vivo */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShieldCheck size={20} color="var(--accent-purple)" />
                <span>Fluxo da Portaria em Tempo Real</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('access')}>
                Ver Portaria <ChevronRight size={14} />
              </button>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Pessoa / Empresa</th>
                    <th>Tipo</th>
                    <th>Destino</th>
                    <th>Entrada</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAccess.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        Nenhum registro de acesso recente.
                      </td>
                    </tr>
                  ) : (
                    recentAccess.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{log.visitor_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {log.company || log.document} {log.vehicle_plate && `• Placa: ${log.vehicle_plate}`}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">{log.type}</span>
                        </td>
                        <td>{log.block ? `${log.block} - Apto ${log.unit_number}` : 'Área Geral'}</td>
                        <td>{formatTime(log.entered_at || log.entry_time)}</td>
                        <td>
                          {log.status === 'inside' ? (
                            <span className="badge badge-warning">No Condomínio</span>
                          ) : (
                            <span className="badge badge-success">Saiu</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Encomendas Aguardando Retirada */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Package size={20} color="var(--accent-primary)" />
                <span>Últimas Encomendas Recebidas</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('deliveries')}>
                Gerenciar Encomendas <ChevronRight size={14} />
              </button>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th>Morador</th>
                    <th>Transportadora</th>
                    <th>PIN de Retirada</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeliveries.map((pkg) => (
                    <tr key={pkg.id}>
                      <td style={{ fontWeight: '600' }}>{pkg.block} - {pkg.unit_number}</td>
                      <td>{pkg.resident_name || 'Morador'}</td>
                      <td>{pkg.courier}</td>
                      <td>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: '700',
                          background: 'rgba(59, 130, 246, 0.15)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          color: '#60a5fa'
                        }}>
                          {pkg.pickup_code}
                        </span>
                      </td>
                      <td>
                        {['pending', 'PENDING', 'RECEBIDA'].includes(pkg.status) ? (
                          <span className="badge badge-warning">Aguardando</span>
                        ) : ['cancelled', 'CANCELLED', 'CANCELADA'].includes(pkg.status) ? (
                          <span className="badge badge-secondary" style={{ opacity: 0.7 }}>Cancelada</span>
                        ) : (
                          <span className="badge badge-success">Entregue</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Comunicados Urgentes & Próximas Reservas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Comunicados Urgentes */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <AlertTriangle size={20} color="var(--accent-danger)" />
                <span>Avisos em Destaque</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('announcements')}>
                Mural <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {urgentAnnouncements.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                  Nenhum aviso em destaque no momento.
                </div>
              ) : (
                [...urgentAnnouncements]
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
                      <div key={ann.id} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        borderLeft: isPinned ? '4px solid var(--accent-purple)' : '4px solid var(--accent-danger)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isPinned && <Pin size={13} color="var(--accent-purple)" style={{ flexShrink: 0 }} />}
                            {ann.title}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {isPinned && (
                              <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                Fixado
                              </span>
                            )}
                            <span className={`badge ${isUrgent ? 'badge-danger' : 'badge-warning'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                              {ann.priority}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {ann.content ? (ann.content.length > 120 ? `${ann.content.slice(0, 120)}...` : ann.content) : ''}
                        </p>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Reservas Agendadas */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <CalendarDays size={20} color="var(--accent-warning)" />
                <span>Próximas Reservas (1h/dia)</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('reservations')}>
                Grade <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingReservations.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                  Nenhuma reserva para os próximos dias.
                </div>
              ) : (
                upcomingReservations.map((res) => (
                  <div key={res.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{res.space_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {res.block} - Apto {res.unit_number} ({res.resident_name})
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                        {res.reservation_date}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {res.start_time} às {res.end_time} (1h)
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
