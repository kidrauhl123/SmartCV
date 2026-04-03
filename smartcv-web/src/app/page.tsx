'use client';

import { useState } from 'react';
import ResumeInput from '@/components/ResumeInput';
import LatexEditor from '@/components/LatexEditor';
import PdfPreview from '@/components/PdfPreview';

export default function Home() {
  const [latexCode, setLatexCode] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleCompileResult = (result: { pdfUrl: string; previewUrl: string }) => {
    setPdfUrl(result.pdfUrl);
    setPreviewUrl(result.previewUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">SmartCV - AI 简历生成器</h1>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <ResumeInput onLatexGenerated={setLatexCode} />
            <LatexEditor code={latexCode} onChange={setLatexCode} onCompileResult={handleCompileResult} />
          </div>
          <div className="lg:col-span-2">
            <PdfPreview pdfUrl={pdfUrl} previewUrl={previewUrl} />
          </div>
        </div>
      </main>
    </div>
  );
}
