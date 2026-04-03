import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, rm } from 'fs/promises';
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
    await require('fs/promises').mkdir(dir, { recursive: true });
    await writeFile(texFile, latex, 'utf8');

    await execAsync(`xelatex -interaction=nonstopmode -output-directory="${dir}" "${texFile}"`, {
      timeout: 30000,
    });

    const pdfBuffer = await readFile(pdfFile);
    const base64Pdf = pdfBuffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${base64Pdf}`;

    return NextResponse.json({ pdfUrl });
  } catch (error: any) {
    console.error('编译错误:', error.message);
    return NextResponse.json({ error: `编译失败: ${error.message}` }, { status: 500 });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
