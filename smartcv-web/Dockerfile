FROM node:20-slim AS builder

WORKDIR /app
COPY smartcv-web/package*.json ./
RUN npm install
COPY smartcv-web/ .
RUN npm run build

# ---- runtime ----
FROM node:20-slim

# 安装 xelatex + 中文支持
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    texlive-xetex \
    texlive-lang-chinese \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
