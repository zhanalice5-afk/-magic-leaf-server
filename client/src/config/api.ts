/**
 * API 配置
 * 
 * 开发环境说明：
 * - Web 端：通过 Metro 代理访问后端（localhost:9091）
 * - 手机预览（Expo Go）：需要使用公网 URL
 * 
 * 生产环境：使用 eas.json 中配置的 EXPO_PUBLIC_BACKEND_BASE_URL
 */

import Constants from 'expo-constants';

// 公网后端 URL（用于 Expo Go 预览）
const PUBLIC_BACKEND_URL = 'https://65fd0868-e3a9-4c6e-991f-bad63a5236d6.dev.coze.site';

// 获取后端 API 基础 URL
export const getBackendBaseUrl = (): string => {
  // 优先使用环境变量（生产环境或 EAS 构建）
  if (process.env.EXPO_PUBLIC_BACKEND_BASE_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  }
  
  // 尝试从 app.config.ts 的 extra 中获取
  const extraUrl = (Constants as any).expoConfig?.extra?.backendBaseUrl;
  if (extraUrl) {
    return extraUrl;
  }
  
  // 开发环境使用公网 URL（支持 Expo Go 预览）
  return PUBLIC_BACKEND_URL;
};

// API 基础 URL（缓存）
let _apiBaseUrl: string | null = null;

// 获取 API 基础 URL（带缓存）
export const getApiBaseUrl = (): string => {
  if (!_apiBaseUrl) {
    _apiBaseUrl = getBackendBaseUrl();
  }
  return _apiBaseUrl;
};

// 完整的 API URL 构建函数
export const getApiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  // 确保路径以 /api/v1 开头
  if (path.startsWith('/api/')) {
    return `${base}${path}`;
  }
  return `${base}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
};

// 默认导出 API 基础 URL（为了兼容性）
export const API_BASE_URL = getApiBaseUrl();
