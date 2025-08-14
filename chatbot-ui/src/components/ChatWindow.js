import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageForm from './MessageForm';
import FileUpload from './FileUpload'; // Import component mới
import { sendMessage, getAllMessages } from '../services/api';

const ChatWindow = ({ sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    // Nếu không có sessionId (ví dụ, vừa xóa session), không làm gì cả
    if (!sessionId) {
      setMessages([]);
      setStatus('idle');
      return;
    }

    const fetchMessages = async () => {
      setStatus('loading');
      try {
        const oldMessages = await getAllMessages(sessionId);
        const formattedMessages = oldMessages.map(msg => ([
          { text: msg.message, sender: 'user' },
          { text: msg.response, sender: 'bot' }
        ])).flat();
        setMessages(formattedMessages);
        setStatus('success');
      } catch (error) {
        console.error(`Lỗi khi tải tin nhắn cho session ${sessionId}:`, error);
        setStatus('error');
      }
    };

    fetchMessages();
  }, [sessionId]); // Chạy lại mỗi khi sessionId thay đổi

  const handleSendMessage = async (text) => {
    if (!sessionId) return;

    const userMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await sendMessage(sessionId, text);
      const botMessage = { text: response.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      const errorMessage = { text: 'Lỗi: Không thể gửi tin nhắn.', sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Giao diện khi chưa có session nào được chọn
  if (!sessionId) {
    return <div className="chat-window-placeholder">Vui lòng chọn hoặc tạo một phiên chat để bắt đầu.</div>;
  }

  // Giao diện khi đang tải hoặc lỗi
  if (status === 'loading') return <div className="chat-window-placeholder">Đang tải tin nhắn...</div>;
  if (status === 'error') return <div className="chat-window-placeholder error-message">Lỗi khi tải dữ liệu cho phiên chat này.</div>;

  return (
    <div className="chat-window">
      <div className="chat-header">
          <FileUpload sessionId={sessionId} />
      </div>
      <MessageList messages={messages} />
      <MessageForm onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;