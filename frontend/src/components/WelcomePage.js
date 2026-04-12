import React from 'react';

const features = [
  {
    icon: '📤',
    title: 'Tải tài liệu lên',
    desc: 'Hỗ trợ PDF, DOCX, TXT và nhiều định dạng khác',
  },
  {
    icon: '🔍',
    title: 'Tìm kiếm thông minh',
    desc: 'Hybrid vector search cho độ chính xác cao nhất',
  },
  {
    icon: '💬',
    title: 'Hỏi & Đáp trực tiếp',
    desc: 'Đặt câu hỏi, nhận câu trả lời dựa trên tài liệu',
  },
];

export default function WelcomePage({ username, onCreateSession }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-8">
      <div className="w-full max-w-lg text-center">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(249,115,22,0.1)' }}
        >
          <svg className="w-10 h-10" style={{ color: '#f97316' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Xin chào{username ? `, ${username}` : ''}!
        </h1>
        <p className="text-slate-500 text-base mb-8 leading-relaxed">
          Bắt đầu một phiên hội thoại mới để tải lên tài liệu và đặt câu hỏi với AI.
        </p>

        <button
          onClick={onCreateSession}
          className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl text-sm transition-all"
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo phiên hội thoại mới
        </button>

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-left">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
