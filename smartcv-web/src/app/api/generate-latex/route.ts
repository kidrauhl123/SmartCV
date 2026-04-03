import { NextRequest, NextResponse } from 'next/server';

const PROVIDERS: Record<string, { baseUrl: string; defaultModel: string; envKey: string; label: string }> = {
  grok: {
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-3',
    envKey: 'GROK_API_KEY',
    label: 'Grok (xAI)',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
    label: 'DeepSeek',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    envKey: 'OPENAI_API_KEY',
    label: 'OpenAI',
  },
};

const SYSTEM_PROMPT = `你是一名专业的简历设计师，将用户的简历内容排版成 LaTeX 简历。基本按照下方模板结构输出，根据用户内容填充，不要虚构内容。

模板结构如下（花括号内为占位说明）：

\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{banking}
\\definecolor{mygrey}{RGB}{80,80,80}
\\moderncvcolor{black}
\\renewcommand{\\labelitemi}{\\textcolor{mygrey}{\\small$\\bullet$}}
\\nopagenumbers
\\usepackage[scale=0.9]{geometry}
\\usepackage{enumitem}
\\setlist[itemize]{noitemsep, topsep=0pt, leftmargin=1.5em}
\\usepackage{fontawesome5}
\\name{姓名}{}

\\begin{document}

\\begin{minipage}[b]{0.72\\textwidth}
{\\raggedright
  {\\Huge \\bfseries 姓名} \\\\[0.8em]
  {\\small \\color{black!80} \\makebox[1.5em][c]{\\faMobile} \\ 电话} \\\\[0.4em]
  {\\small \\color{black!80} \\makebox[1.5em][c]{\\faEnvelope} \\ \\href{mailto:邮箱}{邮箱}} \\\\[0.4em]
  % 其他联系方式（微信、GitHub 等）同格式追加，有什么放什么
  % 如有求职意向，也用同样格式放这里，例如：
  % {\\small \\color{black!80} \\makebox[1.5em][c]{\\faBriefcase} \\ 求职意向：} \\\\[0.4em]
}
\\end{minipage}

\\vspace{0.6em}

% 正文章节，章节名根据内容灵活命名（教育背景、工作经历、项目经历、技能等）
\\section{章节名}

% 经历类（教育/工作/项目）用 cventry： 而且{}里面的内容你可以灵活调整、留空
\\cventry{时间}{职位或学位}{机构}{地点}{}{
  \\begin{itemize}
    \\item 这里是要点描述
  \\end{itemize}
}

% 技能等列举类用两栏 minipage + cvitem：
\\begin{minipage}[t]{0.48\\textwidth}
  \\cvitem{类别}{内容}
\\end{minipage}
\\hfill
\\begin{minipage}[t]{0.48\\textwidth}
  \\cvitem{类别}{内容}
\\end{minipage}

\\end{document}

【注意】
- 忠实用户原文，不翻译、不改写、不虚构
- 特殊字符转义：& → \\&，% → \\%，# → \\#，_ → \\_
- 布局紧凑，尽量一页
- 不要添加 \\usepackage{hyperref}，moderncv 已内置，\\href 可直接使用
- fontawesome5 图标只用以下这些（LaTeX 包的正确写法，不是网页版写法）：\\faMobile \\faPhone \\faEnvelope \\faWeixin \\faGithub \\faLinkedin \\faGlobe \\faBriefcase \\faMapMarker，绝对不要用 \\faMobileAlt \\faMapMarkerAlt \\faDollarSign \\faLocationArrow 等
- 只输出 LaTeX 代码，直接以 \\documentclass 开头，以 \\end{document} 结尾`;

// 返回哪些 provider 有默认 Key 可用
export async function GET() {
  const available: string[] = [];
  for (const [key, config] of Object.entries(PROVIDERS)) {
    if (process.env[config.envKey]) available.push(key);
  }
  return NextResponse.json({ providers: Object.entries(PROVIDERS).map(([value, c]) => ({ value, label: c.label, hasDefault: !!process.env[c.envKey] })) });
}

export async function POST(req: NextRequest) {
  const { content, provider = 'grok', apiKey } = await req.json();

  const providerConfig = PROVIDERS[provider];
  if (!providerConfig) {
    return NextResponse.json({ error: `不支持的 AI 提供商: ${provider}` }, { status: 400 });
  }

  // 用户没填 Key 时，尝试使用服务器端默认 Key
  const resolvedKey = apiKey?.trim() || process.env[providerConfig.envKey] || '';
  if (!resolvedKey) {
    return NextResponse.json({ error: '请填写 API Key，或联系管理员配置默认 Key' }, { status: 400 });
  }

  try {
    const res = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedKey}`,
      },
      body: JSON.stringify({
        model: providerConfig.defaultModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `请将以下简历内容转换为 LaTeX 代码：\n\n${content}` },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API 请求失败 (${res.status})`);
    }

    const data = await res.json();
    const latex = data.choices?.[0]?.message?.content?.trim();

    if (!latex) throw new Error('AI 未返回内容');

    return NextResponse.json({ latex });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
