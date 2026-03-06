# Magic Leaf 独立部署指南

本指南帮助你在自己的服务器上部署 Magic Leaf 后端，实现完全独立运行，不依赖 Coze 平台。

## 📋 准备工作

### 1. 获取 Coze API Key

1. 访问 [Coze 开放平台](https://www.coze.cn/) 或 [Coze 国际版](https://www.coze.com/)
2. 注册/登录账号
3. 进入「个人设置」→「访问令牌」
4. 创建新的访问令牌，保存 API Key（格式：`pat_xxxxx`）

### 2. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/)
2. 创建新项目
3. 在「设置」→「API」中获取：
   - `URL` → 你的 SUPABASE_URL
   - `anon public` → 你的 SUPABASE_ANON_KEY

### 3. 准备服务器

选择一个云服务器提供商：
- 国内：阿里云、腾讯云、华为云
- 国外：AWS、DigitalOcean、Vultr

**最低配置**：1核 CPU + 1GB 内存 + 20GB 存储

## 🚀 部署方式

### 方式一：Docker 部署（推荐）

```bash
# 1. 克隆代码
git clone <your-repo-url>
cd server

# 2. 创建环境变量文件
cat > .env << 'EOF'
COZE_API_KEY=pat_your_api_key_here
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
EOF

# 3. 启动服务
docker-compose up -d

# 4. 检查状态
docker-compose ps
curl http://localhost:5000/api/v1/health
```

### 方式二：直接部署

```bash
# 1. 安装 Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装 pnpm
npm install -g pnpm

# 3. 克隆代码
git clone <your-repo-url>
cd server

# 4. 设置环境变量
export COZE_API_KEY=pat_your_api_key_here
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_ANON_KEY=your_anon_key_here

# 5. 安装依赖并构建
pnpm install
pnpm build

# 6. 启动服务
pnpm start

# 7. 使用 PM2 保持运行（可选）
npm install -g pm2
pm2 start "pnpm start" --name magic-leaf-api
```

### 方式三：Railway 一键部署

1. Fork 本项目到你的 GitHub
2. 访问 [Railway](https://railway.app/)
3. 连接 GitHub 仓库
4. 设置环境变量：
   - `COZE_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. 自动部署完成

## 🔧 配置 APP 连接你的服务器

### 1. 修改后端地址

编辑 `client/src/config/api.ts`：

```typescript
const PUBLIC_BACKEND_URL = 'https://your-domain.com';
```

或修改 `client/app.config.ts`：

```typescript
const DEFAULT_BACKEND_URL = 'https://your-domain.com';
```

### 2. 重新构建 APK

```bash
cd client
eas build --platform android --profile production
```

## 📊 费用估算

| 资源 | 免费额度 | 超出后费用 |
|------|---------|-----------|
| Coze API | 有免费额度 | 按调用计费 |
| Supabase | 500MB 数据库 | $25/月起 |
| 云服务器 | - | ¥50-200/月 |

**最低成本**：约 ¥50-100/月（使用免费额度 + 最低配置服务器）

## ✅ 验证部署

```bash
# 健康检查
curl https://your-domain.com/api/v1/health

# 测试生成绘本
curl -X POST https://your-domain.com/api/v1/books/generate \
  -H "Content-Type: application/json" \
  -d '{"level":1,"theme":"动物","interestTag":"猫"}'
```

## 🔒 安全建议

1. **启用 HTTPS**：使用 Let's Encrypt 免费证书
2. **配置防火墙**：只开放必要端口（80, 443, 5000）
3. **定期备份**：备份 Supabase 数据
4. **监控服务**：设置健康检查和告警

## 🆘 常见问题

### Q: 部署后提示"AI 功能不可用"
A: 检查 `COZE_API_KEY` 是否正确设置

### Q: 数据库连接失败
A: 检查 Supabase URL 和 Key 是否正确，确保网络可达

### Q: APK 无法连接服务器
A: 确保服务器已配置 HTTPS，且 APP 配置的地址正确
