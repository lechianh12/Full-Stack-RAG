import { useEffect, useRef } from 'react';

const EXT_COLORS = {
  pdf: '#ef4444', docx: '#3b82f6', doc: '#3b82f6', txt: '#64748b',
  md: '#8b5cf6', csv: '#22c55e', json: '#eab308', xlsx: '#16a34a', pptx: '#f97316',
};

function FileIcon({ filename }) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  return (
    <svg style={{ width: '18px', height: '18px', flexShrink: 0, color: EXT_COLORS[ext] || '#94a3b8' }}
      fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function DocItem({ doc, isSelected, onSelect, isGlobal }) {
  const name   = doc.original_filename || 'Tài liệu';
  const ext    = name.split('.').pop()?.toLowerCase();
  const accent = isGlobal ? '#16a34a' : '#2563eb';
  const selBg  = isGlobal ? '#f0fdf4' : '#eff6ff';
  const selBdr = isGlobal ? '#86efac' : '#93c5fd';
  const selTxt = isGlobal ? '#15803d' : '#1d4ed8';

  return (
    <button onClick={onSelect} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
      padding: '11px 14px', marginBottom: '6px', textAlign: 'left',
      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
      border: isSelected ? `1.5px solid ${selBdr}` : '1.5px solid transparent',
      borderLeft: `3px solid ${isSelected ? selBdr : accent + '70'}`,
      background: isSelected ? selBg : '#f8fafc',
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f1f5f9'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
    >
      {/* File icon box */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
        background: isSelected ? (isGlobal ? '#dcfce7' : '#dbeafe') : '#fff',
        border: `1px solid ${isSelected ? selBdr : '#e2e8f0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileIcon filename={name} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: '13.5px', fontWeight: 600,
          color: isSelected ? selTxt : '#0f172a',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{ext || 'file'}</span>
          {isGlobal
            ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>CHUNG</span>
            : <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>CỦA BẠN</span>
          }
        </div>
      </div>

      {/* Check / arrow */}
      {isSelected
        ? <svg style={{ width: '18px', height: '18px', flexShrink: 0, color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        : <svg style={{ width: '15px', height: '15px', flexShrink: 0, color: '#cbd5e1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
      }
    </button>
  );
}

/* ── Main export: floating card (positioned by parent) ── */
export default function DocumentPanel({ documents, selectedCollection, onSelectDocument, onClose }) {
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    // Delay so the pill-click that opened this doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const globalDocs  = documents.filter(d => d.is_global);
  const sessionDocs = documents.filter(d => !d.is_global);

  return (
    <div ref={panelRef} style={{
      background: '#fff',
      borderRadius: '18px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '440px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px 14px',
        borderBottom: '1px solid #f3f4f6',
        background: '#fafafa',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>📁 Tài liệu RAG</p>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>
            {documents.length === 0
              ? 'Chưa có tài liệu — dùng 📎 để tải lên'
              : `${documents.length} tài liệu · Nhấn để chọn dùng cho chat`}
          </p>
        </div>
        <button onClick={onClose} style={{
          padding: '6px', borderRadius: '8px', border: 'none',
          background: '#f3f4f6', color: '#6b7280', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
          onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
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
              <div style={{ marginBottom: '6px' }}>
                <p style={{ margin: '4px 0 8px 2px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>
                  🌍 Tài liệu chung ({globalDocs.length})
                </p>
                {globalDocs.map(doc => (
                  <DocItem key={doc.id || doc._id || doc.collection_name}
                    doc={doc} isGlobal isSelected={selectedCollection === doc.collection_name}
                    onSelect={() => onSelectDocument(doc)} />
                ))}
              </div>
            )}
            {sessionDocs.length > 0 && (
              <div>
                <p style={{ margin: `${globalDocs.length > 0 ? '12px' : '4px'} 0 8px 2px`, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>
                  📂 Tài liệu của bạn ({sessionDocs.length})
                </p>
                {sessionDocs.map(doc => (
                  <DocItem key={doc.id || doc._id || doc.collection_name}
                    doc={doc} isGlobal={false} isSelected={selectedCollection === doc.collection_name}
                    onSelect={() => onSelectDocument(doc)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Active hint */}
      {selectedCollection && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #fed7aa', background: '#fffbeb', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
            ✓ RAG đang bật — AI đang dùng tài liệu đã chọn
          </p>
        </div>
      )}
    </div>
  );
}
