import React, { useState } from 'react';

function groupByDate(sessions) {
  const now = new Date();
  const startOfToday    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek     = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups = { 'Hôm nay': [], 'Hôm qua': [], 'Tuần này': [], 'Trước đó': [] };

  sessions.forEach(s => {
    const d    = new Date(s.created_at);
    const day  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if      (day >= startOfToday)     groups['Hôm nay'].push(s);
    else if (day >= startOfYesterday) groups['Hôm qua'].push(s);
    else if (d   >= startOfWeek)      groups['Tuần này'].push(s);
    else                              groups['Trước đó'].push(s);
  });
  return groups;
}

function ChatIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function TrashIcon({ spinning }) {
  if (spinning) {
    return (
      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default function Sidebar({
  sessions, activeSessionId, isLoading, userInfo, isOpen,
  onToggle, onSelectSession, onCreateSession, onDeleteSession, onLogout,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [hoveredId, setHoveredId]   = useState(null);

  const handleDelete = async (e, session) => {
    e.stopPropagation();
    if (!window.confirm(`Xóa phiên "${session.display_name || 'Phiên mới'}"?`)) return;
    setDeletingId(session.session_id);
    await onDeleteSession(session.session_id);
    setDeletingId(null);
  };

  const grouped  = groupByDate(sessions);
  const username = userInfo?.username || 'User';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Sidebar panel ── */}
      <aside
        className="flex flex-col h-screen flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{
          width: isOpen ? '256px' : '0px',
          background: '#0f172a',
          borderRight: '1px solid #1e293b',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid #1e293b' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm whitespace-nowrap">RAG Assistant</span>
          <button onClick={onToggle}
            className="ml-auto p-1 rounded-md transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* New Session Button */}
        <div className="px-3 py-3">
          <button
            onClick={onCreateSession}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-white text-sm font-medium rounded-lg transition-all whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Phiên hội thoại mới
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-2 py-1 space-y-1 min-h-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-t-orange-500 rounded-full animate-spin"
                style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#f97316' }} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs" style={{ color: '#475569' }}>Chưa có phiên hội thoại nào</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={group} className="mb-1">
                  <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider"
                    style={{ color: '#475569' }}>
                    {group}
                  </p>
                  {list.map(session => {
                    const isActive  = activeSessionId === session.session_id;
                    const isHovered = hoveredId === session.session_id;
                    return (
                      <div
                        key={session.session_id}
                        onClick={() => onSelectSession(session.session_id)}
                        onMouseEnter={() => setHoveredId(session.session_id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                        style={{
                          background: isActive ? '#1e293b' : isHovered ? '#161f2e' : 'transparent',
                          color: isActive ? '#f8fafc' : '#94a3b8',
                        }}
                      >
                        <ChatIcon />
                        <span className="flex-1 truncate text-sm">
                          {session.display_name || 'Phiên mới'}
                        </span>
                        {(isHovered || isActive) && (
                          <button
                            onClick={e => handleDelete(e, session)}
                            disabled={deletingId === session.session_id}
                            className="flex-shrink-0 p-0.5 rounded transition-colors"
                            style={{ color: '#475569' }}
                            onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = '#f87171'; }}
                            onMouseLeave={e => { e.stopPropagation(); e.currentTarget.style.color = '#475569'; }}
                          >
                            <TrashIcon spinning={deletingId === session.session_id} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* User Footer */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid #1e293b' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
              <span className="text-xs font-bold" style={{ color: '#fb923c' }}>{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-white">{username}</p>
              <p className="text-xs capitalize" style={{ color: '#475569' }}>{userInfo?.role || 'user'}</p>
            </div>
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#475569' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Toggle button when sidebar is closed ── */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-5 h-14 flex items-center justify-center rounded-r-lg transition-colors"
          style={{ background: '#1e293b', color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#f8fafc'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#64748b'; }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </>
  );
}
