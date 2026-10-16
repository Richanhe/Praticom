import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  PackagePlus,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  CheckCircle2,
  Receipt,
  X,
  Trash2,
  Building,
  Sparkles,
  ArrowRight,
  Pencil
} from 'lucide-react';
import { api } from '../services/api';
import { DeleteConfirmModal } from '../components/CrudModal';

const EMPTY_PRODUCT = {
  name: '',
  barcode: '',
  category: 'Bebidas',
  cost_price: '',
  sale_price: '',
  stock_quantity: '',
  min_stock: '5',
  image_url: '📦'
};

export default function MarketInventoryView({ showToast }) {
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'pos'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Carrinho do PDV
  const [cart, setCart] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('condo_bill');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Modal Produto (null = criando, objeto = editando)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProductForm, setNewProductForm] = useState(EMPTY_PRODUCT);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setFeatureDisabled(false);
      const [prodRes, unitRes, resRes] = await Promise.all([
        api.getMarketProducts({ category: categoryFilter }),
        api.getUnits(),
        api.getResidents()
      ]);
      const prods = Array.isArray(prodRes) ? prodRes : [];
      setProducts(prods);
      setUnits(Array.isArray(unitRes) ? unitRes : []);
      setResidents(Array.isArray(resRes) ? resRes : []);
      // Mantém o preço exibido no carrinho igual ao do banco (o checkout cobra o preço do banco)
      setCart(prev => prev.map(item => {
        const p = prods.find(prod => prod.id === item.product_id);
        return p ? { ...item, price: p.sale_price } : item;
      }));
    } catch (err) {
      setProducts([]);
      setUnits([]);
      setResidents([]);
      if (err.message && (err.message.includes('LPS') || err.message.includes('ENABLE_MARKETPLACE') || err.message.includes('desativada'))) {
        setFeatureDisabled(true);
      } else {
        showToast(err.message || 'Erro ao carregar dados do mercadinho.', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnableFeature = async () => {
    try {
      await api.updateFeature('ENABLE_MARKETPLACE', true);
      showToast('Funcionalidade Mercadinho ativada na LPS com sucesso!', 'success');
      loadData();
    } catch (err) {
      showToast('Erro ao ativar funcionalidade na LPS.', 'danger');
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const handleStockAdjust = async (id, delta) => {
    try {
      await api.updateMarketStock(id, { delta });
      showToast('Estoque atualizado!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao ajustar estoque.', 'danger');
    }
  };

  const openCreateProductModal = () => {
    setEditingProduct(null);
    setNewProductForm(EMPTY_PRODUCT);
    setIsNewProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setNewProductForm({
      name: prod.name || '',
      barcode: prod.barcode || '',
      category: prod.category || 'Bebidas',
      cost_price: String(prod.cost_price ?? ''),
      sale_price: String(prod.sale_price ?? ''),
      stock_quantity: String(prod.stock_quantity ?? ''),
      min_stock: String(prod.min_stock ?? '5'),
      image_url: prod.image_url || '📦'
    });
    setIsNewProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsNewProductModalOpen(false);
    setEditingProduct(null);
    setNewProductForm(EMPTY_PRODUCT);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.sale_price) {
      showToast('Nome e preço de venda são obrigatórios.', 'warning');
      return;
    }
    const payload = {
      ...newProductForm,
      cost_price: parseFloat(newProductForm.cost_price) || 0,
      sale_price: parseFloat(newProductForm.sale_price),
      stock_quantity: parseInt(newProductForm.stock_quantity, 10) || 0,
      min_stock: parseInt(newProductForm.min_stock, 10) || 5
    };
    try {
      if (editingProduct) {
        await api.updateMarketProduct(editingProduct.id, payload);
        showToast('Produto atualizado com sucesso!', 'success');
      } else {
        await api.createMarketProduct(payload);
        showToast('Produto cadastrado com sucesso no mercadinho!', 'success');
      }
      closeProductModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar produto.', 'danger');
    }
  };

  const handleDeleteProduct = async (prod) => {
    setDeleteConfirmation({
      message: `Deseja realmente excluir o produto ${prod.name}? O histórico de vendas será mantido.`,
      onConfirm: async () => {
        try {
          await api.deleteMarketProduct(prod.id);
          setCart(prev => prev.filter(item => item.product_id !== prod.id));
          showToast(`Produto ${prod.name} excluído.`, 'info');
          setDeleteConfirmation(null);
          loadData();
        } catch (err) {
          showToast(err.message || 'Erro ao excluir produto.', 'danger');
        }
      }
    });
  };

  // Funções do Carrinho de Autoatendimento
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      showToast('Produto esgotado no estoque.', 'warning');
      return;
    }
    setCart((prev) => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          showToast(`Limite de estoque atingido (${product.stock_quantity} un).`, 'warning');
          return prev;
        }
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.sale_price, quantity: 1, image_url: product.image_url }];
    });
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('O carrinho está vazio.', 'warning');
      return;
    }
    if (!selectedUnitId || !selectedResidentId) {
      showToast('Selecione a unidade e o morador que está comprando.', 'warning');
      return;
    }

    try {
      // Envia só produto e quantidade; preço e total são calculados pelo backend com os valores do banco
      const sale = await api.checkoutMarket({
        unit_id: parseInt(selectedUnitId, 10),
        resident_id: parseInt(selectedResidentId, 10),
        payment_method: paymentMethod,
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
      });

      showToast(`Compra finalizada com sucesso! Total: R$ ${Number(sale.total_amount).toFixed(2)}`, 'success');
      setCart([]);
      setSelectedResidentId('');
      setIsCheckoutModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao finalizar compra.', 'danger');
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(p => {
    const term = (searchTerm || '').toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.includes(term))
    );
  });

  const lowStockCount = (Array.isArray(products) ? products : []).filter(p => p.stock_quantity <= p.min_stock).length;

  if (featureDisabled) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '640px', margin: '40px auto' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertTriangle size={32} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '10px', color: 'var(--text-main)' }}>Módulo Desativado na LPS</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6', fontSize: '0.95rem' }}>
          A funcionalidade <strong>Mercadinho Autônomo & Estoque</strong> está desativada na configuração de Feature Flags (<code>ENABLE_MARKETPLACE = false</code>).
        </p>
        <button className="btn btn-primary" onClick={handleEnableFeature} style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} /> Ativar Mercadinho Autônomo na LPS
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Barra de Abas (Estoque vs PDV Autoatendimento) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '4px' }}>
          <button
            className={`role-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            style={{ padding: '8px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setActiveTab('inventory')}
          >
            <PackagePlus size={16} /> Gestão de Estoque & Reposição
            {lowStockCount > 0 && <span className="nav-badge alert" style={{ fontSize: '0.7rem' }}>{lowStockCount}</span>}
          </button>
          <button
            className={`role-btn ${activeTab === 'pos' ? 'active' : ''}`}
            style={{ padding: '8px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setActiveTab('pos')}
          >
            <ShoppingCart size={16} /> PDV / Caixa de Autoatendimento do Morador
            {cart.length > 0 && <span className="nav-badge" style={{ background: 'var(--accent-primary)', fontSize: '0.7rem' }}>{cart.length}</span>}
          </button>
        </div>

        {activeTab === 'inventory' && (
          <button className="btn btn-primary" onClick={openCreateProductModal}>
            <Plus size={18} /> Novo Produto no Mercadinho
          </button>
        )}
      </div>

      {/* ABA 1: GESTÃO DE ESTOQUE */}
      {activeTab === 'inventory' && (
        <div>
          {lowStockCount > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertTriangle size={22} color="var(--accent-danger)" />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <strong>Atenção:</strong> Existem <strong>{lowStockCount} produto(s)</strong> com estoque igual ou abaixo do mínimo. Realize a reposição junto aos fornecedores.
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div className="search-box" style={{ width: '300px' }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar produto, código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '200px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas as Categorias</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Snacks & Salgados">Snacks & Salgados</option>
              <option value="Doces">Doces</option>
              <option value="Congelados">Congelados</option>
              <option value="Higiene & Limpeza">Higiene & Limpeza</option>
              <option value="Mercearia">Mercearia</option>
            </select>
          </div>

          {/* Tabela de Estoque */}
          <div className="card">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Custo Unit.</th>
                    <th>Preço Venda</th>
                    <th>Margem</th>
                    <th>Estoque Atual</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ajuste Rápido / Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Carregando produtos...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhum produto cadastrado.</td></tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isLowStock = prod.stock_quantity <= prod.min_stock;
                      const profit = prod.sale_price - prod.cost_price;
                      const marginPercent = prod.cost_price > 0 ? ((profit / prod.cost_price) * 100).toFixed(0) : 100;

                      return (
                        <tr key={prod.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '24px' }}>{prod.image_url || '📦'}</span>
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{prod.name}</div>
                                {prod.barcode && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                                    EAN: {prod.barcode}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-info">{prod.category}</span></td>
                          <td>R$ {prod.cost_price.toFixed(2)}</td>
                          <td style={{ fontWeight: '700', color: '#10b981' }}>R$ {prod.sale_price.toFixed(2)}</td>
                          <td><span className="badge badge-purple">+{marginPercent}%</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '800', fontSize: '1.1rem', color: isLowStock ? '#ef4444' : 'inherit' }}>
                                {prod.stock_quantity}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                (Mín: {prod.min_stock})
                              </span>
                            </div>
                          </td>
                          <td>
                            {isLowStock ? (
                              <span className="badge badge-danger">
                                <AlertTriangle size={12} /> Estoque Baixo
                              </span>
                            ) : (
                              <span className="badge badge-success">
                                <CheckCircle2 size={12} /> Abastecido
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ width: '32px', height: '32px', padding: 0 }}
                                onClick={() => handleStockAdjust(prod.id, -1)}
                                title="Diminuir 1 unidade"
                              >
                                <Minus size={14} />
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ width: '32px', height: '32px', padding: 0 }}
                                onClick={() => handleStockAdjust(prod.id, 1)}
                                title="Adicionar 1 unidade"
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleStockAdjust(prod.id, 10)}
                                title="Repor pacote com 10 unidades"
                              >
                                +10
                              </button>
                              <button
                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '4px' }}
                                title="Editar produto"
                                onClick={() => openEditProductModal(prod)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                                title="Excluir produto"
                                onClick={() => handleDeleteProduct(prod)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: PDV DE AUTOATENDIMENTO DO MORADOR */}
      {activeTab === 'pos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Catálogo de Produtos para Compra */}
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <div className="search-box" style={{ flex: 1 }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar refrigerante, chocolate, cerveja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: '180px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Todas Categorias</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Snacks & Salgados">Snacks</option>
                <option value="Doces">Doces</option>
                <option value="Congelados">Congelados</option>
                <option value="Higiene & Limpeza">Higiene</option>
                <option value="Mercearia">Mercearia</option>
              </select>
            </div>

            <div className="market-grid">
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="product-card">
                  <div>
                    <div className="product-img-box">
                      {prod.image_url || '📦'}
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem', marginBottom: '6px' }}>{prod.category}</span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px', minHeight: '40px' }}>
                      {prod.name}
                    </h4>
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981' }}>
                        R$ {prod.sale_price.toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: prod.stock_quantity > 0 ? 'var(--text-dim)' : '#ef4444' }}>
                        {prod.stock_quantity > 0 ? `${prod.stock_quantity} disp.` : 'Esgotado'}
                      </span>
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      disabled={prod.stock_quantity <= 0}
                      onClick={() => addToCart(prod)}
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carrinho de Compras & Checkout */}
          <div className="card" style={{ position: 'sticky', top: '90px', height: 'fit-content' }}>
            <div className="card-header">
              <div className="card-title">
                <ShoppingCart size={20} color="var(--accent-primary)" />
                <span>Cesta de Compras</span>
              </div>
              {cart.length > 0 && (
                <button
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}
                  onClick={() => setCart([])}
                >
                  Limpar
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto', marginBottom: '20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p>Sua cesta está vazia.</p>
                  <span style={{ fontSize: '0.78rem' }}>Clique em "+ Adicionar" nos produtos ao lado.</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{item.image_url}</span>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>R$ {item.price.toFixed(2)} un.</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => updateCartQuantity(item.product_id, -1)}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', minWidth: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: '26px', height: '26px', padding: 0 }}
                        onClick={() => updateCartQuantity(item.product_id, 1)}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', marginLeft: '4px' }}
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total e Botão Pagar */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Total a Pagar:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981' }}>
                  R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                className="btn btn-success"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutModalOpen(true)}
              >
                Finalizar Compra <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Finalizar Compra no PDV */}
      {isCheckoutModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--accent-success)" /> Pagamento Autoatendimento
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsCheckoutModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total dos itens ({cart.length})</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981' }}>
                    R$ {cartTotal.toFixed(2)}
                  </div>
                </div>
                <Sparkles size={32} color="#10b981" />
              </div>

              <div className="form-group">
                <label>Forma de Pagamento *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'condo_bill' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flexDirection: 'column', padding: '14px', gap: '6px' }}
                    onClick={() => setPaymentMethod('condo_bill')}
                  >
                    <Building size={20} />
                    <span style={{ fontSize: '0.8rem' }}>Débito no Boleto</span>
                  </button>

                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'pix' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flexDirection: 'column', padding: '14px', gap: '6px' }}
                    onClick={() => setPaymentMethod('pix')}
                  >
                    <QrCode size={20} />
                    <span style={{ fontSize: '0.8rem' }}>PIX Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'credit_card' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flexDirection: 'column', padding: '14px', gap: '6px' }}
                    onClick={() => setPaymentMethod('credit_card')}
                  >
                    <CreditCard size={20} />
                    <span style={{ fontSize: '0.8rem' }}>Cartão Débito/Crédito</span>
                  </button>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label>Sua Unidade *</label>
                  <select
                    className="form-control"
                    required
                    value={selectedUnitId}
                    onChange={(e) => { setSelectedUnitId(e.target.value); setSelectedResidentId(''); }}
                  >
                    <option value="">Selecione sua Unidade</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Morador *</label>
                  <select
                    className="form-control"
                    required
                    disabled={!selectedUnitId}
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                  >
                    <option value="">{selectedUnitId ? 'Selecione o Morador' : 'Escolha a unidade primeiro'}</option>
                    {residents.filter(r => r.unit_id === parseInt(selectedUnitId, 10)).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {paymentMethod === 'condo_bill' && (
                <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                  O valor de R$ {cartTotal.toFixed(2)} será lançado automaticamente na próxima taxa condominial da sua unidade.
                </small>
              )}

              {paymentMethod === 'pix' && (
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginTop: '16px' }}>
                  <div style={{ width: '120px', height: '120px', background: '#fff', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <QrCode size={90} color="#000" />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>Escaneie o QR Code no app do seu banco</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Chave PIX: pix-condo@praticom.com.br</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsCheckoutModalOpen(false)}>
                Voltar
              </button>
              <button type="button" className="btn btn-success" onClick={handleCheckout}>
                Confirmar e Liberar Produtos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Produto no Estoque */}
      {isNewProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingProduct
                  ? <><Pencil size={20} color="var(--accent-primary)" /> Editar Produto</>
                  : <><PackagePlus size={20} color="var(--accent-primary)" /> Cadastrar Produto no Mercadinho</>
                }
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={closeProductModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome do Produto *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ex: Coca-Cola Lata 350ml"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria *</label>
                    <select
                      className="form-control"
                      value={newProductForm.category}
                      onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    >
                      <option value="Bebidas">Bebidas</option>
                      <option value="Snacks & Salgados">Snacks & Salgados</option>
                      <option value="Doces">Doces</option>
                      <option value="Congelados">Congelados</option>
                      <option value="Higiene & Limpeza">Higiene & Limpeza</option>
                      <option value="Mercearia">Mercearia</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Emoji / Ícone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: 🥤, 🍺, 🍕, 🍫, 🧻"
                      value={newProductForm.image_url}
                      onChange={(e) => setNewProductForm({ ...newProductForm, image_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Código de Barras (EAN)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: 7894900010015"
                      value={newProductForm.barcode}
                      onChange={(e) => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Preço de Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="3.20"
                      value={newProductForm.cost_price}
                      onChange={(e) => setNewProductForm({ ...newProductForm, cost_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Preço de Venda (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      required
                      placeholder="5.50"
                      value={newProductForm.sale_price}
                      onChange={(e) => setNewProductForm({ ...newProductForm, sale_price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Quantidade em Estoque</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="20"
                      value={newProductForm.stock_quantity}
                      onChange={(e) => setNewProductForm({ ...newProductForm, stock_quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Estoque Mínimo de Alerta</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="5"
                      value={newProductForm.min_stock}
                      onChange={(e) => setNewProductForm({ ...newProductForm, min_stock: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeProductModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Salvar Alterações' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        isOpen={Boolean(deleteConfirmation)}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => deleteConfirmation?.onConfirm()}
        message={deleteConfirmation?.message}
      />
    </div>
  );
}
