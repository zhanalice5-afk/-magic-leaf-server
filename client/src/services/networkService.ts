/**
 * 网络状态检测服务
 * 检测设备是否联网，用于切换在线/离线模式
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_MODE_KEY = '@offline_mode';

class NetworkService {
  private isOnline = true;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    // 初始检测网络状态
    await this.checkConnectivity();
    
    // 定期检测网络状态（每30秒）
    setInterval(() => {
      this.checkConnectivity();
    }, 30000);
  }

  /**
   * 检测网络连接状态
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // 使用 fetch 检测网络连接
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      const wasOnline = this.isOnline;
      this.isOnline = response?.ok === true;

      // 状态变化时通知监听器
      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }

      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      this.notifyListeners();
      return false;
    }
  }

  /**
   * 获取当前网络状态
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * 添加网络状态监听器
   */
  addListener(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.isOnline));
  }

  /**
   * 获取手动设置的离线模式
   */
  async getManualOfflineMode(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(OFFLINE_MODE_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  }

  /**
   * 设置手动离线模式
   */
  async setManualOfflineMode(offline: boolean): Promise<void> {
    await AsyncStorage.setItem(OFFLINE_MODE_KEY, String(offline));
  }

  /**
   * 判断是否应该使用离线模式
   * 综合考虑：网络状态 + 手动设置
   */
  async shouldUseOfflineMode(): Promise<boolean> {
    const manualOffline = await this.getManualOfflineMode();
    if (manualOffline) return true;
    return !this.isOnline;
  }
}

// 导出单例
export const networkService = new NetworkService();
