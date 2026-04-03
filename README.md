# SmartCV

把简历内容粘进去，AI 帮你排版成好看的 PDF。

## 怎么用

在左侧选择 AI 提供商并填写 API Key（如果网站已配置默认 Key 则不需要填），把简历内容粘到文本框里点生成。AI 会输出 LaTeX 代码，自动编译成 PDF 并在右侧预览。可以直接下载，也可以先上传照片拖到合适位置再下载。

支持的 AI 提供商：Grok (xAI)、DeepSeek、OpenAI，都是 OpenAI 兼容接口格式。

## 本地运行

需要提前安装 [TeX Live](https://tug.org/texlive/)（用于编译 LaTeX）和 Node.js。

```bash
cd smartcv-web
npm install
npm run dev
```

访问 http://localhost:3000

## 部署

项目包含 Dockerfile，使用 Railway 等支持 Docker 的平台直接部署即可。需要在环境变量里配置 API Key：

- `GROK_API_KEY` — xAI Grok
- `DEEPSEEK_API_KEY` — DeepSeek
- `OPENAI_API_KEY` — OpenAI

配置了哪个就开放哪个，用户也可以自己填 Key 覆盖默认的。

## 技术

Next.js + TypeScript，服务端用 xelatex 编译 LaTeX、pdftoppm 生成预览图，客户端用 pdf-lib 在下载前把照片嵌进 PDF。
