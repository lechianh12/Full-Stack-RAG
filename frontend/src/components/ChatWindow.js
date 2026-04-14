import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllMessages, getDocumentsForSession, sendMessageStream } from '../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import DocumentPanel from './DocumentPanel';

export default function ChatWindow({ sessionId, userRole, username, onUnauthorized, onSessionNameUpdate }) {
  const [messages, setMessages]                         = useState([]);
  const [documents, setDocuments]                       = useState([]);
  const [selectedCollections, setSelectedCollections]   = useState([]); // array of collection_names
  const [isLoadingMessages, setIsLoadingMessages]       = useState(true);
  const [docPanelOpen, setDocPanelOpen]                 = useState(false);

  // Streaming
  const [isStreaming, setIsStreaming]     = useState(false);
  const [hasFirstChunk, setHasFirstChunk] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [pendingUserMsg, setPendingUserMsg] = useState(null);
  const abortRef         = useRef(null);
  const streamingTextRef = useRef('');

  const loadSessionData = useCallback(async () => {
    setIsLoadingMessages(true);
    setMessages([]);
    setDocuments([]);
    setSelectedCollections([]);
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
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleSend = useCallback((text) => {
    if (isStreaming) return;
    const userMsg = { message: text, timestamp: new Date().toISOString() };
    setPendingUserMsg(userMsg);
    setIsStreaming(true);
    setHasFirstChunk(false);
    setStreamingText('');
    streamingTextRef.current = '';

    const controller = sendMessageStream(sessionId, text, selectedCollections, {
      onMeta: (meta) => {
        if (meta.session_updated && onSessionNameUpdate) {
          onSessionNameUpdate(sessionId, text.slice(0, 50) + (text.length > 50 ? '...' : ''));
        }
      },
      onChunk: (chunk) => {
        setHasFirstChunk(true);
        streamingTextRef.current += chunk;
        setStreamingText(streamingTextRef.current);
      },
      onDone: (data) => {
        const finalText = streamingTextRef.current;
        setMessages(prev => [...prev, {
          _id: data.chat_id,
          session_id: sessionId,
          message: text,
          response: finalText,
          timestamp: userMsg.timestamp,
        }]);
        setStreamingText('');
        streamingTextRef.current = '';
        setPendingUserMsg(null);
        setIsStreaming(false);
        setHasFirstChunk(false);
        abortRef.current = null;
      },
      onError: (err) => {
        if (err?.response?.status === 401) onUnauthorized();
        setPendingUserMsg(null);
        setIsStreaming(false);
        setHasFirstChunk(false);
        setStreamingText('');
        streamingTextRef.current = '';
        abortRef.current = null;
      },
    });
    abortRef.current = controller;
  }, [sessionId, selectedCollections, isStreaming, onSessionNameUpdate, onUnauthorized]);

  const handleStopStream = useCallback(() => { abortRef.current?.abort(); }, []);

  const handleUploadComplete = useCallback(async (uploadResponse) => {
    try {
      const docs = await getDocumentsForSession(sessionId);
      setDocuments(docs || []);
      setDocPanelOpen(true);
      // Auto-select newly uploaded doc
      const newCol = uploadResponse?.processed_files_info?.[0]?.collection_name;
      if (newCol) setSelectedCollections(prev => [...new Set([...prev, newCol])]);
    } catch (_) {}
  }, [sessionId]);

  // Toggle a single collection in/out of selection
  const handleToggleDocument = useCallback((collectionName) => {
    setSelectedCollections(prev =>
      prev.includes(collectionName)
        ? prev.filter(c => c !== collectionName)
        : [...prev, collectionName]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedCollections(documents.map(d => d.collection_name));
  }, [documents]);

  const handleDeselectAll = useCallback(() => {
    setSelectedCollections([]);
  }, []);

  // Pill label
  const pillLabel = () => {
    if (selectedCollections.length === 0)
      return documents.length > 0 ? `${documents.length} tài liệu` : 'Tài liệu';
    if (selectedCollections.length === 1) {
      const doc = documents.find(d => d.collection_name === selectedCollections[0]);
      return doc?.original_filename || '1 tài liệu';
    }
    return `${selectedCollections.length} tài liệu đã chọn`;
  };

  const hasSelection = selectedCollections.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>

      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        pendingUserMsg={pendingUserMsg}
        streamingText={streamingText}
        isStreaming={isStreaming}
        hasFirstChunk={hasFirstChunk}
        username={username}
      />

      {/* ── Bottom: pill + input ── */}
      <div style={{ flexShrink: 0, padding: '0 20px 20px', background: '#fff' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>

          {/* Pill row — anchors the floating panel */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>

            {/* Floating panel above pill */}
            {docPanelOpen && (
              <div style={{
                position: 'absolute',
                bottom: 'calc(100% + 10px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(480px, 92vw)',
                zIndex: 200,
              }}>
                <DocumentPanel
                  documents={documents}
                  selectedCollections={selectedCollections}
                  onToggleDocument={handleToggleDocument}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onClose={() => setDocPanelOpen(false)}
                />
              </div>
            )}

            {/* Pill button */}
            <button
              onClick={() => setDocPanelOpen(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '7px 16px 7px 12px',
                borderRadius: '22px', border: 'none', cursor: 'pointer',
                background: hasSelection ? '#f0f9ff' : '#f3f4f6',
                boxShadow: hasSelection ? '0 0 0 1.5px #7dd3fc' : '0 0 0 1px #e5e7eb',
                fontSize: '13px', fontWeight: 500,
                color: hasSelection ? '#0369a1' : '#6b7280',
                transition: 'all 0.15s',
              }}
            >
              <svg style={{ width: '15px', height: '15px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>

              {hasSelection && (
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0ea5e9', flexShrink: 0 }} />
              )}

              <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pillLabel()}
              </span>

              {hasSelection ? (
                <span role="button"
                  onClick={e => { e.stopPropagation(); setSelectedCollections([]); }}
                  style={{ display: 'flex', alignItems: 'center', color: '#0369a1', marginLeft: '2px', cursor: 'pointer' }}>
                  <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              ) : (
                <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={docPanelOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              )}
            </button>
          </div>

          <MessageInput
            sessionId={sessionId}
            userRole={userRole}
            selectedCollection={selectedCollections.length > 0 ? selectedCollections[0] : null}
            isStreaming={isStreaming}
            onSend={handleSend}
            onStop={handleStopStream}
            onUploadComplete={handleUploadComplete}
            onUnauthorized={onUnauthorized}
          />
        </div>
      </div>
    </div>
  );
}
