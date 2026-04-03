'use client';

import { useState, useEffect } from 'react';

const PROVIDERS = [
  { value: 'grok', label: 'Grok (xAI)' },
];

export default function ResumeInput({ onLatexGenerated }: {
  onLatexGenerated: (latex: string) => void;
}) {
  const [text, setText] = useState('');
  const [provider, setProvider] = useState('grok');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('smartcv_api_key');
    const savedProvider = localStorage.getItem('smartcv_provider');
    if (saved) setApiKey(saved);
    if (savedProvider) setProvider(savedProvider);
  }, []);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('smartcv_api_key', val);
  };

  const handleProviderChange = (val: string) => {
    setProvider(val);
    localStorage.setItem('smartcv_provider', val);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    if (!apiKey.trim()) { setError('请填写 API Key'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, provider, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');

      onLatexGenerated(data.latex);
      setTimeout(() => window.dispatchEvent(new CustomEvent('auto-compile-pdf')), 100);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold">输入简历内容</h2>

      <div className="flex gap-2">
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {PROVIDERS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => handleApiKeyChange(e.target.value)}
          placeholder="API Key"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴您的简历内容..."
        className="w-full h-56 p-3 border rounded-lg text-sm"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'AI 生成中...' : '生成简历'}
      </button>
    </div>
  );
}
