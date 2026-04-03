'use client';

import { useEffect, useState } from 'react';

export default function LatexEditor({ code, onChange, onCompileResult }: {
  code: string;
  onChange: (code: string) => void;
  onCompileResult: (result: { pdfUrl: string; previewUrl: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

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
      onCompileResult({ pdfUrl: data.pdfUrl, previewUrl: data.previewUrl });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <span>{expanded ? '▾' : '▸'}</span>
          <span>LaTeX 代码{code ? '（可手动编辑）' : ''}</span>
        </button>
        {expanded && (
          <button
            onClick={handleCompile}
            disabled={loading}
            className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            {loading ? '编译中...' : '重新编译'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3">
          {error && <p className="text-red-500 text-sm mb-2 whitespace-pre-wrap">{error}</p>}
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-96 p-3 border rounded-lg font-mono text-sm"
          />
        </div>
      )}

      {!expanded && error && (
        <p className="text-red-500 text-sm mt-2 whitespace-pre-wrap">{error}</p>
      )}
    </div>
  );
}
