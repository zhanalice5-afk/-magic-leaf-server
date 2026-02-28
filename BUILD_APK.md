# Magic Leaf APK 构建指南

## 方式一：使用 EAS 云端构建（推荐）

### 1. 安装 EAS CLI
```bash
npm install -g eas-cli
```

### 2. 登录 Expo 账号
```bash
eas login
```
如果没有账号，访问 https://expo.dev 注册（免费）

### 3. 构建 APK
```bash
cd client
eas build --platform android --profile preview
```

### 4. 下载 APK
构建完成后，在 https://expo.dev/accounts/[your-account]/projects/magic-leaf-bilingual-books/builds 下载 APK

---

## 方式二：本地构建（需要 Android Studio）

### 前置要求
- Node.js 18+
- JDK 17
- Android SDK（API 34）

### 1. 设置环境变量
```bash
export JAVA_HOME=/path/to/jdk-17
export ANDROID_HOME=/path/to/android-sdk
```

### 2. 生成原生项目
```bash
cd client
npx expo prebuild --platform android
```

### 3. 构建 APK
```bash
cd android
./gradlew assembleRelease
```

### 4. APK 位置
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 方式三：使用 GitHub Actions 自动构建

在项目根目录创建 `.github/workflows/build-apk.yml`：

```yaml
name: Build APK

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Install dependencies
        run: |
          cd client
          npm install -g pnpm
          pnpm install
      
      - name: Build APK
        env:
          EXPO_PUBLIC_BACKEND_BASE_URL: https://65fd0868-e3a9-4c6e-991f-bad63a5236d6.dev.coze.site
        run: |
          cd client
          npx expo prebuild --platform android
          cd android
          ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: client/android/app/build/outputs/apk/release/app-release.apk
```

---

## APK 下载安装说明

### 安装步骤
1. 将 APK 文件传输到 Android 手机
2. 点击 APK 文件
3. 如果提示"未知来源"，请在设置中允许安装未知来源应用
4. 点击"安装"

### 权限说明
应用需要以下权限：
- 麦克风：用于语音输入和录音
- 相机：用于拍摄绘本图片
- 存储：用于保存绘本图片

### 后端服务
APK 已配置公网后端地址，安装后可直接使用，无需额外配置。

---

## 技术支持
如有问题，请访问项目仓库提交 Issue。
