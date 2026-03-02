# 🚂 Railway 部署指南

## 第一步：注册 GitHub 账号（约 2 分钟）

1. 打开 https://github.com
2. 点击右上角 **Sign up**
3. 填写用户名、邮箱、密码
4. 完成邮箱验证

---

## 第二步：上传代码到 GitHub（约 5 分钟）

### 2.1 创建新仓库
1. 登录 GitHub 后，点击右上角 **+** → **New repository**
2. 填写：
   - **Repository name**: `magic-leaf-server`（或其他名字）
   - **可见性**: 选择 **Public**（Railway 免费版需要公开仓库）
3. 点击 **Create repository**

### 2.2 上传代码
在项目根目录 `/workspace/projects` 执行以下命令：

```bash
# 初始化 Git（如果还没有）
git init

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/magic-leaf-server.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Magic Leaf backend"

# 推送到 GitHub
git push -u origin main
```

> 💡 如果提示登录，按提示输入 GitHub 用户名和密码（密码需要用 Personal Access Token，或使用 GitHub CLI）

---

## 第三步：注册 Railway 账号（约 1 分钟）

1. 打开 https://railway.app
2. 点击 **Start with GitHub**
3. 授权 Railway 访问你的 GitHub

---

## 第四步：部署后端服务（约 3 分钟）

### 4.1 创建新项目
1. 登录 Railway 后，点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 选择你刚才创建的 `magic-leaf-server` 仓库
4. 选择 `server` 目录（如果根目录就是服务器代码，直接选根目录）

### 4.2 配置环境变量
部署开始后，点击项目 → **Variables** 标签，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `COZE_SUPABASE_URL` | 你的 Supabase URL | 数据库连接 |
| `COZE_SUPABASE_ANON_KEY` | 你的 Supabase Key | 数据库密钥 |
| `COZE_BUCKET_ENDPOINT_URL` | 对象存储地址 | 图片存储 |
| `COZE_BUCKET_NAME` | 存储桶名称 | 图片存储 |

> ⚠️ 这些值可以从当前开发环境的 `.env` 文件中找到，或者问我获取

### 4.3 等待部署完成
- Railway 会自动构建和部署
- 通常需要 2-5 分钟
- 部署成功后状态会变成 **SUCCESS**

---

## 第五步：获取域名并告诉我

1. 在 Railway 项目页面，点击 **Settings** 标签
2. 找到 **Domains** 部分
3. 点击 **Generate Domain** 生成域名
4. 你会得到一个类似 `xxx.up.railway.app` 的域名
5. **把这个域名告诉我**，我会帮你重新构建 APK

---

## 常见问题

### Q: 部署失败怎么办？
A: 点击部署记录查看日志，把错误信息发给我

### Q: 免费额度够用吗？
A: Railway 每月免费 $5 额度，个人使用绰绰有余

### Q: 域名可以自定义吗？
A: 可以，在 Railway 的 Domains 设置中添加自定义域名

---

## 需要的环境变量值

请告诉我你是否需要我提供当前项目的环境变量值，我会帮你整理出来。
