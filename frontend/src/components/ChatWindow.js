import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageForm from './MessageForm';
import { sendMessage, getAllMessages } from '../services/api';

const ChatWindow = ({ sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    // Nếu không có sessionId (ví dụ, vừa xóa hoặc chưa chọn session), reset mọi thứ
    if (!sessionId) {
      setMessages([]);
      setStatus('idle');
      return;
    }

    // Hàm để tải tin nhắn của session được chọn
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
  }, [sessionId]); // Hook này sẽ chạy lại mỗi khi `sessionId` thay đổi

  // Hàm xử lý việc gửi tin nhắn
  const handleSendMessage = async (text) => {
    if (!sessionId) return;

    // Cập nhật giao diện ngay lập tức với tin nhắn của người dùng
    const userMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Gọi API để lấy phản hồi của bot
      const response = await sendMessage(sessionId, text);
      const botMessage = { text: response.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      const errorMessage = { text: 'Lỗi: Không thể gửi tin nhắn đến server.', sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Hiển thị giao diện dựa trên trạng thái
  if (!sessionId) {
    return <div className="chat-window-placeholder">Vui lòng chọn hoặc tạo một phiên chat để bắt đầu.</div>;
  }
  if (status === 'loading') {
    return <div className="chat-window-placeholder">Đang tải tin nhắn...</div>;
  }
  if (status === 'error') {
    return <div className="chat-window-placeholder error-message">Lỗi khi tải dữ liệu cho phiên chat này.</div>;
  }

  return (
    <div className="chat-window">
      <MessageList messages={messages} />
      <MessageForm onSendMessage={handleSendMessage} sessionId={sessionId} />
    </div>
  );
};

export default ChatWindow;