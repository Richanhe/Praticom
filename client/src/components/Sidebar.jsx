import React from 'react';
import {
  LayoutDashboard,
  Package,
  DollarSign,
  ShieldCheck,
  Users,
  CalendarDays,
  Megaphone,
  ShoppingCart,
  Building2,
  Bell
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, stats, availableModules = null }) {
  const mandatoryItems = ['residents', 'territory', 'announcements'];

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deliveries', label: 'Controle de Encomendas', icon: Package, badge: stats?.pendingDeliveries, badgeAlert: stats?.pendingDeliveries > 0 },
    { id: 'financial', label: 'Financeiro & Taxas', icon: DollarSign, badge: stats?.overdueCount ? `${stats.overdueCount} pendentes` : null, badgeAlert: stats?.overdueCount > 0 },
    { id: 'access', label: 'Portaria & Acessos', icon: ShieldCheck, badge: (stats?.activeVisitors ?? stats?.activeAccess) ? `${stats?.activeVisitors ?? stats?.activeAccess} no prédio` : null },
    { id: 'residents', label: 'Cadastro de Pessoas', icon: Users },
    { id: 'territory', label: 'Condomínios & Blocos', icon: Building2 },
    { id: 'reservations', label: 'Reservas (1h/dia)', icon: CalendarDays, badge: stats?.todayReservations ? `${stats.todayReservations} hoje` : null },
    { id: 'announcements', label: 'Mural de Avisos', icon: Megaphone },
    { id: 'market', label: 'Mercadinho & Estoque', icon: ShoppingCart, badge: stats?.lowStockItems ? `${stats.lowStockItems} repor` : null, badgeAlert: stats?.lowStockItems > 0 },
  ];

  const menuItems = allMenuItems.filter(item => {
    // Áreas estruturais obrigatórias permanecem SEMPRE disponíveis
    if (mandatoryItems.includes(item.id)) return true;
    // Se a lista de módulos ainda não foi carregada, exibe por fallback
    if (!availableModules) return true;
    return availableModules.includes(item.id);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <Building2 size={24} />
        </div>
        <div className="brand-text">
          <h2>praticom</h2>
          <span>Gestão Condominial</span>
        </div>
      </div>

      <ul className="nav-links">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <li key={item.id}>
              <button
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
                style={{ width: '100%', background: isActive ? undefined : 'transparent', border: 'none', textAlign: 'left' }}
              >
                <div className="nav-item-content">
                  <Icon size={19} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
                  <span className={`nav-badge ${item.badgeAlert ? 'alert' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent-mint)', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', color: 'var(--accent-mint-text)' }}>
            MA
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>Mariana Alves</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Síndica Profissional</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
