'use client';

import { useState } from 'react';

export default function ResumeInput({ onLatexGenerated, onPdfGenerated }: {
  onLatexGenerated: (latex: string) => void;
  onPdfGenerated: (url: string) => void;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch('/api/generate-latex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text })
    });
    const data = await res.json();
    onLatexGenerated(data.latex);

    // 自动生成 PDF
    setTimeout(() => {
      const event = new CustomEvent('auto-compile-pdf');
      window.dispatchEvent(event);
    }, 100);

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">输入简历内容</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴您的简历内容..."
        className="w-full h-64 p-3 border rounded-lg"
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        {loading ? '生成中...' : '生成简历'}
      </button>
    </div>
  );
}
