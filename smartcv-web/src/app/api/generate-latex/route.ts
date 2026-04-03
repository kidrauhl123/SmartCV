import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { content } = await req.json();

  const latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[UTF8]{ctex}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{enumitem}

\\begin{document}

\\begin{center}
  {\\LARGE \\textbf{个人简历}}
\\end{center}

\\section*{个人信息}
${content}

\\end{document}`;

  return NextResponse.json({ latex });
}
