import { useEffect, useRef } from 'react';

const EXT_COLORS = {
  pdf: '#ef4444', docx: '#3b82f6', doc: '#3b82f6', txt: '#64748b',
  md: '#8b5cf6', csv: '#22c55e', json: '#eab308', xlsx: '#16a34a', pptx: '#f97316',
};

function FileIcon({ filename }) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  return (
    <svg style={{ width: '17px', height: '17px', flexShrink: 0, color: EXT_COLORS[ext] || '#94a3b8' }}
      fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function DocItem({ doc, checked, onToggle, isGlobal }) {
  const name   = doc.original_filename || 'Tài liệu';
  const ext    = name.split('.').pop()?.toLowerCase();
  const accent = isGlobal ? '#16a34a' : '#2563eb';
  const selBg  = isGlobal ? '#f0fdf4' : '#eff6ff';
  const selBdr = isGlobal ? '#86efac' : '#93c5fd';

  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '11px 14px', marginBottom: '6px',
      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
      border: checked ? `1.5px solid ${selBdr}` : '1.5px solid transparent',
      borderLeft: `3px solid ${checked ? selBdr : accent + '60'}`,
      background: checked ? selBg : '#f8fafc',
    }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#f1f5f9'; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = '#f8fafc'; }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{ width: '16px', height: '16px', accentColor: accent, flexShrink: 0, cursor: 'pointer' }}
      />

      {/* Icon */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
        background: checked ? (isGlobal ? '#dcfce7' : '#dbeafe') : '#fff',
        border: `1px solid ${checked ? selBdr : '#e2e8f0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileIcon filename={name} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: '13.5px', fontWeight: 600,
          color: checked ? (isGlobal ? '#15803d' : '#1d4ed8') : '#0f172a',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name}</p>
        <div style={{ display: 'flex', gap: '5px', marginTop: '2px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{ext || 'file'}</span>
          {isGlobal
            ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>CHUNG</span>
            : <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>CỦA BẠN</span>
          }
        </div>
      </div>
    </label>
  );
}

export default function DocumentPanel({ documents, selectedCollections, onToggleDocument, onSelectAll, onDeselectAll, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const globalDocs  = documents.filter(d => d.is_global);
  const sessionDocs = documents.filter(d => !d.is_global);
  const selectedCount = selectedCollections.length;
  const allSelected   = documents.length > 0 && selectedCount === documents.length;

  return (
    <div ref={panelRef} style={{
      background: '#fff',
      borderRadius: '18px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '460px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px 12px',
        borderBottom: '1px solid #f3f4f6',
        background: '#fafafa',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>
            📁 Chọn tài liệu RAG
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>
            {selectedCount > 0
              ? `${selectedCount}/${documents.length} tài liệu đang được chọn`
              : documents.length === 0
                ? 'Chưa có tài liệu — dùng 📎 để tải lên'
                : 'Chọn một hoặc nhiều tài liệu'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Select All / None */}
          {documents.length > 0 && (
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              style={{
                padding: '5px 10px', borderRadius: '8px', border: 'none',
                background: '#f3f4f6', color: '#374151',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
            >
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          )}

          <button onClick={onClose} style={{
            padding: '6px', borderRadius: '8px', border: 'none',
            background: '#f3f4f6', color: '#6b7280', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
          >
            <svg style={{ width: '15px', height: '15px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', minHeight: 0 }}>
        {documents.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px', textAlign: 'center' }}>
            <svg style={{ width: '40px', height: '40px', color: '#e5e7eb', marginBottom: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', fontWeight: 500 }}>Chưa có tài liệu nào</p>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#d1d5db' }}>Dùng nút 📎 bên dưới để tải lên</p>
          </div>
        ) : (
          <>
            {globalDocs.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <p style={{ margin: '2px 0 8px 2px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>
                  🌍 Tài liệu chung ({globalDocs.length})
                </p>
                {globalDocs.map(doc => (
                  <DocItem key={doc.id || doc._id || doc.collection_name}
                    doc={doc} isGlobal
                    checked={selectedCollections.includes(doc.collection_name)}
                    onToggle={() => onToggleDocument(doc.collection_name)} />
                ))}
              </div>
            )}
            {sessionDocs.length > 0 && (
              <div>
                <p style={{ margin: `${globalDocs.length > 0 ? '12px' : '2px'} 0 8px 2px`, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>
                  📂 Tài liệu của bạn ({sessionDocs.length})
                </p>
                {sessionDocs.map(doc => (
                  <DocItem key={doc.id || doc._id || doc.collection_name}
                    doc={doc} isGlobal={false}
                    checked={selectedCollections.includes(doc.collection_name)}
                    onToggle={() => onToggleDocument(doc.collection_name)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: selected count + Apply button */}
      {selectedCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderTop: '1px solid #f3f4f6', background: '#fafafa', flexShrink: 0,
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#374151', fontWeight: 500 }}>
            {selectedCount === 1
              ? '✓ Đang dùng 1 tài liệu cho RAG'
              : `✓ Đang dùng ${selectedCount} tài liệu cho RAG (hybrid query)`}
          </p>
          <button onClick={onClose} style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            background: '#111827', color: '#fff',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            Xong
          </button>
        </div>
      )}
    </div>
  );
}
