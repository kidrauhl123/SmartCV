import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, rm, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const { latex } = await req.json();

  const id = randomUUID();
  const dir = join(tmpdir(), id);
  const texFile = join(dir, 'main.tex');
  const pdfFile = join(dir, 'main.pdf');

  try {
    await mkdir(dir, { recursive: true });

    // 强制注入中文支持
    let processedLatex = latex;
    if (!latex.includes('\\usepackage[UTF8]{ctex}') && !latex.includes('\\usepackage{xeCJK}')) {
      processedLatex = processedLatex.replace(
        /\\begin\{document\}/,
        '\\usepackage[UTF8]{ctex}\n\\begin{document}'
      );
    }

    await writeFile(texFile, processedLatex, 'utf8');

    await execAsync(
      `xelatex -interaction=nonstopmode -output-directory="${dir}" "${texFile}"`,
      { timeout: 60000, cwd: dir }
    );

    // 把 PDF 第一页转成 PNG（150dpi，A4 约 1240×1754px）
    const previewBase = join(dir, 'preview');
    await execAsync(
      `pdftoppm -r 150 -f 1 -l 1 -png "${pdfFile}" "${previewBase}"`,
      { timeout: 10000 }
    );

    // pdftoppm 输出的文件名形如 preview-1.png
    const previewFile = join(dir, 'preview-1.png');
    const [pdfBuffer, previewBuffer] = await Promise.all([
      readFile(pdfFile),
      readFile(previewFile),
    ]);

    return NextResponse.json({
      pdfUrl: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`,
      previewUrl: `data:image/png;base64,${previewBuffer.toString('base64')}`,
    });

  } catch (error: any) {
    const logFile = join(dir, 'main.log');
    let log = '';
    try {
      const logContent = await readFile(logFile, 'utf8');
      const errorLines = logContent.split('\n').filter(l => l.startsWith('!') || l.includes('Error'));
      log = errorLines.slice(0, 20).join('\n');
    } catch {}
    console.error('编译错误:', error.message, '\n日志:', log);
    return NextResponse.json({ error: `编译失败:\n${log || error.message}` }, { status: 500 });

  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
