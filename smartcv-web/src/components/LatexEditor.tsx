'use client';

import { useEffect, useState } from 'react';

export default function LatexEditor({ code, onChange, onCompile }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAutoCompile = () => {
      if (code) handleCompile();
    };
    window.addEventListener('auto-compile-pdf', handleAutoCompile);
    return () => window.removeEventListener('auto-compile-pdf', handleAutoCompile);
  }, [code]);

  const handleCompile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/compile-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '编译失败');
      onCompile(data.pdfUrl);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">LaTeX 代码</h2>
        <button
          onClick={handleCompile}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? '编译中...' : '生成预览'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-96 p-3 border rounded-lg font-mono text-sm"
      />
    </div>
  );
}
