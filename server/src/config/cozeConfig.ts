/**
 * Coze SDK 配置
 * 支持从环境变量加载 API Key，用于生产环境认证
 */

import { Config } from "coze-coding-dev-sdk";

// 检查是否在 Coze 开发环境中
const isCozeDevEnvironment = (): boolean => {
  // 检查是否有 Coze 特有的环境变量
  return !!process.env.COZE_SUPABASE_URL;
};

// 获取 Coze API Key（支持多个环境变量名）
const getCozeApiKey = (): string | undefined => {
  // 优先使用 COZE_WORKLOAD_IDENTITY_API_KEY（SDK 默认环境变量）
  // 也支持 COZE_API_KEY 作为备选
  return process.env.COZE_WORKLOAD_IDENTITY_API_KEY || process.env.COZE_API_KEY;
};

// 创建配置实例
export const createCozeConfig = (): Config => {
  const apiKey = getCozeApiKey();
  
  if (apiKey) {
    // 生产环境：使用 API Key 认证
    console.log('Using Coze API Key authentication');
    return new Config({ apiKey });
  } else if (isCozeDevEnvironment()) {
    // Coze 开发环境：使用默认配置，认证信息从请求头获取
    console.log('Using Coze development environment authentication');
    return new Config();
  } else {
    // 无认证环境：使用默认配置，可能会失败
    console.warn('No Coze authentication available. API calls may fail.');
    return new Config();
  }
};

// 判断是否可以使用 AI 功能
export const canUseAIFeatures = (): boolean => {
  return !!(getCozeApiKey() || isCozeDevEnvironment());
};

// 导出单例配置（延迟初始化）
let _config: Config | null = null;

export const getCozeConfig = (): Config => {
  if (!_config) {
    _config = createCozeConfig();
  }
  return _config;
};
