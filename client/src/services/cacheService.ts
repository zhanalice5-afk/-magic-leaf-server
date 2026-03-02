/**
 * 绘本离线缓存服务
 * 使用 AsyncStorage 存储绘本元数据
 * 使用 expo-file-system 存储图片和音频文件
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// 缓存目录 - 使用 as any 绕过类型检查
const FS = FileSystem as any;
const CACHE_DIR = `${FS.documentDirectory}bookCache/`;
const IMAGES_DIR = `${CACHE_DIR}images/`;
const AUDIO_DIR = `${CACHE_DIR}audio/`;

// 缓存键前缀
const CACHE_KEY_PREFIX = '@book_cache_';
const CACHE_LIST_KEY = '@cached_books_list';

// 缓存的绘本元数据
export interface CachedBookMeta {
  id: string;
  title: string;
  level: number;
  theme: string;
  interest_tag: string;
  coverImage: string; // 本地路径
  cachedAt: number; // 缓存时间戳
  totalPages: number;
  downloadedPages: number; // 已下载页数
  isFullyCached: boolean;
}

// 缓存的绘本完整数据
export interface CachedBook {
  id: string;
  title: string;
  level: number;
  theme: string;
  interest_tag: string;
  function_tag: string;
  content: CachedBookPage[];
  interaction: {
    branching_options?: { label: string; leads_to: string }[];
    character_dialogue: string;
  };
  created_at: string;
}

export interface CachedBookPage {
  page_num: number;
  text_en: string;
  text_zh: string;
  audio_hint: string;
  image_prompt?: string;
  image_url?: string; // 原始远程 URL
  local_image_url?: string; // 本地缓存路径
  local_audio_url?: string; // 本地音频缓存路径
  spotlight: Array<{
    object: string;
    phonics: string;
    animation_effect?: string;
  }>;
  question?: {
    question_en: string;
    question_zh: string;
    hint?: string;
  };
}

class CacheService {
  private initialized = false;

  /**
   * 初始化缓存目录
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // 创建缓存目录
      await FS.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      await FS.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
      await FS.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
      
      console.log('Cache directories created');
      this.initialized = true;
    } catch (error) {
      // 目录可能已存在
      console.log('Cache directories already exist or created');
      this.initialized = true;
    }
  }

  /**
   * 获取缓存目录路径
   */
  getCacheDir(): string {
    return CACHE_DIR;
  }

  /**
   * 获取图片缓存目录
   */
  getImagesDir(): string {
    return IMAGES_DIR;
  }

  /**
   * 获取音频缓存目录
   */
  getAudioDir(): string {
    return AUDIO_DIR;
  }

  /**
   * 获取所有已缓存的绘本列表
   */
  async getCachedBooksList(): Promise<CachedBookMeta[]> {
    try {
      const json = await AsyncStorage.getItem(CACHE_LIST_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Failed to get cached books list:', error);
      return [];
    }
  }

  /**
   * 获取单个缓存的绘本
   */
  async getCachedBook(bookId: string): Promise<CachedBook | null> {
    try {
      const json = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${bookId}`);
      return json ? JSON.parse(json) : null;
    } catch (error) {
      console.error('Failed to get cached book:', error);
      return null;
    }
  }

  /**
   * 检查绘本是否已缓存
   */
  async isBookCached(bookId: string): Promise<boolean> {
    const book = await this.getCachedBook(bookId);
    return book !== null;
  }

  /**
   * 检查绘本是否完全缓存（所有页面都下载）
   */
  async isBookFullyCached(bookId: string): Promise<boolean> {
    try {
      const meta = await this.getCachedBookMeta(bookId);
      return meta?.isFullyCached ?? false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取绘本缓存元数据
   */
  async getCachedBookMeta(bookId: string): Promise<CachedBookMeta | null> {
    const list = await this.getCachedBooksList();
    return list.find(item => item.id === bookId) || null;
  }

  /**
   * 保存绘本到缓存
   */
  async cacheBook(book: any): Promise<CachedBook> {
    await this.init();

    const cachedBook: CachedBook = {
      id: book.id,
      title: book.title,
      level: book.level,
      theme: book.theme,
      interest_tag: book.interest_tag,
      function_tag: book.function_tag,
      content: book.content.map((page: any) => ({
        ...page,
        local_image_url: undefined,
        local_audio_url: undefined,
      })),
      interaction: book.interaction,
      created_at: book.created_at,
    };

    // 保存绘本数据
    await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${book.id}`, JSON.stringify(cachedBook));

    // 更新缓存列表
    await this.updateCacheList(book.id, {
      id: book.id,
      title: book.title,
      level: book.level,
      theme: book.theme,
      interest_tag: book.interest_tag,
      coverImage: book.content[0]?.image_url || '',
      cachedAt: Date.now(),
      totalPages: book.content.length,
      downloadedPages: 0,
      isFullyCached: false,
    });

    return cachedBook;
  }

  /**
   * 下载绘本的所有图片和音频
   */
  async downloadBookAssets(bookId: string, book: any, onProgress?: (progress: number) => void): Promise<void> {
    await this.init();

    const totalPages = book.content.length;
    let downloadedPages = 0;

    const cachedBook = await this.getCachedBook(bookId) || await this.cacheBook(book);

    // 下载每一页的图片
    for (let i = 0; i < book.content.length; i++) {
      const page = book.content[i];
      
      // 下载图片
      if (page.image_url) {
        try {
          const localPath = await this.downloadImage(page.image_url, bookId, i);
          cachedBook.content[i].local_image_url = localPath;
        } catch (error) {
          console.error(`Failed to download image for page ${i}:`, error);
        }
      }

      downloadedPages++;
      onProgress?.(downloadedPages / totalPages);

      // 更新进度
      await this.updateCacheList(bookId, {
        id: bookId,
        title: book.title,
        level: book.level,
        theme: book.theme,
        interest_tag: book.interest_tag,
        coverImage: book.content[0]?.image_url || '',
        cachedAt: Date.now(),
        totalPages,
        downloadedPages,
        isFullyCached: downloadedPages === totalPages,
      });
    }

    // 保存更新后的绘本数据
    await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${bookId}`, JSON.stringify(cachedBook));
  }

  /**
   * 下载单张图片
   */
  async downloadImage(url: string, bookId: string, pageIndex: number): Promise<string> {
    const fileExtension = url.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${bookId}_page_${pageIndex}.${fileExtension}`;
    const localPath = `${IMAGES_DIR}${fileName}`;

    // 检查是否已存在
    try {
      const fileInfo = await FS.getInfoAsync(localPath);
      if (fileInfo.exists) {
        return localPath;
      }
    } catch (error) {
      // 文件不存在，继续下载
    }

    // 下载文件
    await FS.downloadAsync(url, localPath);
    return localPath;
  }

  /**
   * 更新缓存列表
   */
  private async updateCacheList(bookId: string, meta: CachedBookMeta): Promise<void> {
    const list = await this.getCachedBooksList();
    const existingIndex = list.findIndex(item => item.id === bookId);
    
    if (existingIndex >= 0) {
      list[existingIndex] = meta;
    } else {
      list.push(meta);
    }

    await AsyncStorage.setItem(CACHE_LIST_KEY, JSON.stringify(list));
  }

  /**
   * 删除绘本缓存
   */
  async deleteCachedBook(bookId: string): Promise<void> {
    // 删除绘本数据
    await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${bookId}`);

    // 删除图片文件
    try {
      const files = await FS.readDirectoryAsync(IMAGES_DIR);
      for (const file of files) {
        if (file.startsWith(bookId)) {
          await FS.deleteAsync(`${IMAGES_DIR}${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to delete cached images:', error);
    }

    // 更新缓存列表
    const list = await this.getCachedBooksList();
    const newList = list.filter(item => item.id !== bookId);
    await AsyncStorage.setItem(CACHE_LIST_KEY, JSON.stringify(newList));
  }

  /**
   * 获取缓存大小（字节）
   */
  async getCacheSize(): Promise<number> {
    let totalSize = 0;

    try {
      // 计算图片目录大小
      const imageFiles = await FS.readDirectoryAsync(IMAGES_DIR);
      for (const file of imageFiles) {
        const info = await FS.getInfoAsync(`${IMAGES_DIR}${file}`, { size: true });
        if (info.exists && info.size) {
          totalSize += info.size;
        }
      }
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
    }

    return totalSize;
  }

  /**
   * 清除所有缓存
   */
  async clearAllCache(): Promise<void> {
    // 清除所有绘本数据
    const list = await this.getCachedBooksList();
    for (const item of list) {
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${item.id}`);
    }

    // 清除缓存列表
    await AsyncStorage.removeItem(CACHE_LIST_KEY);

    // 删除所有缓存文件
    try {
      const imageFiles = await FS.readDirectoryAsync(IMAGES_DIR);
      for (const file of imageFiles) {
        await FS.deleteAsync(`${IMAGES_DIR}${file}`);
      }
    } catch (error) {
      console.error('Failed to clear cache files:', error);
    }
  }
}

// 导出单例
export const cacheService = new CacheService();
