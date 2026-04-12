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

// isGlobal=true → green accent (admin shared), false → blue accent (session)
function DocItem({ doc, isSelected, onSelect, isGlobal }) {
  const name = doc.original_filename || 'Tài liệu';
  const ext  = name.split('.').pop()?.toLowerCase();

  const accent      = isGlobal ? '#16a34a' : '#2563eb';
  const selBg       = isGlobal ? '#f0fdf4' : '#eff6ff';
  const selBorder   = isGlobal ? '#86efac' : '#93c5fd';
  const selText     = isGlobal ? '#15803d' : '#1d4ed8';
  const selCheck    = isGlobal ? '#16a34a' : '#2563eb';
  const iconBg      = isGlobal ? (isSelected ? '#dcfce7' : '#f0fdf4') : (isSelected ? '#dbeafe' : '#eff6ff');

  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px', marginBottom: '6px', textAlign: 'left',
        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
        border: isSelected ? `1.5px solid ${selBorder}` : '1.5px solid #e2e8f0',
        borderLeft: `3px solid ${isSelected ? selBorder : accent + '80'}`,
        background: isSelected ? selBg : '#f8fafc',
        boxShadow: isSelected ? `0 1px 8px ${accent}22` : 'none',
      }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.borderLeft = `3px solid ${accent}80`; } }}
    >
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
        background: iconBg, border: `1px solid ${isSelected ? selBorder : '#e2e8f0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileIcon filename={name} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: '13px', fontWeight: 600,
          color: isSelected ? selText : '#0f172a',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>{ext || 'file'}</span>
          {isGlobal ? (
            <span style={{
              fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
              background: isSelected ? '#dcfce7' : '#f0fdf4',
              color: '#15803d', border: '1px solid #bbf7d0', letterSpacing: '0.04em',
            }}>CHUNG</span>
          ) : (
            <span style={{
              fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
              background: isSelected ? '#dbeafe' : '#eff6ff',
              color: '#1d4ed8', border: '1px solid #bfdbfe', letterSpacing: '0.04em',
            }}>CỦA BẠN</span>
          )}
          {doc.username && (
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>· {doc.username}</span>
          )}
        </div>
      </div>
      {isSelected
        ? <svg style={{ width: '20px', height: '20px', flexShrink: 0, color: selCheck }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        : <svg style={{ width: '16px', height: '16px', flexShrink: 0, color: '#cbd5e1' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
      }
    </button>
  );
}

export default function DocumentPanel({ documents, selectedCollection, onSelectDocument, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const globalDocs  = documents.filter(d => d.is_global);
  const sessionDocs = documents.filter(d => !d.is_global);
  const selectedDoc = documents.find(d => d.collection_name === selectedCollection);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
      background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
    }}>
      {/* backdrop */}
      <div style={{ flex: 1 }} onClick={onClose} />

      {/* Side panel */}
      <div ref={panelRef} style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        width: 'min(500px, 94vw)',
        background: '#fff', borderLeft: '1px solid #e2e8f0',
        boxShadow: '-8px 0 32px rgba(15,23,42,0.12)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 20px 16px', flexShrink: 0,
          borderBottom: '1px solid #f1f5f9', background: '#fafbfc',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>📁 Tài liệu RAG</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              {documents.length === 0
                ? 'Chưa có tài liệu nào'
                : `${documents.length} tài liệu · Nhấn chọn để dùng cho chat`}
            </p>
          </div>
          <button onClick={onClose} style={{
            padding: '6px', borderRadius: '10px', border: 'none',
            background: '#f1f5f9', color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: 0 }}>

          {/* ── SECTION 1: Tài liệu chung (admin) ── */}
          <section style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', marginBottom: '10px',
              borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0',
            }}>
              <span style={{ fontSize: '14px' }}>🌍</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#15803d' }}>
                  Tài liệu chung
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#4ade80' }}>
                  Admin upload · hiện với tất cả người dùng
                </p>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 700,
                padding: '2px 9px', borderRadius: '999px',
                background: '#dcfce7', color: '#15803d', border: '1px solid #86efac',
              }}>{globalDocs.length}</span>
            </div>
            {globalDocs.length === 0 ? (
              <div style={{
                padding: '14px', borderRadius: '10px', textAlign: 'center',
                background: '#f8fafc', border: '1.5px dashed #bbf7d0',
              }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#86efac' }}>Chưa có tài liệu chung nào</p>
              </div>
            ) : (
              globalDocs.map(doc => (
                <DocItem key={doc.collection_name} doc={doc}
                  isSelected={selectedCollection === doc.collection_name}
                  onSelect={() => onSelectDocument(doc)}
                  isGlobal={true} />
              ))
            )}
          </section>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 16px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '10px', color: '#cbd5e1', flexShrink: 0 }}>session này</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* ── SECTION 2: Tài liệu của session ── */}
          <section>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', marginBottom: '10px',
              borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe',
            }}>
              <span style={{ fontSize: '14px' }}>📂</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1d4ed8' }}>
                  Tài liệu của bạn
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#60a5fa' }}>
                  Chỉ hiện trong session này
                </p>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 700,
                padding: '2px 9px', borderRadius: '999px',
                background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd',
              }}>{sessionDocs.length}</span>
            </div>
            {sessionDocs.length === 0 ? (
              <div style={{
                padding: '14px', borderRadius: '10px', textAlign: 'center',
                background: '#f8fafc', border: '1.5px dashed #bfdbfe',
              }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#93c5fd' }}>Chưa có tài liệu nào trong session này</p>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#cbd5e1' }}>Dùng nút 📎 để upload tài liệu riêng</p>
              </div>
            ) : (
              sessionDocs.map(doc => (
                <DocItem key={doc.collection_name} doc={doc}
                  isSelected={selectedCollection === doc.collection_name}
                  onSelect={() => onSelectDocument(doc)}
                  isGlobal={false} />
              ))
            )}
          </section>

        </div>

        {/* Footer: active selection */}
        <div style={{
          flexShrink: 0, padding: '12px 16px',
          borderTop: '1px solid #f1f5f9', background: '#fafbfc',
        }}>
          {selectedDoc ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              background: '#fff7ed', border: '1px solid #fed7aa',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#92400e', fontWeight: 600 }}>Đang dùng cho RAG</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#c2410c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedDoc.original_filename}
                </p>
              </div>
              <button onClick={() => onSelectDocument(selectedDoc)} style={{
                fontSize: '11px', color: '#9a3412', background: 'none', border: 'none',
                cursor: 'pointer', padding: '2px 8px', borderRadius: '6px',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#fed7aa'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                Bỏ chọn
              </button>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', textAlign: 'center', color: '#94a3b8' }}>
              Chưa chọn tài liệu · Bot sẽ trả lời không dùng RAG
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
