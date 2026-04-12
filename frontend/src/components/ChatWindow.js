import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllMessages, getDocumentsForSession, sendMessageStream } from '../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DocumentPanel from './DocumentPanel';

export default function ChatWindow({ sessionId, userRole, onUnauthorized, onSessionNameUpdate }) {
  const [messages, setMessages]               = useState([]);
  const [documents, setDocuments]             = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages]   = useState(true);

  // Streaming state
  const [isStreaming, setIsStreaming]           = useState(false);
  const [hasFirstChunk, setHasFirstChunk]      = useState(false);
  const [streamingText, setStreamingText]      = useState('');
  const [pendingUserMsg, setPendingUserMsg]    = useState(null);
  const abortRef = useRef(null);
  const streamingTextRef = useRef(''); // ref tránh stale closure trong onDone

  // Document dropdown
  const [docDropdownOpen, setDocDropdownOpen]  = useState(false);

  // Fetch data on session change
  const loadSessionData = useCallback(async () => {
    setIsLoadingMessages(true);
    setMessages([]);
    setDocuments([]);
    setSelectedCollection(null);
    try {
      const [msgs, docs] = await Promise.all([
        getAllMessages(sessionId),
        getDocumentsForSession(sessionId),
      ]);
      setMessages(msgs || []);
      setDocuments(docs || []);
    } catch (err) {
      if (err?.response?.status === 401) onUnauthorized();
    } finally {
      setIsLoadingMessages(false);
    }
  }, [sessionId, onUnauthorized]);

  useEffect(() => { loadSessionData(); }, [loadSessionData]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleSend = useCallback((text) => {
    if (isStreaming) return;

    const userMsg = { message: text, timestamp: new Date().toISOString() };
    setPendingUserMsg(userMsg);
    setIsStreaming(true);
    setHasFirstChunk(false);
    setStreamingText('');
    streamingTextRef.current = '';

    const controller = sendMessageStream(sessionId, text, selectedCollection, {
      onMeta: (meta) => {
        if (meta.session_updated && onSessionNameUpdate) {
          const preview = text.slice(0, 50) + (text.length > 50 ? '...' : '');
          onSessionNameUpdate(sessionId, preview);
        }
      },
      onChunk: (chunk) => {
        setHasFirstChunk(true);
        streamingTextRef.current += chunk;
        setStreamingText(streamingTextRef.current);
      },
      onDone: (data) => {
        const finalText = streamingTextRef.current;
        const newMsg = {
          _id: data.chat_id,
          session_id: sessionId,
          message: text,
          response: finalText,
          timestamp: userMsg.timestamp,
        };
        setMessages(prev => [...prev, newMsg]);
        setStreamingText('');
        streamingTextRef.current = '';
        setPendingUserMsg(null);
        setIsStreaming(false);
        setHasFirstChunk(false);
        abortRef.current = null;
      },
      onError: (err) => {
        if (err?.response?.status === 401) {
          onUnauthorized();
        }
        setPendingUserMsg(null);
        setIsStreaming(false);
        setHasFirstChunk(false);
        setStreamingText('');
        abortRef.current = null;
      },
    });

    abortRef.current = controller;
  }, [sessionId, selectedCollection, isStreaming, onSessionNameUpdate, onUnauthorized]);

  const handleStopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleUploadComplete = useCallback(async (uploadResponse) => {
    try {
      const docs = await getDocumentsForSession(sessionId);
      setDocuments(docs || []);
      setDocDropdownOpen(true);

      const firstUploadedCollection = uploadResponse?.processed_files_info?.[0]?.collection_name;
      if (firstUploadedCollection) {
        setSelectedCollection(firstUploadedCollection);
      }
    } catch (_) {}
  }, [sessionId]);

  const handleSelectDocument = (doc) => {
    setSelectedCollection(prev =>
      prev === doc.collection_name ? null : doc.collection_name
    );
    setDocDropdownOpen(false);
  };

  const selectedDoc = documents.find(d => d.collection_name === selectedCollection);

  return (
    <div className="flex flex-col h-screen" style={{ background: '#f8fafc' }}>
      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-200 flex-shrink-0"
        style={{ minHeight: '48px' }}>

        {/* Document button – shows count or active filename */}
        <div className="relative">
          <button
            onClick={() => setDocDropdownOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: selectedCollection ? '5px 12px' : '5px 10px',
              borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: selectedCollection ? '#fff7ed' : docDropdownOpen ? '#f1f5f9' : '#f8fafc',
              color: selectedCollection ? '#c2410c' : '#475569',
              boxShadow: selectedCollection
                ? '0 0 0 1.5px #fdba74'
                : '0 0 0 1px #e2e8f0',
            }}
          >
            {/* Icon */}
            <svg style={{ width: '14px', height: '14px', flexShrink: 0 }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>

            {selectedCollection ? (
              <>
                {/* Active dot */}
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#f97316', flexShrink: 0,
                }} />
                {/* Filename truncated */}
                <span style={{
                  maxWidth: '180px', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {selectedDoc?.original_filename || selectedCollection}
                </span>
                {/* X to deselect */}
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); setSelectedCollection(null); }}
                  style={{ marginLeft: '2px', color: '#9a3412', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </>
            ) : (
              <>
                <span>{documents.length > 0 ? `${documents.length} tài liệu` : 'Tài liệu'}</span>
                <svg style={{ width: '11px', height: '11px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={docDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </>
            )}
          </button>

          {/* Document window */}
          {docDropdownOpen && (
            <DocumentPanel
              documents={documents}
              selectedCollection={selectedCollection}
              onSelectDocument={handleSelectDocument}
              onClose={() => setDocDropdownOpen(false)}
            />
          )}
        </div>

        <div className="flex-1" />

        {/* Message count */}
        {messages.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ color: '#94a3b8', background: '#f1f5f9' }}>
            {messages.length} tin nhắn
          </span>
        )}
      </div>

      {/* ── Messages ── */}
      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        pendingUserMsg={pendingUserMsg}
        streamingText={streamingText}
        isStreaming={isStreaming}
        hasFirstChunk={hasFirstChunk}
      />

      {/* ── Input ── */}
      <MessageInput
        sessionId={sessionId}
        userRole={userRole}
        selectedCollection={selectedCollection}
        selectedDocName={selectedDoc?.original_filename || null}
        isStreaming={isStreaming}
        onSend={handleSend}
        onStop={handleStopStream}
        onUploadComplete={handleUploadComplete}
        onUnauthorized={onUnauthorized}
        onOpenDocPanel={() => setDocDropdownOpen(true)}
      />
    </div>
  );
}
