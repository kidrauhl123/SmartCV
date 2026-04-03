'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

// A4 @ 150dpi
const PDF_W_PX = 1240;
const PDF_H_PX = 1754;

interface Photo {
  src: string;
  x: number; // px on preview image
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
  const containerRef = useRef<HTMLDivElement>(null);

  const [photo, setPhoto] = useState<Photo | null>(null);
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
      setPhoto({ src, x: imgW * 0.68, y: imgW * 0.02, width: w });
    };
    reader.readAsDataURL(file);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!photo) return;
    const imgW = imgRef.current?.clientWidth ?? 0;
    const imgH = imgRef.current?.clientHeight ?? 0;

    if (dragging) {
      setPhoto(p => p && ({
        ...p,
        x: Math.max(0, Math.min(imgW - p.width, dragStart.current.px + e.clientX - dragStart.current.mx)),
        y: Math.max(0, Math.min(imgH - 20, dragStart.current.py + e.clientY - dragStart.current.my)),
      }));
    }
    if (resizing) {
      const dx = e.clientX - resizeStart.current.mx;
      setPhoto(p => p && ({ ...p, width: Math.max(30, Math.min(imgW * 0.5, resizeStart.current.pw + dx)) }));
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;
    const base64 = pdfUrl.split(',')[1];
    const pdfDoc = await PDFDocument.load(base64ToUint8Array(base64));
    const page = pdfDoc.getPage(0);
    const { width: pdfW, height: pdfH } = page.getSize(); // PDF pt

    if (photo && imgRef.current) {
      const displayW = imgRef.current.clientWidth;
      const scale = PDF_W_PX / displayW; // display px → 150dpi px
      const ptPerPx = pdfW / PDF_W_PX;   // 150dpi px → PDF pt

      const matches = photo.src.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const imgBytes = base64ToUint8Array(matches[2]);
        const image = matches[1].toLowerCase() === 'png'
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        const imgWPt = photo.width * scale * ptPerPx;
        const imgHPt = imgWPt * (image.height / image.width);
        const imgXPt = photo.x * scale * ptPerPx;
        const imgYPt = pdfH - photo.y * scale * ptPerPx - imgHPt; // PDF y 轴向上

        page.drawImage(image, { x: imgXPt, y: imgYPt, width: imgWPt, height: imgHPt });
      }
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

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">PDF 预览</h2>
        <div className="flex gap-2">
          <label className="cursor-pointer text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
            + 添加照片
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && loadPhoto(e.target.files[0])} />
          </label>
          {photo && (
            <button onClick={() => setPhoto(null)} className="text-sm text-gray-500 hover:text-red-500 px-2 py-1.5">
              移除照片
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
        ref={containerRef}
        className="relative flex-1 overflow-auto border rounded-lg bg-gray-200"
        style={{ cursor: dragging ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => { setDragging(false); setResizing(false); }}
        onMouseLeave={() => { setDragging(false); setResizing(false); }}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) loadPhoto(f); }}
        onDragOver={e => e.preventDefault()}
      >
        {previewUrl ? (
          <div className="relative inline-block w-full">
            <img ref={imgRef} src={previewUrl} alt="简历预览" className="w-full block" draggable={false} />
            {photo && (
              <div
                style={{ position: 'absolute', left: photo.x, top: photo.y, width: photo.width, userSelect: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
                onMouseDown={e => {
                  e.preventDefault();
                  setDragging(true);
                  dragStart.current = { mx: e.clientX, my: e.clientY, px: photo.x, py: photo.y };
                }}
              >
                <img src={photo.src} alt="照片" className="w-full shadow-lg ring-2 ring-blue-400 rounded-sm" draggable={false} />
                <div
                  style={{ position: 'absolute', bottom: -5, right: -5, width: 14, height: 14, background: '#3b82f6', borderRadius: 3, cursor: 'se-resize' }}
                  onMouseDown={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setResizing(true);
                    resizeStart.current = { mx: e.clientX, pw: photo.width };
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full min-h-64 flex items-center justify-center text-gray-400">
            等待生成预览...
          </div>
        )}
      </div>

      {photo && (
        <p className="text-xs text-gray-400 mt-2">拖动照片调整位置，右下角蓝点调整大小，满意后点「下载 PDF」</p>
      )}
    </div>
  );
}
