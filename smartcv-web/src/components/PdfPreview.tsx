'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

// A4 @ 220dpi
const PDF_W_PX = 1819;
const PDF_H_PX = 2575;

interface Photo {
  src: string;
  x: number;
  y: number;
  width: number;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

export default function PdfPreview({ pdfUrl, previewUrl }: { pdfUrl: string; previewUrl: string }) {
  const imgRef = useRef<HTMLImageElement>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const resizeStart = useRef({ mx: 0, pw: 0 });

  const loadPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const imgW = imgRef.current?.clientWidth ?? 400;
      const w = imgW * 0.22;
      const newPhoto: Photo = { src, x: imgW * 0.68, y: imgW * 0.02, width: w };
      setPhotos(prev => {
        setSelectedIdx(prev.length); // 选中刚添加的（index = 当前长度）
        return [...prev, newPhoto];
      });
    };
    reader.readAsDataURL(file);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedIdx === null || (!dragging && !resizing)) return;
    const imgW = imgRef.current?.clientWidth ?? 0;
    const imgH = imgRef.current?.clientHeight ?? 0;

    setPhotos(prev => prev.map((p, i) => {
      if (i !== selectedIdx) return p;
      if (dragging) return {
        ...p,
        x: Math.max(0, Math.min(imgW - p.width, dragStart.current.px + e.clientX - dragStart.current.mx)),
        y: Math.max(0, Math.min(imgH - 20, dragStart.current.py + e.clientY - dragStart.current.my)),
      };
      if (resizing) return {
        ...p,
        width: Math.max(30, Math.min(imgW * 0.5, resizeStart.current.pw + e.clientX - resizeStart.current.mx)),
      };
      return p;
    }));
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;
    const base64 = pdfUrl.split(',')[1];
    const pdfDoc = await PDFDocument.load(base64ToUint8Array(base64));
    const page = pdfDoc.getPage(0);
    const { width: pdfW, height: pdfH } = page.getSize();

    const displayW = imgRef.current?.clientWidth ?? 1;
    const scale = PDF_W_PX / displayW;       // display px → 220dpi px
    const ptPerPx = pdfW / PDF_W_PX;         // 220dpi px → PDF pt

    for (const photo of photos) {
      const matches = photo.src.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) continue;
      const imgBytes = base64ToUint8Array(matches[2]);
      const image = matches[1].toLowerCase() === 'png'
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);

      const imgWPt = photo.width * scale * ptPerPx;
      const imgHPt = imgWPt * (image.height / image.width);
      page.drawImage(image, {
        x: photo.x * scale * ptPerPx,
        y: pdfH - photo.y * scale * ptPerPx - imgHPt,
        width: imgWPt,
        height: imgHPt,
      });
    }

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selected = selectedIdx !== null ? photos[selectedIdx] : null;

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">PDF 预览</h2>
        <div className="flex gap-2">
          <label className="cursor-pointer text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
            + 添加照片
            <input type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) { loadPhoto(e.target.files[0]); e.target.value = ''; } }} />
          </label>
          {selected && (
            <button
              onClick={() => { setPhotos(prev => prev.filter((_, i) => i !== selectedIdx)); setSelectedIdx(null); }}
              className="text-sm text-red-500 hover:text-red-700 px-2 py-1.5"
            >
              移除所选
            </button>
          )}
          {pdfUrl && (
            <button onClick={handleDownload} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
              下载 PDF
            </button>
          )}
        </div>
      </div>

      <div
        className="relative flex-1 overflow-auto border rounded-lg bg-gray-200"
        style={{ cursor: dragging ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => { setDragging(false); setResizing(false); }}
        onMouseLeave={() => { setDragging(false); setResizing(false); }}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) loadPhoto(f); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => setSelectedIdx(null)} // 点空白处取消选中
      >
        {previewUrl ? (
          <div className="relative inline-block w-full">
            <img ref={imgRef} src={previewUrl} alt="简历预览" className="w-full block" draggable={false} />

            {photos.map((photo, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <div
                  key={idx}
                  style={{ position: 'absolute', left: photo.x, top: photo.y, width: photo.width, userSelect: 'none', cursor: dragging && isSelected ? 'grabbing' : 'grab' }}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedIdx(idx);
                    setDragging(true);
                    dragStart.current = { mx: e.clientX, my: e.clientY, px: photo.x, py: photo.y };
                  }}
                >
                  <img
                    src={photo.src}
                    alt={`照片${idx + 1}`}
                    className={`w-full shadow-lg rounded-sm ${isSelected ? 'ring-2 ring-blue-400' : 'ring-1 ring-gray-300'}`}
                    draggable={false}
                  />
                  {isSelected && (
                    <div
                      style={{ position: 'absolute', bottom: -5, right: -5, width: 14, height: 14, background: '#3b82f6', borderRadius: 3, cursor: 'se-resize' }}
                      onMouseDown={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setResizing(true);
                        setDragging(false);
                        resizeStart.current = { mx: e.clientX, pw: photo.width };
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full min-h-64 flex items-center justify-center text-gray-400">
            等待生成预览...
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          点击照片选中，拖动调整位置，右下角蓝点调整大小，点空白处取消选中，满意后点「下载 PDF」
        </p>
      )}
    </div>
  );
}
