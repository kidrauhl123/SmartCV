import { NextRequest, NextResponse } from 'next/server';

const PROVIDERS: Record<string, { baseUrl: string; defaultModel: string }> = {
  grok: {
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-3',
  },
};

const SYSTEM_PROMPT = `你是一个专业的简历 LaTeX 排版引擎，使用 moderncv 模板生成简历。

【固定模板结构】
严格按照以下模板框架输出，不得更改文档类和导言区配置：

\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{banking}
\\definecolor{mygrey}{RGB}{80, 80, 80}
\\moderncvcolor{black}
\\renewcommand{\\labelitemi}{\\textcolor{mygrey}{\\small$\\bullet$}}
\\nopagenumbers
\\usepackage[scale=0.9]{geometry}
\\usepackage{enumitem}
\\setlist[itemize]{noitemsep, topsep=0pt, leftmargin=1.5em}
\\usepackage{fontawesome5}
\\usepackage{hyperref}
\\name{名}{姓}（根据实际姓名填写）

\\begin{document}

% 标题区域（无照片）
{\\Huge \\bfseries \\color{black}{名} \\color{gray}{姓}} \\\\[1.0em]
% 联系方式行，有什么放什么，格式如下：
{\\small \\color{black!80} \\makebox[1.5em][c]{\\faMobile*} \\ 电话} \\\\[0.5em]
{\\small \\color{black!80} \\makebox[1.5em][c]{\\faEnvelope} \\ \\href{mailto:邮箱}{邮箱}} \\\\[0.5em]
{\\small \\color{black!80} \\makebox[1.5em][c]{\\faGithub} \\ \\href{链接}{显示文字}} \\\\[0.5em]
% 可根据实际情况增减联系方式行，支持的图标：\\faWeixin \\faLinkedin \\faGlobe 等

\\vspace{0.8em}
{\\color{gray!50}\\hrule}
\\vspace{1.5em}

% 正文各章节（见下方规则）

\\end{document}

【章节规则】
- 章节名称智能调整：根据用户内容决定章节标题（如用户是学生可用 Education/Internship Experience，工作党可用 Professional Experience，有科研可加 Research 等，注意用中文哈）
- 每个章节用 \\section{章节名}
- 教育/工作/项目经历统一用 \\cventry{时间}{职位/学位}{机构}{地点}{}{描述}
  - 描述用 \\begin{itemize}...\\end{itemize} 列举要点
- 技能类用两栏 minipage + \\cvitem{类别}{内容} 展示
- 奖项/证书/出版物等特殊内容视情况用 \\cvitem 或 \\cventry

【内容处理原则】
- 忠实原文：用户写什么放什么，保留原始语言（中文/英文/混合），不翻译、不改写
- 只在原文过于简陋（如仅一两个词、语意不完整）时才适当扩充，且扩充内容需合理可信
- 只输出原文中存在的章节，不虚构经历
- 特殊字符转义：& → \\&，% → \\%，# → \\#，_ → \\_，~ → \\textasciitilde{}

【输出规则】
- 只输出 LaTeX 代码，不加任何解释或 markdown 代码块
- 输出的简历必须保证和用户输入的语言一致，一般只是中文
- 直接以 \\documentclass 开头，以 \\end{document} 结尾`;

export async function POST(req: NextRequest) {
  const { content, provider = 'grok', apiKey } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: '请填写 API Key' }, { status: 400 });
  }

  const providerConfig = PROVIDERS[provider];
  if (!providerConfig) {
    return NextResponse.json({ error: `不支持的 AI 提供商: ${provider}` }, { status: 400 });
  }

  try {
    const res = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
