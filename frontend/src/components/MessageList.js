import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Custom ReactMarkdown components: YouTube links get an inline embed right below them
const markdownComponents = {
  // --- Tables ---
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', marginTop: '10px', marginBottom: '10px' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead style={{ background: '#f1f5f9' }}>{children}</thead>,
  th: ({ children }) => (
    <th style={{ border: '1px solid #e2e8f0', padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{ border: '1px solid #e2e8f0', padding: '6px 12px', color: '#475569', verticalAlign: 'top' }}>{children}</td>
  ),
  tr: ({ children }) => <tr style={{ borderBottom: '1px solid #f1f5f9' }}>{children}</tr>,

  // --- Code ---
  code: ({ inline, children }) =>
    inline
      ? <code style={{ background: '#f1f5f9', color: '#be123c', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>{children}</code>
      : <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '14px 16px', borderRadius: '10px', overflowX: 'auto', fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.6, margin: '10px 0' }}><code>{children}</code></pre>,

  // --- Blockquote ---
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: '3px solid #f97316', paddingLeft: '12px', margin: '8px 0', color: '#64748b', fontStyle: 'italic' }}>{children}</blockquote>
  ),

  // --- Lists ---
  ul: ({ children }) => <ul style={{ paddingLeft: '20px', margin: '6px 0', listStyleType: 'disc' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '20px', margin: '6px 0', listStyleType: 'decimal' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '3px', color: '#334155' }}>{children}</li>,

  // --- Headings ---
  h1: ({ children }) => <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '14px 0 6px' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '12px 0 5px' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', margin: '10px 0 4px' }}>{children}</h3>,

  // --- Links + YouTube embed ---
  a: ({ href, children }) => {
    const vid = extractYouTubeId(href);
    return (
      <span style={{ display: 'inline' }}>
        <a href={href} target="_blank" rel="noopener noreferrer"
          style={{ color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {children}
        </a>
        {vid && (
          <span style={{ display: 'block', marginTop: '10px', marginBottom: '8px' }}>
            <iframe
              src={`https://www.youtube.com/embed/${vid}`}
              width="460"
              height="259"
              style={{
                display: 'block', border: 'none',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
                maxWidth: '100%',
              }}
              allowFullScreen
              title={`YouTube ${vid}`}
              loading="lazy"
            />
          </span>
        )}
      </span>
    );
  },
};

function SourcesAccordion({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs transition-colors"
        style={{ color: open ? '#f97316' : '#94a3b8' }}>
        <svg className="w-3 h-3 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ transform: open ? 'rotate(90deg)' : '' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {sources.length} nguồn tham khảo
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {sources.map((src, i) => (
            <div key={i} className="p-2.5 rounded-lg text-xs"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p className="font-medium truncate mb-1" style={{ color: '#475569' }}>
                📄 {src?.metadata?.source || src?.metadata?.filename || `Nguồn ${i + 1}`}
              </p>
              {(src?.page_content || src?.content) && (
                <p className="line-clamp-2 leading-relaxed" style={{ color: '#64748b' }}>
                  {src.page_content || src.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
      <svg className="w-3.5 h-3.5" style={{ color: '#f97316' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  );
}

function UserBubble({ text, time }) {
  return (
    <div className="flex justify-end">
      <div style={{ maxWidth: '72%' }}>
        <div className="px-4 py-2.5 rounded-2xl text-sm text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', borderBottomRightRadius: '4px' }}>
          <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        </div>
        {time && <p className="text-right text-xs mt-1 pr-1" style={{ color: '#cbd5e1' }}>{time}</p>}
      </div>
    </div>
  );
}

function BotBubble({ text, sources, time, streaming }) {
  return (
    <div className="flex justify-start gap-2.5">
      <BotAvatar />
      <div style={{ maxWidth: '72%' }}>
        <div className="px-4 py-2.5 rounded-2xl text-sm shadow-sm"
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderBottomLeftRadius: '4px', color: '#1e293b' }}>
          <div className="prose-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{text}</ReactMarkdown>
          </div>
          {streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 rounded-sm animate-pulse"
              style={{ background: '#f97316', verticalAlign: 'text-bottom' }} />
          )}
          {!streaming && <SourcesAccordion sources={sources} />}
        </div>
        {time && !streaming && <p className="text-xs mt-1 pl-1" style={{ color: '#cbd5e1' }}>{time}</p>}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2.5">
      <BotAvatar />
      <div className="px-4 py-3 rounded-2xl shadow-sm"
        style={{ background: '#fff', border: '1px solid #e2e8f0', borderBottomLeftRadius: '4px' }}>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full typing-dot" style={{ background: '#cbd5e1' }} />
          <span className="w-2 h-2 rounded-full typing-dot" style={{ background: '#cbd5e1' }} />
          <span className="w-2 h-2 rounded-full typing-dot" style={{ background: '#cbd5e1' }} />
        </div>
      </div>
    </div>
  );
}

function MessageItem({ msg }) {
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  return (
    <div className="space-y-3 fade-in">
      <UserBubble text={msg.message} time={time} />
      {msg.response && <BotBubble text={msg.response} sources={msg.sources} time={time} />}
    </div>
  );
}

export default function MessageList({
  messages, isLoading,
  pendingUserMsg, streamingText, isStreaming, hasFirstChunk,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isStreaming]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(249,115,22,0.2)', borderTopColor: '#f97316' }} />
        <p className="text-sm" style={{ color: '#94a3b8' }}>Đang tải...</p>
      </div>
    );
  }

  const isEmpty = messages.length === 0 && !pendingUserMsg;

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="text-4xl mb-3">💬</div>
        <p className="text-sm font-medium" style={{ color: '#64748b' }}>Bắt đầu cuộc trò chuyện</p>
        <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>
          Chọn tài liệu bằng nút 📂 rồi đặt câu hỏi bên dưới
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {/* Historical messages */}
      {messages.map((msg, i) => (
        <MessageItem key={msg._id || msg.id || i} msg={msg} />
      ))}

      {/* Pending user message + streaming response */}
      {pendingUserMsg && (
        <div className="space-y-3 fade-in">
          <UserBubble text={pendingUserMsg.message} />
          {hasFirstChunk && streamingText ? (
            <BotBubble text={streamingText} streaming />
          ) : isStreaming ? (
            <TypingIndicator />
          ) : null}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
