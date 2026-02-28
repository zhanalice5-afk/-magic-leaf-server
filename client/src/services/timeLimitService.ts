/**
 * 限时保护服务
 * 用于保护小朋友眼睛，限制使用时间
 * 支持儿童模式和成人模式切换
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'magic_leaf_time_limit';
const MODE_KEY = 'magic_leaf_mode';
const TIME_LIMIT_MINUTES = 20; // 儿童模式每次使用限时 20 分钟
const TIME_LIMIT_MS = TIME_LIMIT_MINUTES * 60 * 1000;

export type AppMode = 'child' | 'adult';

export interface TimeLimitData {
  startTime: number; // 开始时间戳
  totalUsedTime: number; // 累计使用时间（毫秒）
  lastActiveTime: number; // 最后活跃时间
  warningShown: boolean; // 是否已显示过警告
}

/**
 * 限时服务类
 */
export class TimeLimitService {
  private static instance: TimeLimitService;
  private data: TimeLimitData | null = null;
  private mode: AppMode = 'child'; // 默认儿童模式
  private listeners: Set<(remainingTime: number, isExceeded: boolean) => void> = new Set();
  private modeListeners: Set<(mode: AppMode) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private warningCallback: (() => void) | null = null;
  private exceededCallback: (() => void) | null = null;

  static getInstance(): TimeLimitService {
    if (!TimeLimitService.instance) {
      TimeLimitService.instance = new TimeLimitService();
    }
    return TimeLimitService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      // 加载模式设置
      const storedMode = await AsyncStorage.getItem(MODE_KEY);
      if (storedMode === 'child' || storedMode === 'adult') {
        this.mode = storedMode;
      }
      
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const parsedData = JSON.parse(stored) as TimeLimitData;
        this.data = parsedData;
        
        // 检查是否是新的一天（重置计时）
        const now = Date.now();
        const lastDate = new Date(this.data.lastActiveTime).toDateString();
        const currentDate = new Date(now).toDateString();
        
        if (lastDate !== currentDate) {
          await this.reset();
        } else {
          // 同一天，更新最后活跃时间并累加时间
          const elapsedSinceLastActive = now - this.data.lastActiveTime;
          if (elapsedSinceLastActive < 5 * 60 * 1000) {
            this.data.totalUsedTime += elapsedSinceLastActive;
          }
          this.data.lastActiveTime = now;
          await this.save();
        }
      } else {
        await this.reset();
      }
      
      // 只有儿童模式才启动定时检查
      if (this.mode === 'child') {
        this.startPeriodicCheck();
      }
    } catch (error) {
      console.error('TimeLimitService initialize error:', error);
      await this.reset();
    }
  }

  /**
   * 获取当前模式
   */
  getMode(): AppMode {
    return this.mode;
  }

  /**
   * 设置模式
   */
  async setMode(newMode: AppMode): Promise<void> {
    if (this.mode === newMode) return;
    
    this.mode = newMode;
    await AsyncStorage.setItem(MODE_KEY, newMode);
    
    // 通知模式变化
    this.modeListeners.forEach(callback => callback(newMode));
    
    if (newMode === 'adult') {
      // 成人模式：停止计时
      this.stopPeriodicCheck();
      this.notifyListeners();
    } else {
      // 儿童模式：重新开始计时
      await this.reset();
      this.startPeriodicCheck();
    }
  }

  /**
   * 是否启用限时（儿童模式）
   */
  isTimeLimitEnabled(): boolean {
    return this.mode === 'child';
  }

  /**
   * 添加模式变化监听器
   */
  addModeListener(callback: (mode: AppMode) => void): () => void {
    this.modeListeners.add(callback);
    return () => this.modeListeners.delete(callback);
  }

  /**
   * 重置计时
   */
  async reset(): Promise<void> {
    const now = Date.now();
    this.data = {
      startTime: now,
      totalUsedTime: 0,
      lastActiveTime: now,
      warningShown: false,
    };
    await this.save();
  }

  /**
   * 保存数据到本地存储
   */
  private async save(): Promise<void> {
    try {
      if (this.data) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (error) {
      console.error('TimeLimitService save error:', error);
    }
  }

  /**
   * 更新活跃时间
   */
  async updateActivity(): Promise<void> {
    // 成人模式不计时
    if (this.mode === 'adult') return;
    if (!this.data) return;
    
    const now = Date.now();
    const elapsed = now - this.data.lastActiveTime;
    
    if (elapsed < 5 * 60 * 1000) {
      this.data.totalUsedTime += elapsed;
    }
    this.data.lastActiveTime = now;
    
    await this.save();
    this.notifyListeners();
  }

  /**
   * 获取剩余时间（毫秒）
   */
  getRemainingTime(): number {
    // 成人模式无限制
    if (this.mode === 'adult') return Infinity;
    if (!this.data) return TIME_LIMIT_MS;
    return Math.max(0, TIME_LIMIT_MS - this.data.totalUsedTime);
  }

  /**
   * 获取已使用时间（毫秒）
   */
  getUsedTime(): number {
    return this.data?.totalUsedTime || 0;
  }

  /**
   * 获取已使用时间（格式化字符串）
   */
  getUsedTimeString(): string {
    const usedMinutes = Math.floor(this.getUsedTime() / 60000);
    const usedSeconds = Math.floor((this.getUsedTime() % 60000) / 1000);
    return `${usedMinutes}分${usedSeconds}秒`;
  }

  /**
   * 获取剩余时间（格式化字符串）
   */
  getRemainingTimeString(): string {
    if (this.mode === 'adult') return '无限制';
    const remaining = this.getRemainingTime();
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  }

  /**
   * 是否已超时
   */
  isTimeExceeded(): boolean {
    // 成人模式永不超时
    if (this.mode === 'adult') return false;
    return this.getRemainingTime() <= 0;
  }

  /**
   * 是否应该显示警告（剩余 5 分钟时）
   */
  shouldShowWarning(): boolean {
    if (this.mode === 'adult') return false;
    if (!this.data || this.data.warningShown) return false;
    const remaining = this.getRemainingTime();
    return remaining > 0 && remaining <= 5 * 60 * 1000;
  }

  /**
   * 标记警告已显示
   */
  async markWarningShown(): Promise<void> {
    if (this.data) {
      this.data.warningShown = true;
      await this.save();
    }
  }

  /**
   * 家长验证通过后延长使用时间
   */
  async extendTime(extraMinutes: number = 10): Promise<void> {
    if (!this.data) return;
    
    this.data.totalUsedTime -= extraMinutes * 60 * 1000;
    if (this.data.totalUsedTime < 0) {
      this.data.totalUsedTime = 0;
    }
    this.data.warningShown = false;
    
    await this.save();
    this.notifyListeners();
  }

  /**
   * 添加监听器
   */
  addListener(callback: (remainingTime: number, isExceeded: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const remaining = this.getRemainingTime();
    const exceeded = this.isTimeExceeded();
    this.listeners.forEach(callback => callback(remaining, exceeded));
  }

  /**
   * 设置警告回调
   */
  setWarningCallback(callback: (() => void) | null): void {
    this.warningCallback = callback;
  }

  /**
   * 设置超时回调
   */
  setExceededCallback(callback: (() => void) | null): void {
    this.exceededCallback = callback;
  }

  /**
   * 启动定时检查
   */
  private startPeriodicCheck(): void {
    this.stopPeriodicCheck();
    this.checkInterval = setInterval(() => {
      this.updateActivity();
      
      if (this.shouldShowWarning() && this.warningCallback) {
        this.warningCallback();
        this.markWarningShown();
      }
      
      if (this.isTimeExceeded() && this.exceededCallback) {
        this.exceededCallback();
      }
      
      this.notifyListeners();
    }, 1000);
  }

  /**
   * 停止定时检查
   */
  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 获取限时配置
   */
  getConfig() {
    return {
      timeLimitMinutes: TIME_LIMIT_MINUTES,
      warningThresholdMinutes: 5,
      extendMinutes: 10,
    };
  }
}

// 导出单例
export const timeLimitService = TimeLimitService.getInstance();
