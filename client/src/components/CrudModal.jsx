import React, { useEffect } from 'react';
import { X, Loader2, AlertTriangle, Trash2 } from 'lucide-react';

/**
 * Componente compartilhado e reutilizável de Modal para operações CRUD e formulários.
 * Preserva 100% das classes CSS padrão do Praticom (.modal-overlay, .modal-content, etc.)
 * e suporta composição flexível via props e children.
 */
export function CrudModal({
  isOpen = true,
  onClose,
  title,
  icon: Icon,
  iconColor = 'var(--accent-primary)',
  children,
  onSubmit,
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  isLoading = false,
  error = null,
  maxWidth,
  customFooter,
  hideFooter = false,
  closeOnOverlayClick = false
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const contentStyle = maxWidth ? { maxWidth } : undefined;

  const modalBody = (
    <>
      <div className="modal-body">
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
        {children}
      </div>

      {!hideFooter && (
        customFooter ? (
          <div className="modal-footer">{customFooter}</div>
        ) : (
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            {onSubmit && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Salvando...
                  </span>
                ) : submitText}
              </button>
            )}
          </div>
        )
      )}
    </>
  );

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={contentStyle}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            {Icon && <Icon size={20} color={iconColor} />}
            {title}
          </h3>
          {onClose && (
            <button
              type="button"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {onSubmit ? (
          <form onSubmit={onSubmit}>
            {modalBody}
          </form>
        ) : (
          modalBody
        )}
      </div>
    </div>
  );
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar exclusão',
  message,
  isLoading = false
}) {
  return (
    <CrudModal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      title={title}
      icon={AlertTriangle}
      iconColor="#ef4444"
      closeOnOverlayClick={!isLoading}
      maxWidth="480px"
      customFooter={(
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 size={16} className="animate-spin" /> Excluindo...
              </span>
            ) : (
              <><Trash2 size={16} /> Excluir</>
            )}
          </button>
        </>
      )}
    >
      <p style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>
    </CrudModal>
  );
}

export default CrudModal;
