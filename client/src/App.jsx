import React, { lazy, Suspense, useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import FinancialView from './views/FinancialView';
import AnnouncementsView from './views/AnnouncementsView';
import MarketInventoryView from './views/MarketInventoryView';
import { api } from './services/api';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const CadastroRemote = lazy(() => import('mfeCadastro/Cadastro'));
const OperacoesRemote = lazy(() => import('mfeOperacoes/Operacoes'));

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [userRole, setUserRole] = useState('admin'); // 'admin' | 'portaria' | 'morador'
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadDashboardMetrics = async () => {
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    loadDashboardMetrics();
    const interval = setInterval(loadDashboardMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Barra Lateral */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        stats={dashboardData?.metrics}
      />

      {/* Área Principal */}
      <div className="main-wrapper">
        <Header 
          currentView={currentView}
          theme={theme}
          toggleTheme={toggleTheme}
          userRole={userRole}
          setUserRole={setUserRole}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <main className="content-body">
          {currentView === 'dashboard' && (
            <DashboardView 
              data={dashboardData} 
              setCurrentView={setCurrentView}
              onRefresh={loadDashboardMetrics}
            />
          )}

          <Suspense fallback={<div className="empty-state">Carregando módulo...</div>}>
            {(currentView === 'residents' || currentView === 'access') && (
              <CadastroRemote section={currentView} showToast={showToast} />
            )}
            {(currentView === 'reservations' || currentView === 'deliveries') && (
              <OperacoesRemote section={currentView} showToast={showToast} />
            )}
          </Suspense>

          {currentView === 'financial' && (
            <FinancialView showToast={showToast} />
          )}

          {currentView === 'announcements' && (
            <AnnouncementsView showToast={showToast} />
          )}

          {currentView === 'market' && (
            <MarketInventoryView showToast={showToast} />
          )}
        </main>
      </div>

      {/* Sistema Global de Notificações Toast */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className="toast"
            style={{
              borderLeft: toast.type === 'success' ? '4px solid var(--accent-success)' :
                          toast.type === 'danger' ? '4px solid var(--accent-danger)' :
                          toast.type === 'warning' ? '4px solid var(--accent-warning)' : '4px solid var(--accent-primary)'
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--accent-success)" />}
            {toast.type === 'danger' && <AlertTriangle size={18} color="var(--accent-danger)" />}
            {toast.type === 'warning' && <AlertTriangle size={18} color="var(--accent-warning)" />}
            {toast.type === 'info' && <Info size={18} color="var(--accent-primary)" />}
            
            <div style={{ flex: 1 }}>{toast.message}</div>
            
            <button 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              onClick={() => removeToast(toast.id)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
