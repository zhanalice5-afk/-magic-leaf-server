# Magic Leaf 后端 Docker 镜像
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 5000

# 环境变量（需要在运行时设置）
# COZE_API_KEY - Coze API 密钥
# SUPABASE_URL - Supabase URL
# SUPABASE_ANON_KEY - Supabase 匿名密钥

# 启动服务
CMD ["pnpm", "start"]
