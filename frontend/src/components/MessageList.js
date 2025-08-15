import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Component này dùng để hiển thị video YouTube từ một URL chuẩn.
 * (Chúng ta sẽ thêm một chút logic để xử lý link googleusercontent tại đây)
 */
const YouTubeVideoRenderer = ({ url }) => {
  let videoId = null;

  // Cố gắng lấy video ID từ link YouTube chuẩn
  let match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) {
    videoId = match[1];
  } else {
    // Xử lý định dạng link đặc biệt của bạn
    // Giả định rằng backend sẽ trả về link YouTube chuẩn trong tương lai
    // Tạm thời, chúng ta sẽ không hiển thị video cho các link này để tránh lỗi
    // Nếu bạn muốn chúng trở thành link có thể nhấp, hãy bỏ comment dòng dưới
    // return <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>;
  }
  
  // Chỉ hiển thị video nếu chúng ta có videoId hợp lệ
  if (!videoId) {
    // Với các link không hợp lệ, chúng ta sẽ không hiển thị gì cả để tránh làm xấu giao diện
    // hoặc bạn có thể trả về một link có thể nhấp như trên.
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="youtube-player-wrapper">
      <iframe
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};


const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Hàm này sử dụng phương pháp "placeholder" để tìm và thay thế tất cả các loại
   * link YouTube bằng component video một cách chính xác.
   */
  const renderMessageWithVideos = (text) => {
    if (!text) return null;

    const videos = [];
    let processedText = text;

    // Regex tìm cả link YouTube chuẩn và link googleusercontent
    const allYoutubeLinksRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/[a-zA-Z0-9_-]{11})[\w?=&-]*|https?:\/\/googleusercontent\.com\/youtube\.com\/[0-9]+)/g;

    // Bước 1: Tìm và thay thế các link nằm trong Markdown `[text](URL)`
    const markdownYoutubeRegex = new RegExp(`\\[([^\\]]*?)\\]\\((${allYoutubeLinksRegex.source})\\)`, 'g');
    
    processedText = processedText.replace(markdownYoutubeRegex, (fullMatch, linkText, url) => {
        const placeholder = `__VIDEO_PLACEHOLDER_${videos.length}__`;
        videos.push(<YouTubeVideoRenderer key={placeholder} url={url} />);
        return placeholder;
    });

    // Bước 2: Tìm và thay thế các link trần còn lại
    processedText = processedText.replace(allYoutubeLinksRegex, (url) => {
        const placeholder = `__VIDEO_PLACEHOLDER_${videos.length}__`;
        videos.push(<YouTubeVideoRenderer key={placeholder} url={url} />);
        return placeholder;
    });

    // Bước 3: Tách chuỗi đã xử lý và chèn component video vào đúng vị trí
    const parts = processedText.split(/(__VIDEO_PLACEHOLDER_\d+__)/g);

    return parts.map((part, index) => {
        if (part.startsWith('__VIDEO_PLACEHOLDER_')) {
            const videoIndex = parseInt(part.match(/\d+/)[0], 10);
            return videos[videoIndex];
        }
        // Các phần văn bản còn lại sẽ được hiển thị qua ReactMarkdown
        return part ? <ReactMarkdown key={index} components={{ p: React.Fragment }}>{part}</ReactMarkdown> : null;
    });
  };

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.sender}`}>
          {renderMessageWithVideos(msg.text)}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;