# SmartCV

把简历内容粘进去，AI 帮你排版成好看的 PDF。

## 怎么用

在左侧选择 AI 提供商并填写 API Key（如果网站已配置默认 Key 则不需要填），把简历内容粘到文本框里点生成。AI 会输出 LaTeX 代码，自动编译成 PDF 并在右侧预览。可以直接下载，也可以先上传照片拖到合适位置再下载。

支持Grok (xAI)、DeepSeek、OpenAI



## 技术

Next.js + TypeScript，服务端用 xelatex 编译 LaTeX、pdftoppm 生成预览图，客户端用 pdf-lib 在下载前把照片嵌进 PDF。
