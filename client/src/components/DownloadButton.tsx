/**
 * 下载按钮组件
 * 显示下载状态和进度，支持下载和删除缓存
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, ActivityIndicator, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { cacheService, CachedBookMeta } from '@/src/services/cacheService';

interface DownloadButtonProps {
  bookId: string;
  book: any;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: Error) => void;
  size?: 'small' | 'medium' | 'large';
}

export function DownloadButton({
  bookId,
  book,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
  size = 'medium',
}: DownloadButtonProps) {
  const { theme } = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cachedMeta, setCachedMeta] = useState<CachedBookMeta | null>(null);

  // 检查缓存状态
  useEffect(() => {
    checkCacheStatus();
  }, [bookId]);

  const checkCacheStatus = async () => {
    const meta = await cacheService.getCachedBookMeta(bookId);
    setCachedMeta(meta);
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setProgress(0);
    onDownloadStart?.();

    try {
      // 先缓存绘本元数据
      await cacheService.cacheBook(book);
      
      // 下载所有资源
      await cacheService.downloadBookAssets(bookId, book, (p) => {
        setProgress(Math.round(p * 100));
      });

      // 刷新状态
      await checkCacheStatus();
      onDownloadComplete?.();
    } catch (error) {
      console.error('Download failed:', error);
      onDownloadError?.(error as Error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    await cacheService.deleteCachedBook(bookId);
    setCachedMeta(null);
  };

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const textSize = size === 'small' ? 'caption' : size === 'medium' ? 'smallMedium' : 'bodyMedium';

  // 下载中状态
  if (isDownloading) {
    return (
      <View style={[styles.container, styles.downloading]}>
        <ActivityIndicator size="small" color={theme.primary} />
        <ThemedText variant={textSize} color={theme.textSecondary} style={styles.text}>
          {progress}%
        </ThemedText>
      </View>
    );
  }

  // 已缓存状态
  if (cachedMeta?.isFullyCached) {
    return (
      <TouchableOpacity style={[styles.container, styles.cached]} onPress={handleDelete}>
        <FontAwesome6 name="circle-check" size={iconSize} color={theme.success} />
        <ThemedText variant={textSize} color={theme.success} style={styles.text}>
          已缓存
        </ThemedText>
      </TouchableOpacity>
    );
  }

  // 部分缓存状态
  if (cachedMeta && !cachedMeta.isFullyCached) {
    return (
      <TouchableOpacity style={[styles.container, styles.partial]} onPress={handleDownload}>
        <FontAwesome6 name="cloud-arrow-down" size={iconSize} color={theme.primary} />
        <ThemedText variant={textSize} color={theme.primary} style={styles.text}>
          继续下载
        </ThemedText>
      </TouchableOpacity>
    );
  }

  // 未缓存状态
  return (
    <TouchableOpacity style={[styles.container, styles.notCached]} onPress={handleDownload}>
      <FontAwesome6 name="cloud-arrow-down" size={iconSize} color={theme.textSecondary} />
      <ThemedText variant={textSize} color={theme.textSecondary} style={styles.text}>
        下载
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  downloading: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  cached: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  partial: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  notCached: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  text: {
    fontWeight: '500',
  },
});
