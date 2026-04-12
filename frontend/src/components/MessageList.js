import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const mdComponents = {
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '14px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '14px' }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead style={{ background: '#f9fafb' }}>{children}</thead>,
  th: ({ children }) => <th style={{ border: '1px solid #e5e7eb', padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{children}</th>,
  td: ({ children }) => <td style={{ border: '1px solid #e5e7eb', padding: '8px 14px', color: '#374151', verticalAlign: 'top' }}>{children}</td>,
  tr: ({ children }) => <tr>{children}</tr>,

  code: ({ inline, children }) =>
    inline
      ? <code style={{ background: '#f3f4f6', color: '#be123c', padding: '2px 6px', borderRadius: '5px', fontSize: '13.5px', fontFamily: "'Fira Code',monospace" }}>{children}</code>
      : <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '16px 18px', borderRadius: '12px', overflowX: 'auto', fontSize: '13px', fontFamily: "'Fira Code',monospace", lineHeight: 1.7, margin: '12px 0' }}><code>{children}</code></pre>,

  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: '3px solid #d1d5db', paddingLeft: '16px', margin: '10px 0', color: '#6b7280', fontStyle: 'italic' }}>{children}</blockquote>
  ),

  ul: ({ children }) => <ul style={{ paddingLeft: '24px', margin: '8px 0', listStyleType: 'disc' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '24px', margin: '8px 0', listStyleType: 'decimal' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '5px', lineHeight: 1.7 }}>{children}</li>,

  h1: ({ children }) => <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '20px 0 10px', color: '#111827' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '18px 0 8px', color: '#111827' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '14px 0 6px', color: '#1f2937' }}>{children}</h3>,

  p: ({ children }) => <p style={{ margin: '0 0 12px', lineHeight: 1.75, color: '#1a1a1a' }}>{children}</p>,

  a: ({ href, children }) => {
    const vid = extractYouTubeId(href);
    return (
      <span>
        <a href={href} target="_blank" rel="noopener noreferrer"
          style={{ color: '#2563eb', textDecoration: 'underline' }}>
          {children}
        </a>
        {vid && (
          <span style={{ display: 'block', marginTop: '12px', marginBottom: '6px' }}>
            <iframe src={`https://www.youtube.com/embed/${vid}`}
              width="500" height="281"
              style={{ display: 'block', border: 'none', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.14)', maxWidth: '100%' }}
              allowFullScreen title={`yt-${vid}`} loading="lazy" />
          </span>
        )}
      </span>
    );
  },

  strong: ({ children }) => <strong style={{ fontWeight: 600, color: '#111827' }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: 'italic', color: '#374151' }}>{children}</em>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '18px 0' }} />,
};

function SourcesAccordion({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: open ? '#f97316' : '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <svg style={{ width: '13px', height: '13px', transform: open ? 'rotate(90deg)' : '', transition: 'transform 0.15s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {sources.length} nguồn tham khảo
      </button>
      {open && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {sources.map((src, i) => (
            <div key={i} style={{ padding: '11px 14px', borderRadius: '10px', background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: '13px' }}>
              <p style={{ margin: '0 0 5px', fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📄 {src?.metadata?.source || src?.metadata?.filename || `Nguồn ${i + 1}`}
              </p>
              {(src?.page_content || src?.content) && (
                <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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

function AiAvatar() {
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#f97316,#ea580c)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(249,115,22,0.4)',
    }}>
      <svg style={{ width: '18px', height: '18px', color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  );
}

/* max-width wrapper */
const ROW = { maxWidth: '820px', margin: '0 auto', width: '100%', padding: '0 24px' };

function UserMsg({ text }) {
  return (
    <div style={ROW}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '78%',
          background: '#f3f4f6',
          color: '#111827',
          borderRadius: '20px 20px 5px 20px',
          padding: '12px 18px',
          fontSize: '15px',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {text}
        </div>
      </div>
    </div>
  );
}

function AiMsg({ text, sources, streaming }) {
  return (
    <div style={ROW}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <AiAvatar />
        <div style={{ flex: 1, minWidth: 0, paddingTop: '4px' }}>
          <div style={{ fontSize: '15px', lineHeight: 1.75, color: '#111827' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{text}</ReactMarkdown>
          </div>
          {streaming && (
            <span style={{
              display: 'inline-block', width: '7px', height: '18px', marginLeft: '3px',
              borderRadius: '3px', background: '#f97316',
              animation: 'pulse 1s infinite',
              verticalAlign: 'text-bottom',
            }} />
          )}
          {!streaming && <SourcesAccordion sources={sources} />}
        </div>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div style={ROW}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <AiAvatar />
        <div style={{ display: 'flex', gap: '6px', paddingTop: '4px' }}>
          {[0, 1, 2].map(i => (
            <span key={i} className="typing-dot" style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#d1d5db', animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MsgPair({ msg }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <UserMsg text={msg.message} />
      {msg.response && <AiMsg text={msg.response} sources={msg.sources} />}
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2.5px solid rgba(249,115,22,0.2)', borderTopColor: '#f97316', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: '14px', color: '#9ca3af' }}>Đang tải...</p>
      </div>
    );
  }

  const isEmpty = messages.length === 0 && !pendingUserMsg;
  if (isEmpty) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 32px' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '18px', marginBottom: '20px',
          background: 'linear-gradient(135deg,#f97316,#ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
        }}>
          <svg style={{ width: '30px', height: '30px', color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Bắt đầu hội thoại</p>
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.65, maxWidth: '360px' }}>
          Chọn tài liệu bên dưới rồi đặt câu hỏi để AI trả lời dựa trên nội dung tài liệu.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingTop: '28px', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {messages.map((msg, i) => (
        <MsgPair key={msg._id || msg.id || i} msg={msg} />
      ))}
      {pendingUserMsg && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <UserMsg text={pendingUserMsg.message} />
          {hasFirstChunk && streamingText
            ? <AiMsg text={streamingText} streaming />
            : isStreaming ? <Typing /> : null}
        </div>
      )}
      <div ref={bottomRef} style={{ height: '4px' }} />
    </div>
  );
}
