import { ExpoConfig, ConfigContext } from 'expo/config';

const appName = 'Magic Leaf 双语绘本';

// 扣子平台后端 URL（支持 AI 功能，语音缓存）
const DEFAULT_BACKEND_URL = 'https://65fd0868-e3a9-4c6e-991f-bad63a5236d6.dev.coze.site';

export default ({ config }: ConfigContext): ExpoConfig => {
  // 优先使用环境变量，否则使用默认值
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || DEFAULT_BACKEND_URL;
  
  return {
    ...config,
    "name": appName,
    "slug": "magic-leaf-bilingual-books",
    "version": "1.1.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "magic-leaf",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "extra": {
      "eas": {
        "projectId": "0d1970a7-8caf-45c2-89e6-c5d87a87fd45"
      },
      "backendBaseUrl": backendUrl,
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.magicleaf.bilingualbooks",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Magic Leaf 需要访问麦克风以支持语音输入和录音功能",
        "NSCameraUsageDescription": "Magic Leaf 需要访问相机以拍摄照片上传绘本",
        "NSPhotoLibraryUsageDescription": "Magic Leaf 需要访问相册以上传或保存图片"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#4A7C59"
      },
      "package": "com.magicleaf.bilingualbooks",
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.INTERNET"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
        "expo-router",
        {
          "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
        }
      ] : 'expo-router',
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#FFF8E7"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Magic Leaf 需要访问您的相册，以便您上传或保存绘本图片",
          "cameraPermission": "Magic Leaf 需要使用相机，以便您拍摄照片上传绘本"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Magic Leaf 需要访问相机以拍摄照片和视频",
          "microphonePermission": "Magic Leaf 需要访问麦克风以录制语音",
          "recordAudioAndroid": true
        }
      ],
      [
        "expo-av",
        {
          "microphonePermission": "Magic Leaf 需要访问麦克风以支持语音输入和录音功能"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
