export default function PdfPreview({ pdfUrl }: { pdfUrl: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-lg font-semibold mb-4">PDF 预览</h2>
      {pdfUrl ? (
        <iframe src={pdfUrl} className="w-full h-[calc(100vh-180px)] border rounded-lg" />
      ) : (
        <div className="w-full h-[calc(100vh-180px)] border rounded-lg flex items-center justify-center text-gray-400">
          等待生成预览...
        </div>
      )}
    </div>
  );
}
