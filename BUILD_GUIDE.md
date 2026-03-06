# Magic Leaf 双语绘本 v1.2.0 - APK 构建指南

## 🆕 版本 1.2.0 更新内容

- ✅ **完整离线缓存**：下载绘本时同时缓存图片和中英文语音
- ✅ **离线播放**：无网络时也能播放语音朗读
- ✅ **缓存管理**：正确统计和清除音频文件
- ✅ **友好提示**：离线播放失败时提供明确提示

## 📱 APK 构建方法

### 方法一：EAS 云构建（推荐，最简单）

1. 安装 EAS CLI：
```bash
npm install -g eas-cli
```

2. 登录 Expo 账户（如果没有账户，会提示注册）：
```bash
eas login
```

3. 进入项目 client 目录：
```bash
cd client
```

4. 构建 APK：
```bash
eas build --platform android --profile production
```

5. 构建完成后（约 10-15 分钟），在终端会显示下载链接，或者访问：
   - https://expo.dev/accounts/[你的用户名]/projects/magic-leaf-bilingual-books/builds

### 方法二：本地构建（需要 Android SDK）

1. 安装依赖：
```bash
cd client
pnpm install
```

2. 生成原生代码：
```bash
npx expo prebuild
```

3. 构建 APK：
```bash
cd android
./gradlew assembleRelease
```

4. APK 位置：`android/app/build/outputs/apk/release/app-release.apk`

## 🔧 后端配置

当前后端地址已配置为扣子平台：
```
https://65fd0868-e3a9-4c6e-991f-bad63a5236d6.dev.coze.site
```

## 📦 离线功能使用说明

1. 在绘本阅读页面，点击 **"下载离线包"** 按钮
2. 等待下载完成（会下载图片和语音）
3. 下载完成后显示 **"已缓存(离线可用)"**
4. 之后即使没有网络，也可以阅读绘本和播放语音

## ⚠️ 注意事项

- 首次播放语音时需要网络（调用 TTS API）
- 下载离线包后，语音会缓存到本地，后续可离线使用
- 建议在 WiFi 环境下下载离线包（包含音频文件，可能较大）
