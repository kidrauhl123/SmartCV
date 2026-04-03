'use client';

import { useState, useEffect } from 'react';

interface ProviderInfo {
  value: string;
  label: string;
  hasDefault: boolean;
}

export default function ResumeInput({ onLatexGenerated }: {
  onLatexGenerated: (latex: string) => void;
}) {
  const [text, setText] = useState('');
  const [provider, setProvider] = useState('grok');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('smartcv_api_key');
    const savedProvider = localStorage.getItem('smartcv_provider');
    if (saved) setApiKey(saved);

    fetch('/api/generate-latex').then(r => r.json()).then(data => {
      if (data.providers) {
        setProviders(data.providers);
        // 如果本地没有保存过 provider，默认选第一个有默认 Key 的，或第一个
        if (!savedProvider) {
          const withDefault = data.providers.find((p: ProviderInfo) => p.hasDefault);
          setProvider(withDefault?.value ?? data.providers[0]?.value ?? 'grok');
        } else {
          setProvider(savedProvider);
        }
      }
    }).catch(() => {});
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

  const currentProvider = providers.find(p => p.value === provider);

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold">输入简历内容</h2>

      <div className="flex gap-2">
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {providers.length > 0 ? providers.map(p => (
            <option key={p.value} value={p.value}>
              {p.label}{p.hasDefault ? ' ✓' : ''}
            </option>
          )) : (
            <option value="grok">Grok (xAI)</option>
          )}
        </select>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => handleApiKeyChange(e.target.value)}
          placeholder={currentProvider?.hasDefault ? '留空使用默认 Key' : '填写 API Key'}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {currentProvider?.hasDefault && !apiKey && (
        <p className="text-xs text-green-600">✓ 当前使用站点提供的默认 Key</p>
      )}

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
