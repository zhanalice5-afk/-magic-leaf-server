# Railway 部署 Dockerfile - 根目录
FROM node:20-alpine

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 server 目录的文件
COPY server/package.json ./

# 安装依赖
RUN pnpm install --prod=false

# 复制 server 源代码
COPY server/ ./

# 构建项目
RUN pnpm run build

# 暴露端口
EXPOSE $PORT

# 启动服务
CMD ["node", "dist/index.js"]
